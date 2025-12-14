"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/shared/data/api";
import {
  EMaintenanceReturnSlipStatus,
  IMaintenanceReturnSlip,
  IResponse,
} from "@/shared/interfaces";
import {
  UpdateMaintenanceReturnSlipFormValues,
  updateMaintenanceReturnSlipSchema,
} from "@/shared/schema/admin/maintenance-return-slip.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditMaintenanceReturnSlipPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slipId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<UpdateMaintenanceReturnSlipFormValues>({
    resolver: zodResolver(updateMaintenanceReturnSlipSchema),
    defaultValues: {
      note: "",
    },
  });

  // Fetch slip details
  const {
    data: slip,
    isLoading: slipLoading,
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

  // Set form values when slip is loaded
  useEffect(() => {
    if (slip) {
      form.reset({
        note: slip.note || "",
      });
    }
  }, [slip, form]);

  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin phiếu nhận";
      toast.error(errorMessage);
    }
  }, [error]);

  const onSubmit = async (data: UpdateMaintenanceReturnSlipFormValues) => {
    setIsSubmitting(true);
    try {
      await api.put<IResponse<IMaintenanceReturnSlip>>(
        `/maintenance-return-slips/${slipId}`,
        data,
      );
      toast.success("Cập nhật phiếu nhận thành công");
      queryClient.invalidateQueries({
        queryKey: ["maintenance-return-slip", slipId],
      });
      queryClient.invalidateQueries({ queryKey: ["maintenance-return-slips"] });
      router.push(`/maintenance-slip/return/${slipId}`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể cập nhật phiếu nhận");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || slipLoading) {
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

  // Check if can edit
  if (slip.status === EMaintenanceReturnSlipStatus.CANCELLED) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Không thể sửa phiếu nhận đã bị hủy
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/maintenance-slip/return/${slipId}`)}
            >
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/maintenance-slip/return/${slipId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sửa Thông Tin Phiếu Nhận</h1>
          <p className="text-muted-foreground font-mono">{slip.code}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã Phiếu Nhận</label>
                  <p className="font-mono text-sm">{slip.code}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Mã Phiếu Bảo Trì
                  </label>
                  <p className="font-mono text-sm">
                    {slip.maintenanceSlip?.code || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đối Tác Bảo Trì</label>
                  <p className="text-sm">
                    {slip.maintenanceSlip?.partner?.user?.name || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày Nhận</label>
                  <p className="text-sm">
                    {dayjs(slip.createdAt).format("DD/MM/YYYY")}
                  </p>
                </div>
              </div>

              {/* Note - Editable */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi Chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập ghi chú (nếu có)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Device List - Read only */}
          <Card>
            <CardHeader>
              <CardTitle>
                Danh Sách Thiết Bị (
                {slip.maintenanceReturnSlipDetails?.length || 0} thiết bị)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slip.maintenanceReturnSlipDetails &&
              slip.maintenanceReturnSlipDetails.length > 0 ? (
                <div className="space-y-3">
                  {slip.maintenanceReturnSlipDetails.map((detail, index) => (
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

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/maintenance-slip/return/${slipId}`)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu Thay Đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
