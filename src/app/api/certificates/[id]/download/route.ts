import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCertificateForDownload } from "@/lib/data/certificates";
import { buildCertificatePdf } from "@/lib/utils/certificate-pdf";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const certificate = await getCertificateForDownload(params.id, session.user.id);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  const pdfBuffer = await buildCertificatePdf({
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    courseCode: certificate.courseCode,
    certificateNumber: certificate.certificateNumber,
    verificationCode: certificate.verificationCode,
    issuedAt: certificate.issuedAt,
  });

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`,
    },
  });
}
