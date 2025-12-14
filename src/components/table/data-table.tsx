"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IPaginatedResponse } from "@/shared/interfaces";
import { useQuery } from "@tanstack/react-query";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { debounce } from "lodash";
import { Columns3Cog, FunnelX, ListFilter, RefreshCcw } from "lucide-react";
import type React from "react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { v7 as uuidv7 } from "uuid";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { ColumnResizer } from "./column-resizer";
import {
  ColumnFilterConfig,
  DataTableColumnFilter,
  FilterOption,
  FilterType,
} from "./data-table-column-filter";
import { DataTablePagination } from "./data-table-pagination";

const getCommonPinningStyles = <TData,>(
  column: Column<TData>,
): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");

  let boxShadow: string | undefined = undefined;
  if (isLastLeftPinnedColumn) {
    boxShadow = "-4px 0 4px -4px hsl(var(--border)) inset";
  } else if (isFirstRightPinnedColumn) {
    boxShadow = "4px 0 4px -4px hsl(var(--border)) inset";
  }

  return {
    boxShadow,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 10 : 1,
    backgroundColor: isPinned ? "white" : undefined,
    textWrap: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
};

// Define meta configuration interface
interface ColumnMetaConfig {
  label?: string;
  filterType?: FilterType;
  options?: FilterOption[];
  placeholder?: string;
}

interface IDataTableProps<TData, TValue> {
  readonly columns: ColumnDef<TData, TValue>[];
  readonly queryKey: string[];
  readonly queryFn: (
    params: Record<string, unknown>,
  ) => Promise<IPaginatedResponse<TData>>;
  readonly searchColumn?: string;
  readonly searchPlaceholder?: string;
  readonly initialFilters?: Record<string, unknown>;
  readonly globalActions?: React.ReactNode;
  readonly columnActions?: (row: TData) => React.ReactNode;
  readonly emptyMessage?: string;
  readonly columnFilters?: Record<string, ColumnFilterConfig>;
  readonly onRowSelectionChange?: (
    selectedRows: TData[],
    clearSelection: () => void,
  ) => void;
}

// Checkbox header component moved outside
interface CheckboxHeaderProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
}
function CheckboxHeader<TData>({
  table,
}: Readonly<CheckboxHeaderProps<TData>>) {
  return (
    <input
      type="checkbox"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  );
}

// Checkbox cell component
interface CheckboxCellProps<TData> {
  row: Row<TData>;
}
function CheckboxCell<TData>({ row }: Readonly<CheckboxCellProps<TData>>) {
  return (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
    />
  );
}

