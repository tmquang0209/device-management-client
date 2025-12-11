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
import { IPaginatedResponse, IParamInfo } from "@/shared/interfaces";
import {
  createParamSchema,
  updateParamSchema,
} from "@/shared/schema/admin/param.schema";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (): ColumnDef<IParamInfo>[] => [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại" />
    ),
    enableColumnFilter: true,
    meta: { label: "Loại", filterType: "text" },
    minSize: 150,
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã" />
    ),
    enableColumnFilter: true,
    meta: { label: "Mã", filterType: "text" },
    size: 150,
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Giá Trị" />
    ),
    enableColumnFilter: true,
    meta: { label: "Giá Trị", filterType: "text" },
    minSize: 200,
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
        { label: "Hoạt Động", value: true },
        { label: "Không Hoạt Động", value: false },
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
      dayjs(row.getValue("createdAt")).format("DD/MM/YYYY hh:mm:ss"),
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
      dayjs(row.getValue("updatedAt")).format("DD/MM/YYYY hh:mm:ss"),
    enableColumnFilter: true,
    meta: { filterType: "date", label: "Ngày Cập Nhật" },
    size: 150,
  },
];

function ParamActions(
  row: Readonly<IParamInfo>,
  onDelete: (p: IParamInfo) => void,
  onEdit: (p: IParamInfo) => void,
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

export default function ParamConfigPage() {
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

  const getParams = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IParamInfo>>("/params", {
      params,
    });
    return response;
  };

  const queryClient = useQueryClient();

  const onCreate = () => {
    setType("create");
    setSelectedId(null);
    setOpen(true);
  };

  const onDelete = (p: IParamInfo) => {
    setType("delete");
    setSelectedId(p.id);
    setOpen(true);
  };

  const onEdit = (p: IParamInfo) => {
    setType("edit");
    setSelectedId(p.id);
    setOpen(true);
  };

  const fields = useMemo((): IFormFieldConfig[] => {
    return [
      { name: "type", label: "Loại", type: "text", placeholder: "Nhập loại" },
      { name: "code", label: "Mã", type: "text", placeholder: "Nhập mã" },
      {
        name: "value",
        label: "Giá Trị",
        type: "text",
        placeholder: "Nhập giá trị",
      },
      {
        name: "status",
        label: "Trạng Thái",
        type: "select",
        placeholder: "Chọn trạng thái",
        options: [
          { label: "Hoạt Động", value: "1" },
          { label: "Không Hoạt Động", value: "0" },
        ],
      },
    ];
  }, []);

  const modalConfig = useMemo(() => {
    const base = "/params" as const;
    const idPath = selectedId ? `${base}/${selectedId}` : base;
    const apiEndpoint = type === "create" ? base : idPath;
    const fetchDetailsEndpoint = selectedId ? idPath : "";
    const schema = type === "edit" ? updateParamSchema : createParamSchema;

    let title = "Tham Số";
    if (type === "create") title = "Tạo Tham Số";
    else if (type === "edit") title = "Chỉnh Sửa Tham Số";

    const subtitle =
      type === "create" ? "Tạo một tham số mới" : "Chỉnh sửa tham số này";

    return { apiEndpoint, fetchDetailsEndpoint, schema, title, subtitle };
  }, [type, selectedId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Cấu Hình Tham Số</h1>
        <p className="text-muted-foreground">Quản lý tham số hệ thống</p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Cấu Hình Tham Số</h1>
      <p className="text-muted-foreground">Quản lý tham số hệ thống</p>

      <DataTable<IParamInfo, unknown>
        columns={columns}
        queryKey={["params"]}
        queryFn={getParams}
        searchColumn="type"
        searchPlaceholder="Tìm kiếm tham số..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy tham số nào."
        globalActions={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) => ParamActions(row, onDelete, onEdit)}
      />

      {open && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={fields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["params"],
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
