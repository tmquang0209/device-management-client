"use client";

import { AsyncSelect, AsyncSelectOption } from "@/components/ui/async-select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { IDevice, IResponse } from "@/shared/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Minus, MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MaintenanceSlipDevice {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  deviceTypeId: string;
}

interface DeviceTypeFilter {
  id: string;
  deviceTypeId: string;
  deviceTypeName: string;
  quantity: number;
}

export default function CreateMaintenanceSlipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: "",
    reason: "",
    requestDate: "",
  });
  const [selectedPartner, setSelectedPartner] =
    useState<AsyncSelectOption | null>(null);
  const [devices, setDevices] = useState<MaintenanceSlipDevice[]>([]);
  const [deviceTypeFilters, setDeviceTypeFilters] = useState<
    DeviceTypeFilter[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [deviceToSwap, setDeviceToSwap] =
    useState<MaintenanceSlipDevice | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<IDevice[]>([]);
  const [loadingSwapCandidates, setLoadingSwapCandidates] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mutation to fetch available devices for maintenance by type
  const fetchAvailableDevicesMutation = useMutation({
    mutationFn: async (params: { deviceTypeId: string; quantity: number }) => {
      const response = await api.get<IResponse<IDevice[]>>(
        "/devices/available-for-loan",
        {
          params: {
            deviceTypeId: params.deviceTypeId,
            quantity: params.quantity,
          },
        },
      );
      return response.data || [];
    },
  });

  // Fetch devices from API when filters change
  const fetchDevicesFromFilters = async () => {
    if (deviceTypeFilters.length === 0) {
      setDevices([]);
      return;
    }

    const validFilters = deviceTypeFilters.filter((f) => f.deviceTypeId);
    if (validFilters.length === 0) {
      setDevices([]);
      return;
    }

    try {
      const results = await Promise.all(
        validFilters.map((filter) =>
          fetchAvailableDevicesMutation.mutateAsync({
            deviceTypeId: filter.deviceTypeId,
            quantity: filter.quantity,
          }),
        ),
      );

      const allDevices: MaintenanceSlipDevice[] = [];
      const usedDeviceIds = new Set<string>();

      results.forEach((deviceList) => {
        deviceList.forEach((device) => {
          if (!usedDeviceIds.has(device.id)) {
            usedDeviceIds.add(device.id);
            allDevices.push({
              id: `temp-${device.id}`,
              deviceId: device.id,
              deviceCode: device.serial || device.id.slice(0, 8),
              deviceName: device.deviceName,
              deviceType: device.deviceType?.deviceTypeName || "N/A",
              deviceTypeId: device.deviceType?.id || "",
            });
          }
        });
      });

      setDevices(allDevices);
    } catch (error) {
      console.error("Failed to fetch available devices:", error);
      toast.error("Không thể lấy danh sách thiết bị");
    }
  };

  // Add new device type filter row
  const handleAddDeviceTypeFilter = () => {
    setDeviceTypeFilters([
      ...deviceTypeFilters,
      {
        id: `filter-${Date.now()}`,
        deviceTypeId: "",
        deviceTypeName: "",
        quantity: 1,
      },
    ]);
  };

  // Remove device type filter row
  const handleRemoveDeviceTypeFilter = (id: string) => {
    setDeviceTypeFilters(deviceTypeFilters.filter((f) => f.id !== id));
  };

  // Update device type filter
  const handleUpdateDeviceTypeFilter = (
    id: string,
    field: "deviceTypeId" | "quantity" | "deviceTypeName",
    value: string | number,
  ) => {
    setDeviceTypeFilters(
      deviceTypeFilters.map((f) =>
        f.id === id ? { ...f, [field]: value } : f,
      ),
    );
  };

  // Handle device type selection from AsyncSelect
  const handleDeviceTypeChange = (
    filterId: string,
    option: AsyncSelectOption | null,
  ) => {
    setDeviceTypeFilters(
      deviceTypeFilters.map((f) =>
        f.id === filterId
          ? {
              ...f,
              deviceTypeId: option ? String(option.value) : "",
              deviceTypeName: option ? option.label : "",
            }
          : f,
      ),
    );
  };

  // Handle swap device - fetch candidates from API
  const handleOpenSwapDialog = async (device: MaintenanceSlipDevice) => {
    setDeviceToSwap(device);
    setSwapDialogOpen(true);
    setLoadingSwapCandidates(true);

    try {
      if (device.deviceTypeId) {
        const response = await api.get<IResponse<IDevice[]>>(
          "/devices/available-for-loan",
          {
            params: {
              deviceTypeId: device.deviceTypeId,
              quantity: 100,
            },
          },
        );

        const candidates = (response.data || []).filter(
          (d) =>
            d.id !== device.deviceId &&
            !devices.some((selected) => selected.deviceId === d.id),
        );
        setSwapCandidates(candidates);
      } else {
        setSwapCandidates([]);
      }
    } catch (error) {
      console.error("Failed to fetch swap candidates:", error);
      setSwapCandidates([]);
    } finally {
      setLoadingSwapCandidates(false);
    }
  };

  const handleSwapDevice = (newDeviceId: string) => {
    if (!deviceToSwap) return;

    const newDevice = swapCandidates.find((d) => d.id === newDeviceId);
    if (!newDevice) return;

    setDevices(
      devices.map((d) =>
        d.id === deviceToSwap.id
          ? {
              ...d,
              deviceId: newDevice.id,
              deviceCode: newDevice.serial || newDevice.id.slice(0, 8),
              deviceName: newDevice.deviceName,
              deviceType: newDevice.deviceType?.deviceTypeName || "N/A",
              deviceTypeId: newDevice.deviceType?.id || "",
            }
          : d,
      ),
    );

    setSwapDialogOpen(false);
    setDeviceToSwap(null);
    setSwapCandidates([]);
    toast.success("Đổi thiết bị thành công");
  };

  // Update devices when filters change
  useEffect(() => {
    fetchDevicesFromFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceTypeFilters]);

  const handleRemoveDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (devices.length === 0) {
      toast.error("Vui lòng thêm ít nhất một thiết bị");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/maintenance-slips", {
        partnerId: formData.partnerId || undefined,
        reason: formData.reason || undefined,
        requestDate: formData.requestDate || undefined,
        deviceIds: devices.map((d) => d.deviceId),
      });

      toast.success("Tạo phiếu bảo trì thành công");

      await queryClient.invalidateQueries({
        queryKey: ["maintenance-slips"],
        exact: false,
      });

      router.push("/maintenance-slip");
    } catch (error) {
      console.error("Failed to create maintenance slip:", error);
      const message =
        error instanceof Error && "response" in error
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).response?.data?.message
          : "Không thể tạo phiếu bảo trì";
      toast.error(message || "Không thể tạo phiếu bảo trì");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/maintenance-slip")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Giao dịch xuất bảo trì</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin giao dịch */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin giao dịch</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerId">Đối tượng bảo trì</Label>
              <AsyncSelect
                endpoint="/partners"
                transformKey={{ label: "user.name", value: "id" }}
                placeholder="Chọn đối tượng bảo trì"
                value={selectedPartner}
                onChange={(option) => {
                  setSelectedPartner(option);
                  setFormData({
                    ...formData,
                    partnerId: option ? String(option.value) : "",
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestDate">Ngày yêu cầu</Label>
              <Input
                id="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requestDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="reason">Lý do bảo trì</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Nhập lý do bảo trì"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Danh sách thiết bị */}
        <div className="space-y-4">
          {/* Header with title and count badge */}
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Danh sách thiết bị</h3>
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              Số lượng đã chọn: {devices.length}
            </Badge>
          </div>

          {/* Add device type button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDeviceTypeFilter}
            className="border-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Device type filters */}
          {deviceTypeFilters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-4">
              <div className="w-[250px]">
                <AsyncSelect
                  endpoint="/device-types"
                  transformKey={{ label: "deviceTypeName", value: "id" }}
                  placeholder="Loại thiết bị"
                  value={
                    filter.deviceTypeId
                      ? {
                          label: filter.deviceTypeName,
                          value: filter.deviceTypeId,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleDeviceTypeChange(filter.id, option)
                  }
                  size="sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Số lượng:</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={filter.quantity}
                  placeholder="Nhập số luợng thiết bị"
                  onChange={(e) =>
                    handleUpdateDeviceTypeFilter(
                      filter.id,
                      "quantity",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-36"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveDeviceTypeFilter(filter.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Device table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-16 font-semibold">STT</TableHead>
                  <TableHead className="font-semibold">Mã thiết bị</TableHead>
                  <TableHead className="font-semibold">Tên thiết bị</TableHead>
                  <TableHead className="font-semibold">Loại thiết bị</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500"
                    >
                      Chưa có thiết bị nào được thêm
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device, index) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium text-green-600">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-green-600">
                        {device.deviceCode}
                      </TableCell>
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell>{device.deviceType}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenSwapDialog(device)}
                            >
                              Đổi thiết bị
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveDevice(device.id)}
                              className="text-red-600"
                            >
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/maintenance-slip")}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>

      {/* Swap Device Dialog */}
      <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Đổi thiết bị</DialogTitle>
            <DialogDescription>
              Chọn thiết bị khác cùng loại để thay thế cho:{" "}
              <span className="font-semibold">{deviceToSwap?.deviceName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="font-semibold">Mã thiết bị</TableHead>
                  <TableHead className="font-semibold">Tên thiết bị</TableHead>
                  <TableHead className="font-semibold">Ngày nhập</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSwapCandidates ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600" />
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : swapCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500"
                    >
                      Không có thiết bị nào khác cùng loại
                    </TableCell>
                  </TableRow>
                ) : (
                  swapCandidates.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-sm text-green-600">
                        {device.serial || device.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {device.createdAt
                          ? new Date(device.createdAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSwapDevice(device.id)}
                        >
                          Chọn
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSwapDialogOpen(false);
                setDeviceToSwap(null);
                setSwapCandidates([]);
              }}
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
