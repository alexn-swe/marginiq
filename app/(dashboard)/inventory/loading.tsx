// Next.js automatically wraps page.tsx in a <Suspense> boundary using this file.
// It shows while the server is awaiting the database query.

export default function InventoryLoading() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
        <p className="text-slate-500 mt-1">
          Manage and track all your resale inventory items.
        </p>
      </div>

      {/* Summary card skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse"
          >
            <div className="h-3.5 bg-slate-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 animate-pulse">
        <div className="h-9 bg-slate-200 rounded w-full" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 border-b border-slate-100 px-4 flex items-center gap-4"
          >
            <div className="h-3.5 bg-slate-200 rounded flex-1" />
            <div className="h-3.5 bg-slate-200 rounded w-20" />
            <div className="h-3.5 bg-slate-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
