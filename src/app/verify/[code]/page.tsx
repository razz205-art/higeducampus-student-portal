import { ShieldCheck, ShieldX, GraduationCap } from "lucide-react";
import { getCertificateByVerificationCode } from "@/lib/data/certificates";

export const metadata = { title: "Certificate Verification" };

// Intentionally public — no auth. Anyone who scans a certificate's QR
// code (an employer, another institution, etc.) needs to verify it
// without a HiG EDUCAMPUS account.
export default async function VerifyCertificatePage({ params }: { params: { code: string } }) {
  const result = await getCertificateByVerificationCode(params.code);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-gold-500/15 text-gold-400">
            <GraduationCap size={22} aria-hidden="true" />
          </span>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            HiG EDUCAMPUS
          </p>
          <h1 className="font-serif text-2xl font-semibold text-parchment-50">
            Certificate Verification
          </h1>
        </div>

        <div className="rounded-sm border border-white/10 bg-parchment-50 p-8 shadow-2xl">
          {result.valid ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 rounded-sm border border-signal-success/30 bg-signal-success/10 px-3.5 py-2.5 text-signal-success">
                <ShieldCheck size={18} aria-hidden="true" />
                <span className="text-sm font-medium">This certificate is valid.</span>
              </div>

              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-900/50">Certificate No.</dt>
                  <dd className="font-medium text-ink-900">{result.certificateNumber}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-900/50">Awarded to</dt>
                  <dd className="font-medium text-ink-900">{result.studentName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-900/50">Course</dt>
                  <dd className="text-right font-medium text-ink-900">
                    {result.courseCode} — {result.courseName}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-900/50">Issued</dt>
                  <dd className="font-medium text-ink-900">{result.issuedAt}</dd>
                </div>
              </dl>
            </div>
          ) : result.revoked ? (
            <div className="flex items-center gap-2.5 rounded-sm border border-signal-error/30 bg-signal-error/10 px-3.5 py-2.5 text-signal-error">
              <ShieldX size={18} aria-hidden="true" />
              <span className="text-sm font-medium">
                This certificate has been revoked and is no longer valid.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-sm border border-signal-error/30 bg-signal-error/10 px-3.5 py-2.5 text-signal-error">
              <ShieldX size={18} aria-hidden="true" />
              <span className="text-sm font-medium">
                This certificate could not be verified. The link may be incorrect or the certificate
                may not exist.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
