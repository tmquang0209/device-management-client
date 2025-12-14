"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Loader2Icon } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { FormFieldRenderer } from "./form-field-renderer";
import { IFormFieldConfig } from "./types";

interface DynamicFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FieldValues>;
  fields: IFormFieldConfig[];
  onSubmit: (data: unknown) => void;
  isLoading: boolean;
  isLoadingDetails: boolean;
  title: string;
  description: string;
  type: "create" | "edit" | "update" | "view";
}

export function DynamicForm({
  open,
  onOpenChange,
  form,
  fields,
  onSubmit,
  isLoading,
  isLoadingDetails,
  title,
  description,
  type,
}: Readonly<DynamicFormProps>) {
  let submitButtonLabel = "Gửi";
  switch (type) {
    case "create":
      submitButtonLabel = "Tạo";
      break;
    case "edit":
    case "update":
      submitButtonLabel = "Cập nhật";
      break;
    case "view":
      submitButtonLabel = "Xem";
      break;
    default:
      submitButtonLabel = "Gửi";
  }
  if (isLoading || isLoadingDetails) {
    submitButtonLabel = "Đang xử lý...";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden"
        suppressHydrationWarning
      >
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Form Errors:", errors);
            })}
            className="flex min-h-0 flex-1 flex-col"
          >
            {isLoadingDetails && (
              <div className="flex w-full justify-center text-center">
                <Loader2Icon className="h-10 w-10 animate-spin" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-1">
              <div className="grid gap-4 py-4">
                {!isLoadingDetails &&
                  fields.map((field: IFormFieldConfig) => (
                    <FormFieldRenderer
                      key={field.name}
                      field={field}
                      control={form.control}
                      isLoading={isLoadingDetails}
                      type={type}
                    />
                  ))}
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isLoadingDetails}
              >
                Huỷ
              </Button>
              {type !== "view" && (
                <Button type="submit" disabled={isLoading || isLoadingDetails}>
                  {submitButtonLabel}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
