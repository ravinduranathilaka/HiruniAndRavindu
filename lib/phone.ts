export const SRI_LANKAN_PHONE_NUMBER = /^\+94\d{9}$/;

export function normalizeSriLankanPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0094")) digits = digits.slice(4);
  else if (digits.startsWith("94")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `+94${digits}`;
}
