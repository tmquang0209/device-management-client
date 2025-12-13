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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/shared/data/api";
import {
  EReturnSlipStatus,
  IPartner,
  IResponse,
  IReturnSlip,
} from "@/shared/interfaces";
import {
  UpdateReturnSlipFormValues,
  updateReturnSlipSchema,
} from "@/shared/schema/admin/return-slip.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditReturnSlipPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnSlipId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<UpdateReturnSlipFormValues>({
    resolver: zodResolver(updateReturnSlipSchema),
    defaultValues: {
      returnerId: "",
      note: "",
    },
  });

  // Fetch return slip details
  const {
    data: returnSlip,
    isLoading: returnSlipLoading,
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

  // Fetch partners for returner selection
  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async (): Promise<IPartner[]> => {
      const response = await api.get<IResponse<IPartner[]>>("/partners");
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
  });

  // Set form values when return slip is loaded
  useEffect(() => {
    if (returnSlip) {
      form.reset({
        returnerId: returnSlip.returnerId,
        note: returnSlip.note || "",
      });
    }
  }, [returnSlip, form]);

  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin giao dịch trả";
      toast.error(errorMessage);
    }
  }, [error]);

  const onSubmit = async (data: UpdateReturnSlipFormValues) => {
    setIsSubmitting(true);
    try {
      await api.put<IResponse<IReturnSlip>>(
        `/return-slips/${returnSlipId}`,
        data,
      );
      toast.success("Cập nhật giao dịch trả thành công");
      queryClient.invalidateQueries({
        queryKey: ["return-slip", returnSlipId],
      });
      queryClient.invalidateQueries({ queryKey: ["return-slips"] });
      router.push(`/return/${returnSlipId}`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể cập nhật giao dịch trả");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || returnSlipLoading) {
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

  // Check if can edit
  if (returnSlip.status === EReturnSlipStatus.CANCELLED) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Không thể sửa giao dịch trả đã bị hủy
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/return/${returnSlipId}`)}
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
          onClick={() => router.push(`/return/${returnSlipId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sửa Thông Tin Giao Dịch Trả</h1>
          <p className="text-muted-foreground font-mono">{returnSlip.code}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Editable Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Người Trả</CardTitle>
              <p className="text-muted-foreground text-sm">
                Chỉ có thể sửa thông tin liên quan đến người trả thiết bị
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Returner Selection */}
              <FormField
                control={form.control}
                name="returnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người Trả Thiết Bị *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={partnersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn người trả thiết bị" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partners?.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.user?.name || `Partner ${partner.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Note */}
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

          {/* Read-only Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Giao Dịch (Không thể sửa)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Mã Giao Dịch Trả
                  </p>
                  <p className="font-mono font-medium">{returnSlip.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Mã Giao Dịch Mượn
                  </p>
                  <p className="font-mono font-medium">
                    {returnSlip.loanSlip?.code || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Số Thiết Bị Đã Trả
                  </p>
                  <p className="font-medium">
                    {returnSlip.details?.length || 0} thiết bị
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/return/${returnSlipId}`)}
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
