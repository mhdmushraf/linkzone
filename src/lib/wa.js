export function waLink(number) {
  if (!number) return null;
  const digits = String(number).replace(/[^0-9]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}