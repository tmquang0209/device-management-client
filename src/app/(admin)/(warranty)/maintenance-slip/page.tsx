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
import { IMaintenanceSlipInfo, IPaginatedResponse } from "@/shared/interfaces";
import {
  createMaintenanceSlipSchema,
  updateMaintenanceSlipSchema,
} from "@/shared/schema/admin/maintenance-slip.schema";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const statusMap = {
  1: { label: "Hoạt Động", variant: "success" as const },
  0: { label: "Ngừng Hoạt Động", variant: "secondary" as const },
};

const createColumns = (): ColumnDef<IMaintenanceSlipInfo>[] => [
  {
    accessorKey: "device",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thiết Bị" />
    ),
    cell: ({ row }) => {
      const device = row.getValue("device") as IMaintenanceSlipInfo["device"];
      if (!device) return "N/A";
      const serial = device.serial ? `(${device.serial})` : "";
      return `${device.deviceName} ${serial}`.trim();
    },
    enableColumnFilter: false,
    minSize: 200,
  },
  {
    accessorKey: "partner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Đối Tác" />
    ),
    cell: ({ row }) => {
      const partner = row.getValue(
        "partner",
      ) as IMaintenanceSlipInfo["partner"];
      if (!partner) return "N/A";
      return partner.partnerType || partner.userId || partner.id;
    },
    enableColumnFilter: false,
    minSize: 160,
  },
  {
    accessorKey: "transferStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng Thái Chuyển Giao" />
    ),
    cell: ({ row }) => row.getValue("transferStatus") || "N/A",
    enableColumnFilter: true,
    meta: { label: "Trạng Thái Chuyển Giao", filterType: "text" },
    minSize: 200,
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lý Do" />
    ),
    cell: ({ row }) => row.getValue("reason") || "N/A",
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
      const status = row.getValue("status") as number;
      const info = statusMap[(status as 0 | 1) ?? 1];
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
      options: [
        { label: "Hoạt Động", value: 1 },
        { label: "Ngừng Hoạt Động", value: 0 },
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
    meta: { filterType: "date", label: "Ngày Tạo" },
    size: 150,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày Cập Nhật" />
    ),
    cell: ({ row }) =>
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY HH:mm:ss"),
    enableColumnFilter: true,
    meta: { filterType: "date", label: "Ngày Cập Nhật" },
    size: 150,
  },
];

function RowActions(
  row: Readonly<IMaintenanceSlipInfo>,
  onDelete: (r: IMaintenanceSlipInfo) => void,
  onEdit: (r: IMaintenanceSlipInfo) => void,
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
              toast.success("ID đã sao chép vào bộ nhớ đệm");
            } catch (err) {
              console.error("Failed to copy ID:", err);
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(row)}
          className="text-destructive"
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MaintenanceSlipPage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const columns = useMemo(() => createColumns(), []);

  const getList = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IMaintenanceSlipInfo>>(
      "/maintenance-slips",
      { params },
    );
    return response;
  };

  const queryClient = useQueryClient();

  const onCreate = () => {
    setType("create");
    setSelectedId(null);
    setOpen(true);
  };

  const onDelete = (r: IMaintenanceSlipInfo) => {
    setType("delete");
    setSelectedId(r.id);
    setOpen(true);
  };

  const onEdit = (r: IMaintenanceSlipInfo) => {
    setType("edit");
    setSelectedId(r.id);
    setOpen(true);
  };

  const fields = useMemo((): IFormFieldConfig[] => {
    return [
      {
        name: "deviceId",
        label: "Thiết Bị",
        type: "async-select",
        placeholder: "Chọn thiết bị",
        endpoint: "/devices",
        queryParams: { page: 1, pageSize: 50 },
        transformKey: { value: "id", label: "deviceName" },
        mappingField: "id",
        description: "Chọn thiết bị cần bảo trì",
      },
      {
        name: "partnerId",
        label: "Đối Tác",
        type: "async-select",
        placeholder: "Chọn đối tác",
        endpoint: "/partners",
        queryParams: { page: 1, pageSize: 50 },
        transformKey: { value: "id", label: "partnerType" },
        mappingField: "id",
        description: "Chọn đối tác (nếu có)",
      },
      {
        name: "transferStatus",
        label: "Trạng Thái Chuyển Giao",
        type: "text",
        placeholder: "Nhập trạng thái chuyển giao",
      },
      {
        name: "reason",
        label: "Lý Do",
        type: "textarea",
        placeholder: "Nhập lý do bảo trì",
      },
      {
        name: "requestDate",
        label: "Ngày Yêu Cầu",
        type: "date",
        placeholder: "Chọn ngày yêu cầu",
      },
      {
        name: "status",
        label: "Trạng Thái",
        type: "select",
        placeholder: "Chọn trạng thái",
        options: [
          { label: "Hoạt Động", value: "1" },
          { label: "Ngừng Hoạt Động", value: "0" },
        ],
      },
    ];
  }, []);

  const modalConfig = useMemo(() => {
    const base = "/maintenance-slips" as const;
    const idPath = selectedId ? `${base}/${selectedId}` : base;

    const apiEndpoint = type === "create" ? base : idPath;
    const fetchDetailsEndpoint = selectedId ? idPath : "";
    const schema =
      type === "edit"
        ? updateMaintenanceSlipSchema
        : createMaintenanceSlipSchema;

    let title = "Phiếu Bảo Trì";
    if (type === "create") title = "Tạo Phiếu Bảo Trì";
    else if (type === "edit") title = "Chỉnh Sửa Phiếu Bảo Trì";
    else if (type === "delete") title = "Xóa Phiếu Bảo Trì";

    let subtitle = "";
    if (type === "create") subtitle = "Tạo phiếu bảo trì mới cho thiết bị";
    else if (type === "edit") subtitle = "Chỉnh sửa thông tin phiếu bảo trì";
    else subtitle = "Bạn có chắc chắn muốn xóa phiếu bảo trì này?";

    return { apiEndpoint, fetchDetailsEndpoint, schema, title, subtitle };
  }, [type, selectedId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Quản Lý Phiếu Bảo Trì</h1>
        <p className="text-muted-foreground">Quản lý phiếu bảo trì thiết bị</p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Quản Lý Phiếu Bảo Trì</h1>
      <p className="text-muted-foreground">Quản lý phiếu bảo trì thiết bị</p>

      <DataTable<IMaintenanceSlipInfo, unknown>
        columns={columns}
        queryKey={["maintenance-slips"]}
        queryFn={getList}
        searchColumn="reason"
        searchPlaceholder="Tìm kiếm phiếu bảo trì..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy phiếu bảo trì nào."
        globalActions={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) => RowActions(row, onDelete, onEdit)}
      />

      {open && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={
            type === "edit" ? fields : fields.filter((f) => f.name !== "status")
          }
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["maintenance-slips"],
              exact: false,
            });
            if (modalConfig.fetchDetailsEndpoint) {
              queryClient.invalidateQueries({
                queryKey: [modalConfig.fetchDetailsEndpoint],
                exact: false,
              });
            }
          }}
        />
      )}
    </Card>
  );
}
