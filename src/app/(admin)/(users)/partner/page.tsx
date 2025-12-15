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
import { IPaginatedResponse, IPartner } from "@/shared/interfaces";
import {
  createPartnerSchema,
  updatePartnerSchema,
} from "@/shared/schema/admin/partner.schema";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const createColumns = (): ColumnDef<IPartner>[] => [
  {
    accessorKey: "user.fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên Người Dùng" />
    ),
    cell: ({ row }) => row.original.user?.name || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Tên Người Dùng",
      filterType: "text",
      placeholder: "Tìm kiếm theo tên...",
    },
    minSize: 200,
    maxSize: 250,
  },
  {
    accessorKey: "user.email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => row.original.user?.email || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Email",
      filterType: "text",
    },
    minSize: 200,
    maxSize: 250,
  },
  {
    accessorKey: "partnerType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại Đối Tượng" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("partnerType");
      const partnerTypeLabel = row.original.partnerTypeLabel;
      return partnerTypeLabel || type;
    },
    enableColumnFilter: true,
    meta: {
      label: "Loại Đối Tượng",
      filterType: "async-select",
      asyncEndpoint: "/params/type/PARTNER_TYPE",
      transformKey: { value: "code", label: "value" },
    },
    size: 150,
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
    size: 180,
    meta: {
      filterType: "date",
      label: "Ngày Cập Nhật",
    },
  },
];

// Partner actions component
function PartnerActions(
  row: Readonly<IPartner>,
  onDelete: (partner: IPartner) => void,
  onEdit: (partner: IPartner) => void,
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
        >
          Chỉnh Sửa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className="text-red-600"
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function PartnerPage() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<"create" | "edit" | "view" | "delete">(
    "create",
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const partnerFields = useMemo((): IFormFieldConfig[] => {
    return [
      {
        name: "name",
        label: "Tên Đối Tượng",
        type: "text",
        placeholder: "Nhập tên đối tượng",
        description: "Tên đầy đủ của đối tượng",
        className: "w-full",
      },
      {
        name: "email",
        label: "Email",
        type: "text",
        placeholder: "Nhập email",
        description: "Địa chỉ email của đối tượng",
        className: "w-full",
      },
      {
        name: "partnerType",
        label: "Loại Đối Tượng",
        type: "async-select",
        placeholder: "Chọn loại đối tượng",
        endpoint: "/params/type/PARTNER_TYPE",
        transformKey: { value: "code", label: "value" },
        description: "Phân loại đối tượng",
        className: "w-full",
      },
      {
        name: "status",
        label: "Trạng Thái",
        type: "switch",
        placeholder: "Chọn trạng thái",
        options: [
          { label: "Hoạt Động", value: "1" },
          { label: "Không Hoạt Động", value: "0" },
        ],
        description: "Trạng thái hoạt động của đối tượng",
        className: "w-full",
      },
    ];
  }, []);

  // Create columns
  const columns = useMemo(() => createColumns(), []);

  const getPartners = async (params: Record<string, unknown>) => {
    const response = await api.get<IPaginatedResponse<IPartner>>("/partners", {
      params,
    });
    return response;
  };

  const queryClient = useQueryClient();

  const onCreatePartner = () => {
    setType("create");
    setSelectedPartnerId(null);
    setOpen(true);
  };

  const onDeletePartner = (partner: IPartner) => {
    setType("delete");
    setSelectedPartnerId(partner.id);
    setOpen(true);
  };

  const onEditPartner = (partner: IPartner) => {
    setType("edit");
    setSelectedPartnerId(partner.id);
    setOpen(true);
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo Đối Tượng Mới",
      edit: "Chỉnh Sửa Đối Tượng",
      view: "Xem Chi Tiết Đối Tượng",
      delete: "Xóa Đối Tượng",
    } as const;
    const subtitleMap = {
      create: "Điền thông tin bên dưới để tạo đối tượng mới.",
      edit: "Cập nhật thông tin đối tượng.",
      view: "Xem chi tiết thông tin đối tượng.",
      delete: "Bạn có chắc chắn muốn xóa đối tượng này?",
    } as const;

    const base = "/partners" as const;
    const idPath = selectedPartnerId ? `${base}/${selectedPartnerId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isEdit || isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedPartnerId ? idPath : "",
      schema: isEdit ? updatePartnerSchema : createPartnerSchema,
    };
  }, [type, selectedPartnerId]);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="text-lg font-semibold">Đang tải...</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Quản Lý Đối Tượng</h1>
      <p className="text-muted-foreground">
        Quản lý đối tượng và thông tin của họ
      </p>

      <DataTable<IPartner, unknown>
        columns={columns}
        queryKey={["partners"]}
        queryFn={getPartners}
        searchColumn="user.fullName"
        searchPlaceholder="Tìm kiếm đối tượng..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy đối tượng nào."
        globalActions={
          <Button onClick={onCreatePartner}>
            <Plus className="h-4 w-4" />
          </Button>
        }
        columnActions={(row) =>
          PartnerActions(row, onDeletePartner, onEditPartner)
        }
      />

      {open && (
        <DynamicModal
          open={open}
          onOpenChange={setOpen}
          schema={modalConfig.schema}
          fields={partnerFields}
          type={type}
          apiEndpoint={modalConfig.apiEndpoint}
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["partners"],
              exact: false,
            });
            setOpen(false);
          }}
          onError={(error) => {
            console.error("Partner operation failed:", error);
          }}
        />
      )}
    </Card>
  );
}
