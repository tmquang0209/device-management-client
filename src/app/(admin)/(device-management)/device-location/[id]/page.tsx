"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/shared/data/api";
import {
  IDevice,
  IDeviceLocation,
  IPaginatedResponse,
  IRack,
  IResponse,
} from "@/shared/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const CELL_SIZE = 120; // px: keep cells square and aligned
  const initializedRef = useRef(false);
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [cellsReady, setCellsReady] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ row: 1, col: 1 });
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    deviceId: string;
    deviceName: string;
    row: number;
    col: number;
  } | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Fetch selected device details
  const { data: selectedDevice, isLoading: deviceDetailsLoading } =
    useQuery<IDevice>({
      queryKey: ["devices", selectedDeviceId],
      queryFn: async () => {
        const response = await api.get<IResponse<IDevice>>(
          `/devices/${selectedDeviceId}`,
        );
        return response.data;
      },
      enabled: !!selectedDeviceId,
    });

  // Fetch devices currently on this rack
  const { data: rackDevicesData, refetch: refetchRackDevices } = useQuery({
    queryKey: ["devices", "rack", rackId],
    queryFn: async () => {
      if (!rackId) return null;

      try {
        const locationsResponse = await api.get<
          IPaginatedResponse<IDeviceLocation>
        >(`/device-locations`, {
          params: { rackId, pageSize: 1000 },
        });

        const locations = locationsResponse.data || [];

        if (locations.length === 0) {
          return { locations: [], devices: [] };
        }

        const locationIds = locations.map((loc) => loc.id);

        const devicePromises = locationIds.map(async (locId) => {
          const res = await api.get<IPaginatedResponse<IDevice>>(`/devices`, {
            params: { deviceLocationId: locId, pageSize: 100 },
          });
          return {
            locationId: locId,
            devices: res.data || [],
          };
        });

        const deviceResults = await Promise.all(devicePromises);

        const devices: IDevice[] = [];

        deviceResults.forEach(({ locationId, devices: devicesForLocation }) => {
          const location = locations.find((loc) => loc.id === locationId);
          if (location && devicesForLocation.length > 0) {
            devicesForLocation.forEach((device) => {
              devices.push({
                ...device,
                deviceLocation: location as IDevice["deviceLocation"],
              });
            });
          }
        });

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
    if (!rackDevicesData?.devices) {
      return;
    }

    const newCells = new Map<string, CellData>();

    rackDevicesData.devices.forEach((device) => {
      if (device.deviceLocation) {
        const location = device.deviceLocation;
        const row = parseInt(location.xPosition || "0");
        const col = parseInt(location.yPosition || "0");

        if (row > 0 && col > 0) {
          const key = `${row}-${col}`;
          newCells.set(key, {
            row,
            col,
            deviceId: device.id,
            deviceName: device.deviceName,
            serial: device.serial,
          });
        }
      }
    });

    setCells(newCells);
    setCellsReady(true);
  }, [rackDevicesData]);

  // On first load, focus the first empty cell left->right, top->bottom

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  // Convert row number to letter (1 → A, 2 → B, ..., 27 → AA)
  const rowToLetter = (row: number): string => {
    let result = "";
    let num = row;
    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }
    return result;
  };

  const findNextEmptyLinear = useCallback(
    (
      startRow: number,
      startCol: number,
      maxRows: number,
      maxCols: number,
      occupied: Set<string>,
    ): { row: number; col: number } => {
      let row = startRow;
      let col = startCol + 1; // move to next cell first

      const total = maxRows * maxCols;
      for (let i = 0; i < total; i++) {
        if (col > maxCols) {
          col = 1;
          row += 1;
        }
        if (row > maxRows) break;

        const key = getCellKey(row, col);
        if (!occupied.has(key)) {
          return { row, col };
        }

        col += 1;
      }

      // No empty cell found; stay where we are
      return { row: startRow, col: startCol };
    },
    [],
  );

  const openCellDropdown = (row: number, col: number) => {
    setCursorPosition({ row, col });
    setEditingCell((prev) => {
      const sameCell = prev && prev.row === row && prev.col === col;
      return {
        row,
        col,
        value: sameCell ? prev!.value : prev?.value || "",
        isOpen: true,
      };
    });
  };

  // On first load, focus the first empty cell left->right, top->bottom
  useEffect(() => {
    if (!rack || !cellsReady) return;
    if (initializedRef.current) return;

    const occupied = new Set(Array.from(cells.keys()));
    const nextPos = findNextEmptyLinear(1, 0, rack.rows, rack.cols, occupied);

    setCursorPosition(nextPos);
    setEditingCell({
      row: nextPos.row,
      col: nextPos.col,
      value: "",
      isOpen: false,
    });
    initializedRef.current = true;
  }, [rack, cellsReady, cells, findNextEmptyLinear]);

  // When editing cell changes, ensure the corresponding input receives focus
  useEffect(() => {
    if (!editingCell) return;
    const selector = `input[data-cell="${editingCell.row}-${editingCell.col}"]`;
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el) {
      // Delay slightly to ensure element is mounted
      requestAnimationFrame(() => el.focus());
    }
  }, [editingCell]);

  const handleCellInputChange = (value: string, row: number, col: number) => {
    setCursorPosition({ row, col });
    setEditingCell({ row, col, value, isOpen: true });
  };

  const handleRemoveDevice = async () => {
    if (!deleteConfirm) return;

    setLoadingDevices(true);
    try {
      await api.put(`/devices/${deleteConfirm.deviceId}`, {
        deviceLocationId: null,
      });

      // Invalidate all related queries to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
        queryClient.invalidateQueries({ queryKey: ["device-locations"] }),
        queryClient.invalidateQueries({
          queryKey: ["devices", "rack", rackId],
        }),
        queryClient.invalidateQueries({ queryKey: ["devices", "unassigned"] }),
      ]);

      await refetchRackDevices();

      toast.success("Đã xóa thiết bị khỏi vị trí");
      setDeleteConfirm(null);
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
      const key = getCellKey(editingCell.row, editingCell.col);
      const cellData = cells.get(key);

      if (cellData && cellData.deviceId) {
        await api.put(`/devices/${cellData.deviceId}`, {
          deviceLocationId: null,
        });
      }

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

      await api.put(`/devices/${device.id}`, {
        deviceLocationId: locationId,
      });

      // Invalidate all related queries instead of clearing entire cache
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
        queryClient.invalidateQueries({ queryKey: ["device-locations"] }),
        queryClient.invalidateQueries({
          queryKey: ["devices", "rack", rackId],
        }),
        queryClient.invalidateQueries({ queryKey: ["devices", "unassigned"] }),
      ]);

      await refetchRackDevices();

      const successMessage = cellData
        ? "Đã thay thế thiết bị thành công"
        : "Đã thêm thiết bị thành công";
      toast.success(successMessage);

      // Determine next empty cell (left-to-right, top-to-bottom)
      const occupied = new Set(Array.from(cells.keys()));
      occupied.add(key); // newly filled cell
      const nextPos = findNextEmptyLinear(
        editingCell.row,
        editingCell.col,
        rack.rows,
        rack.cols,
        occupied,
      );

      setCursorPosition(nextPos);
      // Prepare focus on next empty cell; dropdown opens on focus/keydown
      setEditingCell({
        row: nextPos.row,
        col: nextPos.col,
        value: "",
        isOpen: false,
      });
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
    row: number,
    col: number,
  ) => {
    if (e.key === "Escape") {
      setEditingCell(null);
      return;
    }
    openCellDropdown(row, col);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCell) {
        const target = e.target as HTMLElement;
        const isClickInsideCell = target.closest(".editing-cell");
        if (!isClickInsideCell) {
          setEditingCell(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingCell]);

  const getFilteredDevices = (): IDevice[] => {
    if (!editingCell?.value) return unassignedDevices;

    const searchTerm = editingCell.value.toLowerCase();
    return unassignedDevices.filter(
      (device) =>
        device.serial?.toLowerCase().includes(searchTerm) ||
        device.deviceName.toLowerCase().includes(searchTerm),
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
            Vị trí hiện tại: [{cursorPosition.col},
            {rowToLetter(cursorPosition.row)}]
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Rack Grid */}
        <div className="overflow-x-auto">
          <div className="inline-flex gap-4">
            {/* Y-axis labels (A, B, C...) */}
            <div className="flex flex-col gap-2 pt-10">
              {Array.from({ length: rack.rows }, (_, i) => (
                <div
                  key={`y-${i}`}
                  className="flex items-center justify-center rounded bg-gray-200 px-3 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  style={{ height: `${CELL_SIZE}px` }}
                >
                  {rowToLetter(i + 1)}
                </div>
              ))}
            </div>

            {/* Grid container */}
            <div className="flex flex-col gap-2">
              {/* X-axis labels (1, 2, 3...) */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${rack.cols}, minmax(120px, 1fr))`,
                }}
              >
                {Array.from({ length: rack.cols }, (_, i) => (
                  <div
                    key={`x-${i}`}
                    className="flex h-8 items-center justify-center rounded bg-gray-200 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Rack cells */}
              <div
                className="grid gap-2 rounded-lg bg-gray-50 dark:bg-gray-900"
                style={{
                  gridTemplateColumns: `repeat(${rack.cols}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(${rack.rows}, ${CELL_SIZE}px)`,
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
                    const showDropdownAbove = rowIndex >= rack.rows - 1;
                    const dropdownPosClass = showDropdownAbove
                      ? "bottom-full mb-1"
                      : "top-full mt-1";

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`editing-cell group relative flex flex-col items-center justify-center rounded-lg border-2 p-3 text-sm transition-all ${
                          isCursor && !isEditing
                            ? "border-blue-500 bg-blue-100 dark:bg-blue-900"
                            : isOccupied
                              ? "border-green-500 bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
                              : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800"
                        }`}
                        style={{ height: `${CELL_SIZE}px` }}
                      >
                        {/* Delete button - only show when cell has device */}
                        {cellData && !isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                deviceId: cellData.deviceId!,
                                deviceName: cellData.deviceName || "",
                                row,
                                col,
                              });
                            }}
                            className="absolute top-1 right-1 hidden rounded bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:bg-red-600"
                            title="Xóa thiết bị"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}

                        {/* Coordinate label removed as requested */}
                        {isEditing || !cellData ? (
                          <div className="relative h-full w-full">
                            <input
                              autoFocus={
                                isEditing &&
                                editingCell?.row === row &&
                                editingCell?.col === col
                              }
                              type="text"
                              data-cell={`${row}-${col}`}
                              value={isEditing ? editingCell?.value || "" : ""}
                              onChange={(e) =>
                                handleCellInputChange(e.target.value, row, col)
                              }
                              onKeyDown={(e) =>
                                handleCellInputKeyPress(e, row, col)
                              }
                              onFocus={() => openCellDropdown(row, col)}
                              className="h-full w-full bg-transparent text-center text-xs font-semibold outline-none placeholder:text-gray-400"
                              placeholder="Nhập mã/serial thiết bị..."
                            />
                            {/* Dropdown list */}
                            {editingCell?.isOpen &&
                              editingCell.row === row &&
                              editingCell.col === col && (
                                <div
                                  className={`absolute left-0 z-50 w-80 rounded-md border bg-white shadow-lg dark:bg-gray-800 ${dropdownPosClass}`}
                                >
                                  <Command>
                                    <CommandList>
                                      <CommandEmpty className="py-6 text-center text-sm">
                                        Không tìm thấy thiết bị.
                                      </CommandEmpty>
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
                                            onSelect={() =>
                                              handleSelectDevice(device)
                                            }
                                            className="cursor-pointer"
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                editingCell?.value ===
                                                device.deviceName
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
                                                  {
                                                    device.deviceType
                                                      .deviceTypeName
                                                  }
                                                </span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div
                            className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-center"
                            onClick={() => {
                              if (cellData.deviceId) {
                                setSelectedDeviceId(cellData.deviceId);
                                setDrawerOpen(true);
                              }
                            }}
                          >
                            <div className="font-medium">
                              {cellData.deviceName}
                            </div>
                            {cellData.serial && (
                              <div className="mt-1 text-xs">
                                {cellData.serial}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
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
            <span>Đã có thiết bị: {cells.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" />
            <span>Trống: {rack.rows * rack.cols - cells.size}</span>
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
                    [{cell.col},{rowToLetter(cell.row)}]
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thiết bị</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thiết bị{" "}
              <span className="font-semibold text-red-600">
                {deleteConfirm?.deviceName}
              </span>{" "}
              khỏi vị trí [{deleteConfirm?.col},
              {rowToLetter(deleteConfirm?.row || 1)}]?
              <br />
              Thiết bị sẽ trở về trạng thái chưa gán vị trí.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveDevice}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Device Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[400px] overflow-y-auto p-4 sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Chi Tiết Thiết Bị</SheetTitle>
            <SheetDescription>
              Thông tin chi tiết về thiết bị được chọn
            </SheetDescription>
          </SheetHeader>

          {deviceDetailsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : selectedDevice ? (
            <div className="mt-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-semibold">
                  Thông Tin Cơ Bản
                </h3>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      Tên thiết bị:
                    </span>
                    <span className="col-span-2 text-sm">
                      {selectedDevice.deviceName}
                    </span>
                  </div>
                  {selectedDevice.serial && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Serial:
                      </span>
                      <span className="col-span-2 font-mono text-sm">
                        {selectedDevice.serial}
                      </span>
                    </div>
                  )}
                  {selectedDevice.model && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Model:
                      </span>
                      <span className="col-span-2 text-sm">
                        {selectedDevice.model}
                      </span>
                    </div>
                  )}
                  {selectedDevice.deviceType && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Loại thiết bị:
                      </span>
                      <span className="col-span-2 text-sm">
                        {selectedDevice.deviceType.deviceTypeName}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      Trạng thái:
                    </span>
                    <span className="col-span-2">
                      {selectedDevice.status === 1 ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Không hoạt động
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              {selectedDevice.deviceLocation && (
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    Vị Trí
                  </h3>
                  <div className="grid gap-3">
                    {selectedDevice.deviceLocation.rack && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          Kệ:
                        </span>
                        <span className="col-span-2 text-sm">
                          {selectedDevice.deviceLocation.rack.code}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Tọa độ:
                      </span>
                      <span className="col-span-2 text-sm">
                        [{selectedDevice.deviceLocation.yPosition},{" "}
                        {rowToLetter(
                          parseInt(
                            selectedDevice.deviceLocation.xPosition || "1",
                          ),
                        )}
                        ]
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase & Warranty Information */}
              {(selectedDevice.purchaseDate ||
                selectedDevice.warrantyExpirationDate ||
                selectedDevice.supplier) && (
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    Thông Tin Mua Hàng & Bảo Hành
                  </h3>
                  <div className="grid gap-3">
                    {selectedDevice.supplier && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          Nhà cung cấp:
                        </span>
                        <span className="col-span-2 text-sm">
                          {selectedDevice.supplier}
                        </span>
                      </div>
                    )}
                    {selectedDevice.purchaseDate && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          Ngày mua:
                        </span>
                        <span className="col-span-2 text-sm">
                          {new Date(
                            selectedDevice.purchaseDate,
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                    {selectedDevice.warrantyExpirationDate && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          Hết hạn bảo hành:
                        </span>
                        <span className="col-span-2 text-sm">
                          {new Date(
                            selectedDevice.warrantyExpirationDate,
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDevice.notes && (
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold">
                    Ghi Chú
                  </h3>
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedDevice.notes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-semibold">
                  Thông Tin Hệ Thống
                </h3>
                <div className="grid gap-3">
                  {selectedDevice.createdAt && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Ngày tạo:
                      </span>
                      <span className="col-span-2 text-sm">
                        {new Date(selectedDevice.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  )}
                  {selectedDevice.updatedAt && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Cập nhật lần cuối:
                      </span>
                      <span className="col-span-2 text-sm">
                        {new Date(selectedDevice.updatedAt).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-gray-500">
                Không tìm thấy thông tin thiết bị
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
