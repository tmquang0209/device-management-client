import {
  IErrorResponse,
  IGenericResponse,
} from "../interfaces/common.interface";

export function parseApiError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      response?: {
        data?: IErrorResponse | IGenericResponse;
      };
      message?: string;
    };

    if (err.response?.data?.message) {
      const message = err.response.data.message;
      // Handle both string and array formats
      if (Array.isArray(message)) {
        return message.join(", ");
      }
      return message;
    }

    if (err.message) return err.message;
  }
  return "Something went wrong";
}
