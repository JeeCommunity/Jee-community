import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstName(fullName?: string | null): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '';
  const first = parts[0];
  const titles = ['mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'dr', 'dr.', 'prof', 'prof.', 'sir', 'madam'];
  if (titles.includes(first.toLowerCase()) && parts.length > 1) {
    return parts[1];
  }
  return first;
}

export function playNotificationSound() {
  // Sound removed as per user request
}

export function getLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
