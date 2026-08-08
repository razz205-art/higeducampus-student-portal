"use client";

import { useState, useTransition } from "react";
import { Award, Download } from "lucide-react";
import { issueCertificateAction } from "@/lib/actions/certificates";

export default function IssueCertificateButton({
  courseId,
  initialCertificateId,
}: {
  courseId: string;
  initialCertificateId: string | null;
}) {
  const [certificateId, setCertificateId] = useState(initialCertificateId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (certificateId) {
      window.location.href = `/api/certificates/${certificateId}/download`;
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await issueCertificateAction(courseId);
      if (res.success && res.certificateId) {
        setCertificateId(res.certificateId);
        window.location.href = `/api/certificates/${res.certificateId}/download`;
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 transition-colors hover:bg-ink-800 disabled:opacity-60"
      >
        {certificateId ? (
          <>
            <Download size={13} aria-hidden="true" />
            Download Certificate
          </>
        ) : (
          <>
            <Award size={13} aria-hidden="true" />
            {isPending ? "Generating…" : "Generate Certificate"}
          </>
        )}
      </button>
      {error && <p className="text-xs text-signal-error">{error}</p>}
    </div>
  );
}
