export default function Complaints() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="text-slate-500 mt-1">Manage and track your reported issues.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          New Complaint
        </button>
      </div>
      
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl border-dashed">
        <h3 className="text-lg font-medium text-slate-900">No complaints yet</h3>
        <p className="text-slate-500 mt-1">When you report an issue, it will appear here.</p>
      </div>
    </div>
  );
}
