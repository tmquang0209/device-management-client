"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/shared/data/api";
import {
  IDevice,
  IDeviceLocation,
  IPaginatedResponse,
  IRack,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CellData {
  row: number;
  col: number;
  deviceId: string | null;
  deviceName?: string;
  serial?: string;
}

interface EditingCell {
  row: number;
  col: number;
  value: string;
  isOpen: boolean;
}

export default function RackDiagramPage() {
  const params = useParams();
  const router = useRouter();
  const rackId = params.id as string;
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [cursorPosition, setCursorPosition] = useState({ row: 1, col: 1 });
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const queryClient = useQueryClient();

  // Fetch rack details
  const { data: rack, isLoading: rackLoading } = useQuery<IRack>({
    queryKey: ["racks", rackId],
    queryFn: async () => {
      const response = await api.get<IResponse<IRack>>(`/racks/${rackId}`);
      return response.data;
    },
    enabled: !!rackId,
  });

  // Fetch unassigned devices
  const { data: unassignedDevices = [], isLoading: devicesLoading } = useQuery<
    IDevice[]
  >({
    queryKey: ["devices", "unassigned"],
    queryFn: async () => {
      const response = await api.get<IResponse<IDevice[]>>(
        "/devices/unassigned/list",
      );
      return response.data;
    },
  });

  // Fetch devices currently on this rack
  const { data: rackDevicesData, refetch: refetchRackDevices } = useQuery({
    queryKey: ["devices", "rack", rackId],
    queryFn: async () => {
      if (!rackId) return null;

      try {
        // First get all device locations for this rack
        const locationsResponse = await api.get<
          IPaginatedResponse<IDeviceLocation>
        >(`/device-locations`, {
          params: { rackId, pageSize: 1000 },
        });
        const locations = locationsResponse.data || [];

        console.log("=== Fetching rack devices ===");
        console.log("Locations found:", locations.length);
        console.log("Locations:", locations);

        if (locations.length === 0) {
          return { locations: [], devices: [] };
        }

        // Get all location IDs
        const locationIds = locations.map((loc) => loc.id);
        console.log("Location IDs:", locationIds);

        // Fetch all devices for each location
        const devicePromises = locationIds.map(async (locId) => {
          const res = await api.get<IPaginatedResponse<IDevice>>(`/devices`, {
            params: { deviceLocationId: locId, pageSize: 100 },
          });
          console.log(`API response for location ${locId}:`, res);
          return {
            locationId: locId,
            devices: res.data || [],
          };
        });

        const deviceResults = await Promise.all(devicePromises);
        console.log("Device results:", deviceResults);

        const devices: IDevice[] = [];

        // Combine all devices and attach their location info
        deviceResults.forEach(({ locationId, devices: devicesForLocation }) => {
          console.log(
            `Processing location ${locationId}, devices:`,
            devicesForLocation.length,
          );
          const location = locations.find((loc) => loc.id === locationId);
          if (location && devicesForLocation.length > 0) {
            devicesForLocation.forEach((device) => {
              console.log(
                `Adding device ${device.deviceName} with location:`,
                location,
              );
              devices.push({
                ...device,
                deviceLocation: location as IDevice["deviceLocation"],
              });
            });
          }
        });

        console.log("Final devices array:", devices);
        return { locations, devices };
      } catch (error) {
        console.error("Failed to load devices:", error);
        return { locations: [], devices: [] };
      }
    },
    enabled: !!rackId,
  });

  // Initialize cells from existing rack devices
  useEffect(() => {
    console.log("=== useEffect triggered ===");
    console.log("rackDevicesData:", rackDevicesData);

    if (!rackDevicesData?.devices) {
      console.log("No devices data");
      return;
    }

    console.log("Total devices:", rackDevicesData.devices.length);

    const newCells = new Map<string, CellData>();

    rackDevicesData.devices.forEach((device) => {
      console.log("Processing device:", {
        id: device.id,
        name: device.deviceName,
        hasLocation: !!device.deviceLocation,
        location: device.deviceLocation,
      });

      if (device.deviceLocation) {
        const location = device.deviceLocation;
        const row = parseInt(location.xPosition || "0");
        const col = parseInt(location.yPosition || "0");

        console.log(`Parsed position: [${row},${col}]`);

        if (row > 0 && col > 0) {
          const key = `${row}-${col}`;
          console.log(`Adding to cell ${key}:`, device.deviceName);
          newCells.set(key, {
            row,
            col,
            deviceId: device.id,
            deviceName: device.deviceName,
            serial: device.serial,
          });
        } else {
          console.warn(
            `Invalid position for device ${device.deviceName}: [${row},${col}]`,
          );
        }
      } else {
        console.warn(`Device ${device.id} has no location`);
      }
    });

    console.log("Total cells to set:", newCells.size);
    console.log("Cells map:", Array.from(newCells.entries()));
    setCells(newCells);
  }, [rackDevicesData]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const calculateNextPosition = (
    currentRow: number,
    currentCol: number,
    maxRows: number,
    maxCols: number,
  ): { row: number; col: number } => {
    // If at end of row, move to next row
    if (currentCol === maxCols) {
      if (currentRow === maxRows) {
        return { row: currentRow, col: currentCol };
      }
      return findFirstEmptyPosition(1, currentRow + 1, maxRows, maxCols);
    }

    // Move to next column
    return findFirstEmptyPosition(currentCol + 1, currentRow, maxRows, maxCols);
  };

  const findFirstEmptyPosition = (
    startCol: number,
    startRow: number,
    maxRows: number,
    maxCols: number,
  ): { row: number; col: number } => {
    for (let row = startRow; row <= maxRows; row++) {
      const colStart = row === startRow ? startCol : 1;
      for (let col = colStart; col <= maxCols; col++) {
        const key = getCellKey(row, col);
        if (!cells.has(key)) {
          return { row, col };
        }
      }
    }
    return { row: startRow, col: startCol };
  };

  const handleGridClick = (row: number, col: number) => {
    // Cho phép click vào cả ô trống và ô đã có thiết bị
    setCursorPosition({ row, col });
    setEditingCell({ row, col, value: "", isOpen: true });
  };

  const handleCellInputChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value, isOpen: true });
    }
  };

  const handleRemoveDevice = async () => {
    if (!editingCell) return;

    const key = getCellKey(editingCell.row, editingCell.col);
    const cellData = cells.get(key);

    if (!cellData || !cellData.deviceId) {
      toast.error("Không tìm thấy thiết bị để xóa");
      return;
    }

    setLoadingDevices(true);
    try {
      // Remove device from location by setting deviceLocationId to null
      await api.put(`/devices/${cellData.deviceId}`, {
        deviceLocationId: null,
      });

      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
        queryClient.invalidateQueries({ queryKey: ["device-locations"] }),
      ]);

      // Wait for refetch to complete
      await refetchRackDevices();

      toast.success("Đã xóa thiết bị khỏi vị trí");
      setEditingCell(null);
    } catch (error) {
      console.error("Failed to remove device:", error);
      toast.error("Không thể xóa thiết bị");
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSelectDevice = async (device: IDevice) => {
    if (!editingCell || !rack) return;

    setLoadingDevices(true);
    try {
      // Check if current position has an existing device
      const key = getCellKey(editingCell.row, editingCell.col);
      const cellData = cells.get(key);

      // If position has existing device, remove it first
      if (cellData && cellData.deviceId) {
        await api.put(`/devices/${cellData.deviceId}`, {
          deviceLocationId: null,
        });
      }

      // Check if location exists
      const existingLocations = await api.get<
        IPaginatedResponse<IDeviceLocation>
      >(`/device-locations`, {
        params: {
          rackId,
          xPosition: editingCell.row,
          yPosition: editingCell.col,
          pageSize: 1,
        },
      });

      let locationId: string;

      if (existingLocations.data && existingLocations.data.length > 0) {
        locationId = existingLocations.data[0].id;
      } else {
        const newLocation = await api.post<IResponse<IDeviceLocation>>(
          "/device-locations",
          {
            rackId: rackId,
            xPosition: editingCell.row.toString(),
            yPosition: editingCell.col.toString(),
            status: 1,
          },
        );
        locationId = newLocation.data.id;
      }

      // Update new device with location
      await api.put(`/devices/${device.id}`, {
        deviceLocationId: locationId,
      });

      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
        queryClient.invalidateQueries({ queryKey: ["device-locations"] }),
      ]);

      // Wait for refetch to complete
      await refetchRackDevices();

      const successMessage = cellData
        ? "Đã thay thế thiết bị thành công"
        : "Đã thêm thiết bị thành công";
      toast.success(successMessage);

      // Move to next position
      const nextPos = calculateNextPosition(
        editingCell.row,
        editingCell.col,
        rack.rows,
        rack.cols,
      );
      setCursorPosition(nextPos);
      setEditingCell(null);
    } catch (error) {
      console.error("Failed to add device:", error);
      toast.error("Không thể thêm thiết bị");
      setEditingCell(null);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleCellInputKeyPress = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const getFilteredDevices = (): IDevice[] => {
    if (!editingCell?.value) return unassignedDevices;

    const searchTerm = editingCell.value.toLowerCase();
    return unassignedDevices.filter(
      (device) =>
        device.deviceName.toLowerCase().includes(searchTerm) ||
        device.serial?.toLowerCase().includes(searchTerm),
    );
  };

  if (rackLoading || devicesLoading || loadingDevices) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  if (!rack) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy rack</h2>
          <Button
            onClick={() => router.push("/device-location")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/device-location")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Sơ Đồ Rack: {rack.code}</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            {rack.rows} hàng × {rack.cols} cột. Click vào ô để chọn thiết bị
            (Esc để hủy)
          </p>
          <p className="text-muted-foreground ml-10 text-sm">
            Vị trí hiện tại: [{cursorPosition.row},{cursorPosition.col}]
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Rack Grid */}
        <div className="overflow-x-auto">
          <div
            className="inline-grid gap-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
            style={{
              gridTemplateColumns: `repeat(${rack.cols}, minmax(120px, 1fr))`,
            }}
          >
            {Array.from({ length: rack.rows }, (_, rowIndex) =>
              Array.from({ length: rack.cols }, (_, colIndex) => {
                const row = rowIndex + 1;
                const col = colIndex + 1;
                const key = getCellKey(row, col);
                const cellData = cells.get(key);
                const isOccupied = !!cellData;
                const isCursor =
                  cursorPosition.row === row && cursorPosition.col === col;
                const isEditing =
                  editingCell?.row === row && editingCell?.col === col;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`relative flex min-h-[80px] flex-col items-center justify-center rounded-lg border-2 p-3 text-sm transition-all ${
                      isCursor && !isEditing
                        ? "border-blue-500 bg-blue-100 dark:bg-blue-900"
                        : isOccupied
                          ? "border-green-500 bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
                          : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800"
                    }`}
                  >
                    <div className="mb-1 text-xs text-gray-500">
                      [{row},{col}]
                    </div>
                    {isEditing ? (
                      <Popover
                        open={editingCell.isOpen}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingCell(null);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <div className="h-full w-full">
                            <input
                              autoFocus
                              type="text"
                              value={editingCell.value}
                              onChange={(e) =>
                                handleCellInputChange(e.target.value)
                              }
                              onKeyDown={handleCellInputKeyPress}
                              className="h-full w-full bg-transparent text-center text-xs font-semibold outline-none"
                              placeholder="Tìm thiết bị..."
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Tìm kiếm thiết bị..."
                              value={editingCell.value}
                              onValueChange={handleCellInputChange}
                            />
                            <CommandList>
                              <CommandEmpty>
                                Không tìm thấy thiết bị.
                              </CommandEmpty>
                              {cellData && (
                                <CommandGroup heading="Thao tác">
                                  <CommandItem
                                    onSelect={handleRemoveDevice}
                                    className="cursor-pointer text-red-600 dark:text-red-400"
                                  >
                                    <span className="font-medium">
                                      🗑️ Xóa thiết bị khỏi vị trí này
                                    </span>
                                  </CommandItem>
                                </CommandGroup>
                              )}
                              <CommandGroup
                                heading={
                                  cellData
                                    ? "Thay thế bằng thiết bị khác"
                                    : "Thiết bị chưa gán"
                                }
                              >
                                {getFilteredDevices().map((device) => (
                                  <CommandItem
                                    key={device.id}
                                    value={device.deviceName}
                                    onSelect={() => handleSelectDevice(device)}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        editingCell.value === device.deviceName
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {device.deviceName}
                                      </span>
                                      {device.serial && (
                                        <span className="text-muted-foreground text-xs">
                                          Serial: {device.serial}
                                        </span>
                                      )}
                                      {device.deviceType && (
                                        <span className="text-muted-foreground text-xs">
                                          Loại:{" "}
                                          {device.deviceType.deviceTypeName}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <button
                        onClick={() => handleGridClick(row, col)}
                        className="h-full w-full cursor-pointer"
                        title={
                          cellData
                            ? `${cellData.deviceName}${cellData.serial ? ` - ${cellData.serial}` : ""}`
                            : `Click để nhập thiết bị`
                        }
                      >
                        {cellData ? (
                          <div className="text-center">
                            <div className="font-medium">
                              {cellData.deviceName}
                            </div>
                            {cellData.serial && (
                              <div className="mt-1 text-xs">
                                {cellData.serial}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400">Trống</div>
                        )}
                      </button>
                    )}
                  </div>
                );
              }),
            )}
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
        {cells.size > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Danh Sách Thiết Bị ({cells.size})
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from(cells.values()).map((cell) => (
                <div
                  key={`${cell.row}-${cell.col}`}
                  className="rounded border border-green-300 bg-green-50 p-2 text-xs dark:border-green-700 dark:bg-green-900"
                >
                  <div className="font-semibold text-green-900 dark:text-green-100">
                    [{cell.row},{cell.col}]
                  </div>
                  <div className="truncate text-green-700 dark:text-green-300">
                    {cell.deviceName}
                  </div>
                  {cell.serial && (
                    <div className="truncate text-xs text-green-600 dark:text-green-400">
                      {cell.serial}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
