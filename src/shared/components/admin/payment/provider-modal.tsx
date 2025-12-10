"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
import { queryClient } from "@/lib/query-client";
import {
  createPaymentProviderSchema,
  updatePaymentProviderSchema,
} from "@/shared/schema/admin/payment-provider.schema";
import { useMemo } from "react";

interface PaymentProviderModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: "create" | "edit" | "view" | "delete";
  selectedProviderId: string | null;
}

export function PaymentProviderModal({
  isOpen,
  onOpenChange,
  type,
  selectedProviderId,
}: Readonly<PaymentProviderModalProps>) {
  const providerFields = useMemo((): IFormFieldConfig[] => {
    return [
      {
        name: "code",
        label: "Provider Code",
        type: "text",
        placeholder: "Enter unique provider code (e.g., STRIPE, PAYPAL)",
        description: "A unique code for the payment provider.",
        disabled: type === "edit", // Code is not editable after creation
      },
      {
        name: "name",
        label: "Provider Name",
        type: "text",
        placeholder: "Enter provider name",
        description: "The display name of the payment provider.",
      },
      {
        name: "authorizedKey",
        label: "Authorized Key",
        type: "text",
        placeholder: "Enter authorized key (optional)",
        description: "API key or credentials for the payment provider.",
      },
      {
        name: "isActive",
        label: "Is Active",
        type: "checkbox",
        description: "Whether this payment provider is currently active.",
      },
    ];
  }, [type]);

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Create New Payment Provider",
      edit: "Edit Payment Provider",
      view: "View Payment Provider",
      delete: "Delete Payment Provider",
    } as const;
    const subtitleMap = {
      create: "Add a new payment provider to the system.",
      edit: "Modify the payment provider details below.",
      view: "View the payment provider details.",
      delete:
        "Are you sure you want to delete this payment provider? This action cannot be undone.",
    } as const;

    const base = "/payments/providers" as const;
    const idPath = selectedProviderId ? `${base}/${selectedProviderId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedProviderId ? idPath : "",
      schema: isEdit
        ? updatePaymentProviderSchema
        : createPaymentProviderSchema,
    };
  }, [type, selectedProviderId]);

  return (
    <DynamicModal
      open={isOpen}
      onOpenChange={onOpenChange}
      schema={modalConfig.schema}
      fields={providerFields}
      type={type}
      apiEndpoint={modalConfig.apiEndpoint}
      title={modalConfig.title}
      subtitle={modalConfig.subtitle}
      fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
      onSuccess={() => {
        queryClient.invalidateQueries({
          queryKey: ["payment-providers"],
          exact: false,
        });
        if (selectedProviderId) {
          queryClient.invalidateQueries({
            queryKey: [`/payments/providers/${selectedProviderId}`],
          });
        }
      }}
      onError={(error) => {
        console.error("Error:", error);
      }}
    />
  );
}
