import { MonthlyCashReport, reportCell } from "./cashReport";
import { cashReportXlsx } from "./cashReportXlsx";
import { displayDate } from "./cashFlow";

export async function exportCashReport(report: MonthlyCashReport, format: "pdf" | "xlsx") {
  let bytes: Uint8Array;
  if (format === "xlsx") bytes = await cashReportXlsx(report);
  else {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const pdf = new jsPDF({ orientation: "landscape", format: "a4" });
    pdf.setProperties({ title: `${report.title} — ${report.period}`, author: "PalletCore" });
    pdf.setFontSize(18);
    pdf.setTextColor(11, 79, 108);
    pdf.text(report.title, 12, 17);
    pdf.setFontSize(12);
    pdf.text(report.period, 12, 25);
    pdf.setFontSize(9);
    pdf.text(`Referência: ${displayDate(report.today)}`, 12, 31);
    for (const [index, table] of report.tables.entries()) {
      if (index > 0) pdf.addPage();
      pdf.setFontSize(14);
      pdf.text(table.title, 12, index === 0 ? 42 : 17);
      autoTable(pdf, {
        startY: index === 0 ? 49 : 24, margin: { top: 14, right: 12, bottom: 16, left: 12 },
        head: [table.headers], body: table.rows.length ? table.rows.map(row => row.map((value, index) => reportCell(table, value, index))) : [[{ content: "—", colSpan: table.headers.length }]],
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [11, 79, 108] }, alternateRowStyles: { fillColor: [241, 245, 249] },
      });
    }
    const count = pdf.getNumberOfPages();
    for (let page = 1; page <= count; page++) {
      pdf.setPage(page); pdf.setFontSize(8); pdf.setTextColor(100);
      pdf.text(`${report.period} • ${page} / ${count}`, 285, 203, { align: "right" });
    }
    bytes = new Uint8Array(pdf.output("arraybuffer"));
  }
  const type = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = `${report.filename}.${format}`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
}
