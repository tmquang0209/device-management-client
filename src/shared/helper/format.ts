export function formatDate(date: string | Date) {
  // Use consistent formatting to prevent hydration mismatches
  const dateObj = new Date(date);
  return dateObj.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
}

export function formatDateLocale(date: string | Date) {
  // Only use after component mounts to prevent hydration mismatch
  if (typeof window === "undefined") {
    return formatDate(date);
  }
  return new Date(date).toLocaleDateString("vi-VN");
}

export function formatCurrency(amount: number) {
  // Use consistent formatting to prevent hydration mismatches
  return `$${amount.toFixed(2)}`;
}

export function formatCurrencyLocale(amount: number) {
  // Only use after component mounts to prevent hydration mismatch
  if (typeof window === "undefined") {
    return formatCurrency(amount);
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}
