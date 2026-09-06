import PDFDocument from "pdfkit";
import type { TestReportDetail } from "@/types/test-reports";
import { formatTimeRaw } from "@/lib/utils/date";

// Same design tokens as tailwind.config.ts, so the PDF reads as an extension
// of the on-screen page rather than a generic export.
const INK = "#12203D";
const INK_MUTED = "#6B7280";
const GOLD = "#B98B3E";
const GOLD_BG = "#FBF3E7";
const PARCHMENT_100 = "#F3F1EA";
const SUCCESS = "#3E7A4C";
const ERROR = "#B3392C";
const BORDER = "#E5E1D8";

const MARGIN = 40;

function statCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string
) {
  doc.roundedRect(x, y, width, height, 3).lineWidth(1).strokeColor(BORDER).stroke();
  doc.rect(x, y, 3, height).fill(SUCCESS);
  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(INK)
    .text(value, x + 12, y + 12, { width: width - 24 });
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(INK_MUTED)
    .text(label.toUpperCase(), x + 12, y + height - 22, { width: width - 24 });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, onNewPage?: () => void) {
  if (doc.y + needed > doc.page.height - MARGIN) {
    doc.addPage();
    doc.y = MARGIN;
    onNewPage?.();
  }
}

/**
 * Renders a single test report as a styled PDF that mirrors the on-screen
 * admin detail page (title + type badge, stat cards, Top 5 Performers,
 * full rankings table) — deliberately separate from the generic flat-table
 * exporter in report-export.ts, since that one intentionally doesn't try
 * to match any particular screen's visual design.
 */
