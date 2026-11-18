/**
 * Branding options for public study-material share pages only. The LMS
 * itself always uses HiG EDUCAMPUS branding; this just lets an individual
 * share link show a different logo (e.g. Sahal Razi's Power BI training).
 */

export type ShareBrandKey = "HIG" | "SAHAL_RAZI";

export interface ShareBrand {
  key: ShareBrandKey;
  label: string; // shown in the admin picker
  name: string; // used in page titles, link previews, footer
  logo: { src: string; width: number; height: number; className: string };
  previewImage: { url: string; width: number; height: number };
  theme: "dark" | "light";
}

export const SHARE_BRANDS: Record<ShareBrandKey, ShareBrand> = {
  HIG: {
    key: "HIG",
    label: "HiG EDUCAMPUS",
    name: "HiG EDUCAMPUS",
    logo: {
      src: "/hig-educampus-logo.png",
      width: 280,
      height: 280,
      className: "mx-auto -mt-4 mb-2 h-auto w-44",
    },
    previewImage: {
      url: "https://portal.higeducampus.in/og-share.png",
      width: 1200,
      height: 630,
    },
    theme: "dark",
  },
  SAHAL_RAZI: {
    key: "SAHAL_RAZI",
    label: "Sahal Razi – Learning & Development",
    name: "Sahal Razi",
    logo: {
      src: "/brands/sahal-razi-logo.png",
      width: 900,
      height: 679,
      className: "mx-auto mb-6 h-auto w-64 sm:w-72",
    },
    previewImage: {
      url: "https://portal.higeducampus.in/brands/sahal-razi-og.jpg",
      width: 1200,
      height: 630,
    },
    theme: "light",
  },
};

export const SHARE_BRAND_KEYS = Object.keys(SHARE_BRANDS) as ShareBrandKey[];

export function getShareBrand(key: string | null | undefined): ShareBrand {
  return SHARE_BRANDS[(key as ShareBrandKey) ?? "HIG"] ?? SHARE_BRANDS.HIG;
}
