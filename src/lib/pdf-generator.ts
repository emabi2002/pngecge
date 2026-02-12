'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Voter data interface
interface VoterData {
  voterId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  province: string;
  district: string;
  llg: string;
  ward: string;
  pollingPlace: string;
  villageLocality: string;
  registrationTimestamp: Date;
  status: string;
}

// PNG Electoral Commission branding
const PNGEC_COLORS = {
  primary: '#10b981', // Emerald green
  secondary: '#1e293b', // Slate 800
  text: '#0f172a', // Slate 900
  lightText: '#64748b', // Slate 500
  border: '#e2e8f0', // Slate 200
  gold: '#f59e0b', // Amber 500
  red: '#dc2626', // Red 600
};

/**
 * Generate a single voter ID card
 */
export function generateVoterIDCard(voter: VoterData): jsPDF {
  // ID card dimensions: 85.6mm x 53.98mm (standard credit card size)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 53.98],
  });

  const width = 85.6;
  const height = 53.98;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // Header bar with green stripe
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, width, 12, 'F');

  // PNG Coat of Arms placeholder (circle)
  doc.setFillColor(255, 255, 255);
  doc.circle(8, 6, 4, 'F');
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.circle(8, 6, 4, 'S');

  // Header text
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PAPUA NEW GUINEA', 15, 4.5);
  doc.setFontSize(6);
  doc.text('ELECTORAL COMMISSION', 15, 7.5);
  doc.setFontSize(5);
  doc.text('2027 NATIONAL GENERAL ELECTION', 15, 10);

  // National flag colors on right side
  doc.setFillColor(220, 38, 38); // Red
  doc.rect(width - 15, 0, 15, 6, 'F');
  doc.setFillColor(0, 0, 0); // Black
  doc.rect(width - 15, 6, 15, 6, 'F');

  // Bird of Paradise silhouette (simplified)
  doc.setTextColor(255, 215, 0);
  doc.setFontSize(8);
  doc.text('*', width - 7.5, 4);

  // Southern Cross dots
  doc.setFillColor(255, 255, 255);
  doc.circle(width - 10, 8, 0.6, 'F');
  doc.circle(width - 8, 9, 0.6, 'F');
  doc.circle(width - 6, 8, 0.6, 'F');
  doc.circle(width - 8, 7, 0.6, 'F');

  // Photo placeholder
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(5, 15, 18, 22, 'F');
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.2);
  doc.rect(5, 15, 18, 22, 'S');
  doc.setFontSize(4);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('PHOTO', 10, 27);

  // Voter details
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');

  const fullName = voter.middleName
    ? `${voter.firstName} ${voter.middleName} ${voter.lastName}`
    : `${voter.firstName} ${voter.lastName}`;

  doc.text(fullName.toUpperCase(), 26, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(71, 85, 105); // Slate 600

  const details = [
    { label: 'Voter ID:', value: voter.voterId },
    { label: 'Date of Birth:', value: voter.dateOfBirth.toLocaleDateString('en-GB') },
    { label: 'Gender:', value: voter.gender === 'male' ? 'Male' : 'Female' },
    { label: 'Province:', value: voter.province },
    { label: 'Ward:', value: voter.ward },
    { label: 'Polling Place:', value: voter.pollingPlace },
  ];

  let y = 22;
  for (const detail of details) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(detail.label, 26, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(detail.value, 43, y);
    y += 3.5;
  }

  // Fingerprint placeholder
  doc.setFillColor(241, 245, 249);
  doc.rect(5, 39, 10, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(5, 39, 10, 10, 'S');
  doc.setFontSize(3);
  doc.setTextColor(148, 163, 184);
  doc.text('FINGERPRINT', 6, 44);

  // QR Code placeholder
  doc.setFillColor(241, 245, 249);
  doc.rect(17, 39, 10, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(17, 39, 10, 10, 'S');
  doc.setFontSize(3);
  doc.text('QR CODE', 18.5, 44);

  // Bottom bar with issue info
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, height - 5, width, 5, 'F');

  doc.setFontSize(4);
  doc.setTextColor(255, 255, 255);
  doc.text(`Issued: ${voter.registrationTimestamp.toLocaleDateString('en-GB')}`, 5, height - 2);
  doc.text('Valid for 2027 National General Election', width / 2, height - 2, { align: 'center' });
  doc.text('OFFICIAL', width - 5, height - 2, { align: 'right' });

  // Security pattern (subtle diagonal lines)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.1);
  for (let i = 30; i < width; i += 3) {
    doc.line(i, 12, i + 10, height - 5);
  }

  return doc;
}

/**
 * Generate multiple voter ID cards in a single PDF
 */
export function generateBatchVoterIDCards(voters: VoterData[]): jsPDF {
  // A4 page with multiple cards
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardWidth = 85.6;
  const cardHeight = 53.98;
  const margin = 10;
  const cardsPerRow = 2;
  const cardsPerCol = 4;
  const cardsPerPage = cardsPerRow * cardsPerCol;

  voters.forEach((voter, index) => {
    if (index > 0 && index % cardsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = index % cardsPerPage;
    const row = Math.floor(pageIndex / cardsPerRow);
    const col = pageIndex % cardsPerRow;

    const x = margin + col * (cardWidth + 5);
    const y = margin + row * (cardHeight + 5);

    // Draw card border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(x, y, cardWidth, cardHeight, 'S');

    // Card header
    doc.setFillColor(16, 185, 129);
    doc.rect(x, y, cardWidth, 10, 'F');

    // Header text
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PNGEC VOTER ID - 2027 ELECTION', x + cardWidth / 2, y + 6, { align: 'center' });

    // Photo placeholder
    doc.setFillColor(241, 245, 249);
    doc.rect(x + 3, y + 13, 16, 20, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(x + 3, y + 13, 16, 20, 'S');

    // Voter details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');

    const fullName = voter.middleName
      ? `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      : `${voter.firstName} ${voter.lastName}`;

    doc.text(fullName.toUpperCase(), x + 22, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text(`ID: ${voter.voterId}`, x + 22, y + 21);
    doc.text(`DOB: ${voter.dateOfBirth.toLocaleDateString('en-GB')}`, x + 22, y + 25);
    doc.text(`Province: ${voter.province}`, x + 22, y + 29);
    doc.text(`Ward: ${voter.ward}`, x + 22, y + 33);
    doc.text(`Polling: ${voter.pollingPlace.substring(0, 25)}`, x + 22, y + 37);

    // Bottom info
    doc.setFillColor(30, 41, 59);
    doc.rect(x, y + cardHeight - 5, cardWidth, 5, 'F');
    doc.setFontSize(4);
    doc.setTextColor(255, 255, 255);
    doc.text(`Registered: ${voter.registrationTimestamp.toLocaleDateString('en-GB')}`, x + 3, y + cardHeight - 2);
  });

  return doc;
}

/**
 * Generate a voter roll PDF for a ward/polling place
 */
export function generateVoterRoll(
  voters: VoterData[],
  options: {
    title: string;
    province: string;
    district: string;
    ward: string;
    pollingPlace?: string;
    generatedBy?: string;
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PAPUA NEW GUINEA ELECTORAL COMMISSION', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('OFFICIAL VOTER ROLL - 2027 NATIONAL GENERAL ELECTION', pageWidth / 2, 18, { align: 'center' });

  // Sub-header with location info
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, margin, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Province: ${options.province}`, margin, 42);
  doc.text(`District: ${options.district}`, margin + 60, 42);
  doc.text(`Ward: ${options.ward}`, margin + 120, 42);

  if (options.pollingPlace) {
    doc.text(`Polling Place: ${options.pollingPlace}`, margin, 48);
  }

  // Stats summary
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, 52, pageWidth - 2 * margin, 12, 'F');

  const maleCount = voters.filter(v => v.gender === 'male').length;
  const femaleCount = voters.filter(v => v.gender === 'female').length;

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Registered Voters: ${voters.length}`, margin + 5, 58);
  doc.text(`Male: ${maleCount}`, margin + 60, 58);
  doc.text(`Female: ${femaleCount}`, margin + 90, 58);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin - 5, 58, { align: 'right' });

  // Voter table
  const tableData = voters.map((voter, index) => [
    (index + 1).toString(),
    voter.voterId,
    `${voter.lastName}, ${voter.firstName}${voter.middleName ? ` ${voter.middleName}` : ''}`,
    voter.dateOfBirth.toLocaleDateString('en-GB'),
    voter.gender === 'male' ? 'M' : 'F',
    voter.villageLocality.substring(0, 20),
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['#', 'Voter ID', 'Name', 'DOB', 'Sex', 'Village/Locality']],
    body: tableData,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, font: 'courier' },
      2: { cellWidth: 50 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 40 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on each page
      const pageNumber = doc.internal.pages.length - 1;
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${pageNumber} | ${options.title} | Generated: ${new Date().toLocaleDateString('en-GB')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Security watermark
      doc.setFontSize(40);
      doc.setTextColor(226, 232, 240);
      doc.text('OFFICIAL', pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
    },
  });

  // Certification section on last page
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200;

  if (finalY < pageHeight - 60) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, finalY + 15, pageWidth - margin, finalY + 15);

    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION', margin, finalY + 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('I hereby certify that this voter roll is accurate and complete as of the date of generation.', margin, finalY + 32);
    doc.text('This document is official property of the Papua New Guinea Electoral Commission.', margin, finalY + 38);

    // Signature lines
    doc.line(margin, finalY + 52, margin + 50, finalY + 52);
    doc.text('Authorized Signature', margin, finalY + 56);

    doc.line(margin + 70, finalY + 52, margin + 120, finalY + 52);
    doc.text('Date', margin + 70, finalY + 56);

    doc.line(pageWidth - margin - 50, finalY + 52, pageWidth - margin, finalY + 52);
    doc.text('Official Seal', pageWidth - margin - 50, finalY + 56);
  }

  return doc;
}

/**
 * Generate audit report PDF
 */
export function generateAuditReport(
  logs: Array<{
    id: string;
    timestamp: Date;
    action: string;
    entityType: string;
    entityId: string;
    user: string;
    description: string;
    signatureHash: string;
  }>,
  options: {
    title: string;
    dateRange: { from: Date; to: Date };
    category?: string;
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 15;

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PNGEC-BRS AUDIT LOG REPORT', pageWidth / 2, 12, { align: 'center' });

  // Report info
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(options.title, margin, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Date Range: ${options.dateRange.from.toLocaleDateString('en-GB')} - ${options.dateRange.to.toLocaleDateString('en-GB')}`,
    margin,
    36
  );
  if (options.category) {
    doc.text(`Category: ${options.category}`, margin + 80, 36);
  }
  doc.text(`Total Records: ${logs.length}`, margin + 150, 36);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin, 36, { align: 'right' });

  // Audit log table
  const tableData = logs.map((log) => [
    log.timestamp.toLocaleString('en-GB'),
    log.action,
    log.entityType,
    log.entityId.substring(0, 15),
    log.user,
    log.description.substring(0, 40),
    log.signatureHash.substring(0, 12) + '...',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Description', 'Signature']],
    body: tableData,
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35, font: 'courier' },
      4: { cellWidth: 25 },
      5: { cellWidth: 60 },
      6: { cellWidth: 30, font: 'courier' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      const pageNumber = doc.internal.pages.length - 1;
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${pageNumber} | PNGEC-BRS Audit Report | CONFIDENTIAL`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    },
  });

  return doc;
}

// Export helper to download PDF
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

// Export helper to open PDF in new tab
export function openPDFInNewTab(doc: jsPDF): void {
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
