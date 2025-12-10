"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/shared/data/api";
import { IResponse } from "@/shared/interfaces";
import {
  createConfigSchema,
  updateConfigSchema,
} from "@/shared/schema/admin/config.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

interface IConfigData {
  key: string;
  valueType: string;
  value: string;
  description: string;
  isActive: boolean;
}

interface IConfigFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: "create" | "edit" | "view" | "delete";
  selectedConfigId: string | null;
}

type CreateConfigData = z.infer<typeof createConfigSchema>;
type UpdateConfigData = z.infer<typeof updateConfigSchema>;

export function ConfigForm({
  isOpen,
  onOpenChange,
  type,
  selectedConfigId,
}: Readonly<IConfigFormProps>) {
  const queryClient = useQueryClient();
  const isEdit = type === "edit";
  const isDelete = type === "delete";
  const isView = type === "view";

  const schema = isEdit ? updateConfigSchema : createConfigSchema;

  const form = useForm<CreateConfigData | UpdateConfigData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: "",
      valueType: "string",
      value: "",
      description: "",
      isActive: true,
    },
  });

  // Watch the valueType field to dynamically show appropriate value input
  const watchedValueType = form.watch("valueType");

  // Fetch config details for edit/view/delete
  const { data: configData, isLoading: isLoadingDetails } = useQuery<IResponse<IConfigData>>({
    queryKey: ["config", selectedConfigId],
    queryFn: () => api.get(`/configs/${selectedConfigId}`),
    enabled: !!selectedConfigId && (isEdit || isView || isDelete),
  });
  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (!isOpen) {
      // Reset to default values when modal closes
      form.reset({
        key: "",
        valueType: "string",
        value: "",
        description: "",
        isActive: true,
      });
    }
  }, [isOpen, form]);

  // Reset form when type changes
  useEffect(() => {
    if (isOpen && type === "create") {
      form.reset({
        key: "",
        valueType: "string",
        value: "",
        description: "",
        isActive: true,
      });
    }
  }, [type, isOpen, form]);

  // Set form data when editing
  useEffect(() => {
    if (configData && (isEdit || isView || isDelete)) {
      form.reset({
        key: configData.data.key,
        valueType: configData.data.valueType,
        value: configData.data.value,
        description: configData.data.description,
        isActive: configData.data.isActive,
      });
    }
  }, [configData, form, isEdit, isView, isDelete]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateConfigData) => api.post("/configs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      toast.success("Configuration created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to create configuration";
      toast.error(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateConfigData) =>
      api.put(`/configs/${selectedConfigId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      toast.success("Configuration updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to update configuration";
      toast.error(message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/configs/${selectedConfigId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      toast.success("Configuration deleted successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to delete configuration";
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateConfigData | UpdateConfigData) => {
    if (isDelete) {
      deleteMutation.mutate();
    } else if (isEdit) {
      updateMutation.mutate(data as UpdateConfigData);
    } else {
      createMutation.mutate(data as CreateConfigData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (isDelete) return "Delete";
    if (isEdit) return "Update";
    return "Create";
  };

  const titleMap = {
    create: "Create New Configuration",
    edit: "Edit Configuration",
    view: "View Configuration",
    delete: "Delete Configuration",
  };

  const subtitleMap = {
    create: "Add a new system configuration by filling out the form below.",
    edit: "Modify the configuration details below.",
    view: "View the configuration details.",
    delete: "Are you sure you want to delete this configuration? This action cannot be undone.",
  };

  const renderValueField = () => {
    if (watchedValueType === "boolean") {
      return (
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Value</FormLabel>
                <FormDescription>
                  Toggle the boolean value for this configuration.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === "true" || field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked.toString())}
                  disabled={isView || isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />
      );
    }

    if (watchedValueType === "number") {
      return (
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter numeric value"
                  value={field.value as string}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  disabled={isView || isLoading}
                />
              </FormControl>
              <FormDescription>
                The numeric value associated with this configuration key.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (watchedValueType === "json") {
      return (
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter JSON object or array"
                  rows={6}
                  value={field.value as string}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  disabled={isView || isLoading}
                />
              </FormControl>
              <FormDescription>
                The JSON value associated with this configuration key.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    // Default to text input for string
    return (
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Value</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter configuration value"
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                disabled={isView || isLoading}
              />
            </FormControl>
            <FormDescription>
              The string value associated with this configuration key.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle>{titleMap[type]}</DialogTitle>
          <DialogDescription>{subtitleMap[type]}</DialogDescription>
        </DialogHeader>

        {isDelete ? (
          <>
            <div className="flex-1 py-4">
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Are you sure you want to delete this configuration?
              </p>
              {configData && (
                <div className="mt-4 rounded-lg border p-4">
                  <p><strong>Key:</strong> {configData.data.key}</p>
                  <p><strong>Value:</strong> {configData.data.value}</p>
                  <p><strong>Type:</strong> {configData.data.valueType}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={isLoading || isLoadingDetails}
                variant="destructive"
              >
                {getButtonText()}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 overflow-y-auto px-1">
                <div className="grid gap-4 py-4">
                  {isLoadingDetails ? (
                    <p className="text-muted-foreground text-sm">
                      Loading details...
                    </p>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Configuration Key</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter unique configuration key"
                                {...field}
                                disabled={isEdit || isView || isLoading}
                              />
                            </FormControl>
                            <FormDescription>
                              A unique identifier for the configuration setting.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valueType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isView || isLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select value type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The data type for the configuration value.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {renderValueField()}

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of the configuration"
                                {...field}
                                disabled={isView || isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isView || isLoading}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is Active</FormLabel>
                              <FormDescription>
                                Whether this configuration is currently active.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                {!isView && (
                  <Button
                    type="submit"
                    disabled={isLoading || isLoadingDetails}
                    variant={isDelete ? "destructive" : "default"}
                  >
                    {getButtonText()}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}