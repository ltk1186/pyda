const fallbackPath = "/";

export function sanitizeNextPath(value: string | string[] | null | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return fallbackPath;
  }

  try {
    const decoded = decodeURIComponent(candidate);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return fallbackPath;
    }

    if (hasProtocol(decoded)) {
      return fallbackPath;
    }

    return decoded;
  } catch {
    return fallbackPath;
  }
}

function hasProtocol(value: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}
