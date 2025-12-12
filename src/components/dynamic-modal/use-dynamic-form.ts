"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { api } from "@/shared/data/api";
import { IResponse } from "@/shared/interfaces";
import { DynamicModalProps, IFormFieldConfig } from "./types";

const defaultInitialData = {};

export function useDynamicForm<TData = unknown>({
  open,
  onOpenChange,
  schema,
  fields,
  type,
  apiEndpoint,
  initialData = defaultInitialData,
  fetchDetailsEndpoint,
  onSuccess,
  onError,
}: Readonly<DynamicModalProps>) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: [fetchDetailsEndpoint],
    queryFn: async () => {
      if (!fetchDetailsEndpoint) return null;
      return api.get<IResponse<TData>>(fetchDetailsEndpoint);
    },
    enabled:
      open && (type === "update" || type === "edit") && !!fetchDetailsEndpoint,
  });

  useEffect(() => {
    if (open) {
      if (type === "update" || type === "edit") {
        if (detailsData?.data) {
          const mappingData = fields.reduce(
            (acc, field: IFormFieldConfig) => {
              if (field.type === "multiselect" && field.mappingField) {
                const value = (detailsData.data as Record<string, unknown>)[
                  field.name
                ];
                acc[field.name] = Array.isArray(value)
                  ? value.map(
                      (item: Record<string, unknown>) =>
                        item[field.mappingField!],
                    )
                  : [];
              } else if (field.type === "select" && field.options) {
                const rawValue = (detailsData.data as Record<string, unknown>)[
                  field.name
                ];
                // Normalize select value type to match option values
                const optionValues = field.options.map((o) => o.value);
                const areOptionValuesStrings = optionValues.every(
                  (v) => typeof v === "string",
                );
                const areOptionValuesNumbers = optionValues.every(
                  (v) => typeof v === "number",
                );

                if (rawValue !== undefined && rawValue !== null) {
                  if (areOptionValuesStrings) {
                    acc[field.name] = String(rawValue);
                  } else if (areOptionValuesNumbers) {
                    const num =
                      typeof rawValue === "number"
                        ? rawValue
                        : Number.parseInt(String(rawValue), 10);
                    acc[field.name] = Number.isNaN(num) ? undefined : num;
                  } else {
                    acc[field.name] = rawValue as unknown;
                  }
                }
              } else if (field.type === "async-select") {
                const rawValue = (detailsData.data as Record<string, unknown>)[
                  field.name
                ];

                // Attempt to derive a human-friendly label from nested object
                const nestedKey = field.name.replace(/Id$/, "");

                const nestedObject = (
                  detailsData.data as Record<string, unknown>
                )[nestedKey] as Record<string, unknown> | undefined;
                const labelKey =
                  field.transformKey?.label || field.mappingField || "name";

                let label: string | number | undefined;

                if (nestedObject && labelKey in nestedObject) {
                  label = nestedObject[labelKey] as string | number | undefined;
                }

                if (rawValue !== undefined && rawValue !== null) {
                  acc[field.name] = {
                    value: rawValue as string | number,
                    label:
                      label !== undefined ? String(label) : String(rawValue),
                  };
                }
              }
              return acc;
            },
            {} as Record<string, unknown>,
          );
          form.reset({ ...detailsData.data, ...mappingData } as z.infer<
            typeof schema
          >);
        } else if (initialData) {
          form.reset(initialData);
        }
      } else if (initialData) {
        form.reset(initialData);
      }
    }
  }, [open, detailsData, type, initialData, fields, form]);

  const mutation = useMutation<IResponse<TData>, Error, z.infer<typeof schema>>(
    {
      mutationFn: async (
        data: z.infer<typeof schema>,
      ): Promise<IResponse<TData>> => {
        switch (type) {
          case "create":
            return api.post<IResponse<TData>>(apiEndpoint, data);
          case "delete":
            return api.delete<IResponse<TData>>(apiEndpoint);
          case "edit":
          case "update":
            return api.put<IResponse<TData>>(apiEndpoint, data);
          default:
            throw new Error(`Unsupported type: ${type}`);
        }
      },
      onSuccess: (data: IResponse<TData>) => {
        toast(data.message);
        onSuccess?.(data);
        onOpenChange(false);
        form.reset();
      },
      onError: (error) => {
        console.error("API Error:", error);
        toast.error(
          (error as unknown as string) ||
            "An error occurred. Please try again.",
        );
        onError?.(error);
      },
    },
  );

  const onSubmit = (data: z.infer<typeof schema>) => {
    console.log("Form Data before parsing:", data, schema);
    // must parse async select fields to extract values
    fields.forEach((field: IFormFieldConfig) => {
      if (field.type === "async-select") {
        const fieldValue = data[field.name];
        console.log("Parsing field:", field.name, fieldValue);
        if (Array.isArray(fieldValue)) {
          // multiselect
          data[field.name] = fieldValue.map(
            (item: { value: string }) => item.value,
          );
        } else if (fieldValue && typeof fieldValue === "object") {
          // single select
          data[field.name] = (fieldValue as { value: string }).value;
        } else {
          data[field.name] = fieldValue;
        }
      }
    });

    mutation.mutate(data);
  };

  return {
    form,
    mutation,
    isLoadingDetails,
    detailsData,
    onSubmit,
  };
}
