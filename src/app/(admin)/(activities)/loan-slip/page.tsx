"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
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
  IDevice,
  ILoanSlip,
  IPaginatedResponse,
  IParamInfo,
  IPartner,
  IPartnerUser,
  IResponse,
} from "@/shared/interfaces";
import {
  createLoanSlipSchema,
  updateLoanSlipSchema,
} from "@/shared/schema/admin/loan-slip.schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Eye, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (
  partners?: IPartner[],
  users?: IPartnerUser[],
  onViewDetails?: (loanSlip: ILoanSlip) => void,
  statusList?: IParamInfo[],
): ColumnDef<ILoanSlip>[] => [
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
    size: 150,
  },
  {
    accessorKey: "equipmentBorrowerId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người Mượn" />
    ),
    cell: ({ row }) => row.original.borrower?.user?.name || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Người Mượn",
      filterType: "select",
      options: users?.map((user) => ({
        label: user?.name || `User ${user.id}`,
        value: user.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "createdByUser",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người tạo" />
    ),
    cell: ({ row }) => row.original.createdByUser?.name || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Người tạo",
      filterType: "select",
      options: partners?.map((partner) => ({
        label: partner.user?.name || `Partner ${partner.id}`,
        value: partner.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng Thái" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status");
      const statusInfo = statusList?.find((s) => s.code === String(status));
      if (!statusInfo) {
        return <Badge variant="secondary">Không xác định</Badge>;
      }
      // Map status code to badge variant
      const getVariant = (code: string) => {
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
      return (
        <Badge variant={getVariant(statusInfo.code)}>{statusInfo.value}</Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: "Trạng Thái",
      filterType: "select",
      options:
        statusList?.map((s) => ({
          label: s.value,
          value: Number(s.code),
        })) || [],
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

function LoanSlipActions(
  row: Readonly<ILoanSlip>,
  onDelete: (loanSlip: ILoanSlip) => void,
  onEdit: (loanSlip: ILoanSlip) => void,
  onCancel: (loanSlip: ILoanSlip) => void,
  onViewDetails: (loanSlip: ILoanSlip) => void,
) {
  const canCancel = row.status === 1; // Only allow cancel if BORROWING

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
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LoanSlipPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedLoanSlipId, setSelectedLoanSlipId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: users,
    error: usersError,
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<IPartnerUser[]> => {
      const response =
        await api.get<IResponse<IPartnerUser[]>>("/users/get-list");
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

  const {
    data: devices,
    error: devicesError,
    isLoading: devicesLoading,
  } = useQuery({
    queryKey: ["devices-available"],
    queryFn: async (): Promise<IDevice[]> => {
      const response = await api.get<IResponse<IDevice[]>>("/devices", {
        params: { status: 1 }, // Only get available devices
      });
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

  // Query loan slip status list from param
  const { data: loanSlipStatusList } = useQuery({
    queryKey: ["loan-slip-status"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/loan-slips/config/status",
      );
      return response.data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: mounted,
  });

  useEffect(() => {
    if (usersError) {
      const errorMessage =
        usersError instanceof Error
          ? usersError.message
          : "Không thể tải danh sách người dùng";
      toast.error(errorMessage);
    }
  }, [usersError]);

  useEffect(() => {
    if (partnersError) {
      const errorMessage =
        partnersError instanceof Error
          ? partnersError.message
          : "Không thể tải danh sách đối tượng";
      toast.error(errorMessage);
    }
  }, [partnersError]);

  useEffect(() => {
    if (devicesError) {
      const errorMessage =
        devicesError instanceof Error
          ? devicesError.message
          : "Không thể tải danh sách thiết bị";
      toast.error(errorMessage);
    }
  }, [devicesError]);

  const loanSlipFields = useMemo((): IFormFieldConfig[] => {
    const deviceOptions =
      devices?.map((device) => {
        const serialPart = device.serial ? `- ${device.serial}` : "";
        return {
          label: `${device.deviceName} ${serialPart}`,
          value: device.id,
        };
      }) || [];

    return [
      {
        name: "borrowerId",
        label: "Người Mượn",
        type: "async-select",
        placeholder: "Chọn người mượn",
        endpoint: "/partners",
        queryParams: { page: 1, pageSize: 50 },
        transformKey: { value: "id", label: "partnerType" },
        mappingField: "id",
        className: "w-full",
      },
      {
        name: "deviceIds",
        label: "Thiết Bị",
        type: "multiselect",
        placeholder: "Chọn các thiết bị để mượn",
        options: deviceOptions,
        className: "w-full",
      },
    ];
  }, [devices]);

  const columns = useMemo(
    () =>
      createColumns(
        partners,
        users,
        (loanSlip) => {
          router.push(`/loan-slip/${loanSlip.id}`);
        },
        loanSlipStatusList,
      ),
    [partners, users, router, loanSlipStatusList],
  );

  const getLoanSlips = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<ILoanSlip>>(
      "/loan-slips",
      { params },
    );
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateLoanSlip = () => {
    router.push("/loan-slip/create");
  };

  const onDeleteLoanSlip = (loanSlip: ILoanSlip) => {
    // Use DynamicModal for actual deletion (soft delete)
    setType("delete");
    setSelectedLoanSlipId(loanSlip.id);
    setOpen(true);
  };

  const onEditLoanSlip = (loanSlip: ILoanSlip) => {
    if (partnersLoading || devicesLoading) {
      toast.error("Vui lòng chờ dữ liệu tải xong");
      return;
    }
    setType("edit");
    setSelectedLoanSlipId(loanSlip.id);
    setOpen(true);
  };

  const onViewDetails = (loanSlip: ILoanSlip) => {
    router.push(`/loan-slip/${loanSlip.id}`);
  };

  const onCancelLoanSlip = async (loanSlip: ILoanSlip) => {
    // Cancel means setting status to CANCELLED, not deleting from database
    try {
      await api.delete(`/loan-slips/${loanSlip.id}/cancel`);
      toast.success("Hủy giao dịch mượn thành công");
      queryClient.invalidateQueries({
        queryKey: ["loan-slips"],
        exact: false,
      });
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy giao dịch mượn");
    }
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo giao dịch mượn Mới",
      edit: "Chỉnh Sửa giao dịch mượn",
      view: "Xem Chi Tiết giao dịch mượn",
      delete: "Xóa giao dịch mượn",
    } as const;
    const subtitleMap = {
      create: "Điền đầy đủ thông tin dưới đây để tạo giao dịch mượn mới.",
      edit: "Sửa đổi thông tin giao dịch mượn dưới đây.",
      view: "Xem chi tiết thông tin giao dịch mượn.",
      delete: "Bạn có chắc chắn muốn xóa giao dịch mượn này không?",
    } as const;

    const base = "/loan-slips" as const;
    const idPath = selectedLoanSlipId
      ? `${base}/${selectedLoanSlipId}${isDelete ? "/cancel" : ""}`
      : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedLoanSlipId ? idPath : "",
      schema: isEdit ? updateLoanSlipSchema : createLoanSlipSchema,
    };
  }, [type, selectedLoanSlipId]);

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
      <h1 className="text-2xl font-bold">Quản Lý giao dịch mượn</h1>
      <p className="text-muted-foreground">
        Quản lý các giao dịch mượn thiết bị và thông tin của chúng
      </p>

      <DataTable<ILoanSlip, unknown>
        columns={columns}
        queryKey={["loan-slips"]}
        queryFn={getLoanSlips}
        searchColumn="id"
        searchPlaceholder="Tìm kiếm giao dịch mượn..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy giao dịch mượn nào."
        globalActions={
          <Button onClick={onCreateLoanSlip}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          LoanSlipActions(
            row,
            onDeleteLoanSlip,
            onEditLoanSlip,
            onCancelLoanSlip,
            onViewDetails,
          )
        }
      />

      {open && (type === "delete" || (!partnersLoading && !devicesLoading)) && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={loanSlipFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["loan-slips"],
              exact: false,
            });
            let message = "Xóa giao dịch mượn thành công";
            if (type === "create") {
              message = "Tạo giao dịch mượn thành công";
            } else if (type === "edit") {
              message = "Cập nhật giao dịch mượn thành công";
            }
            toast.success(message);
            setOpen(false);
          }}
          onError={(error) => {
            toast.error(error.message || "Có lỗi xảy ra");
          }}
        />
      )}
    </Card>
  );
}
