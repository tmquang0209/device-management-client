/**
 * Warehouse Layout Types and Utilities
 */

export interface IGridPosition {
  x: number; // Column (0-based index)
  y: number; // Row (0-based index)
}

export interface IWarehouseDevice {
  id: string;
  x: number;
  y: number;
  deviceCode: string;
}

export interface IWarehouseLayout {
  rackId: string;
  width: number; // X axis (columns)
  height: number; // Y axis (rows)
  devices: IWarehouseDevice[];
}

/**
 * Converts grid position to a unique key string
 */
export function getPositionKey(x: number, y: number): string {
  return `${y}-${x}`;
}

/**
 * Checks if a position is occupied by a device
 */
export function isPositionOccupied(
  position: IGridPosition,
  devices: IWarehouseDevice[],
): boolean {
  return devices.some(
    (device) => device.x === position.x && device.y === position.y,
  );
}

/**
 * Calculates the next auto-position for a device
 * Rule: from left to right (X axis), then top to bottom (Y axis)
 *
 * @param devices - Current devices in the rack
 * @param currentPosition - Current cursor position
 * @param maxWidth - Maximum width of the grid (X axis)
 * @param maxHeight - Maximum height of the grid (Y axis)
 * @returns Next available position
 */
export function calculateNextPosition(
  devices: IWarehouseDevice[],
  currentPosition: IGridPosition,
  maxWidth: number,
  maxHeight: number,
): IGridPosition {
  // If current position is the last in a row, move to first of next row
  if (currentPosition.x === maxWidth - 1) {
    // If we're at the last position, stay there
    if (currentPosition.y === maxHeight - 1) {
      return currentPosition;
    }
    // Move to first position of next row
    return findFirstEmptyPosition(
      { x: 0, y: currentPosition.y + 1 },
      devices,
      maxWidth,
      maxHeight,
    );
  }

  // Move to next position in the same row
  return findFirstEmptyPosition(
    { x: currentPosition.x + 1, y: currentPosition.y },
    devices,
    maxWidth,
    maxHeight,
  );
}

/**
 * Finds the first empty position starting from a given position
 * Scans from left to right, top to bottom
 */
function findFirstEmptyPosition(
  startPosition: IGridPosition,
  devices: IWarehouseDevice[],
  maxWidth: number,
  maxHeight: number,
): IGridPosition {
  // Start from the given position and scan forward
  for (let y = startPosition.y; y < maxHeight; y++) {
    const xStart = y === startPosition.y ? startPosition.x : 0;

    for (let x = xStart; x < maxWidth; x++) {
      if (!isPositionOccupied({ x, y }, devices)) {
        return { x, y };
      }
    }
  }

  // If no empty position found, return the current position
  return startPosition;
}

/**
 * Finds the first truly empty position when grid is completely empty
 * Starts from (0, 0)
 */
export function getFirstAvailablePosition(
  devices: IWarehouseDevice[],
  maxWidth: number,
  maxHeight: number,
): IGridPosition {
  for (let y = 0; y < maxHeight; y++) {
    for (let x = 0; x < maxWidth; x++) {
      if (!isPositionOccupied({ x, y }, devices)) {
        return { x, y };
      }
    }
  }

  // Grid is full
  return { x: 0, y: 0 };
}

/**
 * Converts grid coordinates to display format
 * x -> number (01, 02, 03...)
 * y -> letter (A, B, C...)
 */
export function getPositionLabel(position: IGridPosition): string {
  const letter = String.fromCharCode(65 + position.y); // A, B, C...
  const number = String(position.x + 1).padStart(2, "0"); // 01, 02, 03...
  return `${letter}${number}`;
}

/**
 * Parses position label to grid coordinates
 * Example: "A01" -> { x: 0, y: 0 }
 */
export function parsePositionLabel(label: string): IGridPosition | null {
  const match = label.match(/^([A-Z])(\d{2})$/);
  if (!match) return null;

  return {
    y: label.charCodeAt(0) - 65, // A=0, B=1, C=2...
    x: parseInt(match[2]) - 1, // 01->0, 02->1...
  };
}

/**
 * Validates if a position is within grid bounds
 */
export function isValidPosition(
  position: IGridPosition,
  maxWidth: number,
  maxHeight: number,
): boolean {
  return (
    position.x >= 0 &&
    position.x < maxWidth &&
    position.y >= 0 &&
    position.y < maxHeight
  );
}
