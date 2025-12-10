export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  role: {
    code: string;
    id: string;
    name: string;
    permissions: {
      id: string;
      key: string;
      endpoint: string;
    }[];
  };
}