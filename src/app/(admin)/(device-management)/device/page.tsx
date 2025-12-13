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
import {
  DeviceStatusLabel,
  EDeviceStatus,
} from "@/shared/constants/admin/device";
import { api } from "@/shared/data/api";
import {
  IDevice,
  IDeviceLocation,
  IDeviceType,
  IPaginatedResponse,
  IResponse,
} from "@/shared/interfaces";
import {
  createDeviceSchema,
  updateDeviceSchema,
} from "@/shared/schema/admin/device.schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Calendar, MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (
  deviceTypes?: IDeviceType[],
  deviceLocations?: IDeviceLocation[],
): ColumnDef<IDevice>[] => [
  {
    accessorKey: "deviceName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên Thiết Bị" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Tên Thiết Bị",
      filterType: "text",
      placeholder: "Tìm kiếm theo tên thiết bị...",
    },
    minSize: 250,
    maxSize: 300,
  },
  {
    accessorKey: "serial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số Sê-ri" />
    ),
    cell: ({ row }) => row.getValue("serial") || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Số Sê-ri",
      filterType: "text",
    },
    size: 150,
  },
  {
    accessorKey: "model",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mẫu" />
    ),
    cell: ({ row }) => row.getValue("model") || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Mẫu",
      filterType: "text",
    },
    size: 150,
  },
  {
    accessorKey: "deviceTypeId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại Thiết Bị" />
    ),
    cell: ({ row }) => row.original.deviceType?.deviceTypeName || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Loại Thiết Bị",
      filterType: "select",
      options: deviceTypes?.map((type) => ({
        label: type.deviceTypeName,
        value: type.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "deviceLocationId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vị Trí" />
    ),
    cell: ({ row }) => {
      const location = row.original.deviceLocation;
      if (!location) return "N/A";
      return location.rack
        ? `${location.rack.code} [${location.xPosition},${location.yPosition}]`
        : `[${location.xPosition},${location.yPosition}]`;
    },
    enableColumnFilter: true,
    meta: {
      label: "Vị Trí",
      filterType: "select",
      options: deviceLocations?.map((loc) => ({
        label: loc.rack
          ? `${loc.rack.code} [${loc.xPosition},${loc.yPosition}]`
          : `[${loc.xPosition},${loc.yPosition}]`,
        value: loc.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "purchaseDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Mua" />
    ),
    cell: ({ row }) =>
      row.getValue("purchaseDate")
        ? dayjs(row.getValue("purchaseDate")).format("DD/MM/YYYY")
        : "N/A",
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Ngày Mua",
    },
    size: 150,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng Thái" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status");
      // "default" | "success" | "secondary" | "destructive" | "outline" | "warning"
      const badgeColor = {
        [EDeviceStatus.AVAILABLE]: "success",
        [EDeviceStatus.ON_LOAN]: "default",
        [EDeviceStatus.UNDER_WARRANTY]: "warning",
        [EDeviceStatus.BROKEN]: "destructive",
        [EDeviceStatus.MAINTENANCE]: "secondary",
      };
      const color = badgeColor[status as EDeviceStatus] || "gray";

      return (
        <Badge
          variant={
            color as
              | "default"
              | "success"
              | "secondary"
              | "destructive"
              | "outline"
              | "warning"
          }
        >
          {DeviceStatusLabel[status as EDeviceStatus] || "Không Xác Định"}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: "Trạng Thái",
      filterType: "select",
      options: [
        { label: "Hoạt Động", value: 1 },
        { label: "Đang Mượn", value: 2 },
        { label: "Đang Bảo Hành", value: 3 },
        { label: "Hỏng", value: 4 },
        { label: "Đang Bảo Trì", value: 5 },
      ],
    },
    size: 150,
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

function DeviceActions(
  row: Readonly<IDevice>,
  onDelete: (device: IDevice) => void,
  onEdit: (device: IDevice) => void,
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(row.id);
              toast.success("Đã sao chép ID");
            } catch (error) {
              console.error("Failed to copy ID:", error);
              toast.error("Không thể sao chép ID");
            }
          }}
        >
          Sao Chép ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(row)}>
          Chỉnh Sửa
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(row)}>Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DevicePage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: deviceTypes,
    error: typesError,
    isLoading: typesLoading,
  } = useQuery({
    queryKey: ["device-types"],
    queryFn: async (): Promise<IDeviceType[]> => {
      const response = await api.get<IResponse<IDeviceType[]>>("/device-types");
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
    if (typesError) {
      const errorMessage =
        typesError instanceof Error
          ? typesError.message
          : "Không thể tải loại thiết bị";
      toast.error(errorMessage);
    }
  }, [typesError]);

  const deviceFields = useMemo((): IFormFieldConfig[] => {
    const typeOptions =
      deviceTypes?.map((type) => ({
        label: type.deviceTypeName,
        value: type.id,
      })) || [];

    return [
      {
        name: "deviceName",
        label: "Tên Thiết Bị",
        type: "text",
        placeholder: "Nhập tên thiết bị",
        description: "Tên duy nhất cho thiết bị",
      },
      {
        name: "serial",
        label: "Số Sê-ri",
        type: "text",
        placeholder: "Nhập số sê-ri",
      },
      {
        name: "model",
        label: "Mẫu",
        type: "text",
        placeholder: "Nhập mẫu thiết bị",
      },
      {
        name: "deviceTypeId",
        label: "Loại Thiết Bị",
        type: "select",
        placeholder: "Chọn loại thiết bị",
        options: typeOptions,
        className: "w-full",
      },
      {
        name: "supplier",
        label: "Nhà Cung Cấp",
        type: "text",
        placeholder: "Chọn nhà cung cấp",
        className: "w-full",
      },
      {
        name: "purchaseDate",
        label: "Ngày Mua",
        type: "date",
        placeholder: "Chọn ngày mua",
        leftIcon: <Calendar className="h-4 w-4" />,
      },
      {
        name: "warrantyExpirationDate",
        label: "Ngày Hết Hạn Bảo Hành",
        type: "date",
        placeholder: "Chọn ngày hết hạn bảo hành",
        leftIcon: <Calendar className="h-4 w-4" />,
      },
      {
        name: "notes",
        label: "Ghi Chú",
        type: "textarea",
        placeholder: "Nhập các ghi chú thêm",
      },
      {
        name: "status",
        label: "Trạng Thái Hoạt Động",
        type: "checkbox",
        description: "Thiết bị có hoạt động không?",
      },
    ];
  }, [deviceTypes]);

  const columns = useMemo(() => createColumns(deviceTypes), [deviceTypes]);

  const getDevices = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IDevice>>("/devices", {
      params,
    });
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateDevice = () => {
    if (typesLoading) {
      toast.error("Vui lòng chờ dữ liệu tải xong");
      return;
    }
    setType("create");
    setSelectedDeviceId(null);
    setOpen(true);
  };

  const onDeleteDevice = (device: IDevice) => {
    setType("delete");
    setSelectedDeviceId(device.id);
    setOpen(true);
  };

  const onEditDevice = (device: IDevice) => {
    if (typesLoading) {
      toast.error("Vui lòng chờ dữ liệu tải xong");
      return;
    }
    setType("edit");
    setSelectedDeviceId(device.id);
    setOpen(true);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo Thiết Bị Mới",
      edit: "Chỉnh Sửa Thiết Bị",
      view: "Xem Chi Tiết Thiết Bị",
      delete: "Xóa Thiết Bị",
    } as const;
    const subtitleMap = {
      create: "Điền đầy đủ thông tin dưới đây để tạo thiết bị mới.",
      edit: "Sửa đổi thông tin thiết bị dưới đây.",
      view: "Xem chi tiết thông tin thiết bị.",
      delete: "Bạn có chắc chắn muốn xóa thiết bị này không?",
    } as const;

    const base = "/devices" as const;
    const idPath = selectedDeviceId ? `${base}/${selectedDeviceId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedDeviceId ? idPath : "",
      schema: isEdit ? updateDeviceSchema : createDeviceSchema,
    };
  }, [type, selectedDeviceId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Quản Lý Thiết Bị</h1>
        <p className="text-muted-foreground">
          Quản lý các thiết bị và thông tin của chúng
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Quản Lý Thiết Bị</h1>
      <p className="text-muted-foreground">
        Quản lý các thiết bị và thông tin của chúng
      </p>

      <DataTable<IDevice, unknown>
        columns={columns}
        queryKey={["devices"]}
        queryFn={getDevices}
        searchColumn="deviceName"
        searchPlaceholder="Tìm kiếm thiết bị..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy thiết bị nào."
        globalActions={
          <Button onClick={onCreateDevice}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          DeviceActions(row, onDeleteDevice, onEditDevice)
        }
      />

      {open && (type === "delete" || !typesLoading) && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={deviceFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["devices"],
              exact: false,
            });
            if (modalConfig.fetchDetailsEndpoint) {
              queryClient.invalidateQueries({
                queryKey: [modalConfig.fetchDetailsEndpoint],
                exact: false,
              });
            }
          }}
          onError={(error) => {
            console.error("Error:", error);
          }}
        />
      )}
    </Card>
  );
}
