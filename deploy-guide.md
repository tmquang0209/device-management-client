# Hướng dẫn Deploy Next.js lên EC2 với GitLab CI/CD, PM2, và Nginx

Tài liệu này mô tả các bước đầy đủ để deploy tự động một dự án Next.js từ GitLab lên một máy chủ AWS EC2 (sử dụng Amazon Linux 2023), chạy ứng dụng với PM2 và phục vụ qua Nginx reverse proxy.

## 📋 Yêu cầu tiên quyết

* Một máy chủ EC2 (Amazon Linux 2023) đã được khởi tạo.
* Một repository (repo) trên GitLab.
* Một tên miền đã được đăng ký (ví dụ: `your-domain.com`).
* Khả năng SSH vào EC2 của bạn (ví dụ: với file `.pem`).

---

## 🌎 Giai đoạn 1: Chuẩn bị Máy chủ EC2

Trước khi làm bất cứ điều gì, máy chủ của bạn cần các công cụ cần thiết.

1.  **SSH vào EC2:**
    ```bash
    ssh -i "your-key.pem" ec2-user@YOUR_EC2_IP
    ```

2.  **Cập nhật hệ thống và Cài đặt NVM (Node Version Manager):**
    ```bash
    sudo dnf update -y
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    # Kích hoạt NVM
    source ~/.bashrc

    # Cài đặt Node.js (phiên bản LTS)
    nvm install --lts
    ```

3.  **Cài đặt Git, Nginx, và PM2:**
    ```bash
    # Cài đặt Git và Nginx
    sudo dnf install git nginx -y

    # Cài đặt PM2 trên toàn hệ thống
    npm install pm2 -g
    ```

---

## 🔑 Giai đoạn 2: Thiết lập Khóa (Keys) - Trái tim của CI/CD

Chúng ta cần **2 cặp khóa** khác nhau. Đừng nhầm lẫn chúng.

### 2.1. Key 1: Deploy Key (Để EC2 `pull` code từ GitLab)

Key này cho phép máy chủ EC2 của bạn (với tư cách là một "user") có quyền *chỉ đọc* (read-only) để `git clone` hoặc `git pull` repo private của bạn.

1.  **Trên EC2,** tạo một cặp key SSH mới:
    ```bash
    ssh-keygen -t ed25519 -C "ec2-deploy-key"

    # Nhấn Enter 3 lần để chấp nhận mặc định (không đặt mật khẩu)
    ```

2.  **Trên EC2,** lấy public key:
    ```bash
    cat ~/.ssh/id_ed25519.pub
    ```
    *Output sẽ là một dòng dài bắt đầu bằng `ssh-ed25519 AAAA...`*

3.  **Trên GitLab:**
    * Đi tới repo của bạn.
    * Vào **Settings > Repository**.
    * Mở rộng mục **Deploy Keys**.
    * **Title:** Đặt tên (ví dụ: `EC2 Server`).
    * **Key:** Dán (paste) public key bạn vừa copy từ EC2.
    * Nhấn **Add key**.

### 2.2. Key 2: Runner Key (Để GitLab `push` lệnh tới EC2)

Key này cho phép GitLab Runner (máy ảo của CI/CD) có quyền SSH *vào* máy chủ EC2 của bạn để thực thi các lệnh deploy.

1.  **Trên máy tính cá nhân (local)** hoặc trên EC2, tạo một cặp key SSH *khác*:
    ```bash
    # Bạn có thể chạy lệnh này ở bất cứ đâu, không nhất thiết phải là EC2
    ssh-keygen -t ed25519 -C "gitlab-ci-runner"

    # Khi được hỏi lưu ở đâu, hãy gõ một tên file mới, ví dụ:
    # /Users/YourUser/.ssh/gitlab_ci_key (trên local)
    # hoặc /home/ec2-user/.ssh/gitlab_ci_key (trên EC2)
    # Nhấn Enter 2 lần để không đặt mật khẩu.
    ```

2.  **Thêm Public Key vào EC2:**
    * Lấy nội dung **public key** (`gitlab_ci_key.pub`):
        ```bash
        cat ~/.ssh/gitlab_ci_key.pub
        ```
    * **Trên EC2,** dán nội dung key này vào *cuối* file `authorized_keys`:
        ```bash
        nano ~/.ssh/authorized_keys
        # Dán key vào, lưu và thoát (Ctrl+X, Y, Enter)

        # Đảm bảo quyền file chính xác
        chmod 600 ~/.ssh/authorized_keys
        ```

