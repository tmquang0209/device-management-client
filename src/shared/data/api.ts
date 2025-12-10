import { AxiosHttpClient } from "./axios-http-client";

export const api = new AxiosHttpClient(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000");
