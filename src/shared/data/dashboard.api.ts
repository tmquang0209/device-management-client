import { api } from "./api";

export type EntityCounts = {
  users: number;
  devices: number;
  deviceTypes: number;
  deviceLocations: number;
  suppliers: number;
  partners: number;
  racks: number;
  loanSlips: number;
  returnSlips: number;
  maintenanceSlips: number;
  maintenanceReturnSlips: number;
  activeDevices: number;
  devicesInMaintenance: number;
  devicesOnLoan: number;
  pendingLoanSlips: number;
  pendingMaintenanceSlips: number;
};

export type RecentActivity = {
  id: string;
  type: string;
  message: string;
  date: string;
  user?: string;
};

export type DashboardData = {
  counts: EntityCounts;
  recent: RecentActivity[];
};

export type DashboardApiResponse = {
  data: DashboardData;
  message: string;
  statusCode: number;
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardApiResponse>("/dashboard");
    return response.data;
  },
};
