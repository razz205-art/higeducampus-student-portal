type ClassValue = string | number | false | null | undefined;

/**
 * Minimal className joiner — avoids pulling in `clsx` for one small task.
 * Falsy values (false/null/undefined/"") are dropped, everything else is
 * space-joined in order, so later classes still win with Tailwind's normal
 * "last one wins for the same property" cascade.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
