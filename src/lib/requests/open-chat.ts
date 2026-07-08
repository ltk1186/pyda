export function readKakaoOpenChatUrl(
  env?: { KAKAO_OPEN_CHAT_URL?: string | undefined },
) {
  const value = (env ? env.KAKAO_OPEN_CHAT_URL : process.env.KAKAO_OPEN_CHAT_URL)
    ?.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
