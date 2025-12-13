"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/shared/data/api";
import {
  IDevice,
  IDeviceLocation,
  IPaginatedResponse,
  IRack,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RackDiagramProps {
  rack: IRack;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CellData {
  row: number;
  col: number;
  deviceId: string | null;
}

export function RackDiagram({ rack, open, onOpenChange }: RackDiagramProps) {
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const queryClient = useQueryClient();

  // Fetch unassigned devices
  const { data: unassignedDevices = [], isLoading: devicesLoading } = useQuery<
    IDevice[]
  >({
    queryKey: ["devices", "unassigned"],
    queryFn: async () => {
      const response = await api.get<IPaginatedResponse<IDevice>>(
        "/devices/unassigned/list",
      );
      return response.data;
    },
    enabled: open,
  });

  // Fetch devices currently on this rack (devices with deviceLocation linked to this rack)
  const { data: rackDevices = [], isLoading: rackDevicesLoading } = useQuery<
    IDevice[]
  >({
    queryKey: ["devices", "rack", rack.id],
    queryFn: async () => {
      // First get all device locations for this rack
      const locationsResponse = await api.get<
        IPaginatedResponse<IDeviceLocation>
      >(`/device-locations`, { params: { rackId: rack.id } });
      const locations = locationsResponse.data || [];

      if (locations.length === 0) return [];

      // Then fetch devices for these locations
      const devicePromises = locations.map((loc: { id: string }) =>
        api.get<IPaginatedResponse<IDevice>>(`/devices`, {
          params: { deviceLocationId: loc.id },
        }),
      );

      const deviceResponses = await Promise.all(devicePromises);
      const allDevices = deviceResponses.flatMap((res) => res.data || []);

      return allDevices;
    },
    enabled: open,
  });

  // Initialize cells from existing rack devices
  useEffect(() => {
    if (rackDevices && rackDevices.length > 0) {
      const newCells = new Map<string, CellData>();
      rackDevices.forEach((device) => {
        if (device.deviceLocation) {
          const location = device.deviceLocation;
          const row = parseInt(location.xPosition || "0");
          const col = parseInt(location.yPosition || "0");
          const key = `${row}-${col}`;
          newCells.set(key, { row, col, deviceId: device.id });
        }
      });
      setCells(newCells);
    }
  }, [rackDevices]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleDeviceSelect = (deviceId: string) => {
    if (!selectedCell) return;

    const key = getCellKey(selectedCell.row, selectedCell.col);
    const newCells = new Map(cells);

    if (deviceId === "none") {
      newCells.delete(key);
    } else {
      newCells.set(key, {
        row: selectedCell.row,
        col: selectedCell.col,
        deviceId,
      });
    }

    setCells(newCells);
    setSelectedCell(null);
  };

  const handleSave = async () => {
    try {
      // First, create/get device locations for each cell
      const locationUpdates: Array<{
        deviceId: string;
        deviceLocationId: string;
        xPosition: string;
        yPosition: string;
      }> = [];

      // Create or find device locations for each cell
      for (const [, cell] of cells) {
        if (cell.deviceId) {
          // Check if location exists for this position
          const existingLocations = await api.get<IResponse<IDeviceLocation[]>>(
            `/device-locations`,
            {
              params: {
                rackId: rack.id,
                xPosition: cell.row,
                yPosition: cell.col,
              },
            },
          );

          let locationId: string;

          if (existingLocations.data && existingLocations.data.length > 0) {
            // Use existing location
            locationId = existingLocations.data[0].id;
          } else {
            // Create new location
            const newLocation = await api.post<IResponse<IDeviceLocation>>(
              "/device-locations",
              {
                rackId: rack.id,
                xPosition: cell.row.toString(),
                yPosition: cell.col.toString(),
                status: 1,
              },
            );
            locationId = newLocation.data.id;
          }

          locationUpdates.push({
            deviceId: cell.deviceId,
            deviceLocationId: locationId,
            xPosition: cell.row.toString(),
            yPosition: cell.col.toString(),
          });
        }
      }

      // Update each device's deviceLocationId
      await Promise.all(
        locationUpdates.map((update) =>
          api.put(`/devices/${update.deviceId}`, {
            deviceLocationId: update.deviceLocationId,
          }),
        ),
      );

      toast.success("Đã lưu sơ đồ rack thành công!");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["device-locations"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save rack diagram:", error);
      toast.error("Không thể lưu sơ đồ rack");
    }
  };

  const getDeviceAtCell = (row: number, col: number): IDevice | undefined => {
    const key = getCellKey(row, col);
    const cellData = cells.get(key);
    if (!cellData || !cellData.deviceId) return undefined;

    return [...unassignedDevices, ...rackDevices].find(
      (d) => d.id === cellData.deviceId,
    );
  };

  const getAvailableDevices = (): IDevice[] => {
    const usedDeviceIds = new Set(
      Array.from(cells.values())
        .map((c) => c.deviceId)
        .filter((id): id is string => id !== null),
    );

    return unassignedDevices.filter((d) => !usedDeviceIds.has(d.id));
  };

  if (devicesLoading || rackDevicesLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sơ Đồ Rack: {rack.code}</DialogTitle>
          <DialogDescription>
            {rack.rows} hàng × {rack.cols} cột. Nhấp vào ô để chọn thiết bị.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rack Grid */}
          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-2 rounded-lg bg-gray-50 p-4"
              style={{
                gridTemplateColumns: `repeat(${rack.cols}, minmax(120px, 1fr))`,
              }}
            >
              {Array.from({ length: rack.rows }, (_, rowIndex) =>
                Array.from({ length: rack.cols }, (_, colIndex) => {
                  const device = getDeviceAtCell(rowIndex + 1, colIndex + 1);
                  const isSelected =
                    selectedCell?.row === rowIndex + 1 &&
                    selectedCell?.col === colIndex + 1;

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() =>
                        handleCellClick(rowIndex + 1, colIndex + 1)
                      }
                      className={`flex min-h-[80px] flex-col items-center justify-center rounded-lg border-2 p-3 text-sm transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                          : device
                            ? "border-green-500 bg-green-50 hover:bg-green-100"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                      } `}
                    >
                      <div className="mb-1 text-xs text-gray-500">
                        [{rowIndex + 1},{colIndex + 1}]
                      </div>
                      {device ? (
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {device.deviceName}
                          </div>
                          {device.serial && (
                            <div className="mt-1 text-xs text-gray-600">
                              {device.serial}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400">Trống</div>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          {/* Device Selection */}
          {selectedCell && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-medium">
                Chọn thiết bị cho ô [{selectedCell.row},{selectedCell.col}]
              </h3>
              <div className="flex items-center gap-2">
                <Select onValueChange={handleDeviceSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn thiết bị..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Xóa thiết bị
                      </span>
                    </SelectItem>
                    {getAvailableDevices().map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.deviceName}
                        {device.serial && ` - ${device.serial}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setSelectedCell(null)}>
                  Hủy
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Lưu Sơ Đồ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
