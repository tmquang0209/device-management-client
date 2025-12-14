"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/shared/data/api";
import { IPaginatedResponse, IRack } from "@/shared/interfaces";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  calculateNextPosition,
  getPositionKey,
  IGridPosition,
  IWarehouseDevice,
} from "./warehouse-types";

interface RackWithDetails extends IRack {
  gridWidth: number;
  gridHeight: number;
}

export function WarehouseLayoutTab() {
  const [mounted, setMounted] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<string>("");
  const [cursorPosition, setCursorPosition] = useState<IGridPosition>({
    x: 0,
    y: 0,
  });
  const [devicesInRack, setDevicesInRack] = useState<IWarehouseDevice[]>([]);
  const [selectedRack, setSelectedRack] = useState<RackWithDetails | null>(
    null,
  );
  const [editingCell, setEditingCell] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch racks
  const { data: racksData } = useQuery({
    queryKey: ["racks-layout"],
    queryFn: async () => {
      const response = await api.get<IPaginatedResponse<IRack>>("/racks", {
        params: { page: 1, pageSize: 100 },
      });
      return response;
    },
  });

  // Fetch device locations for selected rack
  const { data: locationsData } = useQuery({
    queryKey: ["device-locations-layout", selectedRackId],
    queryFn: async () => {
      if (!selectedRackId) return { data: [] };
      const response = await api.get<
        IPaginatedResponse<{
          id: string;
          xPosition: string;
          yPosition: string;
          deviceCode: string;
        }>
      >("/device-locations", {
        params: { rackId: selectedRackId, page: 1, pageSize: 1000 },
      });
      return response;
    },
    enabled: !!selectedRackId,
  });

  // Extract devices from locations
  useEffect(() => {
    if (locationsData?.data) {
      const devices: IWarehouseDevice[] = locationsData.data.map(
        (location: {
          id: string;
          xPosition: string;
          yPosition: string;
          deviceCode: string;
        }) => ({
          id: location.id,
          x: parseInt(location.xPosition) || 0,
          y: parseInt(location.yPosition) || 0,
          deviceCode: location.deviceCode || `Device-${location.id}`,
        }),
      );
      setDevicesInRack(devices);

      // Initialize cursor to first empty position
      if (selectedRack) {
        const nextPos = calculateNextPosition(
          devices,
          { x: 0, y: 0 },
          selectedRack.gridWidth,
          selectedRack.gridHeight,
        );
        setCursorPosition(nextPos);
      }
    }
  }, [locationsData, selectedRack]);

  // Update selected rack with default dimensions
  useEffect(() => {
    if (selectedRackId && racksData?.data) {
      const rack = racksData.data.find((r) => r.id === selectedRackId);
      if (rack) {
        setSelectedRack({
          ...rack,
          gridWidth: 10, // Default width (X axis)
          gridHeight: 10, // Default height (Y axis)
        });
      }
    }
  }, [selectedRackId, racksData]);

  const handleRackSelect = (rackId: string) => {
    setSelectedRackId(rackId);
    setCursorPosition({ x: 0, y: 0 });
    setEditingCell(null);
  };

  const handleGridClick = (x: number, y: number) => {
    // Check if position is already occupied
    const isOccupied = devicesInRack.some(
      (device) => device.x === x && device.y === y,
    );

    if (!isOccupied) {
      setCursorPosition({ x, y });
      setEditingCell({ x, y, value: "" });
    } else {
      toast.error("Vị trí này đã có thiết bị rồi");
    }
  };

  const handleCellInputChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value });
    }
  };

  const handleCellInputKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && editingCell) {
      handleAddDevice();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleAddDevice = () => {
    if (!editingCell) return;

    if (!editingCell.value.trim()) {
      toast.error("Vui lòng nhập mã thiết bị");
      return;
    }

    if (!selectedRack) {
      toast.error("Vui lòng chọn kệ");
      return;
    }

    try {
      // Check if device already exists at this position
      const posKey = getPositionKey(editingCell.x, editingCell.y);
      const existingDevice = devicesInRack.find(
        (d) => getPositionKey(d.x, d.y) === posKey,
      );

      if (existingDevice) {
        toast.error("Vị trí này đã có thiết bị rồi");
        return;
      }

      // Add device to warehouse
      const newDevice: IWarehouseDevice = {
        id: `temp-${Date.now()}`,
        x: editingCell.x,
        y: editingCell.y,
        deviceCode: editingCell.value,
      };

      setDevicesInRack([...devicesInRack, newDevice]);
      toast.success("Thêm thiết bị thành công");

      // Move cursor to next position
      const nextPos = calculateNextPosition(
        [...devicesInRack, newDevice],
        { x: editingCell.x, y: editingCell.y },
        selectedRack.gridWidth,
        selectedRack.gridHeight,
      );

      setCursorPosition(nextPos);
      setEditingCell(null);
    } catch {
      toast.error("Lỗi khi thêm thiết bị");
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rack Selection */}
      <div className="flex gap-4">
        <Select value={selectedRackId} onValueChange={handleRackSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Chọn kệ..." />
          </SelectTrigger>
          <SelectContent>
            {racksData?.data.map((rack) => (
              <SelectItem key={rack.id} value={rack.id}>
                {rack.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRack && (
        <div className="space-y-6">
          {/* Current Position Display */}
          <div>
            <label className="block text-sm font-medium">
              Vị Trí Hiện Tại: {String.fromCharCode(65 + cursorPosition.y)}
              {String(cursorPosition.x + 1).padStart(2, "0")} - Click vào ô để
              nhập mã thiết bị (Enter để thêm, Esc để hủy)
            </label>
          </div>

          {/* Warehouse Grid */}
          <div className="overflow-x-auto rounded-lg border bg-gray-50 p-6 dark:bg-gray-900">
            <div className="inline-block">
              {/* Y-axis labels */}
              <div className="flex">
                {/* Corner spacer */}
                <div className="h-12 w-12" />

                {/* X-axis labels */}
                <div className="flex gap-1">
                  {Array.from({ length: selectedRack.gridWidth }).map(
                    (_, x) => (
                      <div
                        key={`x-${x}`}
                        className="flex h-8 w-12 items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400"
                      >
                        {String(x + 1).padStart(2, "0")}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Grid rows */}
              {Array.from({ length: selectedRack.gridHeight }).map((_, y) => (
                <div key={`row-${y}`} className="flex gap-1">
                  {/* Y-axis label */}
                  <div className="flex h-12 w-12 items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {String.fromCharCode(65 + y)}
                  </div>

                  {/* Grid cells */}
                  {Array.from({ length: selectedRack.gridWidth }).map(
                    (_, x) => {
                      const isOccupied = devicesInRack.some(
                        (device) => device.x === x && device.y === y,
                      );
                      const isCursor =
                        cursorPosition.x === x && cursorPosition.y === y;
                      const isEditing =
                        editingCell?.x === x && editingCell?.y === y;
                      const device = devicesInRack.find(
                        (d) => d.x === x && d.y === y,
                      );

                      return (
                        <div
                          key={`cell-${x}-${y}`}
                          className={`relative flex h-12 w-12 items-center justify-center rounded border-2 transition-all ${
                            isCursor && !isEditing
                              ? "border-blue-500 bg-blue-100 dark:bg-blue-900"
                              : isOccupied
                                ? "border-green-500 bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
                                : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800"
                          }`}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingCell.value}
                              onChange={(e) =>
                                handleCellInputChange(e.target.value)
                              }
                              onKeyDown={handleCellInputKeyPress}
                              onBlur={handleAddDevice}
                              className="h-full w-full bg-transparent text-center text-xs font-semibold outline-none"
                              placeholder="-"
                            />
                          ) : (
                            <button
                              onClick={() => handleGridClick(x, y)}
                              className="h-full w-full cursor-pointer text-xs font-semibold"
                              title={
                                device
                                  ? `${device.deviceCode}`
                                  : `${String.fromCharCode(65 + y)}${String(x + 1).padStart(2, "0")}`
                              }
                            >
                              {device ? "✓" : ""}
                            </button>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border-2 border-blue-500 bg-blue-100 dark:bg-blue-900" />
              <span>Vị trí hiện tại</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900" />
              <span>Đã có thiết bị</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" />
              <span>Trống</span>
            </div>
          </div>

          {/* Device List */}
          {devicesInRack.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Danh Sách Thiết Bị ({devicesInRack.length})
              </h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {devicesInRack.map((device) => (
                  <div
                    key={device.id}
                    className="rounded border border-green-300 bg-green-50 p-2 text-xs dark:border-green-700 dark:bg-green-900"
                  >
                    <div className="font-semibold text-green-900 dark:text-green-100">
                      {String.fromCharCode(65 + device.y)}
                      {String(device.x + 1).padStart(2, "0")}
                    </div>
                    <div className="truncate text-green-700 dark:text-green-300">
                      {device.deviceCode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
