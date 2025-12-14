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
  EMaintenanceReturnSlipStatus,
  IMaintenanceReturnSlip,
  IPaginatedResponse,
  IParamInfo,
  IPartner,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Edit, Eye, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const defaultStatusLabels: Record<
  number,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "secondary";
  }
> = {
  [EMaintenanceReturnSlipStatus.RETURNED]: {
    label: "Đã nhập kho",
    variant: "success",
  },
  [EMaintenanceReturnSlipStatus.CANCELLED]: {
    label: "Đã hủy",
    variant: "destructive",
  },
};

const getStatusVariant = (
  code: string,
): "default" | "success" | "destructive" | "secondary" => {
  switch (code) {
    case "1":
      return "success";
    case "2":
      return "destructive";
    default:
      return "default";
  }
};

const createColumns = (
  statusLabels: Record<
    number,
    {
      label: string;
      variant: "default" | "success" | "destructive" | "secondary";
    }
  >,
  partners?: IPartner[],
  onViewDetails?: (slip: IMaintenanceReturnSlip) => void,
): ColumnDef<IMaintenanceReturnSlip>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Phiếu Nhận" />
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
    accessorKey: "maintenanceSlip.code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Phiếu Bảo Trì" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.maintenanceSlip?.code || "N/A"}
      </span>
    ),
    size: 180,
  },
  {
    accessorKey: "maintenanceSlip.partner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Đối Tác Bảo Trì" />
    ),
    cell: ({ row }) =>
      row.original.maintenanceSlip?.partner?.user?.name || "N/A",
    size: 200,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Nhận" />
    ),
    cell: ({ row }) => dayjs(row.getValue("createdAt")).format("DD/MM/YYYY"),
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Ngày Nhận",
    },
    size: 120,
  },
  {
    accessorKey: "deviceCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số Thiết Bị" />
    ),
    cell: ({ row }) => row.original.maintenanceReturnSlipDetails?.length || 0,
    size: 100,
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
        { label: "Đã nhập kho", value: EMaintenanceReturnSlipStatus.RETURNED },
        { label: "Đã hủy", value: EMaintenanceReturnSlipStatus.CANCELLED },
      ],
    },
    size: 120,
  },
  {
    accessorKey: "creator.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người Tạo" />
    ),
    cell: ({ row }) => row.original.creator?.name || "N/A",
    size: 150,
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

function MaintenanceReturnSlipActions(
  row: Readonly<IMaintenanceReturnSlip>,
  onViewDetails: (slip: IMaintenanceReturnSlip) => void,
  onEdit: (slip: IMaintenanceReturnSlip) => void,
  onCancel: (slip: IMaintenanceReturnSlip) => void,
) {
  const canEdit = row.status === EMaintenanceReturnSlipStatus.RETURNED;
  const canCancel = row.status === EMaintenanceReturnSlipStatus.RETURNED;

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
              Hủy phiếu nhận
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MaintenanceReturnSlipPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch statuses from API
  const { data: statusList } = useQuery({
    queryKey: ["maintenance-return-slip-statuses"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/maintenance-return-slips/statuses",
      );
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
  });

  // Build status labels from API data
  const statusLabels = useMemo(() => {
    if (!statusList || statusList.length === 0) {
      return defaultStatusLabels;
    }
    const labels: Record<
      number,
      {
        label: string;
        variant: "default" | "success" | "destructive" | "secondary";
      }
    > = {};
    statusList.forEach((status) => {
      labels[parseInt(status.code)] = {
        label: status.value,
        variant: getStatusVariant(status.code),
      };
    });
    return labels;
  }, [statusList]);

  const { data: partners, error: partnersError } = useQuery({
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
          : "Không thể tải danh sách đối tượng";
      toast.error(errorMessage);
    }
  }, [partnersError]);

  const columns = useMemo(
    () =>
      createColumns(statusLabels, partners, (slip) => {
        router.push(`/maintenance-slip/return/${slip.id}`);
      }),
    [statusLabels, partners, router],
  );

  const getMaintenanceReturnSlips = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IMaintenanceReturnSlip>>(
      "/maintenance-return-slips",
      { params },
    );
    return response;
  };

  const onCreateMaintenanceReturnSlip = () => {
    router.push("/maintenance-slip/return/create");
  };

  const onViewDetails = (slip: IMaintenanceReturnSlip) => {
    router.push(`/maintenance-slip/return/${slip.id}`);
  };

  const onEditMaintenanceReturnSlip = (slip: IMaintenanceReturnSlip) => {
    router.push(`/maintenance-slip/return/${slip.id}/edit`);
  };

  const onCancelMaintenanceReturnSlip = async (
    slip: IMaintenanceReturnSlip,
  ) => {
    try {
      await api.delete(`/maintenance-return-slips/${slip.id}/cancel`);
      toast.success("Hủy phiếu nhận thành công");
      queryClient.invalidateQueries({
        queryKey: ["maintenance-return-slips"],
        exact: false,
      });
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy phiếu nhận");
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
      <h1 className="text-2xl font-bold">
        Quản Lý Phiếu Nhận Thiết Bị Từ Bảo Trì
      </h1>
      <p className="text-muted-foreground">
        Quản lý các phiếu nhận thiết bị từ bảo trì và thông tin của chúng
      </p>

      <DataTable<IMaintenanceReturnSlip, unknown>
        columns={columns}
        queryKey={["maintenance-return-slips"]}
        queryFn={getMaintenanceReturnSlips}
        searchColumn="id"
        searchPlaceholder="Tìm kiếm phiếu nhận..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy phiếu nhận nào."
        globalActions={
          <Button onClick={onCreateMaintenanceReturnSlip}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        }
        columnActions={(row) =>
          MaintenanceReturnSlipActions(
            row,
            onViewDetails,
            onEditMaintenanceReturnSlip,
            onCancelMaintenanceReturnSlip,
          )
        }
      />
    </Card>
  );
}
