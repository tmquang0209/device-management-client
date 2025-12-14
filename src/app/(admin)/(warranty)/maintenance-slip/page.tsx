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
  EMaintenanceSlipStatus,
  IMaintenanceSlipInfo,
  IPaginatedResponse,
  IParamInfo,
  IPartner,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Eye, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const defaultStatusMap: Record<
  number,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "warning" | "secondary";
  }
> = {
  [EMaintenanceSlipStatus.SENDING]: {
    label: "Đang Bảo Trì",
    variant: "default",
  },
  [EMaintenanceSlipStatus.CLOSED]: {
    label: "Đã Đóng",
    variant: "success",
  },
  [EMaintenanceSlipStatus.CANCELLED]: {
    label: "Đã Hủy",
    variant: "destructive",
  },
  [EMaintenanceSlipStatus.PARTIAL_RETURNED]: {
    label: "Chưa Hoàn Tất",
    variant: "warning",
  },
};

const getStatusVariant = (
  code: string,
): "default" | "success" | "destructive" | "warning" | "secondary" => {
  switch (code) {
    case "1":
      return "default";
    case "2":
      return "success";
    case "3":
      return "destructive";
    case "4":
      return "warning";
    default:
      return "secondary";
  }
};

const createColumns = (
  statusMap: Record<
    number,
    {
      label: string;
      variant: "default" | "success" | "destructive" | "warning" | "secondary";
    }
  >,
  statusOptions: { label: string; value: number }[],
  partners?: IPartner[],
  onViewDetails?: (slip: IMaintenanceSlipInfo) => void,
): ColumnDef<IMaintenanceSlipInfo>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Giao Dịch" />
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
    accessorKey: "createdByUser",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người Tạo" />
    ),
    cell: ({ row }) => row.original.createdByUser?.name || "N/A",
    enableColumnFilter: true,
    meta: { label: "Người Tạo", filterType: "text" },
    size: 150,
  },
  {
    accessorKey: "partnerId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Đối Tác Bảo Trì" />
    ),
    cell: ({ row }) => row.original.partner?.user?.name || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Đối Tác Bảo Trì",
      filterType: "select",
      options: partners?.map((partner) => ({
        label: partner.user?.name || `Partner ${partner.id}`,
        value: partner.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lý Do" />
    ),
    cell: ({ row }) => (
      <span className="line-clamp-2">{row.original.reason || "N/A"}</span>
    ),
    enableColumnFilter: true,
    meta: { label: "Lý Do", filterType: "text" },
    minSize: 220,
  },
  {
    accessorKey: "requestDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Yêu Cầu" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("requestDate");
      return date ? dayjs(date as Date).format("DD/MM/YYYY") : "N/A";
    },
    enableColumnFilter: true,
    meta: { filterType: "date", label: "Ngày Yêu Cầu" },
    size: 140,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng Thái" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as EMaintenanceSlipStatus;
      const info = statusMap[status];
      return (
        <Badge variant={info?.variant || "default"}>
          {info?.label || "N/A"}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: "Trạng Thái",
      filterType: "select",
      options: statusOptions,
    },
    size: 170,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Tạo" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("createdAt")).format("DD/MM/YYYY HH:mm:ss"),
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Ngày Tạo",
    },
    size: 150,
  },
];

function MaintenanceSlipActions(
  row: Readonly<IMaintenanceSlipInfo>,
  onCancel: (slip: IMaintenanceSlipInfo) => void,
  onViewDetails: (slip: IMaintenanceSlipInfo) => void,
) {
  const canCancel = row.status === EMaintenanceSlipStatus.SENDING;

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
        {canCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCancel(row)}
              className="text-orange-600"
            >
              <X className="mr-2 h-4 w-4" />
              Hủy phiếu
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MaintenanceSlipPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch statuses from API
  const { data: statusList } = useQuery({
    queryKey: ["maintenance-slip-statuses"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/maintenance-slips/statuses",
      );
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
  });

  // Build status map from API data
  const statusMap = useMemo(() => {
    if (!statusList || statusList.length === 0) {
      return defaultStatusMap;
    }
    const map: Record<
      number,
      {
        label: string;
        variant:
          | "default"
          | "success"
          | "destructive"
          | "warning"
          | "secondary";
      }
    > = {};
    statusList.forEach((status) => {
      map[parseInt(status.code)] = {
        label: status.value,
        variant: getStatusVariant(status.code),
      };
    });
    return map;
  }, [statusList]);

  // Build status options for filter
  const statusOptions = useMemo(() => {
    if (!statusList || statusList.length === 0) {
      return [
        { label: "Đang Bảo Trì", value: EMaintenanceSlipStatus.SENDING },
        { label: "Đã Đóng", value: EMaintenanceSlipStatus.CLOSED },
        { label: "Đã Hủy", value: EMaintenanceSlipStatus.CANCELLED },
        {
          label: "Chưa Hoàn Tất",
          value: EMaintenanceSlipStatus.PARTIAL_RETURNED,
        },
      ];
    }
    return statusList.map((status) => ({
      label: status.value,
      value: parseInt(status.code),
    }));
  }, [statusList]);

  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: async (): Promise<IPartner[]> => {
      const response = await api.get<IResponse<IPartner[]>>("/partners");
      return response.data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    enabled: mounted,
  });

  const columns = useMemo(
    () =>
      createColumns(statusMap, statusOptions, partners, (slip) => {
        router.push(`/maintenance-slip/${slip.id}`);
      }),
    [statusMap, statusOptions, partners, router],
  );

  const getMaintenanceSlips = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IMaintenanceSlipInfo>>(
      "/maintenance-slips",
      { params },
    );
    return response;
  };

  const onCreateMaintenanceSlip = () => {
    router.push("/maintenance-slip/create");
  };

  const onViewDetails = (slip: IMaintenanceSlipInfo) => {
    router.push(`/maintenance-slip/${slip.id}`);
  };

  const onCancelMaintenanceSlip = async (slip: IMaintenanceSlipInfo) => {
    try {
      await api.delete(`/maintenance-slips/${slip.id}/cancel`);
      toast.success("Hủy phiếu bảo trì thành công");
      queryClient.invalidateQueries({
        queryKey: ["maintenance-slips"],
        exact: false,
      });
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy phiếu bảo trì");
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
      <h1 className="text-2xl font-bold">Quản Lý Phiếu Bảo Trì</h1>
      <p className="text-muted-foreground">
        Quản lý các phiếu bảo trì thiết bị và thông tin của chúng
      </p>

      <DataTable<IMaintenanceSlipInfo, unknown>
        columns={columns}
        queryKey={["maintenance-slips"]}
        queryFn={getMaintenanceSlips}
        searchColumn="reason"
        searchPlaceholder="Tìm kiếm phiếu bảo trì..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy phiếu bảo trì nào."
        globalActions={
          <Button onClick={onCreateMaintenanceSlip}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          MaintenanceSlipActions(row, onCancelMaintenanceSlip, onViewDetails)
        }
      />
    </Card>
  );
}
