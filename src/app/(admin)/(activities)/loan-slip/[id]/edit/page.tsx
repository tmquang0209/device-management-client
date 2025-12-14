"use client";

import { AsyncSelect, AsyncSelectOption } from "@/components/ui/async-select";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/shared/data/api";
import {
  ELoanSlipStatus,
  ILoanSlip,
  ILoanSlipDetail,
  IResponse,
} from "@/shared/interfaces";
import {
  UpdateLoanSlipFormValues,
  updateLoanSlipSchema,
} from "@/shared/schema/admin/loan-slip.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Status constants for loan slip details
const BORROWED_STATUS = 1;

interface DeviceDisplay {
  id: string;
  deviceId: string;
  deviceName: string;
  serial?: string;
  model?: string;
  deviceTypeName?: string;
  status: number;
}

export default function EditLoanSlipPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devices, setDevices] = useState<DeviceDisplay[]>([]);
  const [borrowerValue, setBorrowerValue] = useState<AsyncSelectOption | null>(
    null,
  );

  const loanSlipId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<UpdateLoanSlipFormValues>({
    resolver: zodResolver(updateLoanSlipSchema),
    defaultValues: {
      borrowerId: "",
    },
  });

  // Fetch loan slip details
  const {
    data: loanSlip,
    isLoading: loanSlipLoading,
    error,
  } = useQuery({
    queryKey: ["loan-slip", loanSlipId],
    queryFn: async (): Promise<ILoanSlip> => {
      const response = await api.get<IResponse<ILoanSlip>>(
        `/loan-slips/${loanSlipId}`,
      );
      return response.data as ILoanSlip;
    },
    enabled: mounted && !!loanSlipId,
  });

  // Set form values and devices when loan slip is loaded
  useEffect(() => {
    if (loanSlip) {
      const deviceList: DeviceDisplay[] = (loanSlip.details || []).map(
        (detail: ILoanSlipDetail) => ({
          id: detail.id,
          deviceId: detail.deviceId,
          deviceName: detail.device?.deviceName || "N/A",
          serial: detail.device?.serial,
          model: detail.device?.model,
          deviceTypeName: detail.device?.deviceType?.deviceTypeName,
          status: detail.status,
        }),
      );

      setDevices(deviceList);

      // Set borrower value for async select
      if (loanSlip.borrower) {
        setBorrowerValue({
          label:
            loanSlip.borrower.user?.name || `Partner ${loanSlip.borrower.id}`,
          value: loanSlip.equipmentBorrowerId,
        });
      }

      form.reset({
        borrowerId: loanSlip.equipmentBorrowerId,
      });
    }
  }, [loanSlip, form]);

  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin phiếu mượn";
      toast.error(errorMessage);
    }
  }, [error]);

  const onSubmit = async (data: UpdateLoanSlipFormValues) => {
    setIsSubmitting(true);
    try {
      await api.put<IResponse<ILoanSlip>>(`/loan-slips/${loanSlipId}`, {
        borrowerId: data.borrowerId,
      });
      toast.success("Cập nhật phiếu mượn thành công");
      queryClient.invalidateQueries({
        queryKey: ["loan-slip", loanSlipId],
      });
      queryClient.invalidateQueries({ queryKey: ["loan-slips"] });
      router.push(`/loan-slip/${loanSlipId}`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể cập nhật phiếu mượn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case BORROWED_STATUS:
        return <Badge variant="default">Đang mượn</Badge>;
      case 2:
        return <Badge variant="secondary">Đã trả</Badge>;
      case 3:
        return <Badge variant="destructive">Hỏng</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  if (!mounted || loanSlipLoading) {
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

  if (!loanSlip) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy thông tin phiếu mượn
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/loan-slip")}
            >
              Quay lại danh sách
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if can edit
  if (loanSlip.status !== ELoanSlipStatus.BORROWING) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Không thể sửa phiếu mượn không ở trạng thái &quot;Đang mượn&quot;
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/loan-slip/${loanSlipId}`)}
            >
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const borrowedDevices = devices.filter((d) => d.status === BORROWED_STATUS);
  const returnedDevices = devices.filter((d) => d.status !== BORROWED_STATUS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/loan-slip/${loanSlipId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sửa Thông Tin Phiếu Mượn</h1>
          <p className="text-muted-foreground font-mono">{loanSlip.code}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Editable Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Người Mượn & Người Tạo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {/* Borrower Selection */}
              <FormField
                control={form.control}
                name="borrowerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người Mượn *</FormLabel>
                    <FormControl>
                      <AsyncSelect
                        endpoint="/partners"
                        transformKey={{ label: "user.name", value: "id" }}
                        searchKey="user.name"
                        placeholder="Tìm và chọn người mượn..."
                        value={borrowerValue}
                        onChange={(option) => {
                          setBorrowerValue(option);
                          field.onChange(option?.value?.toString() || "");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Read-only Information - Loan Slip Details */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Phiếu Mượn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-sm">Mã Phiếu Mượn</p>
                  <p className="font-mono font-medium">{loanSlip.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Trạng Thái</p>
                  <p className="font-medium">Đang mượn</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Số Thiết Bị Đang Mượn
                  </p>
                  <p className="font-medium">
                    {borrowedDevices.length} thiết bị
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device List - Read Only */}
          <Card>
            <CardHeader>
              <CardTitle>Danh Sách Thiết Bị Đang Mượn</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Tên Thiết Bị</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Loại Thiết Bị</TableHead>
                    <TableHead className="w-24">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowedDevices.map((device, index) => (
                    <TableRow key={device.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {device.deviceName}
                      </TableCell>
                      <TableCell className="font-mono">
                        {device.serial || "N/A"}
                      </TableCell>
                      <TableCell>{device.model || "N/A"}</TableCell>
                      <TableCell>{device.deviceTypeName || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                    </TableRow>
                  ))}
                  {borrowedDevices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <p className="text-muted-foreground">
                          Không có thiết bị đang mượn
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Returned Devices - Read Only */}
          {returnedDevices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Thiết Bị Đã Trả/Hỏng</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Tên Thiết Bị</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Loại Thiết Bị</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnedDevices.map((device, index) => (
                      <TableRow key={device.id} className="opacity-60">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {device.deviceName}
                        </TableCell>
                        <TableCell className="font-mono">
                          {device.serial || "N/A"}
                        </TableCell>
                        <TableCell>{device.model || "N/A"}</TableCell>
                        <TableCell>{device.deviceTypeName || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(device.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/loan-slip/${loanSlipId}`)}
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
