import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertInvoiceSchema, type InsertInvoice, type InvoiceItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Plus, Upload, Trash2, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

const paymentTermsOptions = [
  { value: "NET7", label: "NET 7 - Payment due in 7 days" },
  { value: "NET15", label: "NET 15 - Payment due in 15 days" },
  { value: "NET30", label: "NET 30 - Payment due in 30 days" },
  { value: "NET45", label: "NET 45 - Payment due in 45 days" },
  { value: "NET60", label: "NET 60 - Payment due in 60 days" },
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CHF", label: "CHF" },
  { value: "SEK", label: "SEK (kr)" },
  { value: "NOK", label: "NOK (kr)" },
  { value: "DKK", label: "DKK (kr)" },
];

export default function InvoiceCreate() {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      rate: 0,
      discountType: "percentage",
      discountValue: 0,
      amount: 0,
    }
  ]);

  const { toast } = useToast();

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      paymentTerms: "NET30",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      currency: "USD",
      logoUrl: "",
      status: "draft",
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      businessTaxId: "",
      clientName: "",
      clientAddress: "",
      clientPhone: "",
      clientEmail: "",
      clientTaxId: "",
      items: [],
      subtotal: "",
      discountType: "percentage",
      discountValue: "",
      taxRate: "",
      shippingCost: "",
      total: "",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Calculation functions
  const calculateItemAmount = (item: InvoiceItem): number => {
    const baseAmount = item.quantity * item.rate;
    if (item.discountType === "percentage") {
      return baseAmount * (1 - item.discountValue / 100);
    } else {
      return Math.max(0, baseAmount - item.discountValue);
    }
  };

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(form.getValues("taxRate") || "0");
    const shippingCost = parseFloat(form.getValues("shippingCost") || "0");
    
    const taxAmount = subtotal * (taxRate / 100);
    
    return subtotal + taxAmount + shippingCost;
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€", 
      GBP: "£",
      INR: "₹",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CHF: "Fr",
      SEK: "kr",
      NOK: "kr", 
      DKK: "kr"
    };
    return symbols[currency] || currency;
  };

  const calculateDueDate = (issueDate: string, paymentTerms: string) => {
    if (!issueDate) return "";
    
    const issue = new Date(issueDate);
    let days = 0;
    
    switch (paymentTerms) {
      case "NET7": days = 7; break;
      case "NET15": days = 15; break;
      case "NET30": days = 30; break;
      case "NET45": days = 45; break;
      case "NET60": days = 60; break;
      case "DUE_ON_RECEIPT": days = 0; break;
      default: days = 30;
    }
    
    const dueDate = new Date(issue);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  };

  const handleIssueeDateChange = (date: string) => {
    form.setValue("issueDate", date);
    const paymentTerms = form.getValues("paymentTerms");
    const dueDate = calculateDueDate(date, paymentTerms);
    form.setValue("dueDate", dueDate);
  };

  const handlePaymentTermsChange = (terms: string) => {
    form.setValue("paymentTerms", terms as any);
    const issueDate = form.getValues("issueDate");
    const dueDate = calculateDueDate(issueDate, terms);
    form.setValue("dueDate", dueDate);
  };

  // Item management functions
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      rate: 0,
      discountType: "percentage",
      discountValue: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount for this item
    updatedItems[index].amount = calculateItemAmount(updatedItems[index]);
    
    setItems(updatedItems);
    
    // Update form with new calculations
    const subtotal = updatedItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
    form.setValue("subtotal", subtotal.toString());
    form.setValue("items", updatedItems);
    form.setValue("total", calculateTotal().toString());
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      
      // Update form with new calculations
      const subtotal = updatedItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
      form.setValue("subtotal", subtotal.toString());
      form.setValue("items", updatedItems);
      form.setValue("total", calculateTotal().toString());
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      form.setValue("logoUrl", url);
    }
  };

  const generatePDF = async () => {
    const formData = form.getValues();
    const invoiceData = {
      ...formData,
      items,
      subtotal: calculateSubtotal().toString(),
      total: calculateTotal().toString(),
    };
    
    try {
      await generateInvoicePDF(invoiceData, logoUrl);
      toast({
        title: "Success!",
        description: "Invoice PDF has been generated and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InsertInvoice) => {
    const submitData = {
      ...data,
      items,
      subtotal: calculateSubtotal().toString(),
      total: calculateTotal().toString(),
    };
    createInvoiceMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Invoice</h1>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Invoice Details Card */}
            <Card className="bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-gray-900">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* First Row - Logo Upload and Basic Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Logo Upload Section */}
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {logoUrl ? (
                        <div className="space-y-3">
                          <img 
                            src={logoUrl} 
                            alt="Company Logo" 
                            className="w-16 h-16 object-contain mx-auto"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLogoUrl("");
                              form.setValue("logoUrl", "");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                            <Plus className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Upload logo</p>
                            <p className="text-xs text-gray-500 mb-2">Supported formats: JPG, PNG, SVG</p>
                            <p className="text-xs text-gray-500 mb-3">Recommended size: 500px × 500px</p>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-black"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              Upload
                            </Button>
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                            <p className="text-xs text-gray-500 mt-2">Max upload size: 1 MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Basic Details */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Invoice Number */}
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Invoice Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="INV-001" 
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Terms */}
                      <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Payment Terms</FormLabel>
                            <Select onValueChange={handlePaymentTermsChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="NET30" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paymentTermsOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Issue Date */}
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Issue Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                onChange={(e) => handleIssueeDateChange(e.target.value)}
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Due Date */}
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Due Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Currency */}
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel className="text-sm font-medium text-gray-700">Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="USD ($)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice From and Bill To Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Invoice From */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Invoice From</h3>
                    <p className="text-sm text-gray-600 mb-4">Your Business Details</p>
                    
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormControl>
                            <Textarea 
                              placeholder="Business Name,&#10;Address,&#10;Phone,&#10;Email,&#10;TAX ID, etc."
                              {...field}
                              className="bg-white min-h-[120px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bill To */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Bill To</h3>
                    <p className="text-sm text-gray-600 mb-4">Client Details</p>
                    
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormControl>
                            <Textarea 
                              placeholder="Client/Business Name,&#10;Address,&#10;Phone,&#10;Email,&#10;TAX ID, etc."
                              {...field}
                              className="bg-white min-h-[120px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Items</h3>
                  
                  {/* Items Header */}
                  <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-medium text-gray-600 px-2">
                    <div className="col-span-4">Item Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Rate</div>
                    <div className="col-span-2">Discount</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-lg border">
                        {/* Description */}
                        <div className="col-span-4">
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        {/* Quantity */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ""}
                            placeholder="1"
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                        
                        {/* Rate */}
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate || ""}
                            placeholder="0.00"
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                        
                        {/* Discount */}
                        <div className="col-span-2">
                          <div className="flex">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discountValue || ""}
                              placeholder="0"
                              onChange={(e) => updateItem(index, 'discountValue', parseFloat(e.target.value) || 0)}
                              className="rounded-r-none"
                            />
                            <Select
                              value={item.discountType}
                              onValueChange={(value: "percentage" | "amount") => updateItem(index, 'discountType', value)}
                            >
                              <SelectTrigger className="w-16 rounded-l-none border-l-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="amount">$</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Amount */}
                        <div className="col-span-2">
                          <div className="text-right font-medium text-gray-900">
                            {getCurrencySymbol(form.watch("currency"))}{calculateItemAmount(item).toFixed(2)}
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        <div className="col-span-1">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Item Button */}
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {/* Calculations Section */}
                  <div className="mt-8 flex justify-end">
                    <div className="w-96 space-y-4">
                      {/* Subtotal */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Subtotal:</span>
                        <span className="font-semibold text-lg">{getCurrencySymbol(form.watch("currency"))}{calculateSubtotal().toFixed(2)}</span>
                      </div>



                      {/* Tax */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Tax:</span>
                        <div className="flex items-center space-x-2">
                          <FormField
                            control={form.control}
                            name="taxRate"
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...field}
                                    placeholder="0"
                                    onChange={(e) => {
                                      field.onChange(e);
                                      form.setValue("total", calculateTotal().toString());
                                    }}
                                    className="w-24 text-right"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-gray-500 w-4">%</span>
                        </div>
                      </div>

                      {/* Shipping */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Shipping:</span>
                        <FormField
                          control={form.control}
                          name="shippingCost"
                          render={({ field }) => (
                            <FormItem className="mb-0">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  placeholder="0"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.setValue("total", calculateTotal().toString());
                                  }}
                                  className="w-24 text-right"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Total */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-blue-600">{getCurrencySymbol(form.watch("currency"))}{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button
                type="button"
                variant="outline"
                className="px-8 py-2"
                onClick={() => {
                  // Reset form or navigate back
                  form.reset();
                  setItems([{
                    id: crypto.randomUUID(),
                    description: "",
                    quantity: 1,
                    rate: 0,
                    discountType: "percentage",
                    discountValue: 0,
                    amount: 0,
                  }]);
                  setLogoUrl("");
                }}
              >
                Cancel
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={generatePDF}
                  disabled={items.length === 0 || items.every(item => !item.description)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </Button>
                <Button
                  type="submit"
                  className="px-8 py-2 bg-black hover:bg-gray-800 text-white"
                  disabled={createInvoiceMutation.isPending}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}