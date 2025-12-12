import { api } from "@/shared/data/api";
import { IPaginatedResponse } from "@/shared/interfaces";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useCallback, useMemo } from "react";
import AsyncSelectComponent from "react-select/async";

export interface AsyncSelectOption {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

export interface TransformKey {
  label: string;
  value: string;
}

export interface AsyncSelectProps {
  endpoint: string;
  transformKey: TransformKey;
  placeholder?: string;
  isSearchable?: boolean;
  queryParams?: Record<string, unknown>;
  value?: AsyncSelectOption | null;
  onChange: (value: AsyncSelectOption | null) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function AsyncSelect<T = Record<string, unknown>>(
  props: Readonly<AsyncSelectProps>,
) {
  const {
    endpoint,
    transformKey,
    value,
    onChange,
    queryParams = {},
    placeholder = "Please select...",
    isSearchable = true,
    size = "md",
    disabled = false,
    className = "",
    emptyMessage = "No options available",
  } = props;

  // Load options function with search
  const loadOptionsFunc = useCallback(
    async (inputValue: string): Promise<AsyncSelectOption[]> => {
      try {
        const searchParams = {
          ...queryParams,
          [transformKey.label]: inputValue.trim(),
        };

        const res = await api.get<IPaginatedResponse<T>>(endpoint, {
          params: searchParams,
        });

        const transformedData = res.data.map((item: T) => ({
          label: (item as Record<string, unknown>)[
            transformKey.label
          ] as string,
          value: (item as Record<string, unknown>)[transformKey.value] as
            | string
            | number,
        }));

        return transformedData;
      } catch (error) {
        console.error("Error loading options:", error);
        return [];
      }
    },
    [endpoint, queryParams, transformKey],
  );

  // Create debounced version of loadOptions
  const debouncedLoadOptions = useMemo(
    () =>
      debounce(
        (
          inputValue: string,
          callback: (result: AsyncSelectOption[]) => void,
        ) => {
          loadOptionsFunc(inputValue)
            .then(callback)
            .catch(() => callback([]));
        },
        300,
      ),
    [loadOptionsFunc],
  );

  // Wrapper function for react-select that returns a Promise
  const loadOptions = useCallback(
    (inputValue: string): Promise<AsyncSelectOption[]> => {
      return new Promise<AsyncSelectOption[]>((resolve) => {
        debouncedLoadOptions(inputValue, resolve);
      });
    },
    [debouncedLoadOptions],
  );

  // Initial load for default options
  const { data: defaultOptions, isLoading } = useQuery<AsyncSelectOption[]>({
    queryKey: [endpoint, JSON.stringify(queryParams)],
    queryFn: async () => {
      const res = await api.get<IPaginatedResponse<T>>(endpoint, {
        params: queryParams,
      });
      const transformedData = res.data.map((item: T) => ({
        label: (item as Record<string, unknown>)[transformKey.label] as string,
        value: (item as Record<string, unknown>)[transformKey.value] as
          | string
          | number,
      }));

      console.log("🚀 ~ AsyncSelect ~ transformedData:", transformedData);
      return transformedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className={`w-full ${className}`}>
      <AsyncSelectComponent<AsyncSelectOption, false>
        defaultOptions={defaultOptions || []}
        loadOptions={loadOptions}
        placeholder={placeholder}
        isClearable
        isLoading={isLoading}
        isSearchable={isSearchable}
        isDisabled={disabled}
        value={value}
        onChange={(selectedOption) => onChange(selectedOption)}
        noOptionsMessage={() => emptyMessage}
        styles={{
          control: (provided) => {
            const getMinHeight = () => {
              if (size === "sm") return "32px";
              if (size === "lg") return "48px";
              return "40px";
            };

            return {
              ...provided,
              minHeight: getMinHeight(),
            };
          },
        }}
      />
    </div>
  );
}
