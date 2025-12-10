"use client";

import { DynamicModal } from "@/components/dynamic-modal";
import { IFormFieldConfig } from "@/components/dynamic-modal/types";
import { queryClient } from "@/lib/query-client";
import { EPaymentMethod, EPaymentStatus, EReconciliationStatus } from "@/shared/constants/admin/payment";
import { createPaymentTransactionSchema, updatePaymentTransactionSchema } from "@/shared/schema/admin/payment-transaction.schema";
import { useMemo } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: "create" | "edit" | "view" | "delete";
  selectedTransactionId: string | null;
}

export function TransactionModal({
  isOpen,
  onOpenChange,
  type,
  selectedTransactionId,
}: Readonly<TransactionModalProps>) {
  const transactionFields = useMemo((): IFormFieldConfig[] => {
    const fields: IFormFieldConfig[] = [
      {
        name: "userId",
        label: "User",
        type: "async-select",
        placeholder: "Select a user",
        mappingField: "fullName",
        endpoint: "/users/get-list",
        transformKey: {
          label: "fullName",
          value: "id",
        },
      },
      {
        name: "providerId",
        label: "Provider",
        type: "async-select",
        placeholder: "Select a provider",
        endpoint: "/payments/providers",
        mappingField: "name",
        transformKey: {
          label: "name",
          value: "id",
        },
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        placeholder: "Enter amount",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter transaction description",
      },
      {
        name: "paymentMethod",
        label: "Payment Method",
        type: "select",
        options: Object.values(EPaymentMethod).map((method) => ({
          label: method,
          value: method,
        })),
      },
    ];

    if (type === "edit") {
      fields.push(
        {
          name: "status",
          label: "Status",
          type: "select",
          options: Object.values(EPaymentStatus).map((status) => ({ label: status, value: status })),
        },
        {
          name: "reconStatus",
          label: "Reconciliation Status",
          type: "select",
          options: Object.values(EReconciliationStatus).map((status) => ({ label: status, value: status })),
        }
      );
    }

    return fields;
  }, [type]);

  const modalConfig = useMemo(() => {
    const isEdit = type === "edit";
    const isDelete = type === "delete";
    const titleMap = {
      create: "Create New Transaction",
      edit: "Edit Transaction",
      view: "View Transaction",
      delete: "Delete Transaction",
    } as const;
    const subtitleMap = {
      create: "Add a new transaction to the system.",
      edit: "Modify the transaction details below.",
      view: "View the transaction details.",
      delete:
        "Are you sure you want to delete this transaction? This action cannot be undone.",
    } as const;

    const base = "/payments/transactions" as const;
    const idPath = selectedTransactionId ? `${base}/${selectedTransactionId}` : base;

    return {
      title: titleMap[type],
      subtitle: subtitleMap[type],
      apiEndpoint: isDelete ? idPath : base,
      fetchDetailsEndpoint: selectedTransactionId ? idPath : "",
      schema: isEdit
        ? updatePaymentTransactionSchema
        : createPaymentTransactionSchema,
    };
  }, [type, selectedTransactionId]);

  return (
    <DynamicModal
      open={isOpen}
      onOpenChange={onOpenChange}
      schema={modalConfig.schema}
      fields={transactionFields}
      type={type}
      apiEndpoint={modalConfig.apiEndpoint}
      title={modalConfig.title}
      subtitle={modalConfig.subtitle}
      fetchDetailsEndpoint={modalConfig.fetchDetailsEndpoint}
      onSuccess={() => {
        queryClient.invalidateQueries({
          queryKey: ["payment-transactions"],
          exact: false,
        });
        if (selectedTransactionId) {
          queryClient.invalidateQueries({
            queryKey: [`/payments/transactions/${selectedTransactionId}`],
          });
        }
      }}
      onError={(error) => {
        console.error("Error:", error);
      }}
    />
  );
}