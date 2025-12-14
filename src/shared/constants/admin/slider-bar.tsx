import {
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
    label: "Giao dịch mượn - trả",
    children: [
      {
        id: "loan-slip",
        icon: Receipt,
        label: "Giao dịch mượn",
        href: "/loan-slip",
      },
      { id: "return", icon: RotateCw, label: "Giao dịch trả", href: "/return" },
      // { id: "history", icon: Clock, label: "Lịch sử", href: "/history" },
    ],
  },
  {
    id: "warranty",
    icon: Settings,
    label: "Bảo hành",
    children: [
      {
        id: "warranty-slip",
        icon: FileText,
        label: "Phiếu bảo hành",
        href: "/maintenance-slip",
      },
      {
        id: "maintenance-slip-return",
        icon: RotateCw,
        label: "Phiếu trả bảo hành",
        href: "/maintenance-slip/return",
      },
    ],
  },
  {
    id: "users",
    icon: Users,
    label: "Người dùng",
    children: [
      { id: "user-list", icon: Users, label: "Người dùng", href: "/user" },
      { id: "partner", icon: Handshake, label: "Đối tượng", href: "/partner" },
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
      // { id: "role", icon: Shield, label: "Phân quyền", href: "/role" },
      { id: "audit", icon: FileText, label: "Audit Logs", href: "/audit-logs" },
    ],
  },
];

export const bottomItems: MenuItem[] = [
  { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  { id: "logout", icon: LogOut, label: "Log Out", href: "/logout" },
];
