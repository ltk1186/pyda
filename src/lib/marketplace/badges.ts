export function shouldShowSampleBadge(value: {
  isSample: boolean;
  creator?: { isSample: boolean };
}) {
  return value.isSample || value.creator?.isSample === true;
}
