export function isPublishedMarketplaceListing(row: {
  status: string;
  creators:
    | {
        status: string | null;
      }
    | Array<{
        status: string | null;
      }>
    | null;
}) {
  const creator = Array.isArray(row.creators) ? row.creators[0] : row.creators;

  return row.status === "published" && creator?.status === "published";
}
