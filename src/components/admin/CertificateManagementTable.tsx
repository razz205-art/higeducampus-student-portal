"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ShieldOff, ShieldCheck as ShieldCheckIcon, Award } from "lucide-react";
import { revokeCertificateAction, restoreCertificateAction } from "@/lib/actions/certificates";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { AdminCertificateRow } from "@/lib/data/certificates";

function Row({ certificate }: { certificate: AdminCertificateRow }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(() => {
      if (certificate.isRevoked) {
        restoreCertificateAction(certificate.id);
      } else {
        if (!confirm(`Revoke certificate ${certificate.certificateNumber}?`)) return;
        revokeCertificateAction(certificate.id);
      }
    });
  }

  return (
    <tr className={certificate.isRevoked ? "opacity-60" : ""}>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{certificate.studentName}</p>
        <p className="text-xs text-ink-900/45">{certificate.certificateNumber}</p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">
        {certificate.courseCode} — {certificate.courseName}
      </td>
      <td className="px-5 py-3 text-ink-900/60">{certificate.issuedAt}</td>
      <td className="px-5 py-3">
        <Badge variant={certificate.isRevoked ? "danger" : "success"}>
          {certificate.isRevoked ? "Revoked" : "Valid"}
        </Badge>
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/verify/${certificate.verificationCode}`}
            target="_blank"
            className="text-xs font-medium text-gold-600 hover:underline"
          >
            View
          </Link>
          <button
            onClick={toggle}
            disabled={isPending}
            aria-label={certificate.isRevoked ? "Restore" : "Revoke"}
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-50"
          >
            {certificate.isRevoked ? (
              <ShieldCheckIcon size={15} aria-hidden="true" />
            ) : (
              <ShieldOff size={15} aria-hidden="true" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CertificateManagementTable({
  certificates,
}: {
  certificates: AdminCertificateRow[];
}) {
  return (
    <DashboardCard title="Issued Certificates" icon={Award} bodyClassName="p-0">
      {certificates.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No certificates issued yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Issued</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {certificates.map((c) => (
                <Row key={c.id} certificate={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
