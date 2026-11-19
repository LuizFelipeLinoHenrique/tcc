import { MonthlyCashReport } from "./cashReport";

export async function cashReportXlsx(report: MonthlyCashReport): Promise<Uint8Array> {
  // The browser build avoids Node's fs/stream modules on both web and native.
  const { Workbook } = await import("exceljs/dist/exceljs.min.js");
  const workbook = new Workbook();
  workbook.creator = "PalletCore";
  workbook.title = `${report.title} — ${report.period}`;
  for (const table of report.tables) {
    const sheet = workbook.addWorksheet(table.title, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = table.headers.map((header, index) => ({ header, width: table.currencyColumns.includes(index) ? 24 : 28 }));
    table.rows.forEach(row => sheet.addRow(row));
    table.currencyColumns.forEach(index => { sheet.getColumn(index + 1).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00'; });
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B4F6C" } };
    });
    sheet.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; });
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: table.headers.length } };
    sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