3.  **Thêm Private Key vào GitLab:**
    * Lấy nội dung **private key** (`gitlab_ci_key`):
        ```bash
        cat ~/.ssh/gitlab_ci_key
        ```
    * **Trên GitLab:**
        * Đi tới repo của bạn.
        * Vào **Settings > CI/CD**.
        * Mở rộng mục **Variables** -> **Add variable**.
        * **Key:** `SSH_PRIVATE_KEY`
        * **Type:** `File` (Rất quan trọng, chọn 'File' không phải 'Variable')
        * **Value:** Dán toàn bộ nội dung private key vào đây (bao gồm cả `-----BEGIN...` và `-----END...`).
        * Nhấn **Add variable**.

---

## 🛠 Giai đoạn 3: Cấu hình Biến và File CI/CD

GitLab Runner cần thêm một vài biến để biết *nơi* deploy.

1.  **Trên GitLab,** tạo thêm các biến sau (Settings > CI/CD > Variables):
    * **`EC2_USER`**:
        * **Type:** `Variable`
        * **Value:** `ec2-user`
    * **`EC2_HOST`**:
        * **Type:** `Variable`
        * **Value:** `16.176.20.138` (IP công khai của EC2)
    * **`DEPLOY_PATH`**:
        * **Type:** `Variable`
        * **Value:** `/var/www/my-nextjs-app` (Thư mục bạn sẽ deploy code vào)
    * **`EC2_HOST_KEY`**:
        * **Type:** `Variable`
        * **Value:** Chạy `ssh-keyscan YOUR_EC2_IP` trên máy local và dán kết quả vào.

2.  **Tạo file `.gitlab-ci.yml`:**
    * Trong thư mục gốc của dự án (trên local), tạo file `.gitlab-ci.yml` và dán nội dung sau (đây là file chúng ta đã hoàn thiện ở bước trước):

    ```yaml
    # .gitlab-ci.yml

    stages:
      - test
      - deploy

    lint_job:
      stage: test
      image: node:20-alpine
      cache:
        key:
          files:
            - package-lock.json
        paths:
          - node_modules/
      script:
        - echo "Installing dependencies for linting..."
        - npm install
        - echo "Running linter (npm run lint)..."
        - npm run lint
      rules:
        - if: '$CI_COMMIT_BRANCH == "main"'

    deploy_nextjs_to_ec2:
      stage: deploy
      image: alpine:latest
      needs: [lint_job] # Đảm bảo job này chỉ chạy sau khi 'lint_job' thành công

      before_script:
        - 'command -v ssh-agent >/dev/null || ( apk add --update openssh-client )'
        - eval $(ssh-agent -s)
        - chmod 400 $SSH_PRIVATE_KEY
        - ssh-add $SSH_PRIVATE_KEY
        - mkdir -p ~/.ssh
        - chmod 700 ~/.ssh
        - echo "$EC2_HOST_KEY" > ~/.ssh/known_hosts
        - chmod 644 ~/.ssh/known_hosts

      script:
        - |
          ssh $EC2_USER@$EC2_HOST "
            set -e # Dừng ngay nếu có lỗi

            echo '>>> Connected to EC2. Starting Next.js deploy...'

            # 1. Đi tới thư mục dự án
            # Lệnh 'mkdir -p' đảm bảo thư mục tồn tại mà không báo lỗi
            sudo mkdir -p $DEPLOY_PATH
            sudo chown $EC2_USER:$EC2_USER $DEPLOY_PATH
            cd $DEPLOY_PATH

            # 2. Kéo code mới nhất
            # Kiểm tra xem có phải là repo Git không, nếu không thì clone
            if [ ! -d ".git" ]; then
              echo '>>> Cloning repository for the first time...'
              git clone git@gitlab.com:YOUR_USERNAME/YOUR_REPO_NAME.git .
            else
              echo '>>> Pulling latest code...'
              git pull origin main
            fi

            # 3. Cài đặt dependencies
            echo '>>> Installing dependencies (npm install)...'
            npm install

            # 4. Build dự án Next.js
            echo '>>> Building Next.js project (npm run build)...'
            npm run build

            # 5. Khởi động hoặc Khởi động lại với PM2
            echo '>>> Starting/Restarting PM2 process...'
            # Đổi 'my-nextjs-app' thành tên app của bạn
            pm2 restart my-nextjs-app || pm2 start npm --name 'my-nextjs-app' -- start

            echo '>>> NEXT.JS DEPLOYMENT SUCCESSFUL!'
          "

      rules:
        - if: '$CI_COMMIT_BRANCH == "main"'
    ```
    > **Lưu ý:** Hãy thay `git@gitlab.com:YOUR_USERNAME/YOUR_REPO_NAME.git` bằng URL SSH của repo bạn.

