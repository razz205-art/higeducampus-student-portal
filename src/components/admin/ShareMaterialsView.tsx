"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Link2,
  MessageCircle,
  Power,
  Trash2,
  Video,
} from "lucide-react";
import {
  createShareLinkAction,
  deleteShareLinkAction,
  setShareLinkActiveAction,
} from "@/lib/actions/material-share";
import type { MaterialItem } from "@/lib/data/materials";
import type { ShareLinkSummary } from "@/lib/data/material-share";
import type { CourseOption } from "@/types/attendance";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

const fieldClass =
  "w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

const IST = "Asia/Kolkata";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const todayIst = () => new Date().toLocaleDateString("en-CA", { timeZone: IST });

function TypeIcon({ type }: { type: MaterialItem["type"] }) {
  const Icon = type === "VIDEO" ? Video : type === "LINK" ? Link2 : FileText;
  return <Icon size={14} className="shrink-0 text-ink-900/40" aria-hidden="true" />;
}

function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked — the link is still visible to copy by hand */
        }
      }}
      className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function whatsappHref(title: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}

interface ChapterGroup {
  key: string;
  courseName: string;
  chapterName: string;
  order: number;
  items: MaterialItem[];
}

export default function ShareMaterialsView({
  materials,
  courses,
  links,
}: {
  materials: MaterialItem[];
  courses: CourseOption[];
  links: ShareLinkSummary[];
}) {
  const router = useRouter();
  const origin = useOrigin();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>(courses[0]?.id ?? "all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ variant: "success" | "error"; text: string } | null>(null);
  const [created, setCreated] = useState<{ title: string; url: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const groups = useMemo<ChapterGroup[]>(() => {
    const visible =
      courseFilter === "all" ? materials : materials.filter((m) => m.courseId === courseFilter);
    const map = new Map<string, ChapterGroup>();
    for (const m of visible) {
      const key = `${m.courseId}:${m.moduleId ?? "none"}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          courseName: m.courseName,
          chapterName: m.moduleName ?? "Other materials",
          order: m.moduleOrder ?? Number.MAX_SAFE_INTEGER,
          items: [],
        });
      }
      map.get(key)!.items.push(m);
    }
    const list = Array.from(map.values());
    for (const g of list) g.items.sort((a, b) => a.title.localeCompare(b.title));
    return list.sort((a, b) =>
      a.courseName === b.courseName ? a.order - b.order : a.courseName.localeCompare(b.courseName)
    );
  }, [materials, courseFilter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(g: ChapterGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = g.items.every((m) => next.has(m.id));
      for (const m of g.items) {
        if (allOn) next.delete(m.id);
        else next.add(m.id);
      }
      return next;
    });
  }

  function create() {
    setNotice(null);
    // Order the link's materials by course → chapter → title, as shown here.
    const order = new Map<string, number>();
    const all = [...materials].sort((a, b) =>
      a.courseName === b.courseName
        ? (a.moduleOrder ?? Number.MAX_SAFE_INTEGER) - (b.moduleOrder ?? Number.MAX_SAFE_INTEGER) ||
          a.title.localeCompare(b.title)
        : a.courseName.localeCompare(b.courseName)
    );
    all.forEach((m, i) => order.set(m.id, i));
    const ids = Array.from(selected).sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));

    startTransition(async () => {
      const res = await createShareLinkAction({
        title,
        note: note || undefined,
        materialIds: ids,
        expiresOn,
      });
      if (res.success && res.token) {
        setCreated({ title, url: `${origin}/shared/${res.token}` });
        setTitle("");
        setNote("");
        setExpiresOn("");
        setSelected(new Set());
        router.refresh();
      } else {
        setNotice({ variant: "error", text: res.message });
      }
    });
  }

  function setActive(id: string, active: boolean) {
    startTransition(async () => {
      const res = await setShareLinkActiveAction(id, active);
      setNotice({ variant: res.success ? "success" : "error", text: res.message });
      router.refresh();
    });
  }

  function remove(id: string) {
    setConfirmDelete(null);
    startTransition(async () => {
      const res = await deleteShareLinkAction(id);
      setNotice({ variant: res.success ? "success" : "error", text: res.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <section className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">Create a share link</h2>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">Link title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Developmental Psychology – Chapter 4 notes"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">
              Expires <span className="font-normal text-ink-900/40">(optional)</span>
            </span>
            <input
              type="date"
              value={expiresOn}
              min={todayIst()}
              onChange={(e) => setExpiresOn(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-ink-800">
              Note for viewers <span className="font-normal text-ink-900/40">(optional)</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Read these before Saturday's class."
              className={fieldClass}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 pt-4">
          <span className="text-sm font-medium text-ink-800">Choose materials</span>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className={`${fieldClass} w-auto`}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
            <option value="all">All courses</option>
          </select>
        </div>

        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-900/40">
            No study materials in this course yet.
          </p>
        ) : (
          <div className="max-h-[460px] space-y-3 overflow-auto pr-1">
            {groups.map((g) => {
              const allOn = g.items.every((m) => selected.has(m.id));
              const someOn = !allOn && g.items.some((m) => selected.has(m.id));
              return (
                <div key={g.key} className="rounded-sm border border-ink-900/10">
                  <label className="flex cursor-pointer items-center gap-2 border-b border-ink-900/10 bg-ink-900/[0.03] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allOn}
                      ref={(el) => {
                        if (el) el.indeterminate = someOn;
                      }}
                      onChange={() => toggleGroup(g)}
                      className="h-4 w-4 accent-ink-900"
                    />
                    <span className="text-xs font-semibold text-ink-900">{g.chapterName}</span>
                    {courseFilter === "all" && (
                      <span className="text-xs text-ink-900/40">· {g.courseName}</span>
                    )}
                    <span className="ml-auto text-xs text-ink-900/40">
                      {g.items.length} item{g.items.length === 1 ? "" : "s"}
                    </span>
                  </label>
                  <ul className="divide-y divide-ink-900/[0.06]">
                    {g.items.map((m) => (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-gold-500/5">
                          <input
                            type="checkbox"
                            checked={selected.has(m.id)}
                            onChange={() => toggle(m.id)}
                            className="h-4 w-4 accent-ink-900"
                          />
                          <TypeIcon type={m.type} />
                          <span className="min-w-0 flex-1 truncate text-sm text-ink-900/80">
                            {m.title}
                          </span>
                          {m.fileSize && (
                            <span className="text-xs text-ink-900/40">{m.fileSize}</span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={create}
            isLoading={isPending}
            disabled={selected.size === 0 || title.trim().length < 2}
            className="sm:w-auto sm:px-8"
          >
            Create link{selected.size > 0 ? ` (${selected.size} selected)` : ""}
          </Button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
            >
              Clear selection
            </button>
          )}
        </div>

        {created && (
          <div className="space-y-2 rounded-sm border border-signal-success/30 bg-signal-success/5 p-4">
            <p className="text-sm font-semibold text-ink-900">
              Link ready — anyone with it can view the materials, no login needed.
            </p>
            <input
              readOnly
              value={created.url}
              onFocus={(e) => e.currentTarget.select()}
              className={`${fieldClass} font-mono text-xs`}
            />
            <div className="flex flex-wrap items-center gap-4">
              <CopyButton text={created.url} />
              <a
                href={whatsappHref(created.title, created.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
              >
                <MessageCircle size={13} aria-hidden="true" />
                Share on WhatsApp
              </a>
              <a
                href={created.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
              >
                <ExternalLink size={13} aria-hidden="true" />
                Open
              </a>
            </div>
          </div>
        )}
      </section>

      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

      {/* Existing links */}
      <section className="space-y-3 rounded-sm border border-ink-900/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">
          Share links <span className="font-normal text-ink-900/40">({links.length})</span>
        </h2>
        {links.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-900/40">No share links yet.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((l) => {
              const url = `${origin}/shared/${l.token}`;
              const expired = !!l.expiresAt && new Date(l.expiresAt).getTime() < Date.now();
              return (
                <li key={l.id} className="space-y-2 rounded-sm border border-ink-900/10 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{l.title}</p>
                      <p className="text-xs text-ink-900/50">
                        {l.materialCount} material{l.materialCount === 1 ? "" : "s"}
                        {l.missingCount > 0 && ` (${l.missingCount} since deleted)`} · created{" "}
                        {fmtDate(l.createdAt)}
                        {l.createdByName && ` by ${l.createdByName}`} · opened {l.viewCount} time
                        {l.viewCount === 1 ? "" : "s"}
                        {l.lastViewedAt && ` (last ${fmtDate(l.lastViewedAt)})`}
                        {l.expiresAt &&
                          ` · ${expired ? "expired" : "expires"} ${fmtDate(l.expiresAt)}`}
                      </p>
                    </div>
                    {!l.isActive ? (
                      <Badge variant="neutral">Off</Badge>
                    ) : expired ? (
                      <Badge variant="danger">Expired</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="truncate font-mono text-xs text-ink-900/40">{url}</span>
                    <CopyButton text={url} label="Copy" />
                    <a
                      href={whatsappHref(l.title, url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
                    >
                      <MessageCircle size={13} aria-hidden="true" />
                      WhatsApp
                    </a>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
                    >
                      <ExternalLink size={13} aria-hidden="true" />
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => setActive(l.id, !l.isActive)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900 disabled:opacity-50"
                    >
                      <Power size={13} aria-hidden="true" />
                      {l.isActive ? "Turn off" : "Turn on"}
                    </button>
                    {confirmDelete === l.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          className="font-semibold text-signal-error hover:underline"
                        >
                          Delete permanently
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="text-ink-900/50 hover:text-ink-900"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(l.id)}
                        className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-signal-error"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
