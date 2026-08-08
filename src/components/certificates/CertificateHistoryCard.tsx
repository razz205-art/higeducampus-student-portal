import Link from "next/link";
import { History, Download, ShieldCheck } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { CertificateItem } from "@/types/certificate";

export default function CertificateHistoryCard({
  certificates,
}: {
  certificates: CertificateItem[];
}) {
  return (
    <DashboardCard title="Certificate History" icon={History} bodyClassName="p-0">
      {certificates.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No certificates issued yet.</p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {certificates.map((cert) => (
            <li key={cert.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {cert.courseCode} — {cert.courseName}
                </p>
                <p className="mt-0.5 text-xs text-ink-900/45">
                  {cert.certificateNumber} · Issued {cert.issuedAt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/verify/${cert.verificationCode}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs font-medium text-gold-600 hover:underline"
                >
                  <ShieldCheck size={13} aria-hidden="true" />
                  Verify
                </Link>
                <a
                  href={`/api/certificates/${cert.id}/download`}
                  className="flex items-center gap-1.5 rounded-sm border border-ink-900/15 px-3 py-1.5 text-xs font-medium text-ink-900 transition-colors hover:bg-ink-900/5"
                >
                  <Download size={13} aria-hidden="true" />
                  PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
