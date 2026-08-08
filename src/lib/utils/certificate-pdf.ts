import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface CertificateData {
  studentName: string;
  courseName: string;
  courseCode: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: Date;
}

const INK = "#12203D";
const GOLD = "#B98B3E";
const MUTED = "#6B7280";

export async function buildCertificatePdf(data: CertificateData): Promise<Buffer> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verificationUrl = `${appUrl}/verify/${data.verificationCode}`;

  const qrBuffer = await QRCode.toBuffer(verificationUrl, {
    type: "png",
    margin: 1,
    color: { dark: INK, light: "#FFFFFF" },
    width: 200,
  });

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Outer + inner decorative border.
  doc
    .rect(24, 24, pageWidth - 48, pageHeight - 48)
    .lineWidth(2)
    .stroke(INK);
  doc
    .rect(34, 34, pageWidth - 68, pageHeight - 68)
    .lineWidth(0.75)
    .stroke(GOLD);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(GOLD)
    .text("HIG EDUCAMPUS", 0, 70, { align: "center", characterSpacing: 3 });

  doc
    .font("Times-Bold")
    .fontSize(34)
    .fillColor(INK)
    .text("Certificate of Completion", 0, 100, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(MUTED)
    .text("This is to certify that", 0, 165, { align: "center" });

  doc
    .font("Times-Bold")
    .fontSize(30)
    .fillColor(INK)
    .text(data.studentName, 0, 190, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(MUTED)
    .text("has successfully completed the course", 0, 235, { align: "center" });

  doc
    .font("Times-Bold")
    .fontSize(20)
    .fillColor(INK)
    .text(`${data.courseCode} — ${data.courseName}`, 60, 262, {
      align: "center",
      width: pageWidth - 120,
    });

  const issuedLabel = data.issuedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(MUTED)
    .text(`Issued on ${issuedLabel}`, 0, 310, { align: "center" });

  // Certificate number + QR, bottom row.
  const bottomY = pageHeight - 130;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(INK)
    .text(`Certificate No. ${data.certificateNumber}`, 70, bottomY);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      "Scan the QR code or visit the link below to verify this certificate.",
      70,
      bottomY + 18,
      { width: 280 }
    );
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GOLD)
    .text(verificationUrl, 70, bottomY + 48, { width: 300 });

  const qrSize = 90;
  doc.image(qrBuffer, pageWidth - 70 - qrSize, bottomY - 10, { width: qrSize, height: qrSize });

  doc.end();
  return done;
}
