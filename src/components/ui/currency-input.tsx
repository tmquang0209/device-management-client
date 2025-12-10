"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CurrencyInputProps {
  value: {
    amount: number;
    currency: string;
  };
  onChange: (value: { amount: number; currency: string }) => void;
  placeholder?: string;
  className?: string;
}

const currencies = ["VND", "USD", "EUR", "GBP", "JPY"];

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
}: Readonly<CurrencyInputProps>) {
  const [amount, setAmount] = useState(value.amount || "");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(Number(rawValue))) {
      setAmount(Number(rawValue));
      onChange({ ...value, amount: Number(rawValue) });
    }
  };

  const handleCurrencyChange = (currency: string) => {
    onChange({ ...value, currency });
  };

  const formattedAmount = new Intl.NumberFormat().format(Number(amount));

  return (
    <div className={cn("flex items-center", className)}>
      <Input
        type="text"
        value={formattedAmount}
        onChange={handleAmountChange}
        placeholder={placeholder}
        className="flex-1"
      />
      <Select value={value.currency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
