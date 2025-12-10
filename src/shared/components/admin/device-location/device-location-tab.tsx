"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
import { DataTable } from "@/components/table/data-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/shared/data/api";
import { IDeviceLocation, IPaginatedResponse } from "@/shared/interfaces";
import {
  createDeviceLocationSchema,
  updateDeviceLocationSchema,
} from "@/shared/schema/admin/device-location.schema";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (): ColumnDef<IDeviceLocation>[] => [
  {
    accessorKey: "rack.code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Rack" />
    ),
    cell: ({ row }) => row.original.rack?.code || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Mã Rack",
      filterType: "text",
      placeholder: "Tìm kiếm theo mã rack...",
    },
    minSize: 180,
    maxSize: 250,
  },
  {
    accessorKey: "xPosition",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vị Trí X" />
    ),
    cell: ({ row }) => row.getValue("xPosition") || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Vị Trí X",
      filterType: "text",
    },
    size: 120,
  },
  {
    accessorKey: "yPosition",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vị Trí Y" />
    ),
    cell: ({ row }) => row.getValue("yPosition") || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Vị Trí Y",
      filterType: "text",
    },
    size: 120,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng Thái" />
    ),
    cell: ({ row }) =>
      row.getValue("status") ? (
        <Badge variant="success">Hoạt Động</Badge>
      ) : (
        <Badge variant="destructive">Không Hoạt Động</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: "Trạng Thái",
      filterType: "select",
      options: [
        { label: "Hoạt Động", value: 1 },
        { label: "Không Hoạt Động", value: 0 },
      ],
    },
    size: 120,
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
    size: 180,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Cập Nhật" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY HH:mm:ss"),
    enableColumnFilter: true,
    meta: {
      filterType: "date",
      label: "Ngày Cập Nhật",
    },
    size: 180,
  },
];

function DeviceLocationActions(
  row: Readonly<IDeviceLocation>,
  onDelete: (location: IDeviceLocation) => void,
  onEdit: (location: IDeviceLocation) => void,
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

interface DeviceLocationTabProps {
  readonly mounted: boolean;
}

export function DeviceLocationTab({
  mounted,
}: Readonly<DeviceLocationTabProps>) {
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );

  const deviceLocationFields = useMemo((): IFormFieldConfig[] => {
    return [
      {
        name: "rackId",
        label: "Rack",
        type: "async-select",
        placeholder: "Chọn rack",
        description: "Chọn rack để đặt thiết bị",
        endpoint: "/racks",
        transformKey: {
          value: "id",
          label: "code",
        },
        mappingField: "id",
      },
      {
        name: "xPosition",
        label: "Vị Trí X",
        type: "text",
        placeholder: "Nhập vị trí X trên rack (ví dụ: A1, B2)",
        description: "Tọa độ X trên lưới rack",
      },
      {
        name: "yPosition",
        label: "Vị Trí Y",
        type: "text",
        placeholder: "Nhập vị trí Y trên rack (ví dụ: 1, 2, 3)",
        description: "Tọa độ Y trên lưới rack",
      },
      {
        name: "status",
        label: "Trạng Thái Hoạt Động",
        type: "checkbox",
        description: "Vị trí có sẵn sàng sử dụng không?",
      },
    ];
  }, []);

  const columns = useMemo(() => createColumns(), []);

  const getDeviceLocations = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IDeviceLocation>>(
      "/device-locations",
      {
        params,
      },
    );
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateLocation = () => {
    setType("create");
    setSelectedLocationId(null);
    setOpen(true);
  };

  const onDeleteLocation = (location: IDeviceLocation) => {
    setType("delete");
    setSelectedLocationId(location.id);
    setOpen(true);
  };

  const onEditLocation = (location: IDeviceLocation) => {
    setType("edit");
    setSelectedLocationId(location.id);
    setOpen(true);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo Vị Trí Lưu Trữ Mới",
      edit: "Chỉnh Sửa Vị Trí Lưu Trữ",
      view: "Xem Chi Tiết Vị Trí Lưu Trữ",
      delete: "Xóa Vị Trí Lưu Trữ",
    } as const;
    const subtitleMap = {
      create: "Điền đầy đủ thông tin dưới đây để tạo vị trí lưu trữ mới.",
      edit: "Sửa đổi thông tin vị trí lưu trữ dưới đây.",
      view: "Xem chi tiết thông tin vị trí lưu trữ.",
      delete: "Bạn có chắc chắn muốn xóa vị trí lưu trữ này không?",
    } as const;

    const base = "/device-locations" as const;
    const idPath = selectedLocationId ? `${base}/${selectedLocationId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedLocationId ? idPath : "",
      schema: isEdit ? updateDeviceLocationSchema : createDeviceLocationSchema,
    };
  }, [type, selectedLocationId]);

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <DataTable<IDeviceLocation, unknown>
        columns={columns}
        queryKey={["device-locations"]}
        queryFn={getDeviceLocations}
        searchColumn="deviceLocationName"
        searchPlaceholder="Tìm kiếm vị trí lưu trữ..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy vị trí lưu trữ nào."
        globalActions={
          <Button onClick={onCreateLocation}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          DeviceLocationActions(row, onDeleteLocation, onEditLocation)
        }
      />

      {open && type !== "delete" && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={deviceLocationFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["device-locations"],
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

      {open && type === "delete" && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={[]}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["device-locations"],
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
    </>
  );
}
