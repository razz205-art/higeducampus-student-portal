"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Paperclip, CheckCircle2 } from "lucide-react";
import { submitAssignmentAction } from "@/lib/actions/assignments";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import { getEmbedInfo } from "@/lib/utils/embed";
import type { StudentAssignmentItem } from "@/lib/data/assignments";

function AttachmentPreview({ url, type }: { url: string; type: "DOCUMENT" | "VIDEO" | "LINK" }) {
  const embed = getEmbedInfo(url);
  if (embed.kind === "youtube" || embed.kind === "drive") {
    return (
      <div className="mt-3 aspect-video w-full overflow-hidden rounded-sm border border-ink-900/10">
        <iframe
          src={embed.embedUrl}
          title="Reference material"
          className="h-full w-full"
          allowFullScreen
        />
      </div>
    );
  }
  if (embed.kind === "pdf") {
    return (
      <iframe
        src={embed.url}
        title="Reference material"
        className="mt-3 h-72 w-full rounded-sm border border-ink-900/10"
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:underline"
    >
      <Paperclip size={13} aria-hidden="true" />
      {type === "DOCUMENT"
        ? "Open reference document"
        : type === "VIDEO"
          ? "Watch reference video"
          : "Open reference link"}
    </a>
  );
}

function SubmissionForm({ assignmentId }: { assignmentId: string }) {
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await submitAssignmentAction({
        assignmentId,
        submissionUrl: submissionUrl || undefined,
        submissionNote: submissionNote || undefined,
      });
      setResult(res);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-2.5 rounded-sm border border-ink-900/10 bg-ink-900/[0.02] p-3"
    >
      {result && (
        <p className={`text-xs ${result.success ? "text-signal-success" : "text-signal-error"}`}>
          {result.message}
        </p>
      )}
      <input
        value={submissionUrl}
        onChange={(e) => setSubmissionUrl(e.target.value)}
        placeholder="Link to your work (Drive, GitHub, doc, etc.) — optional"
        type="url"
        className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm"
      />
      <textarea
        value={submissionNote}
        onChange={(e) => setSubmissionNote(e.target.value)}
        placeholder="Or write your answer here directly — optional"
        rows={3}
        className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-sm bg-ink-900 px-4 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800 disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit assignment"}
      </button>
    </form>
  );
}

function AssignmentRow({ item }: { item: StudentAssignmentItem }) {
  const [showForm, setShowForm] = useState(false);
  const isOverdue = !item.submission && new Date(item.dueDate) < new Date();

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900">{item.title}</p>
          <p className="mt-0.5 text-xs text-ink-900/45">
            {item.courseCode} — {item.courseName} · Due {item.dueDate} · {item.maxScore} pts
          </p>
        </div>
        {item.submission ? (
          item.submission.status === "GRADED" ? (
            <Badge variant="success">
              Graded: {item.submission.score}/{item.maxScore}
            </Badge>
          ) : (
            <Badge variant="info">Submitted</Badge>
          )
        ) : isOverdue ? (
          <Badge variant="danger">Overdue</Badge>
        ) : (
          <Badge variant="warning">Not submitted</Badge>
        )}
      </div>

      {item.instructions && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-900/70">{item.instructions}</p>
      )}

      {item.attachmentUrl && item.attachmentType && (
        <AttachmentPreview url={item.attachmentUrl} type={item.attachmentType} />
      )}

      {item.submission && (
        <div className="mt-3 rounded-sm border border-ink-900/10 bg-ink-900/[0.02] p-3 text-xs text-ink-900/60">
          <p className="flex items-center gap-1.5 font-medium text-ink-900/70">
            <CheckCircle2 size={13} className="text-signal-success" aria-hidden="true" />
            Your submission — {item.submission.submittedAt}
          </p>
          {item.submission.submissionUrl && (
            <a
              href={item.submission.submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-gold-600 hover:underline"
            >
              {item.submission.submissionUrl}
            </a>
          )}
          {item.submission.submissionNote && (
            <p className="mt-1 whitespace-pre-wrap">{item.submission.submissionNote}</p>
          )}
        </div>
      )}

      {item.submission?.status !== "GRADED" && (
        <div className="mt-2">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-medium text-gold-600 hover:underline"
            >
              {item.submission ? "Update submission" : "Submit assignment"}
            </button>
          ) : (
            <SubmissionForm assignmentId={item.id} />
          )}
        </div>
      )}
    </li>
  );
}

export default function AssignmentList({ items }: { items: StudentAssignmentItem[] }) {
  return (
    <DashboardCard title="Assignments" icon={ClipboardList} bodyClassName="p-0">
      {items.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No assignments yet.</p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {items.map((item) => (
            <AssignmentRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
