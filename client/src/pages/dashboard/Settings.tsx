export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage platform preferences and notifications.</p>
      </div>
      
      <div className="max-w-2xl p-6 bg-white border border-slate-200 rounded-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-500">Receive updates about your complaints</p>
            </div>
            <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center p-1 justify-end">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
