"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  IPaginatedResponse,
  IPartner,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LoanSlipDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
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
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddDevice = () => {
    if (!selectedDeviceId) {
      toast.error("Vui lòng chọn thiết bị");
      return;
    }

    const device = availableDevices.find((d) => d.id === selectedDeviceId);
    if (!device) return;

    // Check if device already added
    if (devices.some((d) => d.deviceId === selectedDeviceId)) {
      toast.error("Thiết bị đã được thêm vào danh sách");
      return;
    }

    setDevices([
      ...devices,
      {
        id: `temp-${Date.now()}`,
        deviceId: device.id,
        deviceName: device.deviceName,
        deviceType: device.deviceType?.deviceTypeName || "N/A",
      },
    ]);
    setSelectedDeviceId("");
  };

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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Danh sách thiết bị</h3>
            <div className="flex items-center gap-2">
              <Select
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices
                    .filter(
                      (d) => !devices.some((dev) => dev.deviceId === d.id),
                    )
                    .map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.deviceName} - {device.serial || "N/A"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddDevice}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Mã thiết bị</TableHead>
                  <TableHead>Tên thiết bị</TableHead>
                  <TableHead>Loại thiết bị</TableHead>
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
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {device.deviceId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell>{device.deviceType}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
    </Card>
  );
}
