import { FileText, Play } from "lucide-react";
import type { NotificationAttachmentItem } from "@/types/notification";

export default function AttachmentPreview({
  attachment,
}: {
  attachment: NotificationAttachmentItem;
}) {
  if (attachment.type === "IMAGE") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-sm border border-ink-900/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external, arbitrary admin-provided URLs; next/image would require allow-listing every domain */}
        <img
          src={attachment.url}
          alt={attachment.label ?? "Attachment image"}
          className="h-32 w-full object-cover"
        />
      </a>
    );
  }

  if (attachment.type === "PDF") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 rounded-sm border border-ink-900/10 bg-ink-900/[0.02] px-3 py-2.5 text-sm text-ink-900 transition-colors hover:bg-ink-900/5"
      >
        <FileText size={16} className="shrink-0 text-signal-error" aria-hidden="true" />
        <span className="truncate">{attachment.label ?? "View PDF"}</span>
      </a>
    );
  }

  // VIDEO
  return (
    <div className="overflow-hidden rounded-sm border border-ink-900/10 bg-ink-950">
      <video controls className="max-h-64 w-full" preload="metadata">
        <source src={attachment.url} />
        Your browser doesn&rsquo;t support embedded video.{" "}
        <a href={attachment.url} className="underline">
          Open the video
        </a>{" "}
        instead.
      </video>
      {attachment.label && (
        <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-parchment-50/60">
          <Play size={11} aria-hidden="true" />
          {attachment.label}
        </p>
      )}
    </div>
  );
}
