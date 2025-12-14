"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  IAvailableDeviceForReturn,
  ILoanSlip,
  IPartner,
  IResponse,
  IReturnSlip,
} from "@/shared/interfaces";
import {
  CreateReturnSlipFormValues,
  createReturnSlipSchema,
} from "@/shared/schema/admin/return-slip.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateReturnSlipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedLoanSlipId, setSelectedLoanSlipId] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<CreateReturnSlipFormValues>({
    resolver: zodResolver(createReturnSlipSchema),
    defaultValues: {
      loanSlipId: "",
      returnerId: "",
      returnDate: dayjs().format("YYYY-MM-DD"),
      note: "",
      devices: [],
    },
  });

  // Fetch available loan slips (BORROWING or PARTIAL_RETURNED status)
  const { data: availableLoanSlips, isLoading: loanSlipsLoading } = useQuery({
    queryKey: ["available-loan-slips"],
    queryFn: async (): Promise<ILoanSlip[]> => {
      const response = await api.get<IResponse<ILoanSlip[]>>(
        "/return-slips/available/loan-slips",
      );
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 60 * 1000,
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

  // Fetch available devices for return when loan slip is selected
  const { data: availableDevices, isLoading: devicesLoading } = useQuery({
    queryKey: ["available-devices-for-return", selectedLoanSlipId],
    queryFn: async (): Promise<IAvailableDeviceForReturn[]> => {
      if (!selectedLoanSlipId) return [];
      const response = await api.get<IResponse<IAvailableDeviceForReturn[]>>(
        `/return-slips/available/devices/${selectedLoanSlipId}`,
      );
      return response.data || [];
    },
    enabled: mounted && !!selectedLoanSlipId,
    staleTime: 30 * 1000,
  });

  // Reset selected devices when loan slip changes
  useEffect(() => {
    setSelectedDevices([]);
    form.setValue("devices", []);
  }, [selectedLoanSlipId, form]);

  // Update form devices when selection changes
  useEffect(() => {
    const deviceItems = selectedDevices.map((deviceId) => ({
      deviceId,
      note: "",
    }));
    form.setValue("devices", deviceItems);
  }, [selectedDevices, form]);

  const handleLoanSlipChange = (loanSlipId: string) => {
    setSelectedLoanSlipId(loanSlipId);
    form.setValue("loanSlipId", loanSlipId);
  };

  const handleDeviceToggle = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices((prev) => [...prev, deviceId]);
    } else {
      setSelectedDevices((prev) => prev.filter((id) => id !== deviceId));
    }
  };

  const handleSelectAll = () => {
    if (availableDevices) {
      const allDeviceIds = availableDevices.map((d) => d.deviceId);
      setSelectedDevices(allDeviceIds);
    }
  };

  const handleDeselectAll = () => {
    setSelectedDevices([]);
  };

  const onSubmit = async (data: CreateReturnSlipFormValues) => {
    if (data.devices.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thiết bị để trả");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post<IResponse<IReturnSlip>>("/return-slips", data);
      toast.success("Tạo giao dịch trả thành công");
      queryClient.invalidateQueries({ queryKey: ["return-slips"] });
      queryClient.invalidateQueries({ queryKey: ["loan-slips"] });
      router.push("/return");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể tạo giao dịch trả");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedLoanSlip = availableLoanSlips?.find(
    (ls) => ls.id === selectedLoanSlipId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/return")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tạo Giao Dịch Trả Thiết Bị</h1>
          <p className="text-muted-foreground">
            Điền thông tin để tạo giao dịch trả thiết bị mới
          </p>
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
                {/* Generated Return Slip Code */}
                <div className="space-y-2">
                  <FormLabel>Mã Giao Dịch Trả</FormLabel>
                  <Input
                    value={`GDNT_${dayjs().format("DDMMYY")}_XXX`}
                    disabled
                    className="font-mono"
                  />
                </div>

                {/* Loan Slip Selection */}
                <FormField
                  control={form.control}
                  name="loanSlipId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã Giao Dịch Mượn *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleLoanSlipChange(value);
                        }}
                        value={field.value}
                        disabled={loanSlipsLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn mã giao dịch mượn" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLoanSlips?.map((loanSlip) => (
                            <SelectItem key={loanSlip.id} value={loanSlip.id}>
                              {loanSlip.code} -{" "}
                              {loanSlip.borrower?.user?.name || "N/A"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectTrigger className="w-full">
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

                {/* Return Date */}
                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày Trả *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Update Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ngày Giờ Cập Nhật
                  </label>
                  <Input
                    value={dayjs().format("DD/MM/YYYY HH:mm:ss")}
                    disabled
                  />
                </div>
              </div>

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

          {/* Loan Slip Info (if selected) */}
          {selectedLoanSlip && (
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Phiếu Mượn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Mã Phiếu Mượn
                    </p>
                    <p className="font-mono font-medium">
                      {selectedLoanSlip.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Người Mượn</p>
                    <p className="font-medium">
                      {selectedLoanSlip.borrower?.user?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Người Cho Mượn
                    </p>
                    <p className="font-medium">
                      {selectedLoanSlip.createdByUser?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Thông Tin Thiết Bị</CardTitle>
              {availableDevices && availableDevices.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Chọn tất cả
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Bỏ chọn tất cả
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedLoanSlipId ? (
                <p className="text-muted-foreground py-8 text-center">
                  Vui lòng chọn mã giao dịch mượn để hiển thị danh sách thiết bị
                </p>
              ) : devicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải danh sách thiết bị...</span>
                </div>
              ) : availableDevices && availableDevices.length > 0 ? (
                <div className="space-y-3">
                  {availableDevices.map((item) => (
                    <div
                      key={item.id}
                      className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4"
                    >
                      <Checkbox
                        id={item.deviceId}
                        checked={selectedDevices.includes(item.deviceId)}
                        onCheckedChange={(checked) =>
                          handleDeviceToggle(item.deviceId, checked as boolean)
                        }
                      />
                      <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-4">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Mã Thiết Bị
                          </p>
                          <p className="font-mono text-sm">
                            {item.device?.serial ||
                              item.device?.id?.slice(0, 8)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Tên Thiết Bị
                          </p>
                          <p className="text-sm font-medium">
                            {item.device?.deviceName}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Model</p>
                          <p className="text-sm">
                            {item.device?.model || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Loại Thiết Bị
                          </p>
                          <p className="text-sm">
                            {item.device?.deviceType?.deviceTypeName || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-muted-foreground mt-4 text-sm">
                    Đã chọn: {selectedDevices.length} /{" "}
                    {availableDevices.length} thiết bị
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  Không có thiết bị nào cần trả trong giao dịch mượn này
                </p>
              )}

              {form.formState.errors.devices && (
                <p className="text-destructive mt-2 text-sm">
                  {form.formState.errors.devices.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/return")}
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
                  Lưu Giao Dịch
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
