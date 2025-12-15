"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/shared/data/api";
import {
  EMaintenanceReturnSlipStatus,
  IMaintenanceReturnSlip,
  IParamInfo,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Loader2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const defaultStatusLabels: Record<
  number,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "secondary";
  }
> = {
  [EMaintenanceReturnSlipStatus.RETURNED]: {
    label: "Đã nhập kho",
    variant: "success",
  },
  [EMaintenanceReturnSlipStatus.CANCELLED]: {
    label: "Đã hủy",
    variant: "destructive",
  },
};

const getStatusVariant = (
  code: string,
): "default" | "success" | "destructive" | "secondary" => {
  switch (code) {
    case "1":
      return "success";
    case "2":
      return "destructive";
    default:
      return "default";
  }
};

const maintenanceSlipStatusLabels: Record<number, string> = {
  1: "Đang Gửi Bảo Trì",
  2: "Đã Đóng",
  3: "Đã Hủy",
  4: "Chưa Hoàn Tất Nhận",
};

export default function MaintenanceReturnSlipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const slipId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch statuses from API
  const { data: statusList } = useQuery({
    queryKey: ["maintenance-return-slip-statuses"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/maintenance-return-slips/statuses",
      );
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
  });

  // Build status labels from API data
  const statusLabels = useMemo(() => {
    if (!statusList || statusList.length === 0) {
      return defaultStatusLabels;
    }
    const labels: Record<
      number,
      {
        label: string;
        variant: "default" | "success" | "destructive" | "secondary";
      }
    > = {};
    statusList.forEach((status) => {
      labels[parseInt(status.code)] = {
        label: status.value,
        variant: getStatusVariant(status.code),
      };
    });
    return labels;
  }, [statusList]);

  const {
    data: slip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["maintenance-return-slip", slipId],
    queryFn: async (): Promise<IMaintenanceReturnSlip> => {
      const response = await api.get<IResponse<IMaintenanceReturnSlip>>(
        `/maintenance-return-slips/${slipId}`,
      );
      return response.data;
    },
    enabled: mounted && !!slipId,
  });

  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin phiếu nhận";
      toast.error(errorMessage);
    }
  }, [error]);

  const handleCancel = async () => {
    if (!slip) return;

    setIsCancelling(true);
    try {
      await api.delete(`/maintenance-return-slips/${slipId}/cancel`);
      toast.success("Hủy phiếu nhận thành công");
      queryClient.invalidateQueries({
        queryKey: ["maintenance-return-slip", slipId],
      });
      queryClient.invalidateQueries({ queryKey: ["maintenance-return-slips"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-slips"] });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể hủy phiếu nhận");
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

  if (!slip) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy thông tin phiếu nhận
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/maintenance-slip/return")}
            >
              Quay lại danh sách
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusLabels[slip.status] || {
    label: "Không xác định",
    variant: "secondary" as const,
  };

  const canEdit = slip.status === EMaintenanceReturnSlipStatus.RETURNED;
  const canCancel = slip.status === EMaintenanceReturnSlipStatus.RETURNED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/maintenance-slip/return")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Chi Tiết Phiếu Nhận Từ Bảo Trì
              </h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground font-mono">{slip.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/maintenance-slip/return/${slipId}/edit`)
              }
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
                  Hủy phiếu nhận
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
              <p className="text-muted-foreground text-sm">Mã Phiếu Nhận</p>
              <p className="font-mono font-medium">{slip.code}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Mã Phiếu Bảo Trì</p>
              <p className="font-mono font-medium">
                {slip.maintenanceSlip?.code || "N/A"}
              </p>
              {slip.maintenanceSlip?.status && (
                <p className="text-muted-foreground text-xs">
                  (
                  {maintenanceSlipStatusLabels[slip.maintenanceSlip.status] ||
                    "N/A"}
                  )
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Đối tượng bảo trì</p>
              <p className="font-medium">
                {slip.maintenanceSlip?.partner?.user?.name || "N/A"}
              </p>
              {slip.maintenanceSlip?.partner?.user?.email && (
                <p className="text-muted-foreground text-xs">
                  {slip.maintenanceSlip.partner.user.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ngày Nhận</p>
              <p className="font-medium">
                {dayjs(slip.createdAt).format("DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Trạng Thái</p>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ngày Giờ Cập Nhật</p>
              <p className="font-medium">
                {dayjs(slip.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
          </div>

          {slip.note && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-muted-foreground text-sm">Ghi Chú</p>
                <p className="mt-1">{slip.note}</p>
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Người Tạo</p>
              <p className="font-medium">{slip.creator?.name || "N/A"}</p>
              <p className="text-muted-foreground text-xs">
                {dayjs(slip.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
            {slip.updater && (
              <div>
                <p className="text-muted-foreground text-sm">
                  Người Cập Nhật Cuối
                </p>
                <p className="font-medium">{slip.updater.name}</p>
                <p className="text-muted-foreground text-xs">
                  {dayjs(slip.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
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
            Danh Sách Thiết Bị Đã Nhận (
            {slip.maintenanceReturnSlipDetails?.length || 0} thiết bị)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slip.maintenanceReturnSlipDetails &&
          slip.maintenanceReturnSlipDetails.length > 0 ? (
            <div className="space-y-3">
              {slip.maintenanceReturnSlipDetails.map((detail, index) => (
                <div key={detail.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
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
                          <p className="text-sm">
                            {detail.device?.model || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Loại Thiết Bị
                          </p>
                          <p className="text-sm">
                            {detail.device?.deviceType?.deviceTypeName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Tình Trạng
                          </p>
                          {/* We don't have status in detail, show note instead */}
                          <p className="text-sm">
                            {detail.note || "Không có ghi chú"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
