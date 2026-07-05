import { PLATFORM_FILTERS, type PlatformFilter } from "./types";

export function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAudienceSize(size: number | null) {
  if (size === null) {
    return null;
  }

  if (size >= 10000) {
    return `${Math.round(size / 1000) / 10}만`;
  }

  return new Intl.NumberFormat("ko-KR").format(size);
}

export function normalizePlatformFilter(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (PLATFORM_FILTERS.includes(candidate as PlatformFilter)) {
    return candidate as PlatformFilter;
  }

  return "전체";
}
