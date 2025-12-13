"use client";

import { AsyncSelect, AsyncSelectOption } from "@/components/ui/async-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Control, FieldValues } from "react-hook-form";
import { MultiSelect } from "../multi-select";
import { Switch } from "../ui/switch";
import { IFormFieldConfig } from "./types";

interface FormFieldRendererProps {
  field: IFormFieldConfig;
  control: Control<FieldValues>;
  isLoading?: boolean;
  type?: string;
}

export function FormFieldRenderer({
  field,
  control,
  isLoading,
  type,
}: Readonly<FormFieldRendererProps>) {
  const isDisabled = type === "view" || isLoading || field.disabled;

  return (
    <FormField
      key={field.name}
      control={control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          {field.type !== "checkbox" && <FormLabel>{field.label}</FormLabel>}
          <FormControl>
            {(() => {
              switch (field.type) {
                case "textarea":
                  return (
                    <Textarea
                      placeholder={field.placeholder}
                      disabled={isDisabled}
                      className={cn("min-h-24 resize-none", field.className)}
                      {...formField}
                      value={
                        (formField.value as
                          | string
                          | number
                          | readonly string[]
                          | undefined) ?? ""
                      }
                      onChange={(e) => formField.onChange(e.target.value)}
                    />
                  );

                case "select": {
                  // Only set value if it exists in options to avoid selection issues
                  const currentValue = formField.value as string | undefined;
                  const validValue = field.options?.some(
                    (option) => option.value === currentValue,
                  )
                    ? currentValue
                    : undefined;

                  return (
                    <Select
                      value={validValue}
                      onValueChange={formField.onChange}
                      disabled={isDisabled}
                    >
                      <SelectTrigger className={field.className}>
                        <SelectValue
                          placeholder={field.placeholder || "Select an option"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }

                case "multiselect": {
                  // Filter value to only include valid options
                  const currentValue = (formField.value as string[]) || [];
                  const validOptions = field.options || [];
                  const validValue = currentValue.filter((val) =>
                    validOptions.some((option) => option.value === val),
                  );

                  return (
                    <MultiSelect
                      options={validOptions}
                      defaultChecked
                      defaultValue={validValue}
                      value={validValue}
                      onValueChange={(value) => formField.onChange(value)}
                      disabled={isDisabled}
                      placeholder={field.placeholder || "Select options"}
                      className={field.className}
                    />
                  );
                }

                case "async-select": {
                  if (!field.endpoint) {
                    return (
                      <div className="px-2 py-4 text-center">
                        <span className="text-destructive text-sm">
                          Endpoint is required for async-select
                        </span>
                      </div>
                    );
                  }

                  const valueKey =
                    field.transformKey?.value || field.mappingField || "id";
                  const labelKey =
                    field.transformKey?.label || field.mappingField || "name";

                  // Handle both string values and option objects
                  let currentValue: AsyncSelectOption | null = null;
                  if (formField.value) {
                    if (
                      typeof formField.value === "object" &&
                      "label" in formField.value
                    ) {
                      // Already an option object
                      currentValue = formField.value as AsyncSelectOption;
                    } else if (
                      typeof formField.value === "string" ||
                      typeof formField.value === "number"
                    ) {
                      // Try to find nested object to get the label
                      // e.g., for field "rackId", look for nested "rack" object
                      const nestedKey = field.name.replace(/Id$/, "");
                      const allFormValues = control._formValues as Record<
                        string,
                        unknown
                      >;
                      const nestedObject = allFormValues[nestedKey];

                      if (nestedObject && typeof nestedObject === "object") {
                        // Use the nested object's label field
                        const labelValue = (
                          nestedObject as Record<string, unknown>
                        )[labelKey];
                        const labelString =
                          typeof labelValue === "string" ||
                          typeof labelValue === "number"
                            ? String(labelValue)
                            : String(formField.value);
                        currentValue = {
                          value: formField.value,
                          label: labelString,
                        };
                      } else {
                        // Fallback: use value as label
                        currentValue = {
                          value: formField.value,
                          label: String(formField.value),
                        };
                      }
                    }
                  }

                  console.log(
                    "🚀 ~ FormFieldRenderer ~ currentValue:",
                    currentValue,
                    formField.value,
                  );
                  return (
                    <AsyncSelect
                      endpoint={field.endpoint}
                      transformKey={{ value: valueKey, label: labelKey }}
                      placeholder={field.placeholder || "Select an option"}
                      value={currentValue}
                      onChange={(option) => {
                        // Store the full option object, will be parsed before submit
                        formField.onChange(option);
                      }}
                      disabled={isDisabled}
                      className={field.className}
                      queryParams={field.queryParams}
                      emptyMessage="Không có lựa chọn nào phù hợp"
                    />
                  );
                }

                case "checkbox":
                  return (
                    <div
                      className={cn("flex items-center gap-2", field.className)}
                    >
                      <Checkbox
                        checked={!!formField.value}
                        onCheckedChange={(checked) =>
                          formField.onChange(checked === true)
                        }
                        disabled={isDisabled}
                      />
                      <FormLabel className="cursor-pointer font-normal">
                        {field.label}
                      </FormLabel>
                    </div>
                  );

                case "switch":
                  return (
                    <Switch
                      checked={!!formField.value}
                      onCheckedChange={(checked) =>
                        formField.onChange(checked === true)
                      }
                      disabled={isDisabled}
                    />
                  );

                default: {
                  const formatDateValue = (
                    value: string | number | readonly string[] | undefined,
                  ) => {
                    if (field.type === "date" && value) {
                      // If it's already in YYYY-MM-DD format, return as is
                      if (
                        typeof value === "string" &&
                        /^\d{4}-\d{2}-\d{2}$/.test(value)
                      ) {
                        return value;
                      }
                      // Try to parse and format the date
                      const date = new Date(value as string);
                      if (!Number.isNaN(date.getTime())) {
                        return date.toISOString().split("T")[0];
                      }
                    }
                    return (value as string) ?? "";
                  };

                  return (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      disabled={isDisabled}
                      className={field.className}
                      leftIcon={field.leftIcon}
                      rightIcon={field.rightIcon}
                      showPasswordToggle={field.showPasswordToggle}
                      {...formField}
                      value={formatDateValue(formField.value)}
                      onChange={(e) => {
                        const val =
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value;
                        formField.onChange(val);
                      }}
                    />
                  );
                }
              }
            })()}
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
