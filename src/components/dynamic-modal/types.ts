import { IResponse } from "@/shared/interfaces";
import type { z } from "zod";

export interface IFormFieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "number"
    | "password"
    | "textarea"
    | "select"
    | "checkbox"
    | "date"
    | "multiselect"
    | "switch"
    | "currency"
    | "async-select";
  placeholder?: string;
  description?: string;
  options?: { label: string; value: string }[];
  disabled?: boolean;
  mappingField?: string; // New field for mapping in multiselect/ select
  className?: string; // Add className support for custom styling
  leftIcon?: React.ReactNode; // Icon to show on the left side of input
  rightIcon?: React.ReactNode; // Icon to show on the right side of input
  showPasswordToggle?: boolean; // Show password toggle for password fields
  endpoint?: string; // For async-select, the API endpoint to fetch options
  queryParams?: Record<string, unknown>; // Query parameters for async-select endpoint
  transformKey?: {
    value?: string; // Key to use for option value (defaults to 'id')
    label?: string; // Key to use for option label (defaults to 'name', 'label', or 'title')
  };
}

export type ZodSchema = z.ZodObject<z.ZodRawShape>;

export interface DynamicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: ZodSchema;
  fields: IFormFieldConfig[];
  type: "create" | "edit" | "update" | "delete" | "view";
  apiEndpoint: string;
  title?: string;
  subtitle?: string;
  initialData?: Record<string, unknown>;
  fetchDetailsEndpoint?: string;
  onSuccess?: (data: IResponse<unknown>) => void;
  onError?: (error: Error) => void;
}
