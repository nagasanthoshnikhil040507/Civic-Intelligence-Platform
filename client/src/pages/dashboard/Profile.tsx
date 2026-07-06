export default function Profile() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information.</p>
      </div>
      
      <div className="max-w-2xl p-6 bg-white border border-slate-200 rounded-xl">
        <div className="space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/4"></div>
          <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
          <div className="h-4 bg-slate-100 rounded w-1/3 mt-6"></div>
          <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
        </div>
      </div>
    </div>
  );
}
