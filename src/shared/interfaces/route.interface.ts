export interface RouteInfo {
  id: string;
  method: string;
  endpoint: string;
  key?: string | null;
  isPublic?: boolean;
  controller: string;
};