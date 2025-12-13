"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
import { DataTable } from "@/components/table/data-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/shared/data/api";
import {
  IDevice,
  ILoanSlip,
  IPaginatedResponse,
  IPartner,
  IResponse,
} from "@/shared/interfaces";
import {
  createLoanSlipSchema,
  updateLoanSlipSchema,
} from "@/shared/schema/admin/loan-slip.schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Calendar, Eye, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const createColumns = (
  partners?: IPartner[],
  devices?: IDevice[],
  onViewDetails?: (loanSlip: ILoanSlip) => void,
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
      options: partners?.map((partner) => ({
        label: partner.user?.name || `Partner ${partner.id}`,
        value: partner.id,
      })),
    },
    size: 200,
  },
  {
    accessorKey: "equipmentLoanerId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người Cho Mượn" />
    ),
    cell: ({ row }) => row.original.loaner?.user?.name || "N/A",
    enableColumnFilter: true,
    meta: {
      label: "Người Cho Mượn",
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
      if (status === 1) {
        return <Badge variant="default">Đang Mượn</Badge>;
      } else if (status === 2) {
        return <Badge variant="success">Đã Đóng</Badge>;
      } else if (status === 3) {
        return <Badge variant="destructive">Đã Hủy</Badge>;
      }
      return <Badge variant="secondary">Không xác định</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: "Trạng Thái",
      filterType: "select",
      options: [
        { label: "Đang Mượn", value: 1 },
        { label: "Đã Đóng", value: 2 },
        { label: "Đã Hủy", value: 3 },
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
  const canEdit = row.status === 1; // Only allow edit if BORROWING
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLoanSlip, setSelectedLoanSlip] = useState<ILoanSlip | null>(
    null,
  );
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedDeviceForReturn, setSelectedDeviceForReturn] = useState<{
    deviceId: string;
    deviceName: string;
  } | null>(null);
  const [returnStatus, setReturnStatus] = useState<string>("2"); // 2 = RETURNED
  const [returnNote, setReturnNote] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (partnersError) {
      const errorMessage =
        partnersError instanceof Error
          ? partnersError.message
          : "Không thể tải danh sách đối tác";
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
        name: "loanerId",
        label: "Người Cho Mượn",
        type: "async-select",
        placeholder: "Chọn người cho mượn",
        endpoint: "/partners",
        queryParams: { page: 1, pageSize: 50 },
        transformKey: { value: "id", label: "partnerType" },
        mappingField: "id",
        className: "w-full",
      },
      {
        name: "expectedReturnDate",
        label: "Ngày Dự Kiến Trả",
        type: "date",
        placeholder: "Chọn ngày dự kiến trả",
        leftIcon: <Calendar className="h-4 w-4" />,
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
      createColumns(partners, devices, (loanSlip) => {
        setSelectedLoanSlip(loanSlip);
        setDetailsOpen(true);
      }),
    [partners, devices],
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
    setSelectedLoanSlip(loanSlip);
    setDetailsOpen(true);
  };

  const onReturnDevice = (deviceId: string, deviceName: string) => {
    setSelectedDeviceForReturn({ deviceId, deviceName });
    setReturnStatus("2");
    setReturnNote("");
    setReturnDialogOpen(true);
  };

  const handleReturnDevice = async () => {
    if (!selectedLoanSlip || !selectedDeviceForReturn) return;

    try {
      await api.put(`/loan-slips/${selectedLoanSlip.id}/return`, {
        items: [
          {
            deviceId: selectedDeviceForReturn.deviceId,
            status: parseInt(returnStatus),
            note: returnNote,
          },
        ],
      });

      toast.success("Trả thiết bị thành công");
      setReturnDialogOpen(false);
      setSelectedDeviceForReturn(null);
      setReturnNote("");

      // Refresh loan slip details
      queryClient.invalidateQueries({
        queryKey: ["loan-slips"],
        exact: false,
      });

      // Refresh details if open
      if (selectedLoanSlip) {
        const response = await api.get<IResponse<ILoanSlip>>(
          `/loan-slips/${selectedLoanSlip.id}`,
        );
        setSelectedLoanSlip(response.data || null);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể trả thiết bị");
    }
  };

  const onCancelLoanSlip = async (loanSlip: ILoanSlip) => {
    // Cancel means setting status to CANCELLED, not deleting from database
    try {
      await api.delete(`/loan-slips/${loanSlip.id}/cancel`);
      toast.success("Hủy phiếu mượn thành công");
      queryClient.invalidateQueries({
        queryKey: ["loan-slips"],
        exact: false,
      });
      // Close details dialog if open
      if (detailsOpen && selectedLoanSlip?.id === loanSlip.id) {
        setDetailsOpen(false);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy phiếu mượn");
    }
  };

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Tạo Phiếu Mượn Mới",
      edit: "Chỉnh Sửa Phiếu Mượn",
      view: "Xem Chi Tiết Phiếu Mượn",
      delete: "Xóa Phiếu Mượn",
    } as const;
    const subtitleMap = {
      create: "Điền đầy đủ thông tin dưới đây để tạo phiếu mượn mới.",
      edit: "Sửa đổi thông tin phiếu mượn dưới đây.",
      view: "Xem chi tiết thông tin phiếu mượn.",
      delete: "Bạn có chắc chắn muốn xóa phiếu mượn này không?",
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
      <h1 className="text-2xl font-bold">Quản Lý Phiếu Mượn</h1>
      <p className="text-muted-foreground">
        Quản lý các phiếu mượn thiết bị và thông tin của chúng
      </p>

      <DataTable<ILoanSlip, unknown>
        columns={columns}
        queryKey={["loan-slips"]}
        queryFn={getLoanSlips}
        searchColumn="id"
        searchPlaceholder="Tìm kiếm phiếu mượn..."
        initialFilters={{}}
        emptyMessage="Không tìm thấy phiếu mượn nào."
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Giao Dịch Mượn</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về giao dịch mượn thiết bị
            </DialogDescription>
          </DialogHeader>

          {selectedLoanSlip && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid gap-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Thông tin giao dịch</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Mã giao dịch
                    </Label>
                    <p className="font-mono text-sm">{selectedLoanSlip.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Trạng thái</Label>
                    <div className="mt-1">
                      {selectedLoanSlip.status === 1 && (
                        <Badge variant="default">Đang Mượn</Badge>
                      )}
                      {selectedLoanSlip.status === 2 && (
                        <Badge variant="success">Đã Đóng</Badge>
                      )}
                      {selectedLoanSlip.status === 3 && (
                        <Badge variant="destructive">Đã Hủy</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Người mượn</Label>
                    <p className="font-medium">
                      {selectedLoanSlip.borrower?.user?.name || "N/A"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedLoanSlip.borrower?.user?.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Người cho mượn
                    </Label>
                    <p className="font-medium">
                      {selectedLoanSlip.loaner?.user?.name || "N/A"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedLoanSlip.loaner?.user?.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ngày tạo</Label>
                    <p>
                      {dayjs(selectedLoanSlip.createdAt).format(
                        "DD/MM/YYYY HH:mm",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device List */}
              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="text-lg font-semibold">Danh sách thiết bị</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Mã thiết bị</TableHead>
                      <TableHead>Tên thiết bị</TableHead>
                      <TableHead>Loại thiết bị</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày trả</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLoanSlip.details &&
                    selectedLoanSlip.details.length > 0 ? (
                      selectedLoanSlip.details.map((detail, index) => (
                        <TableRow key={detail.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {detail.device?.id}
                          </TableCell>
                          <TableCell>{detail.device?.deviceName}</TableCell>
                          <TableCell>
                            {detail.device?.deviceType?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {detail.status === 1 && (
                              <Badge variant="default">Đã mượn</Badge>
                            )}
                            {detail.status === 2 && (
                              <Badge variant="success">Đã trả</Badge>
                            )}
                            {detail.status === 3 && (
                              <Badge variant="destructive">Hỏng</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {detail.returnDate
                              ? dayjs(detail.returnDate).format("DD/MM/YYYY")
                              : "-"}
                          </TableCell>
                          <TableCell>{detail.note || "-"}</TableCell>
                          <TableCell>
                            {detail.status === 1 &&
                              selectedLoanSlip.status === 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onReturnDevice(
                                      detail.deviceId,
                                      detail.device?.deviceName || "",
                                    )
                                  }
                                >
                                  Trả thiết bị
                                </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-muted-foreground text-center"
                        >
                          Không có thiết bị nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Device Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trả Thiết Bị</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin trả thiết bị:{" "}
              {selectedDeviceForReturn?.deviceName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnStatus">Trạng thái trả thiết bị</Label>
              <Select value={returnStatus} onValueChange={setReturnStatus}>
                <SelectTrigger id="returnStatus">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Đã trả (nguyên vẹn)</SelectItem>
                  <SelectItem value="3">Đã trả (hỏng)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnNote">Ghi chú</Label>
              <Textarea
                id="returnNote"
                placeholder="Nhập ghi chú về tình trạng thiết bị..."
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturnDialogOpen(false);
                setSelectedDeviceForReturn(null);
                setReturnNote("");
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleReturnDevice}>Xác nhận trả</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            let message = "Xóa phiếu mượn thành công";
            if (type === "create") {
              message = "Tạo phiếu mượn thành công";
            } else if (type === "edit") {
              message = "Cập nhật phiếu mượn thành công";
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
