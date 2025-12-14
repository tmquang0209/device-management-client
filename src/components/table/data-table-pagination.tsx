"use client";

import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface DataTablePaginationProps<TData> {
  readonly table: Table<TData>;
  readonly totalRows?: number;
  readonly selectedCount?: number;
}

export function DataTablePagination<TData>({
  table,
  totalRows = 0,
  selectedCount = 0,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground flex-1 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span>
            Hiển thị {pageIndex * pageSize + 1} đến{" "}
            {Math.min((pageIndex + 1) * pageSize, totalRows)} trong tổng số{" "}
            {totalRows} kết quả
          </span>
          {selectedCount > 0 && (
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {selectedCount} selected
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-6 lg:space-x-8">
        <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
          <p className="text-sm font-medium">Số dòng mỗi trang</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between sm:justify-center">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium sm:w-auto">
            Trang {pageIndex + 1} trên {pageCount || 1}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 bg-transparent sm:flex lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Đi đến trang đầu tiên</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-transparent"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Đi đến trang trước</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-transparent"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Đi đến trang tiếp theo</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 bg-transparent sm:flex lg:flex"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Đi đến trang cuối</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
