import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInHours } from 'date-fns';

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to load image', url, err);
    return null;
  }
};

export const generateOfficialReport = async (complaint: any) => {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [79, 70, 229]; // indigo-600
  const darkColor: [number, number, number] = [30, 41, 59]; // slate-800
  const grayColor: [number, number, number] = [100, 116, 139]; // slate-500
  const successColor: [number, number, number] = [16, 185, 129]; // emerald-500
  
  let yPos = 15;

  const addHeader = () => {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('AI Powered Civic Intelligence Platform (AIPCIP)', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('RESOLVED CASE REPORT', 14, yPos);
    
    // Status box
    doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    doc.roundedRect(165, yPos - 12, 30, 8, 1, 1, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('RESOLVED', 169, yPos - 6.5);
    
    yPos += 15;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 196, yPos);
    yPos += 10;
  };

  const addFooter = (pageNumber: number) => {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Powered Civic Intelligence Platform (AIPCIP)', 14, pageHeight - 10);
    doc.text(`Case ID: ${complaint._id.slice(-8).toUpperCase()}`, 14, pageHeight - 6);
    doc.text(`System-generated administrative record. Generated: ${format(new Date(), 'PPpp')}`, 80, pageHeight - 10);
    doc.text(`Page ${pageNumber}`, 185, pageHeight - 10);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > 280) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // 1. Header
  addHeader();

  // 2. CASE OVERVIEW
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('CASE OVERVIEW', 14, yPos);
  yPos += 6;

  const resolvedEvent = complaint.timeline?.slice().reverse().find((t: any) => t.status === 'resolved');
  const resolvedDate = resolvedEvent ? format(new Date(resolvedEvent.timestamp), 'PPpp') : 'N/A';
  
  autoTable(doc, {
    startY: yPos,
    theme: 'plain',
    styles: { cellPadding: 2, fontSize: 10, textColor: darkColor },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: grayColor } },
    body: [
      ['CASE ID', complaint._id.slice(-8).toUpperCase()],
      ['CATEGORY', complaint.category.replace('_', ' ').toUpperCase()],
      ['STATUS', 'RESOLVED'],
      ['PRIORITY', String(complaint.priority || 'N/A').toUpperCase()],
      ['REPORTED DATE', format(new Date(complaint.createdAt), 'PPpp')],
      ['RESOLVED DATE', resolvedDate],
    ],
    margin: { left: 14 }
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // 3. CITIZEN INFORMATION
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTED BY', 14, yPos);
  yPos += 6;

  const cit = complaint.citizenId || {};
  autoTable(doc, {
    startY: yPos,
    theme: 'plain',
    styles: { cellPadding: 2, fontSize: 10, textColor: darkColor },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: grayColor } },
    body: [
      ['FULL NAME', cit.firstName ? `${cit.firstName} ${cit.lastName}` : 'N/A'],
      ['CITIZEN ID', cit._id ? cit._id.slice(-8).toUpperCase() : 'N/A'],
      ['EMAIL', cit.email || 'N/A'],
      ['PHONE', cit.phone || 'N/A'],
    ],
    margin: { left: 14 }
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // 4. COMPLAINT DETAILS
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLAINT DETAILS', 14, yPos);
  yPos += 6;

  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(complaint.title, 14, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitDescription = doc.splitTextToSize(complaint.description || 'No description provided.', 180);
  doc.text(splitDescription, 14, yPos);
  yPos += (splitDescription.length * 5) + 10;

  // 5. LOCATION
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('INCIDENT LOCATION', 14, yPos);
  yPos += 6;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, 182, 45, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  doc.text('AREA / REGION', 20, yPos + 10);
  doc.text('PRECISE LOCATION', 20, yPos + 22);
  doc.text('REPORTED', 20, yPos + 34);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  
  const regionName = complaint.region || (complaint.location?.address) || 'N/A';
  doc.text(regionName, 70, yPos + 10);
  
  const loc = complaint.location?.coordinates || [];
  const coordStr = loc.length === 2 ? `${loc[1].toFixed(6)}° N, ${loc[0].toFixed(6)}° E` : 'N/A';
  doc.text(coordStr, 70, yPos + 22);
  
  doc.text(format(new Date(complaint.createdAt), 'PPpp'), 70, yPos + 34);

  yPos += 55;

  // 6. RESOLUTION DETAILS
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESOLUTION DETAILS', 14, yPos);
  yPos += 6;

  const resDetails = complaint.resolutionDetails || {};
  const officer = resDetails.resolvedBy || {};
  
  autoTable(doc, {
    startY: yPos,
    theme: 'plain',
    styles: { cellPadding: 2, fontSize: 10, textColor: darkColor },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: grayColor } },
    body: [
      ['RESOLUTION STATUS', 'RESOLVED'],
      ['RESOLVED BY', officer.firstName ? `${officer.firstName} ${officer.lastName}` : 'N/A'],
      ['OFFICER ID', officer._id ? officer._id.slice(-8).toUpperCase() : 'N/A'],
      ['RESOLUTION DATE', resDetails.resolvedAt ? format(new Date(resDetails.resolvedAt), 'PPpp') : resolvedDate],
    ],
    margin: { left: 14 }
  });
  yPos = (doc as any).lastAutoTable.finalY + 6;

  if (resDetails.resolutionNote) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('RESOLUTION NOTES:', 14, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const splitNotes = doc.splitTextToSize(resDetails.resolutionNote, 180);
    doc.text(splitNotes, 14, yPos);
    yPos += (splitNotes.length * 5) + 10;
  } else if (resolvedEvent && resolvedEvent.note) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('RESOLUTION NOTES:', 14, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const splitNotes = doc.splitTextToSize(resolvedEvent.note, 180);
    doc.text(splitNotes, 14, yPos);
    yPos += (splitNotes.length * 5) + 10;
  }

  // 7. AI INTELLIGENCE SUMMARY
  if (complaint.aiAnalysis) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI INTELLIGENCE SUMMARY', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      theme: 'plain',
      styles: { cellPadding: 2, fontSize: 10, textColor: darkColor },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: grayColor } },
      body: [
        ['AI PRIORITY SCORE', complaint.aiAnalysis.priority || 'N/A'],
        ['AI SEVERITY', complaint.aiAnalysis.severity || 'N/A'],
        ['DUPLICATE DETECTED', complaint.aiAnalysis.duplicateDetected ? 'Yes' : 'No'],
      ],
      margin: { left: 14 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 6;
    
    if (complaint.aiAnalysis.summary) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const splitAi = doc.splitTextToSize(`Diagnostic: ${complaint.aiAnalysis.summary}`, 180);
      doc.text(splitAi, 14, yPos);
      yPos += (splitAi.length * 5) + 10;
    }
  }

  // 8. CASE ACTIVITY TIMELINE
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE ACTIVITY TIMELINE', 14, yPos);
  yPos += 6;

  const timelineData = complaint.timeline?.map((t: any) => [
    format(new Date(t.timestamp), 'PPpp'),
    t.status.replace('_', ' ').toUpperCase(),
    t.note || ''
  ]) || [];

  if (timelineData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: grayColor, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3, textColor: darkColor },
      head: [['Date / Time', 'Event', 'Details']],
      body: timelineData,
      margin: { left: 14 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // 9. REPORTED EVIDENCE & RESOLUTION EVIDENCE (Images)
  const citizenImages = complaint.images || [];
  const resolutionImages = resDetails.proofImages || [];

  if (citizenImages.length > 0 || resolutionImages.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('PHOTOGRAPHIC EVIDENCE', 14, yPos);
    yPos += 10;

    const renderImagesGrid = async (images: any[], label: string, caption: string) => {
      if (images.length === 0) return;
      
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(label, 14, yPos);
      yPos += 8;

      let xPos = 14;
      let rowHasImage = false;
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Before drawing an image, ensure we have space for it (image height 55 + caption 10)
        if (checkPageBreak(70)) {
           xPos = 14;
           rowHasImage = false;
        }
        
        // Wrap to next line if we exceed 2 columns
        if (xPos > 120) {
           yPos += 70;
           xPos = 14;
           rowHasImage = false;
           // Check page break again for the new row
           if (checkPageBreak(70)) {
              xPos = 14;
           }
        }
        
        const imgUrl = typeof img === 'string' ? img : img.url;
        const b64 = await fetchImageAsBase64(imgUrl);
        if (b64) {
          try {
            doc.addImage(b64, 'JPEG', xPos, yPos, 85, 55);
            doc.setFontSize(8);
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text(caption, xPos, yPos + 60);
            rowHasImage = true;
          } catch (e) {
            console.error('Image add error', e);
          }
        }
        xPos += 90;
      }
      
      if (rowHasImage) {
        yPos += 70; // Advance past the last row drawn
      }
      yPos += 10; // Extra spacing between sections
    };

    if (citizenImages.length > 0) {
      await renderImagesGrid(citizenImages, 'BEFORE / REPORTED EVIDENCE', 'Citizen-submitted evidence');
    }

    if (resolutionImages.length > 0) {
      await renderImagesGrid(resolutionImages, 'AFTER / RESOLUTION EVIDENCE', 'Officer-submitted resolution evidence');
    } else {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('AFTER / RESOLUTION EVIDENCE', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No resolution photographs were attached to this case.', 14, yPos);
      yPos += 15;
    }
  }

  // 10. CASE RESOLUTION SUMMARY
  checkPageBreak(70);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CASE RESOLUTION SUMMARY', 14, yPos);
  yPos += 8;

  const resolutionDuration = resolvedEvent ? differenceInHours(new Date(resolvedEvent.timestamp), new Date(complaint.createdAt)) : 0;
  const durationText = resolutionDuration > 0 ? `${Math.floor(resolutionDuration / 24)}d ${resolutionDuration % 24}h` : 'N/A';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, 182, 60, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  doc.text('Problem:', 20, yPos + 10);
  doc.text('Region:', 20, yPos + 18);
  doc.text('Reported:', 20, yPos + 26);
  doc.text('Resolved:', 20, yPos + 34);
  doc.text('Resolution Time:', 100, yPos + 10);
  doc.text('Assigned Officer:', 100, yPos + 18);
  doc.text('Final Status:', 100, yPos + 26);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  
  doc.text(complaint.title.substring(0, 35) + (complaint.title.length > 35 ? '...' : ''), 45, yPos + 10);
  doc.text(complaint.region || 'Unknown Area', 45, yPos + 18);
  doc.text(format(new Date(complaint.createdAt), 'PPpp'), 45, yPos + 26);
  doc.text(resolvedDate, 45, yPos + 34);
  
  doc.text(durationText, 135, yPos + 10);
  doc.text(officer.firstName ? `${officer.firstName} ${officer.lastName}` : 'N/A', 135, yPos + 18);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(successColor[0], successColor[1], successColor[2]);
  doc.text('RESOLVED', 135, yPos + 26);
  
  if (resDetails.resolutionNote || (resolvedEvent && resolvedEvent.note)) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Resolution Notes:', 20, yPos + 44);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const notesStr = resDetails.resolutionNote || resolvedEvent.note;
    const notesSplit = doc.splitTextToSize(notesStr, 140);
    doc.text(notesSplit, 55, yPos + 44);
  }

  yPos += 65;

  if (complaint.resolutionReport?.adminReview?.decision === 'COMPLETED') {
    const adminReview = complaint.resolutionReport.adminReview;
    
    checkPageBreak(80);
    
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(74, 222, 128);
    doc.setLineWidth(1);
    doc.roundedRect(14, yPos, 182, 60, 2, 2, 'FD');
    doc.setLineWidth(0.1); // reset

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('ADMINISTRATOR VERIFICATION', 20, yPos + 12);
    
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Status:', 20, yPos + 22);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPLETED & VERIFIED', 40, yPos + 22);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Verification ID:', 20, yPos + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(adminReview.verificationId || 'N/A', 50, yPos + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date Verified:', 20, yPos + 38);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(adminReview.reviewedAt), 'PPpp'), 50, yPos + 38);

    if (adminReview.note) {
      doc.setFont('helvetica', 'bold');
      doc.text('Review Note:', 20, yPos + 46);
      doc.setFont('helvetica', 'normal');
      const noteSplit = doc.splitTextToSize(adminReview.note, 140);
      doc.text(noteSplit, 50, yPos + 46);
    }

    if (adminReview.signatureImage) {
      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signature:', 120, yPos + 22);
      
      try {
        doc.addImage(adminReview.signatureImage, 'PNG', 120, yPos + 25, 60, 30);
      } catch (e) {
        console.warn('Could not add signature image to PDF');
      }
    }
  }

  // Apply footers to all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // Save the PDF
  doc.save(`AIPCIP_Resolved_Case_${complaint._id.slice(-8).toUpperCase()}.pdf`);
};
