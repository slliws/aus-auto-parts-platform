/**
 * PDF service
 * Handles PDF generation for quotes and invoices (orders)
 */

import PDFDocument from 'pdfkit';
import { QuoteWithDetails } from './quotes.service';
import { OrderWithDetails } from './orders.service';
import { logger } from '../utils/logger';

export class PDFService {
  // ─── Text safety ─────────────────────────────────────────────────────────────

  /**
   * Truncate free-text strings before rendering into PDF.
   * Defence-in-depth: validators cap at input time; this catches any value
   * that bypasses validation (direct DB inserts, migrations, legacy data).
   */
  private static truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max) + '… [truncated]' : text;
  }

  // ─── Quote PDF ───────────────────────────────────────────────────────────────

  /**
   * Generate a PDF quote document
   */
  static async generateQuotePDF(quote: QuoteWithDetails): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Quote #${quote.quote_number}`,
            CreationDate: new Date(),
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        PDFService.addHeader(doc, 'QUOTE', quote.quote_number);
        PDFService.addQuoteDetails(doc, quote);
        PDFService.addQuoteItemsTable(doc, quote);
        if (quote.terms) PDFService.addTerms(doc, quote.terms);
        PDFService.addFooter(doc);

        doc.end();
      } catch (error) {
        logger.error('Failed to generate quote PDF', { error, quoteId: quote.id });
        reject(error);
      }
    });
  }

  // ─── Invoice PDF (Order) ─────────────────────────────────────────────────────

  /**
   * Generate a PDF tax invoice for an order
   */
  static async generateInvoicePDF(order: OrderWithDetails): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice #${order.order_number}`,
            CreationDate: new Date(),
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        PDFService.addHeader(doc, 'TAX INVOICE', order.order_number);
        PDFService.addInvoiceDetails(doc, order);
        PDFService.addOrderItemsTable(doc, order);
        PDFService.addPaymentStatus(doc, order);
        PDFService.addFooter(doc);

        doc.end();
      } catch (error) {
        logger.error('Failed to generate invoice PDF', { error, orderId: order.id });
        reject(error);
      }
    });
  }

  // ─── Shared helpers ──────────────────────────────────────────────────────────

  private static addHeader(doc: PDFKit.PDFDocument, title: string, refNumber: string): void {
    // Title block
    doc.fontSize(28).font('Helvetica-Bold');
    doc.text(title, { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica');
    doc.text(`#${refNumber}`, { align: 'center' });

    // Divider
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).stroke();
    doc.moveDown(0.8);
  }

  private static addFromBlock(doc: PDFKit.PDFDocument, startX: number, startY: number): void {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('FROM:', startX, startY);
    doc.font('Helvetica');
    doc.text('Australian Auto Parts', startX, startY + 14);
    doc.text('123 Business Street', startX, startY + 26);
    doc.text('Sydney NSW 2000', startX, startY + 38);
    doc.text('ABN: 12 345 678 901', startX, startY + 50);
    doc.text('quotes@ausautoparts.com.au', startX, startY + 62);
    doc.text('(02) 1234 5678', startX, startY + 74);
  }

  // ─── Quote-specific layout ───────────────────────────────────────────────────

  private static addQuoteDetails(doc: PDFKit.PDFDocument, quote: QuoteWithDetails): void {
    const blockY = doc.y;
    const leftX = 50;
    const rightX = 310;

    PDFService.addFromBlock(doc, leftX, blockY);

    // To block
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('TO:', rightX, blockY);
    doc.font('Helvetica');
    const cust = quote.customer;
    const custName = cust ? `${cust.first_name} ${cust.last_name}`.trim() : 'N/A';
    doc.text(custName, rightX, blockY + 14);
    if (cust?.company_name) doc.text(cust.company_name, rightX, blockY + 26);
    if (cust?.email) doc.text(cust.email, rightX, blockY + (cust.company_name ? 38 : 26));
    if (cust?.phone) doc.text(cust.phone, rightX, blockY + (cust.company_name ? 50 : 38));
    if (cust?.address) doc.text(cust.address, rightX, blockY + (cust.company_name ? 62 : 50));

    // Meta row
    doc.moveDown(5.5);
    const metaY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Quote Date:', leftX, metaY);
    doc.font('Helvetica');
    doc.text(new Date(quote.created_at).toLocaleDateString('en-AU'), leftX + 70, metaY);

    doc.font('Helvetica-Bold');
    doc.text('Valid Until:', leftX + 180, metaY);
    doc.font('Helvetica');
    const expiry = quote.expires_at
      ? new Date(quote.expires_at).toLocaleDateString('en-AU')
      : '30 days from date';
    doc.text(expiry, leftX + 255, metaY);

    doc.font('Helvetica-Bold');
    doc.text('Status:', rightX + 90, metaY);
    doc.font('Helvetica');
    doc.text(quote.status, rightX + 125, metaY);

    if (quote.notes) {
      doc.moveDown(1.2);
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Notes:', leftX);
      doc.font('Helvetica');
      doc.text(PDFService.truncate(quote.notes, 2000), leftX, undefined, { width: 495 });
    }

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.8);
  }

  private static addQuoteItemsTable(doc: PDFKit.PDFDocument, quote: QuoteWithDetails): void {
    const colX    = [50, 205, 295, 350, 415, 480];
    const colW    = [155, 90, 55, 65, 65, 65];
    const headers = ['Description', 'Part #', 'Qty', 'Unit Price', 'GST', 'Total'];
    const tableTop = doc.y;

    // Header row background
    doc.rect(50, tableTop, 495, 16).fill('#2c2c2c');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, colX[i], tableTop + 4, { width: colW[i], align: i >= 2 ? 'right' : 'left' });
    });
    doc.fillColor('black');

    let rowY = tableTop + 20;
    let rowIndex = 0;

    for (const item of quote.quote_items) {
      // Zebra stripe
      if (rowIndex % 2 === 0) {
        doc.rect(50, rowY, 495, 14).fill('#f5f5f5');
      }

      doc.font('Helvetica').fontSize(9).fillColor('black');
      const vals = [
        item.part.name,
        item.part.part_number,
        String(item.quantity),
        `$${Number(item.unit_price).toFixed(2)}`,
        `$${Number(item.gst_amount).toFixed(2)}`,
        `$${Number(item.total_price).toFixed(2)}`,
      ];
      vals.forEach((v, i) => {
        doc.text(v, colX[i], rowY + 3, { width: colW[i], align: i >= 2 ? 'right' : 'left' });
      });

      rowY += 16;
      rowIndex++;

      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }
    }

    // Totals block
    rowY += 8;
    doc.moveTo(350, rowY).lineTo(545, rowY).lineWidth(0.5).stroke();
    rowY += 6;

    const totals: [string, string][] = [
      ['Subtotal', `$${Number(quote.subtotal_amount).toFixed(2)}`],
      ['GST (10%)', `$${Number(quote.gst_amount).toFixed(2)}`],
    ];

    doc.fontSize(9).font('Helvetica');
    for (const [label, val] of totals) {
      doc.text(label, 350, rowY, { width: 130, align: 'right' });
      doc.text(val, 480, rowY, { width: 65, align: 'right' });
      rowY += 14;
    }

    rowY += 4;
    doc.rect(350, rowY, 195, 18).fill('#2c2c2c');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('TOTAL (AUD)', 352, rowY + 4, { width: 128, align: 'right' });
    doc.text(`$${Number(quote.total_amount).toFixed(2)}`, 480, rowY + 4, { width: 65, align: 'right' });
    doc.fillColor('black');

    doc.y = rowY + 30;
  }

  // ─── Order/Invoice-specific layout ──────────────────────────────────────────

  private static addInvoiceDetails(doc: PDFKit.PDFDocument, order: OrderWithDetails): void {
    const blockY = doc.y;
    const leftX = 50;
    const rightX = 310;

    PDFService.addFromBlock(doc, leftX, blockY);

    // Bill To
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('BILL TO:', rightX, blockY);
    doc.font('Helvetica');
    const cust = order.customer;
    const custName = `${cust.first_name} ${cust.last_name}`.trim();
    doc.text(custName, rightX, blockY + 14);
    if (cust.email) doc.text(cust.email, rightX, blockY + 26);
    if (cust.phone) doc.text(cust.phone, rightX, blockY + 38);

    // Meta row
    doc.moveDown(4.5);
    const metaY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Invoice Date:', leftX, metaY);
    doc.font('Helvetica');
    doc.text(new Date(order.created_at).toLocaleDateString('en-AU'), leftX + 75, metaY);

    doc.font('Helvetica-Bold');
    doc.text('Order Status:', leftX + 185, metaY);
    doc.font('Helvetica');
    doc.text(order.status, leftX + 260, metaY);

    doc.font('Helvetica-Bold');
    doc.text('Sold by:', rightX + 90, metaY);
    doc.font('Helvetica');
    const soldBy = order.user
      ? `${order.user.first_name} ${order.user.last_name}`.trim()
      : 'N/A';
    doc.text(soldBy, rightX + 125, metaY);

    if (order.notes) {
      doc.moveDown(1.2);
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Notes:', leftX);
      doc.font('Helvetica');
      doc.text(PDFService.truncate(order.notes, 2000), leftX, undefined, { width: 495 });
    }

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.8);
  }

  private static addOrderItemsTable(doc: PDFKit.PDFDocument, order: OrderWithDetails): void {
    const colX    = [50, 170, 265, 320, 385, 450];
    const colW    = [120, 95, 55, 65, 65, 65];
    const headers = ['Description', 'Part #', 'Condition', 'Qty', 'Unit Price', 'Total'];
    const tableTop = doc.y;

    // Header
    doc.rect(50, tableTop, 495, 16).fill('#2c2c2c');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, colX[i], tableTop + 4, { width: colW[i], align: i >= 3 ? 'right' : 'left' });
    });
    doc.fillColor('black');

    let rowY = tableTop + 20;
    let rowIndex = 0;

    for (const item of order.order_items) {
      if (rowIndex % 2 === 0) {
        doc.rect(50, rowY, 495, 14).fill('#f5f5f5');
      }

      doc.font('Helvetica').fontSize(9).fillColor('black');
      const vals = [
        item.part.name,
        item.part.part_number,
        item.part.condition,
        String(item.quantity),
        `$${Number(item.unit_price).toFixed(2)}`,
        `$${Number(item.total_price).toFixed(2)}`,
      ];
      vals.forEach((v, i) => {
        doc.text(v, colX[i], rowY + 3, { width: colW[i], align: i >= 3 ? 'right' : 'left' });
      });

      rowY += 16;
      rowIndex++;

      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }
    }

    // Totals
    rowY += 8;
    doc.moveTo(350, rowY).lineTo(545, rowY).lineWidth(0.5).stroke();
    rowY += 6;

    const totals: [string, string][] = [
      ['Subtotal', `$${Number(order.subtotal_amount).toFixed(2)}`],
      ['GST (10%)', `$${Number(order.gst_amount).toFixed(2)}`],
    ];

    doc.fontSize(9).font('Helvetica');
    for (const [label, val] of totals) {
      doc.text(label, 350, rowY, { width: 130, align: 'right' });
      doc.text(val, 480, rowY, { width: 65, align: 'right' });
      rowY += 14;
    }

    rowY += 4;
    doc.rect(350, rowY, 195, 18).fill('#2c2c2c');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('TOTAL (AUD)', 352, rowY + 4, { width: 128, align: 'right' });
    doc.text(`$${Number(order.total_amount).toFixed(2)}`, 480, rowY + 4, { width: 65, align: 'right' });
    doc.fillColor('black');

    doc.y = rowY + 30;
  }

  private static addPaymentStatus(doc: PDFKit.PDFDocument, order: OrderWithDetails): void {
    if (!order.payments || order.payments.length === 0) return;

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Payment History');
    doc.moveDown(0.3);

    for (const p of order.payments) {
      doc.fontSize(9).font('Helvetica');
      const date = p.payment_date
        ? new Date(p.payment_date).toLocaleDateString('en-AU')
        : 'Pending';
      doc.text(
        `${date}  |  Status: ${p.payment_status}  |  Amount: $${Number(p.amount).toFixed(2)}`,
        60
      );
      doc.moveDown(0.3);
    }
  }

  // ─── Shared footers/terms ────────────────────────────────────────────────────

  private static addTerms(doc: PDFKit.PDFDocument, terms: string): void {
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Terms & Conditions');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);
    doc.text(PDFService.truncate(terms, 5000), { align: 'justify', width: 495 });
    doc.moveDown(1);
  }

  private static addFooter(doc: PDFKit.PDFDocument): void {
    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY - 8).lineTo(545, footerY - 8).lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#555555');
    doc.text('Thank you for your business — Australian Auto Parts', 50, footerY, { align: 'center' });
    doc.text('ABN: 12 345 678 901  ·  www.ausautoparts.com.au', 50, footerY + 11, { align: 'center' });
    doc.text(`Generated ${new Date().toLocaleDateString('en-AU')}`, 50, footerY + 22, { align: 'center' });
    doc.fillColor('black');
  }
}

export default PDFService;
