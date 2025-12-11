import {
  IGridPosition,
  IWarehouseDevice,
  calculateNextPosition,
  getFirstAvailablePosition,
  isPositionOccupied,
} from "@/shared/components/admin/device-location/warehouse-types";
import { useCallback, useState } from "react";

export interface UseWarehouseLayoutOptions {
  maxWidth: number;
  maxHeight: number;
}

export function useWarehouseLayout(options: UseWarehouseLayoutOptions) {
  const [devices, setDevices] = useState<IWarehouseDevice[]>([]);
  const [cursorPosition, setCursorPosition] = useState<IGridPosition>({
    x: 0,
    y: 0,
  });

  // Initialize cursor to first available position
  const initializeCursor = useCallback(() => {
    const firstAvailable = getFirstAvailablePosition(
      devices,
      options.maxWidth,
      options.maxHeight,
    );
    setCursorPosition(firstAvailable);
  }, [devices, options.maxWidth, options.maxHeight]);

  // Set cursor to specific position
  const moveCursor = useCallback(
    (position: IGridPosition) => {
      if (!isPositionOccupied(position, devices)) {
        setCursorPosition(position);
      }
    },
    [devices],
  );

  // Add a device and move cursor to next position
  const addDevice = useCallback(
    (device: Omit<IWarehouseDevice, "id">, id: string) => {
      const newDevice: IWarehouseDevice = {
        ...device,
        id,
      };

      setDevices((prevDevices) => {
        const updated = [...prevDevices, newDevice];

        // Calculate next position after adding device
        const nextPos = calculateNextPosition(
          updated,
          cursorPosition,
          options.maxWidth,
          options.maxHeight,
        );

        setCursorPosition(nextPos);

        return updated;
      });
    },
    [cursorPosition, options.maxWidth, options.maxHeight],
  );

  // Remove a device
  const removeDevice = useCallback((deviceId: string) => {
    setDevices((prevDevices) => prevDevices.filter((d) => d.id !== deviceId));
  }, []);

  // Clear all devices
  const clearDevices = useCallback(() => {
    setDevices([]);
    setCursorPosition({ x: 0, y: 0 });
  }, []);

  // Load devices from external source (e.g., API)
  const loadDevices = useCallback(
    (newDevices: IWarehouseDevice[]) => {
      setDevices(newDevices);
      initializeCursor();
    },
    [initializeCursor],
  );

  return {
    devices,
    cursorPosition,
    addDevice,
    removeDevice,
    clearDevices,
    loadDevices,
    moveCursor,
    initializeCursor,
  };
}
