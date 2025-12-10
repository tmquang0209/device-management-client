"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Column } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, Filter, X } from "lucide-react";
import { useState } from "react";

export type FilterType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "range"
  | "date"
  | "date-range";

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface ColumnFilterConfig {
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  config: ColumnFilterConfig;
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  config,
}: Readonly<DataTableColumnFilterProps<TData, TValue>>) {
  const [isOpen, setIsOpen] = useState(false);
  const filterValue = column.getFilterValue();

  const clearFilter = () => {
    column.setFilterValue(undefined);
  };

  const hasFilter = filterValue !== undefined && filterValue !== "";

  // Helper functions to avoid deep nesting
  function handleTextOrNumberChange(
    value: string | React.ChangeEvent<HTMLInputElement>,
    column: Column<TData, TValue>
  ) {
    if (typeof value === "string") {
      column.setFilterValue(value);
    } else {
      column.setFilterValue(value.target.value);
    }
  }

  function handleMultiSelectCheckedChange(
    checked: boolean,
    optionValue: string | number,
    selectedValues: string[],
    column: Column<TData, TValue>
  ) {
    const stringValue = String(optionValue);
    const newValues = checked
      ? [...selectedValues, stringValue]
      : selectedValues.filter((v) => v !== stringValue);
    column.setFilterValue(newValues.length > 0 ? newValues : undefined);
  }

  const renderFilterContent = () => {
    switch (config.type) {
      case "text":
        return (
          <Input
            placeholder={config.placeholder || `Filter ${column.id}...`}
            value={(filterValue as string) ?? ""}
            onChange={(value) => handleTextOrNumberChange(value, column)}
            className="h-8 w-full border-none"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={config.placeholder || `Filter ${column.id}...`}
            value={(filterValue as string) ?? ""}
            onChange={(value) => handleTextOrNumberChange(value, column)}
            min={config.min}
            max={config.max}
            className="h-8 w-full border-none"
          />
        );

      case "select":
        return (
          <Select
            value={(filterValue as string) ?? ""}
            onValueChange={(value) => column.setFilterValue(value)}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder={config.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect": {
        const selectedValues = (filterValue as string[]) ?? [];
        return (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {config.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${column.id}-${option.value}`}
                  checked={selectedValues.includes(String(option.value))}
                  onCheckedChange={(checked) =>
                    handleMultiSelectCheckedChange(
                      !!checked,
                      option.value,
                      selectedValues,
                      column
                    )
                  }
                />
                <Label
                  htmlFor={`${column.id}-${option.value}`}
                  className="text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );
      }

      case "range": {
        const rangeValue = (filterValue as [number, number]) ?? [
          config.min ?? 0,
          config.max ?? 100,
        ];
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min</Label>
                <Input
                  type="number"
                  value={rangeValue[0]}
                  onChange={(value) => {
                    let inputValue: string;
                    if (typeof value === "string") {
                      inputValue = value;
                    } else {
                      inputValue = value.target.value;
                    }
                    const newValue: [number, number] = [
                      Number(inputValue),
                      rangeValue[1],
                    ];
                    column.setFilterValue(newValue);
                  }}
                  min={config.min}
                  max={config.max}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Max</Label>
                <Input
                  type="number"
                  value={rangeValue[1]}
                  onChange={(value) => {
                    let inputValue: string;
                    if (typeof value === "string") {
                      inputValue = value;
                    } else {
                      inputValue = value.target.value;
                    }
                    const newValue: [number, number] = [
                      rangeValue[0],
                      Number(inputValue),
                    ];
                    column.setFilterValue(newValue);
                  }}
                  min={config.min}
                  max={config.max}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        );
      }

      case "date": {
        const dateValue = filterValue as Date;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => column.setFilterValue(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }

      case "date-range": {
        const dateRangeValue = (filterValue as [
          Date | undefined,
          Date | undefined,
        ]) ?? [undefined, undefined];
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 w-full justify-start text-left font-normal",
                      !dateRangeValue[0] && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRangeValue[0]
                      ? format(dateRangeValue[0], "PPP")
                      : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRangeValue[0]}
                    onSelect={(date) => {
                      const newValue: [Date | undefined, Date | undefined] = [
                        date,
                        dateRangeValue[1],
                      ];
                      column.setFilterValue(newValue);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 w-full justify-start text-left font-normal",
                      !dateRangeValue[1] && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRangeValue[1]
                      ? format(dateRangeValue[1], "PPP")
                      : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRangeValue[1]}
                    onSelect={(date) => {
                      const newValue: [Date | undefined, Date | undefined] = [
                        dateRangeValue[0],
                        date,
                      ];
                      column.setFilterValue(newValue);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (config.type === "text" || config.type === "number") {
    // For simple filters, render inline
    return renderFilterContent();
  }

  // For complex filters, use popover
  return (
    <div className="flex items-center space-x-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 border-dashed",
              hasFilter && "bg-accent border-solid",
            )}
          >
            <Filter className="mr-2 h-3 w-3" />
            {config.type}
            {hasFilter && (
              <div className="bg-primary text-primary-foreground ml-1 rounded-sm px-1 text-xs">
                1
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter {column.id}</h4>
              {hasFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {renderFilterContent()}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
