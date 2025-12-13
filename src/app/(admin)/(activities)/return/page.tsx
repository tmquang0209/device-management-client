"use client";

import { DataTable } from "@/components/table/data-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/shared/data/api";
import {
  EReturnSlipStatus,
  IPaginatedResponse,
  IPartner,
  IResponse,
  IReturnSlip,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Edit, Eye, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<
  number,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "secondary";
  }
> = {
  [EReturnSlipStatus.RETURNED]: { label: "Đã nhập kho", variant: "success" },
  [EReturnSlipStatus.CANCELLED]: { label: "Đã hủy", variant: "destructive" },
};

const createColumns = (
  partners?: IPartner[],
  onViewDetails?: (returnSlip: IReturnSlip) => void,
): ColumnDef<IReturnSlip>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Giao Dịch Trả" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{row.original.code}</span>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(row.original)}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
    ),
    size: 180,
  },
  {
    accessorKey: "loanSlip.code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Giao Dịch Mượn" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.loanSlip?.code || "N/A"}
      </span>
    ),
    size: 180,
  },
  {
    accessorKey: "returnerId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người Trả Thiết Bị" />
    ),
    cell: ({ row }) => row.original.returner?.user?.name || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Người Trả Thiết Bị",
      filterType: "select",
      options: partners?.map((partner) => ({
        label: partner.user?.name || `Partner ${partner.id}`,
        value: partner.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "returnDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Trả" />
    ),
    cell: ({ row }) => dayjs(row.getValue("returnDate")).format("DD/MM/YYYY"),
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Ngày Trả",
    },
    size: 120,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng Thái" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as number;
      const statusInfo = statusLabels[status] || {
        label: "Không xác định",
        variant: "secondary" as const,
      };
      return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: "Trạng Thái",
      filterType: "select",
      options: [
        { label: "Đã nhập kho", value: EReturnSlipStatus.RETURNED },
        { label: "Đã hủy", value: EReturnSlipStatus.CANCELLED },
      ],
    },
    size: 120,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Cập Nhật" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY HH:mm:ss"),
    size: 170,
  },
];

function ReturnSlipActions(
  row: Readonly<IReturnSlip>,
  onViewDetails: (returnSlip: IReturnSlip) => void,
  onEdit: (returnSlip: IReturnSlip) => void,
  onCancel: (returnSlip: IReturnSlip) => void,
) {
  const canEdit = row.status === EReturnSlipStatus.RETURNED;
  const canCancel = row.status === EReturnSlipStatus.RETURNED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Mở menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(row)}>
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <Edit className="mr-2 h-4 w-4" />
              Sửa thông tin
            </DropdownMenuItem>
          </>
        )}
        {canCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCancel(row)}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Hủy giao dịch
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ReturnSlipPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: partners,
    error: partnersError,
    isLoading: partnersLoading,
  } = useQuery({
    queryKey: ["partners"],
    queryFn: async (): Promise<IPartner[]> => {
      const response = await api.get<IResponse<IPartner[]>>("/partners");
      return response.data || [];
    },
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        const err = error as Error & { response?: { status?: number } };
        if (
          err?.response?.status &&
          err.response.status >= 400 &&
          err.response.status < 500
        ) {
          return false;
        }
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    enabled: mounted,
  });

  useEffect(() => {
    if (partnersError) {
      const errorMessage =
        partnersError instanceof Error
          ? partnersError.message
          : "Không thể tải danh sách đối tác";
      toast.error(errorMessage);
    }
  }, [partnersError]);

  const columns = useMemo(
    () =>
      createColumns(partners, (returnSlip) => {
        router.push(`/return/${returnSlip.id}`);
      }),
    [partners, router],
  );

  const getReturnSlips = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IReturnSlip>>(
      "/return-slips",
      { params },
    );
    return response;
  };

  const onCreateReturnSlip = () => {
    router.push("/return/create");
  };

  const onViewDetails = (returnSlip: IReturnSlip) => {
    router.push(`/return/${returnSlip.id}`);
  };

  const onEditReturnSlip = (returnSlip: IReturnSlip) => {
    router.push(`/return/${returnSlip.id}/edit`);
  };

  const onCancelReturnSlip = async (returnSlip: IReturnSlip) => {
    try {
      await api.delete(`/return-slips/${returnSlip.id}/cancel`);
      toast.success("Hủy giao dịch trả thành công");
      queryClient.invalidateQueries({
        queryKey: ["return-slips"],
        exact: false,
      });
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy giao dịch trả");
    }
  };

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Quản Lý Giao Dịch Trả Thiết Bị</h1>
      <p className="text-muted-foreground">
        Quản lý các giao dịch trả thiết bị và thông tin của chúng
      </p>

      <DataTable<IReturnSlip, unknown>
        columns={columns}
        queryKey={["return-slips"]}
        queryFn={getReturnSlips}
        searchColumn="id"
        searchPlaceholder="Tìm kiếm giao dịch trả..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy giao dịch trả nào."
        globalActions={
          <Button onClick={onCreateReturnSlip}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        }
        columnActions={(row) =>
          ReturnSlipActions(
            row,
            onViewDetails,
            onEditReturnSlip,
            onCancelReturnSlip,
          )
        }
      />
    </Card>
  );
}
