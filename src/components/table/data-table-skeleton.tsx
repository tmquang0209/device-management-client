import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showSearch?: boolean;
  showColumnToggle?: boolean;
  showPagination?: boolean;
}

export function TableSkeleton({
  columns,
  rows = 5,
  showSearch = true,
  showColumnToggle = true,
  showPagination = true,
}: Readonly<TableSkeletonProps>) {
  return (
    <div>
      {/* Table Controls Skeleton */}
      {(showSearch || showColumnToggle) && (
        <div className="flex items-center py-4">
          {showSearch && <Skeleton className="h-10 w-80 max-w-sm" />}
          {showColumnToggle && <Skeleton className="ml-auto h-10 w-20" />}
        </div>
      )}

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => {
                const key = `skeleton-head-col-${columns}-${index}`;
                return (
                  <TableHead key={key}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => {
              const rowKey = `skeleton-row-${rowIndex}`;
              return (
                <TableRow key={rowKey}>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      )}
    </div>
  );
}
