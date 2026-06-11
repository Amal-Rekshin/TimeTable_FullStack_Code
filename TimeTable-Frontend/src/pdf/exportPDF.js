// src/pdf/exportPDF.js

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportTimetablePDF = async (elementId, fileName = "timetable.pdf") => {
  const element = document.getElementById(elementId);

  if (!element) {
    alert("Error: Timetable not found!");
    return;
  }

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("l", "mm", "a4");
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save(fileName);
};