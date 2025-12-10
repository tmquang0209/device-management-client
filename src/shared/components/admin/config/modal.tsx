"use client";

import { ConfigForm } from "./config-form";

interface IConfigModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: "create" | "edit" | "view" | "delete";
  selectedConfigId: string | null;
  selectedConfigValueType?: string; // To determine input type
  currentValueType?: string; // For dynamic field updates
}

export function ConfigModal({
  isOpen,
  onOpenChange,
  type,
  selectedConfigId,
}: Readonly<IConfigModalProps>) {
  return (
    <ConfigForm
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      type={type}
      selectedConfigId={selectedConfigId}
    />
  );
}