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
import { IPaginatedResponse, IRack } from "@/shared/interfaces";
import {
  createRackSchema,
  updateRackSchema,
} from "@/shared/schema/admin/rack.schema";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { LayoutGrid, MoreHorizontal, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (): ColumnDef<IRack>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã Rack" />
    ),
    cell: ({ row }) => row.getValue("code"),
    enableColumnFilter: true,
    meta: {
      label: "Mã Rack",
      filterType: "text",
      placeholder: "Tìm kiếm theo mã rack...",
    },
    minSize: 150,
    maxSize: 250,
  },
  {
    accessorKey: "rows",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số Hàng" />
    ),
    cell: ({ row }) => row.getValue("rows"),
    enableColumnFilter: false,
    size: 100,
  },
  {
    accessorKey: "cols",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Số Cột" />
    ),
    cell: ({ row }) => row.getValue("cols"),
    enableColumnFilter: false,
    size: 100,
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

function RackActions(
  row: Readonly<IRack>,
  onDelete: (rack: IRack) => void,
  onEdit: (rack: IRack) => void,
  onViewDiagram: (rack: IRack) => void,
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
        <DropdownMenuItem onClick={() => onViewDiagram(row)}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          Xem Sơ Đồ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row)}>
          Chỉnh Sửa
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(row)}>Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface RackTabProps {
  readonly mounted: boolean;
}

export function RackTab({ mounted }: Readonly<RackTabProps>) {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

  const rackFields = useMemo((): IFormFieldConfig[] => {
    const isEdit = type === "edit";

    const fields: IFormFieldConfig[] = [];

    if (isEdit) {
      fields.push({
        name: "code",
        label: "Mã Rack",
        type: "text",
        placeholder: "Mã rack (tự động tạo)",
        description: "Mã định danh duy nhất cho rack (chỉ xem)",
        disabled: true,
      });
    }

    fields.push(
      {
        name: "rows",
        label: "Số Hàng",
        type: "number",
        placeholder: "Nhập số hàng (1-100)",
        description: "Số hàng trong rack",
      },
      {
        name: "cols",
        label: "Số Cột",
        type: "number",
        placeholder: "Nhập số cột (1-100)",
        description: "Số cột trong rack",
      },
      {
        name: "status",
        label: "Trạng Thái Hoạt Động",
        type: "checkbox",
        description: "Rack có sẵn sàng sử dụng không?",
      },
    );

    return fields;
  }, [type]);

  const columns = useMemo(() => createColumns(), []);

  const getRacks = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IRack>>("/racks", {
      params,
    });
    return response;
  };

  const queryClient = useQueryClient();

  const onCreateRack = () => {
    setType("create");
    setSelectedRackId(null);
    setOpen(true);
  };

  const onDeleteRack = (rack: IRack) => {
    setType("delete");
    setSelectedRackId(rack.id);
    setOpen(true);
  };

  const onEditRack = (rack: IRack) => {
    setType("edit");
    setSelectedRackId(rack.id);
    setOpen(true);
  };

  const onViewDiagram = (rack: IRack) => {
    router.push(`/device-location/${rack.id}`);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo Rack Mới",
      edit: "Chỉnh Sửa Rack",
      view: "Xem Chi Tiết Rack",
      delete: "Xóa Rack",
    } as const;
    const subtitleMap = {
      create: "Điền đầy đủ thông tin dưới đây để tạo rack mới.",
      edit: "Sửa đổi thông tin rack dưới đây.",
      view: "Xem chi tiết thông tin rack.",
      delete: "Bạn có chắc chắn muốn xóa rack này không?",
    } as const;

    const base = "/racks" as const;
    const idPath = selectedRackId ? `${base}/${selectedRackId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedRackId ? idPath : "",
      schema: isEdit ? updateRackSchema : createRackSchema,
    };
  }, [type, selectedRackId]);

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <DataTable<IRack, unknown>
        columns={columns}
        queryKey={["racks"]}
        queryFn={getRacks}
        searchColumn="code"
        searchPlaceholder="Tìm kiếm rack..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy rack nào."
        globalActions={
          <Button onClick={onCreateRack}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          RackActions(row, onDeleteRack, onEditRack, onViewDiagram)
        }
      />

      {open && type !== "delete" && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={rackFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["racks"],
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
              queryKey: ["racks"],
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