export async function buildTestReportPdf(
  report: TestReportDetail,
  typeLabel: string
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: MARGIN, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const contentWidth = doc.page.width - MARGIN * 2;

  // --- Title + type badge ---
  doc.font("Helvetica-Bold").fontSize(19).fillColor(INK);
  const titleY = doc.y;
  doc.text(report.title, MARGIN, titleY, { continued: false });
  const titleWidth = doc.widthOfString(report.title);

  doc.font("Helvetica").fontSize(9);
  const badgePadX = 7;
  const badgeTextWidth = doc.widthOfString(typeLabel);
  const badgeX = MARGIN + titleWidth + 12;
  const badgeY = titleY + 4;
  doc.roundedRect(badgeX, badgeY, badgeTextWidth + badgePadX * 2, 16, 3).fill(PARCHMENT_100);
  doc.fillColor(INK).text(typeLabel, badgeX + badgePadX, badgeY + 4);

  doc.y = titleY + 26;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(INK_MUTED)
    .text(
      `${report.courseCode} — ${report.courseName} · ${report.batchName} · ${report.createdAt}`,
      MARGIN,
      doc.y
    );
  doc.moveDown(1.2);

  // --- Stat cards ---
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 58;
  const cardsY = doc.y;
  statCard(doc, MARGIN, cardsY, cardWidth, cardHeight, "Total Students", String(report.totalStudents));
  statCard(
    doc,
    MARGIN + (cardWidth + cardGap),
    cardsY,
    cardWidth,
    cardHeight,
    "Average Score",
    `${report.averagePercentage}%`
  );
  statCard(
    doc,
    MARGIN + (cardWidth + cardGap) * 2,
    cardsY,
    cardWidth,
    cardHeight,
    `Pass Rate (>=${report.passingPercentage}%)`,
    `${report.passRate}%`
  );
  statCard(
    doc,
    MARGIN + (cardWidth + cardGap) * 3,
    cardsY,
    cardWidth,
    cardHeight,
    "Highest Score",
    `${report.highestPercentage}%`
  );
  doc.y = cardsY + cardHeight + 22;

  // --- Top 5 Performers ---
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text("Top 5 Performers", MARGIN, doc.y);
  doc.moveDown(0.6);

  if (report.topPerformers.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(INK_MUTED).text("No students yet.");
    doc.moveDown(1);
  } else {
    report.topPerformers.forEach((p) => {
      ensureSpace(doc, 30);
      const rowY = doc.y;
      const circleR = 9;
      doc.circle(MARGIN + circleR, rowY + circleR, circleR).fill(GOLD_BG);
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(GOLD)
        .text(String(p.rank), MARGIN, rowY + circleR - 5, { width: circleR * 2, align: "center" });

      const textX = MARGIN + circleR * 2 + 10;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(p.name, textX, rowY, {
        width: contentWidth - circleR * 2 - 10 - 70,
      });
      const detailParts: string[] = [];
      if (p.correct !== null && p.incorrect !== null) {
        detailParts.push(`${p.correct} correct · ${p.incorrect} incorrect`);
      }
      if (p.timeRaw) detailParts.push(formatTimeRaw(p.timeRaw));
      if (detailParts.length > 0) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(INK_MUTED)
          .text(detailParts.join(" · "), textX, rowY + 13, {
            width: contentWidth - circleR * 2 - 10 - 70,
          });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(INK)
        .text(`${p.percentage}%`, MARGIN + contentWidth - 60, rowY + 2, {
          width: 60,
          align: "right",
        });

      doc.y = rowY + 28;
      doc
        .moveTo(MARGIN, doc.y)
        .lineTo(MARGIN + contentWidth, doc.y)
        .lineWidth(0.5)
        .strokeColor(BORDER)
        .stroke();
      doc.y += 6;
    });
  }

  doc.moveDown(0.6);

  // --- Complete Rankings table ---
  ensureSpace(doc, 40);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text("Complete Rankings", MARGIN, doc.y);
  doc.moveDown(0.6);

  const columns: { key: string; label: string; width: number }[] = [
    { key: "rank", label: "Rank", width: 40 },
    { key: "name", label: "Name", width: 150 },
    { key: "score", label: "Score", width: 55 },
    { key: "correct", label: "Correct", width: 55 },
    { key: "incorrect", label: "Incorrect", width: 60 },
    { key: "time", label: "Time", width: 60 },
    { key: "status", label: "Status", width: contentWidth - 40 - 150 - 55 - 55 - 60 - 60 },
  ];

  function drawTableHeader() {
    const y = doc.y;
    doc.rect(MARGIN, y, contentWidth, 20).fill(INK);
    let x = MARGIN;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#FAF9F6");
    columns.forEach((c) => {
      doc.text(c.label, x + 6, y + 6, { width: c.width - 6 });
      x += c.width;
    });
    doc.y = y + 20;
  }

  drawTableHeader();

  report.entries.forEach((e, i) => {
    if (doc.y + 18 > doc.page.height - MARGIN) {
      doc.addPage();
      doc.y = MARGIN;
      drawTableHeader();
    }
    const y = doc.y;
    if (i % 2 === 1) {
      doc.rect(MARGIN, y, contentWidth, 18).fill(PARCHMENT_100);
    }
    let x = MARGIN;
    doc.font("Helvetica").fontSize(8).fillColor(INK);
    const values: Record<string, string> = {
      rank: String(e.rank),
      name: e.name + (e.studentId ? "" : " (no account)"),
      score: `${e.percentage}%`,
      correct: e.correct !== null ? String(e.correct) : "—",
      incorrect: e.incorrect !== null ? String(e.incorrect) : "—",
      time: formatTimeRaw(e.timeRaw),
      status: e.status === "PASS" ? "Pass" : "Needs Improvement",
    };
    columns.forEach((c) => {
      if (c.key === "correct") doc.fillColor(SUCCESS);
      else if (c.key === "incorrect") doc.fillColor(ERROR);
      else if (c.key === "status") doc.fillColor(e.status === "PASS" ? SUCCESS : GOLD);
      else doc.fillColor(INK);
      doc.text(values[c.key] ?? "", x + 6, y + 5, { width: c.width - 6 });
      x += c.width;
    });
    doc.y = y + 18;
  });

  doc.end();
  return done;
}
