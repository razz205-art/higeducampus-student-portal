import { Search } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/config/notification-categories";
import type { NotificationCategory, NotificationFilter } from "@/types/notification";

export default function NotificationFilterBar({
  search,
  category,
  filter,
}: {
  search?: string;
  category?: NotificationCategory;
  filter?: NotificationFilter;
}) {
  return (
    <form
      method="GET"
      action="/notifications"
      className="flex flex-wrap items-end gap-3 rounded-sm border border-ink-900/10 bg-white p-4 shadow-sm"
    >
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="q" className="mb-1 block text-xs font-medium text-ink-900/60">
          Search
        </label>
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-900/30"
            aria-hidden="true"
          />
          <input
            id="q"
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search notifications…"
            className="w-full rounded-sm border border-ink-900/15 bg-white py-2 pl-8 pr-3 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-xs font-medium text-ink-900/60">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category ?? ""}
          className="rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter" className="mb-1 block text-xs font-medium text-ink-900/60">
          Status
        </label>
        <select
          id="filter"
          name="filter"
          defaultValue={filter ?? "all"}
          className="rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="pinned">Pinned</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-ink-800"
      >
        Apply
      </button>
    </form>
  );
}
