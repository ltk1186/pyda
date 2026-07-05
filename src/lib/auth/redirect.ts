const fallbackPath = "/";
const internalOrigin = "https://pyda.local";

export function sanitizeNextPath(value: string | string[] | null | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return fallbackPath;
  }

  try {
    const decoded = decodeRepeatedly(candidate);

    if (decoded.includes("\\")) {
      return fallbackPath;
    }

    const parsed = new URL(decoded, internalOrigin);

    if (
      parsed.origin !== internalOrigin ||
      !decoded.startsWith("/") ||
      decoded.startsWith("//")
    ) {
      return fallbackPath;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}

function decodeRepeatedly(value: string) {
  let current = value;

  for (let index = 0; index < 5; index += 1) {
    const decoded = decodeURIComponent(current);

    if (decoded === current) {
      return decoded;
    }

    current = decoded;
  }

  return current;
}
