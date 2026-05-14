import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePDF = (prescription, doctorName, specialization) => {
  if (!prescription) return;

  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;

  // Colors
  const primaryColor = [2, 132, 199]; // text-sky-600
  const secondaryColor = [71, 85, 105]; // text-slate-600
  const lightGray = [241, 245, 249]; // bg-slate-100

  // 1. Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Worker Zone", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Skilled trades & services platform", 132, 20);

  // 2. Worker info
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${doctorName || "Worker"}`, 14, 45);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${specialization || 'Service Specialist'}`, 14, 51);
  
  // Date and ID
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(prescription.createdAt || prescription.date || Date.now()).toLocaleDateString()}`, 140, 45);
  doc.text(`Service ID: ${prescription._id ? prescription._id.toString().substring(0, 8).toUpperCase() : 'JOB-NEW'}`, 140, 51);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 58, 196, 58);

  // 3. Client info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Client information", 14, 68);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...secondaryColor);
  doc.text(`Name: ${prescription.patientName}`, 14, 76);
  doc.text(`Age: ${prescription.age || 'N/A'}`, 100, 76);
  doc.text(`Gender: ${prescription.gender || 'N/A'}`, 150, 76);

  // 4. Job Assessment
  let currentY = 88;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Job Assessment", 14, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...secondaryColor);
  if (prescription.symptoms) {
    doc.setFont("helvetica", "bold");
    doc.text("Issue Details:", 14, currentY);
    doc.setFont("helvetica", "normal");
    const symLines = doc.splitTextToSize(prescription.symptoms, 150);
    doc.text(symLines, 40, currentY);
    currentY += (symLines.length * 5) + 2;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Work Summary:", 14, currentY);
  doc.setFont("helvetica", "normal");
  const diagLines = doc.splitTextToSize(prescription.diagnosis, 150);
  doc.text(diagLines, 40, currentY);
  currentY += (diagLines.length * 5) + 6;

  // 5. Work Symbol
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("WZ", 14, currentY);
  currentY += 6;

  // 6. Task/Material Table
  const tableData = (prescription.medicines || []).map((m, i) => [
    i + 1,
    m.name,
    m.dosage,
    m.frequency,
    (m.time || []).join(", "),
    m.duration || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item/Task', 'Quantity', 'Frequency', 'Time', 'Duration']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: lightGray },
    margin: { left: 14, right: 14 }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Check page break
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  // 7. Additional Checks & Advice
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  
  if (prescription.labTests) {
    doc.text("Recommendations & next steps", 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    const labLines = doc.splitTextToSize(prescription.labTests, 180);
    doc.text(labLines, 14, currentY);
    currentY += (labLines.length * 5) + 8;
  }

  if (prescription.advice) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Client instructions", 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    const advLines = doc.splitTextToSize(prescription.advice, 180);
    doc.text(advLines, 14, currentY);
    currentY += (advLines.length * 5) + 8;
  }

  if (prescription.followUpDate) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString()}`, 14, currentY);
  }

  // 8. Footer (Sign)
  doc.setDrawColor(...primaryColor);
  doc.line(140, pageHeight - 30, 196, pageHeight - 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Worker authorization", 150, pageHeight - 24);

  // Save PDF
  const clientSlug = (prescription.patientName || "Client").replace(/\s+/g, "_");
  doc.save(`Service_Handover_${clientSlug}_${new Date().toISOString().split("T")[0]}.pdf`);
};
