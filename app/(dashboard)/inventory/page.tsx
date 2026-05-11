export default function InventoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
        <p className="text-slate-500 mt-1">
          Track and manage your resale inventory here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <p className="text-slate-400 text-sm">
          No inventory items yet. This section is coming soon.
        </p>
      </div>
    </div>
  );
}
