import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { toCsv } from "@/lib/utils/csv";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ReportFormat } from "@/types/attendance";

async function buildXlsx(title: string, headers: string[], rows: (string | number)[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31)); // Excel sheet name limit
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12203D" } };
    cell.font = { bold: true, color: { argb: "FFFAF9F6" } };
  });
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((col) => {
    col.width = 22;
  });
  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

async function buildPdf(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const colWidth = (doc.page.width - 80) / headers.length;

  function drawHeaderRow() {
    doc.font("Helvetica-Bold").fontSize(9);
    const y = doc.y;
    headers.forEach((h, i) => doc.text(h, 40 + i * colWidth, y, { width: colWidth }));
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(9);
  }

  doc.font("Helvetica-Bold").fontSize(16).text(title);
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6B7280")
    .text(`Generated ${new Date().toDateString()}`);
  doc.moveDown();
  doc.fillColor("#12203D");

  drawHeaderRow();

  rows.forEach((row) => {
    if (doc.y > doc.page.height - 60) {
      doc.addPage();
      drawHeaderRow();
    }
    const y = doc.y;
    row.forEach((cell, i) => doc.text(String(cell), 40 + i * colWidth, y, { width: colWidth }));
    doc.moveDown(0.5);
  });

  doc.end();
  return done;
}

/**
 * Single shared builder for every "Download Report" button in the
 * attendance module (student self-report, faculty/admin course report).
 * Returns a Web-standard Response with the correct content-type and
 * download filename for the requested format.
 */
export async function buildReportResponse(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  format: ReportFormat,
  filenameBase: string
): Promise<Response> {
  if (format === "csv") {
    const csv = toCsv([headers, ...rows]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    const buffer = await buildXlsx(title, headers, rows);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  const buffer = await buildPdf(title, headers, rows);
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
    },
  });
}

export function parseFormat(value: string | null): ReportFormat {
  return value === "xlsx" || value === "pdf" ? value : "csv";
}

/**
 * Shared rate limit for every report-export route (Attendance, Results,
 * Analytics, Certificates) — PDF/Excel generation is CPU-intensive, so
 * this is one policy in one place rather than copy-pasted per route.
 * Returns null if the request may proceed.
 */
export function checkReportRateLimit(userId: string): { retryMessage: string } | null {
  const { success } = rateLimit(`report-export:${userId}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  return success ? null : { retryMessage: "Too many report downloads. Please try again later." };
}
