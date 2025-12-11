import {
  Clock,
  CreditCard,
  FileText,
  Handshake,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Package,
  Receipt,
  RotateCw,
  Settings,
  Shield,
  Sliders,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

export type MenuItem = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  children?: MenuItem[];
};

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    id: "device",
    icon: Package,
    label: "Thiết bị",
    children: [
      {
        id: "device-list",
        icon: Package,
        label: "Danh sách thiết bị",
        href: "/device",
      },
      {
        id: "device-type",
        icon: ListChecks,
        label: "Loại thiết bị",
        href: "/device-type",
      },
      {
        id: "device-location",
        icon: Warehouse,
        label: "Vị trí lưu trữ",
        href: "/device-location",
      },
    ],
  },
  {
    id: "activities",
    icon: CreditCard,
    label: "Hoạt động",
    children: [
      {
        id: "loan-slip",
        icon: Receipt,
        label: "Phiếu mượn",
        href: "/loan-slip",
      },
      { id: "return", icon: RotateCw, label: "Hoàn trả", href: "/return" },
      { id: "history", icon: Clock, label: "Lịch sử", href: "/history" },
    ],
  },
  {
    id: "warranty",
    icon: Wrench,
    label: "Bảo hành",
    children: [
      {
        id: "warranty-slip",
        icon: Receipt,
        label: "Phiếu bảo hành",
        href: "/maintenance-slip",
      },
      { id: "repair", icon: Wrench, label: "Sửa chữa", href: "/repair" },
      {
        id: "waiting-list",
        icon: Clock,
        label: "Danh sách đợi",
        href: "/waiting-list",
      },
    ],
  },
  {
    id: "users",
    icon: Users,
    label: "Người dùng",
    children: [
      { id: "user-list", icon: Users, label: "Người dùng", href: "/user" },
      // {
      //   id: "supplier",
      //   icon: Building2,
      //   label: "Nhà cung cấp",
      //   href: "/supplier",
      // },
      { id: "partner", icon: Handshake, label: "Đối tác", href: "/partner" },
    ],
  },
  {
    id: "system",
    icon: Sliders,
    label: "Hệ thống",
    children: [
      {
        id: "param-config",
        icon: Wrench,
        label: "Cấu hình tham số",
        href: "/param-config",
      },
      {
        id: "system-config",
        icon: Settings,
        label: "Thông số hệ thống",
        href: "/config",
      },
      { id: "role", icon: Shield, label: "Phân quyền", href: "/role" },
      { id: "audit", icon: FileText, label: "Audit Logs", href: "/audit-logs" },
    ],
  },
];

export const bottomItems: MenuItem[] = [
  { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  { id: "logout", icon: LogOut, label: "Log Out", href: "/logout" },
];
