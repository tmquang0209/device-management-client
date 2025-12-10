"use client";

import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { DynamicForm } from "./dynamic-form";
import { DynamicModalProps } from "./types";
import { useDynamicForm } from "./use-dynamic-form";

export function DynamicModal<TData = Record<string, unknown>>(
  props: Readonly<DynamicModalProps>,
) {
  const { open, onOpenChange, type, title, subtitle, fields } = props;

  const { form, mutation, isLoadingDetails, onSubmit } =
    useDynamicForm<TData>(props);

  const getTitle = () => {
    if (title) return title;
    const typeMap: Record<typeof type, string> = {
      create: "Create New",
      edit: "Edit",
      update: "Update",
      delete: "Delete",
      view: "View Details",
    };
    return typeMap[type];
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    const descMap: Record<typeof type, string> = {
      create: "Fill in the details below to create a new entry.",
      edit: "Update the information below.",
      update: "Modify the fields you want to update.",
      delete:
        "Are you sure you want to delete this item? This action cannot be undone.",
      view: "View the details below.",
    };
    return descMap[type];
  };

  const handleConfirmDelete = () => {
    mutation.mutate(form.getValues());
  };

  if (type === "delete") {
    return (
      <DeleteConfirmationDialog
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={mutation.isPending}
        title={getTitle()}
        description={getSubtitle()}
      />
    );
  }

  return (
    <DynamicForm
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      fields={fields}
      onSubmit={onSubmit as (data: unknown) => void}
      isLoading={mutation.isPending}
      isLoadingDetails={isLoadingDetails}
      title={getTitle()}
      description={getSubtitle()}
      type={type}
    />
  );
}