---

## 🖥 Giai đoạn 4: Cấu hình Nginx (Reverse Proxy)

Chúng ta cần map tên miền (`your-domain.com`) đến ứng dụng Next.js đang chạy trên cổng 3000 (mặc định).

1.  **Trỏ DNS:**
    * Vào trình quản lý DNS của bạn.
    * Tạo một **A Record**.
    * **Host:** `@` (cho domain gốc) hoặc `sos-backend` (cho subdomain).
    * **Value:** IP công khai của EC2.

2.  **Cấu hình Security Group:**
    * Vào Bảng điều khiển EC2 > Security Groups.
    * Thêm 2 "Inbound rules" (Quy tắc đầu vào):
        * `Type: HTTP`, `Port: 80`, `Source: Anywhere-IPv4 (0.0.0.0/0)`
        * `Type: HTTPS`, `Port: 443`, `Source: Anywhere-IPv4 (0.0.0.0/0)`

3.  **Tắt Apache (nếu có):**
    * Amazon Linux thường cài sẵn Apache (`httpd`). Nó chiếm cổng 80 và sẽ xung đột với Nginx.
    ```bash
    sudo systemctl stop httpd
    sudo systemctl disable httpd
    ```

4.  **Cấu hình Nginx:**
    * Tạo một file config mới cho trang của bạn:
        ```bash
        sudo nano /etc/nginx/conf.d/my-nextjs-app.conf
        ```
    * Dán nội dung sau vào. Nhớ thay `your-domain.com` bằng tên miền của bạn.
        ```nginx
        server {
            listen 80;
            server_name your-domain.com; # <-- Thay bằng tên miền của bạn

            location / {
                proxy_pass [http://127.0.0.1:3000](http://127.0.0.1:3000); # Cổng mặc định của Next.js
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```

5.  **Cho phép Nginx kết nối mạng (Lỗi SELinux):**
    ```bash
    sudo setsebool -P httpd_can_network_connect 1
    ```

6.  **Khởi động Nginx:**
    ```bash
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    ```

---

## 🔒 Giai đoạn 5: Cài đặt SSL (HTTPS) với Certbot

1.  **Cài đặt Certbot:**
    ```bash
    sudo dnf install certbot python3-certbot-nginx -y
    ```

2.  **Chạy Certbot:**
    ```bash
    sudo certbot --nginx
    ```
    * Certbot sẽ tự động đọc file config của bạn, hỏi bạn muốn kích hoạt HTTPS cho tên miền nào, và tự động cấu hình Nginx.
    * Khi được hỏi "Redirect HTTP traffic to HTTPS?", hãy chọn **Redirect** (thường là lựa chọn 2).

---

## 🚀 Giai đoạn 6: Deploy

Bây giờ, tất cả đã sẵn sàng.

1.  **Trên EC2,** tạo file `.env.production` (hoặc `.env.local`) trong thư mục `$DEPLOY_PATH` (`/var/www/my-nextjs-app`) với tất cả các biến môi trường cần thiết cho ứng dụng Next.js.
    ```bash
    cd /var/www/my-nextjs-app
    nano .env.production
    # Dán các biến môi trường của bạn vào đây
    # Vd: DATABASE_URL=...
    ```

2.  **Trên máy local,** commit và push tất cả các thay đổi của bạn (bao gồm cả file `.gitlab-ci.yml`) lên branch `main`:
    ```bash
    git add .
    git commit -m "feat: Add GitLab CI/CD pipeline for Next.js"
    git push origin main
    ```

3.  Truy cập GitLab, vào mục **CI/CD > Pipelines** và xem pipeline của bạn tự động chạy.