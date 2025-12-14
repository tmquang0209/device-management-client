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
  EMaintenanceSlipDetailStatus,
  IAvailableDeviceForMaintenanceReturn,
  IAvailableMaintenanceSlip,
  IMaintenanceReturnSlip,
  IParamInfo,
  IResponse,
} from "@/shared/interfaces";
import {
  CreateMaintenanceReturnSlipFormValues,
  createMaintenanceReturnSlipSchema,
} from "@/shared/schema/admin/maintenance-return-slip.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface DeviceSelection {
  deviceId: string;
  status: EMaintenanceSlipDetailStatus;
  note: string;
  selected: boolean;
}

export default function CreateMaintenanceReturnSlipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceSelections, setDeviceSelections] = useState<DeviceSelection[]>(
    [],
  );
  const [selectedMaintenanceSlipId, setSelectedMaintenanceSlipId] =
    useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<CreateMaintenanceReturnSlipFormValues>({
    resolver: zodResolver(createMaintenanceReturnSlipSchema),
    defaultValues: {
      maintenanceSlipId: "",
      returnDate: dayjs().format("YYYY-MM-DD"),
      note: "",
      devices: [],
    },
  });

  // Fetch available maintenance slips (SENDING or PARTIAL_RETURNED status)
  const {
    data: availableMaintenanceSlips,
    isLoading: maintenanceSlipsLoading,
  } = useQuery({
    queryKey: ["available-maintenance-slips"],
    queryFn: async (): Promise<IAvailableMaintenanceSlip[]> => {
      const response = await api.get<IResponse<IAvailableMaintenanceSlip[]>>(
        "/maintenance-return-slips/available/maintenance-slips",
      );
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 60 * 1000,
  });

  // Fetch detail statuses from API
  const { data: detailStatusList } = useQuery({
    queryKey: ["maintenance-return-slip-detail-statuses"],
    queryFn: async (): Promise<IParamInfo[]> => {
      const response = await api.get<IResponse<IParamInfo[]>>(
        "/maintenance-return-slips/detail-statuses",
      );
      return response.data || [];
    },
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
  });

  // Build detail status options from API data
  const detailStatusOptions = useMemo(() => {
    if (!detailStatusList || detailStatusList.length === 0) {
      return [
        { code: "2", value: "✅ Đã sửa xong" },
        { code: "3", value: "❌ Không sửa được" },
      ];
    }
    return detailStatusList.map((status) => ({
      code: status.code,
      value:
        status.code === "2"
          ? `✅ ${status.value}`
          : status.code === "3"
            ? `❌ ${status.value}`
            : status.value,
    }));
  }, [detailStatusList]);

  // Fetch available devices for return when maintenance slip is selected
  const { data: availableDevices, isLoading: devicesLoading } = useQuery({
    queryKey: [
      "available-devices-for-maintenance-return",
      selectedMaintenanceSlipId,
    ],
    queryFn: async (): Promise<IAvailableDeviceForMaintenanceReturn[]> => {
      if (!selectedMaintenanceSlipId) return [];
      const response = await api.get<
        IResponse<IAvailableDeviceForMaintenanceReturn[]>
      >(
        `/maintenance-return-slips/available/devices/${selectedMaintenanceSlipId}`,
      );
      return response.data || [];
    },
    enabled: mounted && !!selectedMaintenanceSlipId,
    staleTime: 30 * 1000,
  });

  // Reset device selections when maintenance slip changes
  useEffect(() => {
    if (availableDevices) {
      setDeviceSelections(
        availableDevices.map((d) => ({
          deviceId: d.deviceId,
          status: EMaintenanceSlipDetailStatus.RETURNED, // Default: Đã sửa
          note: "",
          selected: false,
        })),
      );
    } else {
      setDeviceSelections([]);
    }
    form.setValue("devices", []);
  }, [availableDevices, form]);

  // Update form devices when selection changes
  useEffect(() => {
    const selectedDevices = deviceSelections
      .filter((d) => d.selected)
      .map((d) => ({
        deviceId: d.deviceId,
        status: d.status,
        note: d.note,
      }));
    form.setValue("devices", selectedDevices);
  }, [deviceSelections, form]);

  const handleMaintenanceSlipChange = (maintenanceSlipId: string) => {
    setSelectedMaintenanceSlipId(maintenanceSlipId);
    form.setValue("maintenanceSlipId", maintenanceSlipId);
  };

  const handleDeviceToggle = (deviceId: string, checked: boolean) => {
    setDeviceSelections((prev) =>
      prev.map((d) =>
        d.deviceId === deviceId ? { ...d, selected: checked } : d,
      ),
    );
  };

  const handleDeviceStatusChange = (
    deviceId: string,
    status: EMaintenanceSlipDetailStatus,
  ) => {
    setDeviceSelections((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, status } : d)),
    );
  };

  const handleDeviceNoteChange = (deviceId: string, note: string) => {
    setDeviceSelections((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, note } : d)),
    );
  };

  const handleSelectAll = () => {
    setDeviceSelections((prev) => prev.map((d) => ({ ...d, selected: true })));
  };

  const handleDeselectAll = () => {
    setDeviceSelections((prev) => prev.map((d) => ({ ...d, selected: false })));
  };

  const onSubmit = async (data: CreateMaintenanceReturnSlipFormValues) => {
    if (data.devices.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thiết bị để nhận");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post<IResponse<IMaintenanceReturnSlip>>(
        "/maintenance-return-slips",
        data,
      );
      toast.success("Tạo phiếu nhận thiết bị thành công");
      queryClient.invalidateQueries({
        queryKey: ["maintenance-return-slips"],
      });
      queryClient.invalidateQueries({ queryKey: ["maintenance-slips"] });
      router.push("/maintenance-slip/return");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Không thể tạo phiếu nhận thiết bị");
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

  const selectedMaintenanceSlip = availableMaintenanceSlips?.find(
    (ms) => ms.id === selectedMaintenanceSlipId,
  );

  const selectedDevicesCount = deviceSelections.filter(
    (d) => d.selected,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/maintenance-slip/return")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Tạo Phiếu Nhận Thiết Bị Từ Bảo Trì
          </h1>
          <p className="text-muted-foreground">
            Điền thông tin để tạo phiếu nhận thiết bị từ bảo trì mới
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
                {/* Generated Code */}
                <div className="space-y-2">
                  <FormLabel>Mã Phiếu Nhận</FormLabel>
                  <Input
                    value={`GDNBT_${dayjs().format("DDMMYY")}_XXX`}
                    disabled
                    className="font-mono"
                  />
                </div>

                {/* Maintenance Slip Selection */}
                <FormField
                  control={form.control}
                  name="maintenanceSlipId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phiếu Bảo Trì *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleMaintenanceSlipChange(value);
                        }}
                        value={field.value}
                        disabled={maintenanceSlipsLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn phiếu bảo trì" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableMaintenanceSlips?.map((slip) => (
                            <SelectItem key={slip.id} value={slip.id}>
                              {slip.code} - {slip.partner?.user?.name || "N/A"}
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
                      <FormLabel>Ngày Nhận *</FormLabel>
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

          {/* Maintenance Slip Info (if selected) */}
          {selectedMaintenanceSlip && (
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Phiếu Bảo Trì</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Mã Phiếu Bảo Trì
                    </p>
                    <p className="font-mono font-medium">
                      {selectedMaintenanceSlip.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Người yêu cầu
                    </p>
                    <p className="font-medium">
                      {selectedMaintenanceSlip?.createdByUser?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Đối Tác Bảo Trì
                    </p>
                    <p className="font-medium">
                      {selectedMaintenanceSlip.partner?.user?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Ngày Gửi</p>
                    <p className="font-medium">
                      {dayjs(selectedMaintenanceSlip.createdAt).format(
                        "DD/MM/YYYY",
                      )}
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
              {!selectedMaintenanceSlipId ? (
                <p className="text-muted-foreground py-8 text-center">
                  Vui lòng chọn phiếu bảo trì để hiển thị danh sách thiết bị
                </p>
              ) : devicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải danh sách thiết bị...</span>
                </div>
              ) : availableDevices && availableDevices.length > 0 ? (
                <div className="space-y-3">
                  {availableDevices.map((item, index) => {
                    const selection = deviceSelections[index];
                    return (
                      <div
                        key={item.id}
                        className="hover:bg-muted/50 rounded-lg border p-4"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            id={item.deviceId}
                            checked={selection?.selected || false}
                            onCheckedChange={(checked) =>
                              handleDeviceToggle(
                                item.deviceId,
                                checked as boolean,
                              )
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
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
                                <p className="text-muted-foreground text-xs">
                                  Model
                                </p>
                                <p className="text-sm">
                                  {item.device?.model || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Loại Thiết Bị
                                </p>
                                <p className="text-sm">
                                  {item.device?.deviceType?.deviceTypeName ||
                                    "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Status and Note (only show when selected) */}
                            {selection?.selected && (
                              <div className="grid grid-cols-1 gap-4 border-t pt-3 md:grid-cols-2">
                                <div>
                                  <label className="text-muted-foreground mb-1 block text-xs">
                                    Trạng Thái Sau Bảo Trì *
                                  </label>
                                  <Select
                                    value={selection.status.toString()}
                                    onValueChange={(value) =>
                                      handleDeviceStatusChange(
                                        item.deviceId,
                                        parseInt(
                                          value,
                                        ) as EMaintenanceSlipDetailStatus,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {detailStatusOptions.map((option) => (
                                        <SelectItem
                                          key={option.code}
                                          value={option.code}
                                        >
                                          {option.value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-muted-foreground mb-1 block text-xs">
                                    Ghi Chú Thiết Bị
                                  </label>
                                  <Input
                                    placeholder="Nhập ghi chú..."
                                    value={selection.note}
                                    onChange={(e) =>
                                      handleDeviceNoteChange(
                                        item.deviceId,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-muted-foreground mt-4 text-sm">
                    Đã chọn: {selectedDevicesCount} / {availableDevices.length}{" "}
                    thiết bị
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  Không có thiết bị nào cần nhận trong phiếu bảo trì này
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
              onClick={() => router.push("/maintenance-slip/return")}
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
                  Lưu Phiếu Nhận
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
