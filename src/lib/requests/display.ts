export function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function formatPreferredSchedule(
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate && !endDate) {
    return "선택 안 함";
  }

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate ? `${startDate} 이후` : `${endDate} 이전`;
}
