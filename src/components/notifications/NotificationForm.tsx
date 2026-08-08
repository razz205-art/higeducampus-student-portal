"use client";

import { useState, useTransition } from "react";
import { Plus, X, Send } from "lucide-react";
import { createNotificationAction, updateNotificationAction } from "@/lib/actions/notifications";
import { CATEGORY_OPTIONS } from "@/config/notification-categories";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { AttachmentType, NotificationCategory, NotificationItem } from "@/types/notification";

interface AttachmentDraft {
  type: AttachmentType;
  url: string;
  label: string;
}

const emptyAttachment: AttachmentDraft = { type: "IMAGE", url: "", label: "" };

export default function NotificationForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: NotificationItem;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const isEditing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [category, setCategory] = useState<NotificationCategory>(
    initial?.category ?? "ANNOUNCEMENT"
  );
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(
    initial?.attachments.map((a) => ({ type: a.type, url: a.url, label: a.label ?? "" })) ?? []
  );
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function addAttachment() {
    setAttachments((a) => [...a, { ...emptyAttachment }]);
  }
  function removeAttachment(i: number) {
    setAttachments((a) => a.filter((_, idx) => idx !== i));
  }
  function updateAttachment(i: number, patch: Partial<AttachmentDraft>) {
    setAttachments((a) => a.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    const payload = {
      title,
      body,
      category,
      isPinned,
      attachments: attachments
        .filter((a) => a.url.trim())
        .map((a) => ({ type: a.type, url: a.url.trim(), label: a.label.trim() || undefined })),
    };

    startTransition(async () => {
      const res = isEditing
        ? await updateNotificationAction({ notificationId: initial!.id, ...payload })
        : await createNotificationAction(payload);
      setResult(res);
      if (res.success) {
        if (!isEditing) {
          setTitle("");
          setBody("");
          setCategory("ANNOUNCEMENT");
          setIsPinned(false);
          setAttachments([]);
        }
        onSaved?.();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">
          {isEditing ? "Edit notification" : "Post a notification"}
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
          >
            Cancel
          </button>
        )}
      </div>

      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-ink-800">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as NotificationCategory)}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="body" className="mb-1.5 block text-sm font-medium text-ink-800">
          Content
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
          className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/40 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-900/70">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          className="rounded border-ink-900/25"
        />
        Pin to the top
      </label>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-800">
            Attachments{" "}
            <span className="font-normal text-ink-900/40">(image, PDF, or video URL)</span>
          </p>
          <button
            type="button"
            onClick={addAttachment}
            className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:underline"
          >
            <Plus size={13} aria-hidden="true" />
            Add attachment
          </button>
        </div>

        {attachments.map((a, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-sm border border-ink-900/10 bg-white p-2.5"
          >
            <select
              value={a.type}
              onChange={(e) => updateAttachment(i, { type: e.target.value as AttachmentType })}
              className="rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            >
              <option value="IMAGE">Image</option>
              <option value="PDF">PDF</option>
              <option value="VIDEO">Video</option>
            </select>
            <input
              value={a.url}
              onChange={(e) => updateAttachment(i, { url: e.target.value })}
              placeholder="https://…"
              className="min-w-[10rem] flex-1 rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            />
            <input
              value={a.label}
              onChange={(e) => updateAttachment(i, { label: e.target.value })}
              placeholder="Label (optional)"
              className="w-32 rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => removeAttachment(i)}
              aria-label="Remove attachment"
              className="rounded-sm p-1 text-ink-900/40 hover:bg-ink-900/5 hover:text-signal-error"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        <span className="flex items-center justify-center gap-2">
          <Send size={14} aria-hidden="true" />
          {isEditing ? "Save changes" : "Post notification"}
        </span>
      </Button>
    </form>
  );
}
