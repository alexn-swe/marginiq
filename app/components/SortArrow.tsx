type SortDir = "asc" | "desc";

export default function SortArrow({
  field,
  sortField,
  sortDir,
}: {
  field: string;
  sortField: string;
  sortDir: SortDir;
}) {
  if (sortField !== field) {
    return <span className="ml-1 text-slate-300">↕</span>;
  }
  return (
    <span className="ml-1 text-indigo-600">
      {sortDir === "asc" ? "↑" : "↓"}
    </span>
  );
}
