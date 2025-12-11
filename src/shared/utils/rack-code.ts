/**
 * Rack Code Generation Utilities
 * Format: ddmmyy_XX (ddmmyy = date created, XX = sequential number)
 * Example: 091225_01, 091225_02
 */

/**
 * Generates a rack code with the format ddmmyy_XX
 * @param rackCodeToday - Other rack codes created today, used to determine the next sequence number
 * @returns Generated rack code
 */
export function generateRackCode(rackCodesCreatedToday: string[] = []): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  const datePrefix = `${day}${month}${year}`;

  // Filter codes created today
  const codesToday = rackCodesCreatedToday
    .filter((code) => code.startsWith(datePrefix))
    .sort();

  // Extract the sequence number from the last code
  let nextSequence = 1;
  if (codesToday.length > 0) {
    const lastCode = codesToday[codesToday.length - 1];
    const match = lastCode.match(/_(\d{2})$/);
    if (match) {
      nextSequence = parseInt(match[1]) + 1;
    }
  }

  const sequenceNumber = String(nextSequence).padStart(2, "0");
  return `${datePrefix}_${sequenceNumber}`;
}

/**
 * Parses a rack code to extract date and sequence number
 * @param code - Rack code in format ddmmyy_XX
 * @returns Object with date and sequence number, or null if invalid format
 */
export function parseRackCode(
  code: string,
): { day: number; month: number; year: number; sequence: number } | null {
  const match = code.match(/^(\d{2})(\d{2})(\d{2})_(\d{2})$/);
  if (!match) return null;

  return {
    day: parseInt(match[1]),
    month: parseInt(match[2]),
    year: parseInt(match[3]),
    sequence: parseInt(match[4]),
  };
}

/**
 * Validates if a rack code follows the correct format
 * @param code - Rack code to validate
 * @returns true if valid, false otherwise
 */
export function isValidRackCode(code: string): boolean {
  return /^\d{6}_\d{2}$/.test(code) && parseRackCode(code) !== null;
}

/**
 * Gets today's date in ddmmyy format
 * @returns Date in ddmmyy format
 */
export function getTodayDatePrefix(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}
