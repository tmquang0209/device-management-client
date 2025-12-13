"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/shared/data/api";
import { EReturnSlipStatus, IResponse, IReturnSlip } from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Loader2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<
  number,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "secondary";
  }
> = {
  [EReturnSlipStatus.RETURNED]: { label: "Đã nhập kho", variant: "success" },
  [EReturnSlipStatus.CANCELLED]: { label: "Đã hủy", variant: "destructive" },
};

const loanSlipStatusLabels: Record<number, string> = {
  1: "Đang Mượn",
  2: "Đã Đóng",
  3: "Đã Hủy",
  4: "Chưa Hoàn Tất Nhập Kho",
};

export default function ReturnSlipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const returnSlipId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: returnSlip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["return-slip", returnSlipId],
    queryFn: async (): Promise<IReturnSlip> => {
      const response = await api.get<IResponse<IReturnSlip>>(
        `/return-slips/${returnSlipId}`,
      );
      return response.data;
    },
    enabled: mounted && !!returnSlipId,
  });

  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin giao dịch trả";
      toast.error(errorMessage);
    }
  }, [error]);

  const handleCancel = async () => {
    if (!returnSlip) return;

    setIsCancelling(true);
    try {
      await api.delete(`/return-slips/${returnSlipId}/cancel`);
      toast.success("Hủy giao dịch trả thành công");
      queryClient.invalidateQueries({
        queryKey: ["return-slip", returnSlipId],
      });
      queryClient.invalidateQueries({ queryKey: ["return-slips"] });
      queryClient.invalidateQueries({ queryKey: ["loan-slips"] });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể hủy giao dịch trả");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!returnSlip) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy thông tin giao dịch trả
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/return")}
            >
              Quay lại danh sách
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusLabels[returnSlip.status] || {
    label: "Không xác định",
    variant: "secondary" as const,
  };

  const canEdit = returnSlip.status === EReturnSlipStatus.RETURNED;
  const canCancel = returnSlip.status === EReturnSlipStatus.RETURNED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/return")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Chi Tiết Giao Dịch Trả</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground font-mono">{returnSlip.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => router.push(`/return/${returnSlipId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Sửa thông tin
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Hủy giao dịch
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông Tin Chung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Mã Giao Dịch Trả</p>
              <p className="font-mono font-medium">{returnSlip.code}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Mã Giao Dịch Mượn</p>
              <p className="font-mono font-medium">
                {returnSlip.loanSlip?.code || "N/A"}
              </p>
              {returnSlip.loanSlip?.status && (
                <p className="text-muted-foreground text-xs">
                  ({loanSlipStatusLabels[returnSlip.loanSlip.status] || "N/A"})
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                Người Trả Thiết Bị
              </p>
              <p className="font-medium">
                {returnSlip.returner?.user?.name || "N/A"}
              </p>
              {returnSlip.returner?.user?.email && (
                <p className="text-muted-foreground text-xs">
                  {returnSlip.returner.user.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ngày Trả</p>
              <p className="font-medium">
                {dayjs(returnSlip.returnDate).format("DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Trạng Thái</p>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ngày Giờ Cập Nhật</p>
              <p className="font-medium">
                {dayjs(returnSlip.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
          </div>

          {returnSlip.note && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-muted-foreground text-sm">Ghi Chú</p>
                <p className="mt-1">{returnSlip.note}</p>
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Người Tạo</p>
              <p className="font-medium">
                {returnSlip.createdByUser?.name || "N/A"}
              </p>
              <p className="text-muted-foreground text-xs">
                {dayjs(returnSlip.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
            {returnSlip.modifiedByUser && (
              <div>
                <p className="text-muted-foreground text-sm">
                  Người Cập Nhật Cuối
                </p>
                <p className="font-medium">{returnSlip.modifiedByUser.name}</p>
                <p className="text-muted-foreground text-xs">
                  {dayjs(returnSlip.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh Sách Thiết Bị Đã Trả ({returnSlip.details?.length || 0} thiết
            bị)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {returnSlip.details && returnSlip.details.length > 0 ? (
            <div className="space-y-3">
              {returnSlip.details.map((detail, index) => (
                <div
                  key={detail.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Mã Thiết Bị
                      </p>
                      <p className="font-mono text-sm">
                        {detail.device?.serial ||
                          detail.device?.id?.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Tên Thiết Bị
                      </p>
                      <p className="text-sm font-medium">
                        {detail.device?.deviceName}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Model</p>
                      <p className="text-sm">{detail.device?.model || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Loại Thiết Bị
                      </p>
                      <p className="text-sm">
                        {detail.device?.deviceType?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  {detail.note && (
                    <div className="text-muted-foreground text-sm">
                      Ghi chú: {detail.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              Không có thông tin thiết bị
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
