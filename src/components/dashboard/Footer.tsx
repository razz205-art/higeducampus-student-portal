import { siteConfig } from "@/config/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-900/10 bg-white">
      <div className="flex flex-col gap-2 px-4 py-5 text-xs text-ink-900/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          &copy; {year} {siteConfig.name}. All rights reserved.
        </p>
        <p>Built for students, faculty, and administrators.</p>
      </div>
    </footer>
  );
}
