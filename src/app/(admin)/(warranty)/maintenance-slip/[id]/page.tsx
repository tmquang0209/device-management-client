"use client";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  EMaintenanceSlipDetailStatus,
  EMaintenanceSlipStatus,
  IMaintenanceSlipInfo,
  IParamInfo,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Calendar, Hash, Loader2, User, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Default status mappings (fallback)
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
  [EMaintenanceSlipStatus.CLOSED]: { label: "Đã Đóng", variant: "success" },
  [EMaintenanceSlipStatus.CANCELLED]: {
    label: "Đã Hủy",
    variant: "destructive",
  },
  [EMaintenanceSlipStatus.PARTIAL_RETURNED]: {
    label: "Chưa Hoàn Tất",
    variant: "warning",
  },
};

const defaultDetailStatusMap: Record<
  number,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "warning" | "secondary";
  }
> = {
  [EMaintenanceSlipDetailStatus.SENT]: {
    label: "Đang Bảo Trì",
    variant: "default",
  },
  [EMaintenanceSlipDetailStatus.RETURNED]: {
    label: "Đã Nhận Lại",
    variant: "success",
  },
  [EMaintenanceSlipDetailStatus.BROKEN]: {
    label: "Hỏng",
    variant: "destructive",
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

const getDetailStatusVariant = (
  code: string,
): "default" | "success" | "destructive" | "warning" | "secondary" => {
  switch (code) {
    case "1":
      return "default";
    case "2":
      return "success";
    case "3":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function MaintenanceSlipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedDeviceForReturn, setSelectedDeviceForReturn] = useState<{
    deviceId: string;
    deviceName: string;
  } | null>(null);
  const [returnStatus, setReturnStatus] = useState<string>("2");
  const [returnNote, setReturnNote] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    data: maintenanceSlip,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["maintenance-slip", id],
    queryFn: async (): Promise<IMaintenanceSlipInfo> => {
      const response = await api.get<IResponse<IMaintenanceSlipInfo>>(
        `/maintenance-slips/${id}`,
      );
      return response.data as IMaintenanceSlipInfo;
    },
    enabled: !!id,
  });

  // Fetch statuses from API
  const { data: statusList } = useQuery({
    queryKey: ["maintenance-slip-statuses"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/maintenance-slips/statuses",
      );
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch detail statuses from API
  const { data: detailStatusList } = useQuery({
    queryKey: ["maintenance-slip-detail-statuses"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/maintenance-slips/detail-statuses",
      );
      return response.data || [];
    },
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

  // Build detail status map from API data
  const detailStatusMap = useMemo(() => {
    if (!detailStatusList || detailStatusList.length === 0) {
      return defaultDetailStatusMap;
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
    detailStatusList.forEach((status) => {
      map[parseInt(status.code)] = {
        label: status.value,
        variant: getDetailStatusVariant(status.code),
      };
    });
    return map;
  }, [detailStatusList]);

  // Build return status options (exclude SENT status)
  const returnStatusOptions = useMemo(() => {
    if (!detailStatusList || detailStatusList.length === 0) {
      return [
        { value: "2", label: "Đã sửa (hoạt động bình thường)" },
        { value: "3", label: "Không thể sửa (hỏng)" },
      ];
    }
    return detailStatusList
      .filter((status) => status.code !== "1") // Exclude SENT status
      .map((status) => ({
        value: status.code,
        label: status.value,
      }));
  }, [detailStatusList]);

  const onReturnDevice = (deviceId: string, deviceName: string) => {
    setSelectedDeviceForReturn({ deviceId, deviceName });
    setReturnStatus("2");
    setReturnNote("");
    setReturnDialogOpen(true);
  };

  const handleReturnDevice = async () => {
    if (!maintenanceSlip || !selectedDeviceForReturn) return;

    setIsReturning(true);
    try {
      await api.put(`/maintenance-slips/${maintenanceSlip.id}/return`, {
        items: [
          {
            deviceId: selectedDeviceForReturn.deviceId,
            status: parseInt(returnStatus),
            note: returnNote,
          },
        ],
      });

      toast.success("Nhận lại thiết bị thành công");
      setReturnDialogOpen(false);
      setSelectedDeviceForReturn(null);
      setReturnNote("");

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["maintenance-slips"],
        exact: false,
      });
      refetch();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể nhận lại thiết bị");
    } finally {
      setIsReturning(false);
    }
  };

  const openCancelDialog = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelMaintenanceSlip = async () => {
    if (!maintenanceSlip) return;

    setIsCancelling(true);
    try {
      await api.delete(`/maintenance-slips/${maintenanceSlip.id}/cancel`);
      toast.success("Hủy phiếu bảo trì thành công");
      setCancelDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["maintenance-slips"],
        exact: false,
      });
      refetch();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy phiếu bảo trì");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: EMaintenanceSlipStatus) => {
    const statusInfo = statusMap[Number(status)];
    if (statusInfo) {
      return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    }
    return <Badge variant="secondary">Không xác định</Badge>;
  };

  const getDeviceStatusBadge = (status: EMaintenanceSlipDetailStatus) => {
    const statusInfo = detailStatusMap[Number(status)];
    if (statusInfo) {
      return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    }
    return <Badge variant="secondary">Không xác định</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Đang tải...</span>
        </div>
      </Card>
    );
  }

  if (error || !maintenanceSlip) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-500">Không tìm thấy phiếu bảo trì</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/maintenance-slip")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/maintenance-slip")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold">Chi Tiết Phiếu Bảo Trì</h1>
              <p className="text-muted-foreground text-sm">
                Mã giao dịch: {maintenanceSlip.code || maintenanceSlip.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(maintenanceSlip.status)}
            {maintenanceSlip.status === EMaintenanceSlipStatus.SENDING && (
              <Button
                variant="outline"
                className="text-orange-600 hover:text-orange-700"
                onClick={openCancelDialog}
              >
                <X className="mr-2 h-4 w-4" />
                Hủy phiếu
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Transaction Info */}
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">Thông tin giao dịch</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Mã giao dịch
              </Label>
              <p className="font-mono text-sm font-medium">
                {maintenanceSlip.code || maintenanceSlip.id}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Đối tác bảo trì
              </Label>
              <p className="font-medium">
                {maintenanceSlip.partner?.user?.name || "Chưa chọn"}
              </p>
              <p className="text-muted-foreground text-xs">
                {maintenanceSlip.partner?.user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Ngày yêu cầu
              </Label>
              <p className="font-medium">
                {maintenanceSlip.requestDate
                  ? dayjs(maintenanceSlip.requestDate).format("DD/MM/YYYY")
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Ngày tạo</Label>
              <p className="font-medium">
                {dayjs(maintenanceSlip.createdAt).format("DD/MM/YYYY HH:mm")}
              </p>
            </div>
          </div>

          {maintenanceSlip.reason && (
            <div className="col-span-2 flex items-start gap-3">
              <div>
                <Label className="text-muted-foreground text-sm">Lý do</Label>
                <p className="font-medium">{maintenanceSlip.reason}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Device List */}
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Danh sách thiết bị ({maintenanceSlip.details?.length || 0})
          </h2>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">STT</TableHead>
                <TableHead>Mã thiết bị</TableHead>
                <TableHead>Tên thiết bị</TableHead>
                <TableHead>Loại thiết bị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày nhận lại</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="w-32">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceSlip.details && maintenanceSlip.details.length > 0 ? (
                maintenanceSlip.details.map((detail, index) => (
                  <TableRow key={detail.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {detail.device?.serial || detail.device?.id || "N/A"}
                    </TableCell>
                    <TableCell>{detail.device?.deviceName || "N/A"}</TableCell>
                    <TableCell>
                      {detail.device?.deviceType?.deviceTypeName || "N/A"}
                    </TableCell>
                    <TableCell>{getDeviceStatusBadge(detail.status)}</TableCell>
                    <TableCell>
                      {detail.returnDate
                        ? dayjs(detail.returnDate).format("DD/MM/YYYY")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 text-sm">
                        {detail.note || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {detail.status === EMaintenanceSlipDetailStatus.SENT &&
                        maintenanceSlip.status ===
                          EMaintenanceSlipStatus.SENDING && (
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
                            Nhận lại
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-10 text-center"
                  >
                    Không có thiết bị nào trong phiếu bảo trì
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Return Device Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhận Lại Thiết Bị</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhận lại thiết bị:{" "}
              <span className="font-medium">
                {selectedDeviceForReturn?.deviceName}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnStatus">Trạng thái thiết bị</Label>
              <Select value={returnStatus} onValueChange={setReturnStatus}>
                <SelectTrigger id="returnStatus">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {returnStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
              disabled={isReturning}
            >
              Hủy
            </Button>
            <Button onClick={handleReturnDevice} disabled={isReturning}>
              {isReturning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận nhận lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy phiếu bảo trì</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy phiếu bảo trì này không? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <X className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Mã phiếu: {maintenanceSlip?.code || maintenanceSlip?.id}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Tất cả thiết bị trong phiếu sẽ được đánh dấu là khả dụng và
                  phiếu sẽ chuyển sang trạng thái Hủy.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Không, giữ lại
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelMaintenanceSlip}
              disabled={isCancelling}
            >
              {isCancelling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
