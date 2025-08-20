import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { type InsertInvoice, type InvoiceItem } from '@shared/schema';

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

export const generateInvoicePDF = async (
  invoiceData: InsertInvoice & { items: InvoiceItem[] },
  logoUrl?: string
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 20;

  // Add logo if available
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = logoUrl;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 60;
      canvas.height = 60;
      ctx.drawImage(img, 0, 0, 60, 60);
      
      const logoDataUrl = canvas.toDataURL('image/png');
      pdf.addImage(logoDataUrl, 'PNG', 20, currentY, 20, 20);
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
  }

  // Invoice title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 20, currentY + 15, { align: 'right' });
  
  currentY += 40;

  // Invoice details section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice Details', 20, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, currentY);
  pdf.text(`Payment Terms: ${invoiceData.paymentTerms}`, pageWidth/2, currentY);
  currentY += 8;
  
  pdf.text(`Issue Date: ${invoiceData.issueDate}`, 20, currentY);
  pdf.text(`Due Date: ${invoiceData.dueDate}`, pageWidth/2, currentY);
  currentY += 8;
  
  pdf.text(`Currency: ${invoiceData.currency}`, 20, currentY);
  currentY += 20;

  // Business details
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice From:', 20, currentY);
  pdf.text('Bill To:', pageWidth/2, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  const businessLines = [
    invoiceData.businessName,
    invoiceData.businessAddress,
    invoiceData.businessPhone,
    invoiceData.businessEmail,
    invoiceData.businessTaxId && `Tax ID: ${invoiceData.businessTaxId}`
  ].filter(Boolean) as string[];

  const clientLines = [
    invoiceData.clientName,
    invoiceData.clientAddress,
    invoiceData.clientPhone,
    invoiceData.clientEmail,
    invoiceData.clientTaxId && `Tax ID: ${invoiceData.clientTaxId}`
  ].filter(Boolean) as string[];

  const maxLines = Math.max(businessLines.length, clientLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    if (businessLines[i]) {
      pdf.text(businessLines[i], 20, currentY);
    }
    if (clientLines[i]) {
      pdf.text(clientLines[i], pageWidth/2, currentY);
    }
    currentY += 6;
  }

  currentY += 15;

  // Items table
  pdf.setFont('helvetica', 'bold');
  pdf.text('Items', 20, currentY);
  currentY += 10;

  // Table headers
  const tableTop = currentY;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, tableTop, pageWidth - 40, 8, 'F');
  
  pdf.text('Description', 25, tableTop + 6);
  pdf.text('Qty', 120, tableTop + 6);
  pdf.text('Rate', 135, tableTop + 6);
  pdf.text('Discount', 155, tableTop + 6);
  pdf.text('Amount', 180, tableTop + 6, { align: 'right' });
  
  currentY += 12;
  pdf.setFont('helvetica', 'normal');

  // Table rows
  invoiceData.items.forEach((item) => {
    if (currentY > pageHeight - 30) {
      pdf.addPage();
      currentY = 20;
    }

    const currencySymbol = getCurrencySymbol(invoiceData.currency || 'USD');
    
    const discountText = item.discountType === 'percentage' 
      ? `${item.discountValue}%` 
      : `${currencySymbol}${item.discountValue}`;
    
    pdf.text(item.description || 'Item', 25, currentY);
    pdf.text(item.quantity.toString(), 120, currentY);
    pdf.text(`${currencySymbol}${item.rate.toFixed(2)}`, 135, currentY);
    pdf.text(discountText, 155, currentY);
    pdf.text(`${currencySymbol}${item.amount.toFixed(2)}`, 180, currentY, { align: 'right' });
    
    currentY += 8;
  });

  // Totals section
  currentY += 10;
  const totalsX = pageWidth - 80;
  
  const currencySymbol = getCurrencySymbol(invoiceData.currency || 'USD');
  
  pdf.text(`Subtotal: ${currencySymbol}${invoiceData.subtotal}`, totalsX, currentY, { align: 'right' });
  currentY += 8;
  
  if (parseFloat(invoiceData.taxRate || '0') > 0) {
    pdf.text(`Tax (${invoiceData.taxRate}%): ${currencySymbol}${calculateTaxAmount(invoiceData).toFixed(2)}`, totalsX, currentY, { align: 'right' });
    currentY += 8;
  }
  
  if (parseFloat(invoiceData.shippingCost || '0') > 0) {
    pdf.text(`Shipping: ${currencySymbol}${invoiceData.shippingCost}`, totalsX, currentY, { align: 'right' });
    currentY += 8;
  }

  // Total line
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.line(totalsX - 50, currentY, pageWidth - 20, currentY);
  currentY += 8;
  pdf.text(`Total: ${currencySymbol}${invoiceData.total}`, totalsX, currentY, { align: 'right' });

  // Save the PDF
  const fileName = `Invoice_${invoiceData.invoiceNumber || 'draft'}.pdf`;
  pdf.save(fileName);
};



const calculateTaxAmount = (invoiceData: InsertInvoice): number => {
  const subtotal = parseFloat(invoiceData.subtotal || '0');
  const taxRate = parseFloat(invoiceData.taxRate || '0');
  
  return subtotal * (taxRate / 100);
};