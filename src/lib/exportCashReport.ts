import { File, Paths } from "expo-file-system";
import { printToFileAsync } from "expo-print";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { cashReportHtml, MonthlyCashReport } from "./cashReport";
import { cashReportXlsx } from "./cashReportXlsx";

export async function exportCashReport(report: MonthlyCashReport, format: "pdf" | "xlsx") {
  if (!await isAvailableAsync()) throw new Error("O compartilhamento de arquivos não está disponível neste dispositivo.");
  const file = new File(Paths.cache, `${report.filename}.${format}`);
  try {
    if (format === "xlsx") file.write(await cashReportXlsx(report));
    else {
      const result = await printToFileAsync({ html: cashReportHtml(report), width: 842, height: 595 });
      const temporary = new File(result.uri);
      try { file.write(await temporary.bytes()); } finally { temporary.delete(); }
    }
    await shareAsync(file.uri, { mimeType: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", UTI: format === "pdf" ? "com.adobe.pdf" : "org.openxmlformats.spreadsheetml.sheet", dialogTitle: "Salvar relatório mensal" });
  } finally { if (file.exists) file.delete(); }
}
