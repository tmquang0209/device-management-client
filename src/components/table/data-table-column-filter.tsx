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

// Loại bộ lọc
export type FilterType =
  | "text" // Văn bản
  | "number" // Số
  | "select" // Chọn một
  | "multiselect" // Chọn nhiều
  | "range" // Khoảng giá trị
  | "date" // Ngày
  | "date-range"; // Khoảng ngày

// Tùy chọn cho các bộ lọc dạng chọn
export interface FilterOption {
  label: string; // Nhãn hiển thị
  value: string | number; // Giá trị
}

// Cấu hình bộ lọc cho từng cột
export interface ColumnFilterConfig {
  type: FilterType; // Loại bộ lọc
  options?: FilterOption[]; // Danh sách tùy chọn (nếu có)
  placeholder?: string; // Gợi ý nhập liệu
  min?: number; // Giá trị nhỏ nhất (nếu có)
  max?: number; // Giá trị lớn nhất (nếu có)
}

// Props cho component bộ lọc cột
interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue> & {
    columnDef: { meta?: { label?: string; placeholder?: string } };
  };
  config: ColumnFilterConfig;
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  config,
}: Readonly<DataTableColumnFilterProps<TData, TValue>>) {
  const [isOpen, setIsOpen] = useState(false);
  const filterValue = column.getFilterValue();

  // Xóa bộ lọc
  const clearFilter = () => {
    column.setFilterValue(undefined);
  };

  const hasFilter = filterValue !== undefined && filterValue !== "";

  // Hàm phụ trợ để tránh lồng nhau sâu
  function handleTextOrNumberChange(
    value: string | React.ChangeEvent<HTMLInputElement>,
    column: Column<TData, TValue>,
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
    column: Column<TData, TValue>,
  ) {
    const stringValue = String(optionValue);
    const newValues = checked
      ? [...selectedValues, stringValue]
      : selectedValues.filter((v) => v !== stringValue);
    column.setFilterValue(newValues.length > 0 ? newValues : undefined);
  }

  // Render nội dung bộ lọc theo loại
  const renderFilterContent = () => {
    switch (config.type) {
      case "text":
        return (
          <Input
            placeholder={config.placeholder || `Lọc ${column.id}...`}
            value={(filterValue as string) ?? ""}
            onChange={(value) => handleTextOrNumberChange(value, column)}
            className="h-8 w-full border-none"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={config.placeholder || `Lọc ${column.id}...`}
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
              <SelectValue placeholder={config.placeholder || "Chọn..."} />
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
                      column,
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
                <Label className="text-xs">Tối thiểu</Label>
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
                <Label className="text-xs">Tối đa</Label>
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
                {dateValue ? format(dateValue, "PPP") : "Chọn ngày"}
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
              <Label className="text-xs">Từ ngày</Label>
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
                      : "Chọn ngày bắt đầu"}
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
              <Label className="text-xs">Đến ngày</Label>
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
                      : "Chọn ngày kết thúc"}
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
    // Với bộ lọc đơn giản, hiển thị trực tiếp
    return renderFilterContent();
  }

  // Với bộ lọc phức tạp, dùng popover
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
            {(() => {
              switch (config.type) {
                case "select":
                  return "Chọn một";
                case "multiselect":
                  return "Chọn nhiều";
                case "range":
                  return "Khoảng giá trị";
                case "date":
                  return "Ngày";
                case "date-range":
                  return "Khoảng ngày";
                default:
                  return config.type;
              }
            })()}
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
              <h4 className="font-medium">
                {column.columnDef.meta?.placeholder ??
                  `Bộ lọc ${column.columnDef.meta?.label ?? column.id}`}
              </h4>
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
