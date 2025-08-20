import { type Invoice, type InsertInvoice } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getAllInvoices(): Promise<Invoice[]>;
}

export class MemStorage implements IStorage {
  private invoices: Map<string, Invoice>;

  constructor() {
    this.invoices = new Map();
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(
      (invoice) => invoice.invoiceNumber === invoiceNumber,
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const now = new Date();
    const invoice: Invoice = { 
      ...insertInvoice, 
      id,
      logoUrl: insertInvoice.logoUrl || "",
      businessName: insertInvoice.businessName || null,
      businessAddress: insertInvoice.businessAddress || null,
      businessPhone: insertInvoice.businessPhone || null,
      businessEmail: insertInvoice.businessEmail || null,
      businessTaxId: insertInvoice.businessTaxId || null,
      clientName: insertInvoice.clientName || null,
      clientAddress: insertInvoice.clientAddress || null,
      clientPhone: insertInvoice.clientPhone || null,
      clientEmail: insertInvoice.clientEmail || null,
      clientTaxId: insertInvoice.clientTaxId || null,
      items: insertInvoice.items || [],
      subtotal: insertInvoice.subtotal || "0",
      discountType: insertInvoice.discountType || "percentage",
      discountValue: insertInvoice.discountValue || "0",
      taxRate: insertInvoice.taxRate || "0",
      shippingCost: insertInvoice.shippingCost || "0",
      total: insertInvoice.total || "0",
      createdAt: now,
      updatedAt: now,
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) {
      return undefined;
    }

    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...updateData,
      updatedAt: new Date(),
    };

    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }
}

export const storage = new MemStorage();
