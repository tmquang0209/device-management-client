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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { api } from "@/shared/data/api";
import {
  IDevice,
  IDeviceType,
  IPaginatedResponse,
  IPartner,
  IResponse,
} from "@/shared/interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Minus, MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LoanSlipDevice {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
}

interface DeviceTypeFilter {
  id: string;
  deviceTypeId: string;
  quantity: number;
}

export default function CreateLoanSlipPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    borrowerId: "",
    loanerId: "",
    actualReturnDate: "",
    note: "",
  });
  const [devices, setDevices] = useState<LoanSlipDevice[]>([]);
  const [deviceTypeFilters, setDeviceTypeFilters] = useState<
    DeviceTypeFilter[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [deviceToSwap, setDeviceToSwap] = useState<LoanSlipDevice | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<IDevice[]>([]);
  const [loadingSwapCandidates, setLoadingSwapCandidates] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch partners
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: async (): Promise<IPartner[]> => {
      const response = await api.get<IPaginatedResponse<IPartner>>("/partners");
      console.log("🚀 ~ CreateLoanSlipPage ~ response:", response);
      return response.data || [];
    },
    enabled: mounted,
  });

  // Fetch available devices
  const { data: availableDevices = [] } = useQuery({
    queryKey: ["devices-available"],
    queryFn: async (): Promise<IDevice[]> => {
      const response = await api.get<IResponse<IDevice[]>>("/devices", {
        params: { status: 1 },
      });
      return response.data || [];
    },
    enabled: mounted,
  });

  // Fetch device types
  const { data: deviceTypes = [] } = useQuery({
    queryKey: ["device-types"],
    queryFn: async (): Promise<IDeviceType[]> => {
      const response =
        await api.get<IPaginatedResponse<IDeviceType>>("/device-types");
      return response.data || [];
    },
    enabled: mounted,
  });

  // Mutation to fetch available devices for loan by type
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

      const allDevices: LoanSlipDevice[] = [];
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
    field: "deviceTypeId" | "quantity",
    value: string | number,
  ) => {
    setDeviceTypeFilters(
      deviceTypeFilters.map((f) =>
        f.id === id ? { ...f, [field]: value } : f,
      ),
    );
  };

  // Handle swap device - fetch candidates from API
  const handleOpenSwapDialog = async (device: LoanSlipDevice) => {
    setDeviceToSwap(device);
    setSwapDialogOpen(true);
    setLoadingSwapCandidates(true);

    try {
      // Find device type by device name
      const deviceType = deviceTypes.find(
        (dt) => dt.deviceTypeName === device.deviceType,
      );

      if (deviceType) {
        // Fetch many devices of same type for swap options
        const response = await api.get<IResponse<IDevice[]>>(
          "/devices/available-for-loan",
          {
            params: {
              deviceTypeId: deviceType.id,
              quantity: 100, // Get many devices for swap options
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
            }
          : d,
      ),
    );

    setSwapDialogOpen(false);
    setDeviceToSwap(null);
    setSwapCandidates([]);
    toast.success("Đổi thiết bị thành công");
  };

  // Update devices when filters change - call API
  useEffect(() => {
    fetchDevicesFromFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceTypeFilters]);

  const handleRemoveDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.borrowerId) {
      toast.error("Vui lòng chọn người mượn");
      return;
    }

    if (!formData.loanerId) {
      toast.error("Vui lòng chọn người cho mượn");
      return;
    }

    if (devices.length === 0) {
      toast.error("Vui lòng thêm ít nhất một thiết bị");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/loan-slips", {
        borrowerId: formData.borrowerId,
        loanerId: formData.loanerId,
        deviceIds: devices.map((d) => d.deviceId),
      });

      toast.success("Tạo phiếu mượn thành công");

      // Invalidate loan-slips query to refetch data when navigating back
      await queryClient.invalidateQueries({
        queryKey: ["loan-slips"],
        exact: false,
      });

      router.push("/loan-slip");
    } catch (error) {
      console.error("Failed to create loan slip:", error);
      const message =
        error instanceof Error && "response" in error
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).response?.data?.message
          : "Không thể tạo phiếu mượn";
      toast.error(message || "Không thể tạo phiếu mượn");
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
            onClick={() => router.push("/loan-slip")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Giao dịch mượn</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin giao dịch */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin giao dịch</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Mã giao dịch mượn *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Tự động tạo"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrowerId">Tên người mượn *</Label>
              <Select
                value={formData.borrowerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, borrowerId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn người mượn" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.user?.name || `Partner ${partner.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanerId">Người cho mượn *</Label>
              <Select
                value={formData.loanerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, loanerId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn người cho mượn" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.user?.name || `Partner ${partner.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualReturnDate">Ngày cập nhật</Label>
              <Input
                id="actualReturnDate"
                type="date"
                value={formData.actualReturnDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actualReturnDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Nhập ghi chú"
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
              <Select
                value={filter.deviceTypeId}
                onValueChange={(value) =>
                  handleUpdateDeviceTypeFilter(filter.id, "deviceTypeId", value)
                }
              >
                <SelectTrigger className="w-[200px] bg-gray-100 dark:bg-gray-700">
                  <SelectValue placeholder="Loại thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.deviceTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Số lượng:</span>
                <Input
                  type="number"
                  min={1}
                  max={
                    availableDevices.filter(
                      (d) => d.deviceType?.id === filter.deviceTypeId,
                    ).length || 10
                  }
                  value={filter.quantity}
                  onChange={(e) =>
                    handleUpdateDeviceTypeFilter(
                      filter.id,
                      "quantity",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="w-20 bg-gray-100 dark:bg-gray-700"
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
            onClick={() => router.push("/loan-slip")}
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
