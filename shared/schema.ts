import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  paymentTerms: text("payment_terms").notNull(),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  currency: text("currency").notNull().default("USD"),
  logoUrl: text("logo_url").default(""),
  status: text("status").notNull().default("draft"),
  // Invoice From (Business details)
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  businessPhone: text("business_phone"),
  businessEmail: text("business_email"),
  businessTaxId: text("business_tax_id"),
  // Bill To (Client details)
  clientName: text("client_name"),
  clientAddress: text("client_address"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  clientTaxId: text("client_tax_id"),
  // Items and calculations
  items: jsonb("items").default([]),
  subtotal: text("subtotal").default("0"),
  discountType: text("discount_type").default("percentage"), // "percentage" or "amount"
  discountValue: text("discount_value").default("0"),
  taxRate: text("tax_rate").default("0"),
  shippingCost: text("shipping_cost").default("0"),
  total: text("total").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice Item Schema
export const invoiceItemSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be non-negative"),
  discountType: z.enum(["percentage", "amount"]).default("percentage"),
  discountValue: z.number().min(0, "Discount must be non-negative"),
  amount: z.number().default(0),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    paymentTerms: z.enum(["NET7", "NET15", "NET30", "NET45", "NET60", "DUE_ON_RECEIPT"]),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    currency: z.string().default("USD"),
    logoUrl: z.string().optional(),
    status: z.string().default("draft"),
    // Optional business details
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    businessEmail: z.string().optional(),
    businessTaxId: z.string().optional(),
    // Optional client details
    clientName: z.string().optional(),
    clientAddress: z.string().optional(),
    clientPhone: z.string().optional(),
    clientEmail: z.string().optional(),
    clientTaxId: z.string().optional(),
    // Items and calculations
    items: z.array(invoiceItemSchema).default([]),
    subtotal: z.string().default("0"),
    discountType: z.enum(["percentage", "amount"]).default("percentage"),
    discountValue: z.string().default("0"),
    taxRate: z.string().default("0"),
    shippingCost: z.string().default("0"),
    total: z.string().default("0"),
  });

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
