"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
import { DataTable } from "@/components/table/data-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
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
import { IDeviceType, IPaginatedResponse } from "@/shared/interfaces";
import {
  createDeviceTypeSchema,
  updateDeviceTypeSchema,
} from "@/shared/schema/admin/device-type.schema";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (): ColumnDef<IDeviceType>[] => [
  {
    accessorKey: "deviceTypeName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên Loại Thiết Bị" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Tên Loại Thiết Bị",
      filterType: "text",
      placeholder: "Tìm kiếm theo tên loại thiết bị...",
    },
    minSize: 300,
    maxSize: 400,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mô Tả" />
    ),
    cell: ({ row }) => row.getValue("description") || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Mô Tả",
      filterType: "text",
    },
    size: 300,
  },
];

function DeviceTypeActions(
  row: Readonly<IDeviceType>,
  onDelete: (deviceType: IDeviceType) => void,
  onEdit: (deviceType: IDeviceType) => void,
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

export default function DeviceTypePage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const deviceTypeFields = useMemo((): IFormFieldConfig[] => {
    return [
      {
        name: "deviceTypeName",
        label: "Tên Loại Thiết Bị",
        type: "text",
        placeholder: "Nhập tên loại thiết bị",
        description: "Tên duy nhất cho loại thiết bị",
      },
      {
        name: "description",
        label: "Mô Tả",
        type: "textarea",
        placeholder: "Nhập mô tả loại thiết bị",
      },
      {
        name: "status",
        label: "Trạng Thái Hoạt Động",
        type: "checkbox",
        description: "Loại thiết bị có hoạt động không?",
      },
    ];
  }, []);

  const columns = useMemo(() => createColumns(), []);

  const getDeviceTypes = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IDeviceType>>(
      "/device-types",
      {
        params,
      },
    );
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateDeviceType = () => {
    setType("create");
    setSelectedDeviceTypeId(null);
    setOpen(true);
  };

  const onDeleteDeviceType = (deviceType: IDeviceType) => {
    setType("delete");
    setSelectedDeviceTypeId(deviceType.id);
    setOpen(true);
  };

  const onEditDeviceType = (deviceType: IDeviceType) => {
    setType("edit");
    setSelectedDeviceTypeId(deviceType.id);
    setOpen(true);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo Loại Thiết Bị Mới",
      edit: "Chỉnh Sửa Loại Thiết Bị",
      view: "Xem Chi Tiết Loại Thiết Bị",
      delete: "Xóa Loại Thiết Bị",
    } as const;
    const subtitleMap = {
      create: "Điền đầy đủ thông tin dưới đây để tạo loại thiết bị mới.",
      edit: "Sửa đổi thông tin loại thiết bị dưới đây.",
      view: "Xem chi tiết thông tin loại thiết bị.",
      delete: "Bạn có chắc chắn muốn xóa loại thiết bị này không?",
    } as const;

    const base = "/device-types" as const;
    const idPath = selectedDeviceTypeId
      ? `${base}/${selectedDeviceTypeId}`
      : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedDeviceTypeId ? idPath : "",
      schema: isEdit ? updateDeviceTypeSchema : createDeviceTypeSchema,
    };
  }, [type, selectedDeviceTypeId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Quản Lý Loại Thiết Bị</h1>
        <p className="text-muted-foreground">
          Quản lý các loại thiết bị trong hệ thống
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Quản Lý Loại Thiết Bị</h1>
      <p className="text-muted-foreground">
        Quản lý các loại thiết bị trong hệ thống
      </p>

      <DataTable<IDeviceType, unknown>
        columns={columns}
        queryKey={["device-types"]}
        queryFn={getDeviceTypes}
        searchColumn="deviceTypeName"
        searchPlaceholder="Tìm kiếm loại thiết bị..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy loại thiết bị nào."
        globalActions={
          <Button onClick={onCreateDeviceType}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          DeviceTypeActions(row, onDeleteDeviceType, onEditDeviceType)
        }
      />

      {open && type !== "delete" && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={deviceTypeFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["device-types"],
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
              queryKey: ["device-types"],
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
