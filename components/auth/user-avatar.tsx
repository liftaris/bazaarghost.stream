export function initials(name: string) {
  return Array.from(name.trim()).slice(0, 2).join("").toUpperCase() || "?";
}