export function DataTable<TData, TValue>({
  columns,
  queryKey,
  queryFn,
  searchColumn = "name",
  searchPlaceholder = "Search...",
  initialFilters = {},
  globalActions,
  columnActions,
  emptyMessage = "No results found.",
  columnFilters: columnFilterConfigs = {},
  onRowSelectionChange,
}: IDataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["select"],
    right: ["actions"],
  });
  const [colSizing, setColSizing] = useState<ColumnSizingState>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rowSelection, setRowSelection] = useState({});
  const [reloadToggle, setReloadToggle] = useState<boolean>(false);

  // Build query parameters
  const queryParams = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    ...initialFilters,
    // Add column filters
    ...columnFilters.reduce(
      (acc, filter) => {
        acc[filter.id] = filter.value;
        return acc;
      },
      {} as Record<string, unknown>,
    ),
    // Add sorting
    ...(sorting.length > 0 && {
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? "DESC" : "ASC",
    }),
  };

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<IPaginatedResponse<TData>>({
    queryKey: [...queryKey, queryParams],
    queryFn: () => queryFn(queryParams),
  });

  const refetchData = async () => {
    setReloadToggle(true);
    try {
      await refetch();
      toast.success("Làm mới dữ liệu thành công");
    } catch (error) {
      toast.error("Làm mới dữ liệu thất bại");
      console.error("Refetch error:", error);
    } finally {
      setReloadToggle(false);
    }
  };

  const data = response?.data || [];
  const totalRows = response?.total || 0;
  const pageCount = Math.ceil(totalRows / pagination.pageSize);

  const finalColumns: ColumnDef<TData, TValue>[] = [
    // {
    //   id: "select",
    //   header: (props) => <CheckboxHeader table={props.table} />,
    //   cell: ({ row }) => <CheckboxCell row={row} />,
    //   enableHiding: false,
    //   enablePinning: true,
    //   enableSorting: false,
    //   enableColumnFilter: false,
    //   enableResizing: false,
    //   size: 40,
    // },
    ...columns,
    ...(columnActions
      ? [
          {
            id: "actions",
            cell: ({ row }: { row: Row<TData> }) =>
              columnActions?.(row.original) ?? null,
            enableHiding: false,
            enablePinning: true,
            enableSorting: false,
            enableColumnFilter: false,
            enableResizing: false,
            size: 40,
          },
        ]
      : []),
  ];

  const table = useReactTable({
    data,
    columns: finalColumns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColSizing,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableColumnPinning: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      columnSizing: colSizing,
      rowSelection,
    },
  });

  // Handle row selection changes
  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const tableRef = useRef(table);
  tableRef.current = table;

  useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRowsData = tableRef.current
        .getSelectedRowModel()
        .rows.map((row) => row.original as TData);
      onRowSelectionChange(selectedRowsData, clearSelection);
    }
  }, [rowSelection, onRowSelectionChange, clearSelection]);

  // Create debounced function for search after table is created
  const debouncedSetFilter = useMemo(
    () =>
      debounce((value: string) => {
        const column = table.getColumn(searchColumn);
        if (column) {
          column.setFilterValue(value || undefined);
        }
      }, 300),
    [table, searchColumn],
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      debouncedSetFilter(value);
    },
    [debouncedSetFilter],
  );

  // Create debounced function for column filters
  const debouncedColumnFilter = useMemo(
    () =>
      debounce((columnId: string, value: string) => {
        const column = table.getColumn(columnId);
        if (column) {
          column.setFilterValue(value || undefined);
        }
      }, 300),
    [table],
  );

  if (isError) {
    toast.error((error as unknown as string) ?? "Error loading data");
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(value) =>
              handleSearchChange(
                typeof value === "string" ? value : value.target.value,
              )
            }
            className="max-w-sm"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mx-2"
          >
            {showFilters ? <FunnelX /> : <ListFilter />}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {/* reload button */}
          <Button variant="outline" onClick={refetchData}>
            <RefreshCcw
              className={`h-4 w-4 ${reloadToggle ? "animate-spin" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3Cog />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const metaConfig = column.columnDef.meta as ColumnMetaConfig;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {metaConfig?.label || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {globalActions}
        </div>
      </div>

      {/* Table with proper pinning styles */}
      <div className="relative w-full max-w-full overflow-x-auto rounded-md border">
        <Table
          style={{
            width: table.getTotalSize(),
          }}
          className="relative w-full min-w-full table-fixed border-separate border-spacing-0"
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const column = header.column;
                  const columnDef = column.columnDef;
                  // Use meta configuration or fallback to explicit filter config
                  const metaConfig = columnDef.meta as ColumnMetaConfig;
                  const filterConfig =
                    columnFilterConfigs[column.id] ||
                    (metaConfig?.filterType
                      ? {
                          type: metaConfig.filterType,
                          options: metaConfig.options,
                          placeholder: metaConfig.placeholder,
                        }
                      : undefined);
                  return (
                    <TableHead
                      key={header.id}
                      style={getCommonPinningStyles(column)}
                    >
                      <div className="space-y-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}

                        {/* Show filter input if filters are enabled and column allows filtering */}
                        {showFilters &&
                          columnDef.enableColumnFilter !== false &&
                          !header.isPlaceholder &&
                          column.getCanFilter() && (
                            <>
                              {filterConfig ? (
                                <DataTableColumnFilter
                                  column={column}
                                  config={filterConfig}
                                />
                              ) : (
                                <Input
                                  placeholder={
                                    metaConfig?.placeholder ||
                                    `Search ${
                                      metaConfig?.label || column.id
                                    }...`
                                  }
                                  value={
                                    (column.getFilterValue() as string) ?? ""
                                  }
                                  onChange={(value) => {
                                    const inputValue =
                                      typeof value === "string"
                                        ? value
                                        : value.target.value;
                                    debouncedColumnFilter(
                                      column.id,
                                      inputValue,
                                    );
                                  }}
                                  className="h-8 w-full border-0"
                                />
                              )}
                            </>
                          )}

                        <ColumnResizer header={header} />
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {(() => {
              if (isLoading) {
                // Loading skeleton
                return Array.from({ length: pagination.pageSize }).map(() => {
                  return (
                    <TableRow key={uuidv7()}>
                      {finalColumns.map((column) => (
                        <TableCell key={column.id ?? uuidv7()}>
                          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                });
              } else if (table.getRowModel().rows?.length) {
                return table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell
                          key={cell.id}
                          style={getCommonPinningStyles(cell.column)}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ));
              } else {
                return (
                  <TableRow>
                    <TableCell
                      colSpan={finalColumns.length}
                      className="h-24 text-center"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                );
              }
            })()}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        totalRows={totalRows}
        selectedCount={table.getSelectedRowModel().rows.length}
      />
    </div>
  );
}
