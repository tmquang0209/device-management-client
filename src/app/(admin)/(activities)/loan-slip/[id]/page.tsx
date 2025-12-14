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
import { ILoanSlip, IResponse } from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Calendar, Hash, Loader2, User, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoanSlipDetailPage() {
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
    data: loanSlip,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loan-slip", id],
    queryFn: async (): Promise<ILoanSlip> => {
      const response = await api.get<IResponse<ILoanSlip>>(`/loan-slips/${id}`);
      return response.data as ILoanSlip;
    },
    enabled: !!id,
  });

  const onReturnDevice = (deviceId: string, deviceName: string) => {
    setSelectedDeviceForReturn({ deviceId, deviceName });
    setReturnStatus("2");
    setReturnNote("");
    setReturnDialogOpen(true);
  };

  const handleReturnDevice = async () => {
    if (!loanSlip || !selectedDeviceForReturn) return;

    setIsReturning(true);
    try {
      await api.put(`/loan-slips/${loanSlip.id}/return`, {
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

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["loan-slips"],
        exact: false,
      });
      refetch();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể trả thiết bị");
    } finally {
      setIsReturning(false);
    }
  };

  const openCancelDialog = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelLoanSlip = async () => {
    if (!loanSlip) return;

    setIsCancelling(true);
    try {
      await api.delete(`/loan-slips/${loanSlip.id}/cancel`);
      toast.success("Hủy phiếu mượn thành công");
      setCancelDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["loan-slips"],
        exact: false,
      });
      refetch();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể hủy phiếu mượn");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="default">Đang Mượn</Badge>;
      case 2:
        return <Badge variant="success">Đã Nhập Kho</Badge>;
      case 3:
        return <Badge variant="destructive">Đã Hủy</Badge>;
      case 4:
        return <Badge variant="warning">Chưa Hoàn Tất Nhập Kho</Badge>;
      default:
        return <Badge variant="secondary">Không xác định</Badge>;
    }
  };

  const getDeviceStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="default">Đã mượn</Badge>;
      case 2:
        return <Badge variant="success">Đã trả</Badge>;
      case 3:
        return <Badge variant="destructive">Hỏng</Badge>;
      default:
        return <Badge variant="secondary">Không xác định</Badge>;
    }
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

  if (error || !loanSlip) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-500">Không tìm thấy phiếu mượn</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/loan-slip")}
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
              onClick={() => router.push("/loan-slip")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold">Chi Tiết Phiếu Mượn</h1>
              <p className="text-muted-foreground text-sm">
                Mã giao dịch: {loanSlip.code || loanSlip.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(loanSlip.status)}
            {loanSlip.status === 1 && (
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
                {loanSlip.code || loanSlip.id}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Người mượn
              </Label>
              <p className="font-medium">
                {loanSlip.borrower?.user?.name || "N/A"}
              </p>
              <p className="text-muted-foreground text-xs">
                {loanSlip.borrower?.user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Người cho mượn
              </Label>
              <p className="font-medium">
                {loanSlip.loaner?.user?.name || "N/A"}
              </p>
              <p className="text-muted-foreground text-xs">
                {loanSlip.loaner?.user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Ngày tạo</Label>
              <p className="font-medium">
                {dayjs(loanSlip.createdAt).format("DD/MM/YYYY HH:mm")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Cập nhật lần cuối
              </Label>
              <p className="font-medium">
                {dayjs(loanSlip.updatedAt).format("DD/MM/YYYY HH:mm")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-teal-50 p-2 dark:bg-teal-900/20">
              <Hash className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Tổng số thiết bị đã trả
              </Label>
              <p className="font-medium">
                {loanSlip.totalReturned || 0} / {loanSlip.details?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Device List */}
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Danh sách thiết bị ({loanSlip.details?.length || 0})
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
                <TableHead>Mã phiếu trả</TableHead>
                <TableHead>Ngày trả</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanSlip.details && loanSlip.details.length > 0 ? (
                loanSlip.details.map((detail, index) => (
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
                    <TableCell className="font-mono text-xs">
                      {detail.returnSlipCode || "-"}
                    </TableCell>
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground py-10 text-center"
                  >
                    Không có thiết bị nào trong giao dịch mượn
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
            <DialogTitle>Trả Thiết Bị</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin trả thiết bị:{" "}
              <span className="font-medium">
                {selectedDeviceForReturn?.deviceName}
              </span>
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
              disabled={isReturning}
            >
              Hủy
            </Button>
            <Button onClick={handleReturnDevice} disabled={isReturning}>
              {isReturning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận trả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy phiếu mượn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy phiếu mượn này không? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <X className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Mã phiếu: {loanSlip?.code || loanSlip?.id}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Tất cả thiết bị trong phiếu sẽ được đánh dấu là đã trả và
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
              onClick={handleCancelLoanSlip}
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
