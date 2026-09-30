import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

/**
 * Exports a printable DOM node (prescription / invoice preview) to a
 * print-ready PDF.
 *
 * jsPDF's native text renderer does not shape Arabic glyphs correctly, so we
 * snapshot the already-shaped, browser-rendered HTML with html2canvas and
 * place that image into the PDF page — this keeps the Cairo font, RTL layout
 * and clinic letterhead pixel-identical to what's on screen.
 */
@Injectable({ providedIn: 'root' })
export class PdfService {
  async generateQrDataUrl(payload: string): Promise<string> {
    return QRCode.toDataURL(payload, { margin: 1, width: 160, color: { dark: '#0f7d8c', light: '#ffffff' } });
  }

  async exportNodeToPdf(node: HTMLElement, fileName: string): Promise<void> {
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  }
}
