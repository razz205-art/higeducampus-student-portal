/**
 * Detects whether a study-material URL can be shown inline on the portal
 * itself (a real YouTube/Vimeo embed player, a Google Drive preview frame,
 * a direct video file, or a direct PDF) instead of sending the student
 * away to another site. Falls back to "none" for anything else (a plain
 * external link is still the right answer for a generic resource page).
 */
export type EmbedInfo =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "drive"; embedUrl: string }
  | { kind: "video"; url: string }
  | { kind: "pdf"; url: string }
  | { kind: "none" };

export function getEmbedInfo(url: string): EmbedInfo {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.pathname.startsWith("/embed/")
        ? parsed.pathname.split("/embed/")[1]
        : parsed.searchParams.get("v");
      if (videoId) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }
    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (videoId) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }

    // Google Drive: drive.google.com/file/d/FILE_ID/view -> /preview embed
    if (host === "drive.google.com") {
      const match = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      if (match) {
        return { kind: "drive", embedUrl: `https://drive.google.com/file/d/${match[1]}/preview` };
      }
    }

    // Direct file links.
    const lower = parsed.pathname.toLowerCase();
    if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg")) {
      return { kind: "video", url };
    }
    if (lower.endsWith(".pdf")) {
      return { kind: "pdf", url };
    }
  } catch {
    // Not a valid URL — fall through to "none".
  }

  return { kind: "none" };
}
