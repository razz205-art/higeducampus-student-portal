/**
 * Derives display initials for avatar fallbacks: "Jordan Lee" -> "JL",
 * a single name -> its first letter, falling back to the email's first
 * character, and finally "?" if neither is available.
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    const initials = `${first}${last}`.toUpperCase();
    if (initials) return initials;
  }
  if (email && email.trim()) {
    return email.trim()[0]!.toUpperCase();
  }
  return "?";
}
