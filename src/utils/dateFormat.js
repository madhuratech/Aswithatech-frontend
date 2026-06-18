export function toDmy(str) {
  if (!str || typeof str !== "string") return "";
  const parts = str.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return str;
}

export function toYmd(str) {
  if (!str || typeof str !== "string") return "";
  const parts = str.split("-");
  if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return str;
}
