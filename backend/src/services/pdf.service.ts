/**
 * PDF service
 * Handles PDF generation for quotes and other documents
 */

import PDFDocument from 'pdfkit';
import { QuoteWithDetails } from './quotes.service';
import { logger } from '../utils/logger';

export class PDFService {
  /**
   * Generate a PDF quote document
   */
  static async generateQuotePDF(quote: QuoteWithDetails): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          creationDate: new Date(),
        });

        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, quote);

        // Customer and Quote Details
        this.addQuoteDetails(doc, quote);

        // Parts Table
        this.addPartsTable(doc, quote);

        // Terms and Conditions
        if (quote.terms) {
          this.addTerms(doc, quote.terms);
        }

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        logger.error('Failed to generate PDF', { error, quoteId: quote.id });
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  private static addHeader(doc: PDFKit.PDFDocument, quote: QuoteWithDetails): void {
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('QUOTE', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(16);
    doc.text(`Quote #${quote.quote_number}`, { align: 'center' });

    doc.moveDown(1);
  }

  /**
   * Add quote details section
   */
  private static addQuoteDetails(doc: PDFKit.PDFDocument, quote: QuoteWithDetails): void {
    const startY = doc.y;

    // Left column - Company info
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('From:', 50, startY);
    doc.font('Helvetica');
    doc.text('Australian Auto Parts Platform');
    doc.text('123 Business Street');
    doc.text('Sydney, NSW 2000');
    doc.text('Phone: (02) 1234 5678');
    doc.text('Email: quotes@ausautoparts.com');

    // Right column - Customer info
    const customerX = 300;
    doc.font('Helvetica-Bold');
    doc.text('To:', customerX, startY);
    doc.font('Helvetica');
    doc.text(`${quote.customer?.first_name || ''} ${quote.customer?.last_name || ''}`, customerX);
    if (quote.customer?.company_name) {
      doc.text(quote.customer.company_name, customerX);
    }
    if (quote.customer?.email) {
      doc.text(`Email: ${quote.customer.email}`, customerX);
    }
    if (quote.customer?.phone) {
      doc.text(`Phone: ${quote.customer.phone}`, customerX);
    }
    if (quote.customer?.address) {
      doc.text(`Address: ${quote.customer.address}`, customerX);
    }

    doc.moveDown(2);

    // Quote details
    const detailsY = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Quote Details:', 50, detailsY);

    doc.font('Helvetica');
    doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, 50, detailsY + 20);
    doc.text(`Valid Until: ${quote.expires_at ? new Date(quote.expires_at).toLocaleDateString() : 'No expiry'}`, 50, detailsY + 35);
    doc.text(`Status: ${quote.status}`, 50, detailsY + 50);

    doc.moveDown(3);
  }

  /**
   * Add parts table to PDF
   */
  private static addPartsTable(doc: PDFKit.PDFDocument, quote: QuoteWithDetails): void {
    const tableTop = doc.y;
    const tableWidth = 500;

    // Table headers
    doc.font('Helvetica-Bold');
    doc.fontSize(10);

    const headers = ['Description', 'Part Number', 'Qty', 'Unit Price', 'GST', 'Total'];
    const columnWidths = [150, 100, 40, 60, 50, 60];
    let currentX = 50;

    headers.forEach((header, index) => {
      doc.text(header, currentX, tableTop, { width: columnWidths[index], align: 'left' });
      currentX += columnWidths[index];
    });

    // Header underline
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table rows
    doc.font('Helvetica');
    let currentY = tableTop + 25;

    quote.quote_items.forEach((item) => {
      currentX = 50;
      const values = [
        item.part.name,
        item.part.part_number,
        item.quantity.toString(),
        `$${Number(item.unit_price).toFixed(2)}`,
        `$${Number(item.gst_amount).toFixed(2)}`,
        `$${Number(item.total_price).toFixed(2)}`,
      ];

      values.forEach((value, index) => {
        doc.text(value, currentX, currentY, { width: columnWidths[index], align: 'left' });
        currentX += columnWidths[index];
      });

      currentY += 15;

      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Totals
    const totalsY = currentY + 20;
    doc.moveTo(350, totalsY).lineTo(550, totalsY).stroke();

    doc.font('Helvetica-Bold');
    doc.text('Subtotal:', 350, totalsY + 10);
    doc.text(`$${Number(quote.subtotal_amount).toFixed(2)}`, 480, totalsY + 10, { align: 'right' });

    doc.text('GST (10%):', 350, totalsY + 25);
    doc.text(`$${Number(quote.gst_amount).toFixed(2)}`, 480, totalsY + 25, { align: 'right' });

    doc.fontSize(12);
    doc.text('TOTAL:', 350, totalsY + 45);
    doc.text(`$${Number(quote.total_amount).toFixed(2)}`, 480, totalsY + 45, { align: 'right' });

    doc.moveDown(4);
  }

  /**
   * Add terms and conditions
   */
  private static addTerms(doc: PDFKit.PDFDocument, terms: string): void {
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Terms and Conditions:');

    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);
    doc.text(terms, { align: 'justify' });

    doc.moveDown(2);
  }

  /**
   * Add footer to PDF
   */
  private static addFooter(doc: PDFKit.PDFDocument): void {
    const footerY = doc.page.height - 50;

    doc.fontSize(8).font('Helvetica');
    doc.text('Thank you for your business!', 50, footerY, { align: 'center' });
    doc.text('This quote is valid for 7 days unless otherwise stated.', 50, footerY + 10, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 50, footerY + 20, { align: 'center' });
  }
}

export default PDFService;