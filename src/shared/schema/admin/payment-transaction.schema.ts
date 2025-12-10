import { EPaymentMethod, EPaymentStatus, EReconciliationStatus } from "@/shared/constants/admin/payment";
import { z } from "zod";


export const createPaymentTransactionSchema = z.object({
  userId: z.string(),
  providerId: z.string(),
  amount: z.number().min(0, "Amount must be at least 0"),
  description: z.string().optional(),
  paymentMethod: z.nativeEnum(EPaymentMethod).optional(),
});

export const updatePaymentTransactionSchema = createPaymentTransactionSchema.extend({
  id: z.string(),
  status: z.nativeEnum(EPaymentStatus).optional(),
  reconStatus: z.nativeEnum(EReconciliationStatus).optional(),
});
