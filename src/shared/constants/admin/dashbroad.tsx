import {
  Activity,
  AlertTriangle,
  Clock,
  CreditCard,
  Database,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

export const stats = [
  {
    title: "Total Users",
    value: "45,234",
    change: "12.5% Up from last month",
    trend: "up",
    icon: Users,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    title: "Payment Transactions",
    value: "$2.4M",
    change: "8.2% Up from last week",
    trend: "up",
    icon: CreditCard,
    color:
      "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    title: "Today's Visits",
    value: "18,456",
    change: "3.1% Down from yesterday",
    trend: "down",
    icon: Activity,
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  },
  {
    title: "Security Alerts",
    value: "7",
    change: "2 new alerts",
    trend: "up",
    icon: Shield,
    color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
];

export const systemStats = [
  {
    title: "Database Size",
    value: "85.2GB",
    change: "2.1GB Up from last week",
    trend: "up",
    icon: Database,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  },
  {
    title: "System Errors",
    value: "23",
    change: "15% Down from yesterday",
    trend: "down",
    icon: AlertTriangle,
    color:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  {
    title: "System Performance",
    value: "96.8%",
    change: "0.3% Up from yesterday",
    trend: "up",
    icon: TrendingUp,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  {
    title: "Response Time",
    value: "245ms",
    change: "12ms Down from yesterday",
    trend: "down",
    icon: Clock,
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400",
  },
];
