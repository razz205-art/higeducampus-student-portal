import Image from "next/image";
import { ExternalLink, FileText, Link2, LinkIcon, Video } from "lucide-react";
import type { Metadata } from "next";
import {
  getShareLinkPreview,
  getSharedMaterialsByToken,
  type SharedMaterial,
} from "@/lib/data/material-share";

// Intentionally public — no auth. Admins share these links (e.g. on
// WhatsApp) with people who don't have a portal account.
export const dynamic = "force-dynamic";
const PREVIEW_IMAGE = {
  url: "https://portal.higeducampus.in/og-share.png",
  width: 1200,
  height: 630,
  alt: "HiG EDU CAMPUS",
};

// Link previews (WhatsApp, etc.) show the full HiG EDU CAMPUS logo and the
// link's own title and note instead of the generic site icon and title.
export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const preview = await getShareLinkPreview(params.token).catch(() => null);
  const title = preview?.title ?? "Study Materials";
  const description = preview?.note
    ? preview.note.slice(0, 200)
    : "Study materials shared by HiG EDUCAMPUS";
  return {
    title: { absolute: `${title} | HiG EDUCAMPUS` },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: "HiG EDUCAMPUS",
      type: "website",
      images: [PREVIEW_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [PREVIEW_IMAGE.url] },
  };
}

const TYPE_LABEL: Record<SharedMaterial["type"], string> = {
  DOCUMENT: "Document",
  VIDEO: "Video",
  LINK: "Link",
};

function TypeIcon({ type }: { type: SharedMaterial["type"] }) {
  const Icon = type === "VIDEO" ? Video : type === "LINK" ? Link2 : FileText;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink-900/[0.06] text-ink-900/70">
      <Icon size={16} aria-hidden="true" />
    </span>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="-mt-4 mb-2 text-center">
          <Image
            src="/hig-educampus-logo.png"
            alt="HiG EDUCAMPUS"
            width={280}
            height={280}
            className="mx-auto h-auto w-44"
            priority
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function SharedMaterialsPage({ params }: { params: { token: string } }) {
  const result = await getSharedMaterialsByToken(params.token);

  if (result.status !== "ok") {
    const message =
      result.status === "expired"
        ? "This link has expired."
        : result.status === "disabled"
          ? "This link has been turned off."
          : "This link isn't valid. Please check it and try again.";
    return (
      <Shell>
        <div className="rounded-sm border border-white/10 bg-parchment-50 p-8 text-center shadow-2xl">
          <LinkIcon size={22} className="mx-auto mb-3 text-ink-900/40" aria-hidden="true" />
          <p className="text-sm font-medium text-ink-900">{message}</p>
          <p className="mt-1 text-xs text-ink-900/50">
            Contact HiG EDUCAMPUS if you need access to these materials.
          </p>
        </div>
      </Shell>
    );
  }

  // Group by chapter, keeping the order the admin chose.
  const groups: { name: string | null; items: SharedMaterial[] }[] = [];
  for (const m of result.materials) {
    const name = m.chapterTitle;
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }
  const showHeadings = groups.length > 1 || groups[0]?.name;

  return (
    <Shell>
      <div className="rounded-sm border border-white/10 bg-parchment-50 p-6 shadow-2xl sm:p-8">
        <h1 className="font-serif text-2xl font-extrabold text-ink-900">{result.title}</h1>
        {result.note && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-900/70">
            {result.note}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-900/40">
          {result.materials.length} item{result.materials.length === 1 ? "" : "s"}
        </p>

        {result.materials.length === 0 ? (
          <p className="mt-6 text-sm text-ink-900/50">
            The materials in this link are no longer available.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((g, i) => (
              <section key={g.name ?? `none-${i}`} className="space-y-2">
                {showHeadings && (
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                    {g.name ?? "Other materials"}
                  </h2>
                )}
                <ul className="divide-y divide-ink-900/[0.08] rounded-sm border border-ink-900/10 bg-white">
                  {g.items.map((m) => (
                    <li key={m.id}>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gold-500/5"
                      >
                        <TypeIcon type={m.type} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink-900">
                            {m.title}
                          </span>
                          {m.description && (
                            <span className="mt-0.5 block text-xs text-ink-900/60">
                              {m.description}
                            </span>
                          )}
                          <span className="mt-0.5 block text-xs text-ink-900/40">
                            {TYPE_LABEL[m.type]}
                            {m.fileSize && ` · ${m.fileSize}`}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-gold-600">
                          Open <ExternalLink size={13} aria-hidden="true" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-parchment-50/40">Shared by HiG EDUCAMPUS</p>
    </Shell>
  );
}
