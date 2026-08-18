import { useEffect, useState } from 'react';
import { AdminService } from '@/services/admin.service';
import { 
  Sparkles, Activity, AlertTriangle, Layers, BrainCircuit,
  FileText, ArrowRight, ShieldAlert, Loader2, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const res = await AdminService.getAiInsights();
        setInsights(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load AI insights');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Analyzing platform intelligence...</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Failed to load AI Insights</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform AI Insights</h1>
            <p className="text-sm text-slate-500">Automated intelligence and system overview</p>
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Layers className="w-16 h-16 text-indigo-600" /></div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">AI Processing Rate</h3>
          <p className="text-3xl font-bold text-slate-900">
            {insights.aiOverview?.processingRate.toFixed(1)}%
          </p>
          <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {insights.aiOverview?.aiProcessedCount} of {insights.aiOverview?.totalComplaints} complaints analyzed
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-amber-600" /></div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">Duplicate Intelligence</h3>
          <p className="text-3xl font-bold text-slate-900">
            {insights.duplicateIntelligence?.totalDuplicates}
          </p>
          <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Potential duplicates flagged by AI
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-16 h-16 text-red-600" /></div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">Critical Unresolved</h3>
          <p className="text-3xl font-bold text-slate-900">
            {insights.highPriorityUnresolved?.length || 0}
          </p>
          <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
            <Activity className="w-3 h-3" />
            High priority complaints pending action
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Category Trends
          </h3>
          <div className="space-y-4 flex-1">
            {insights.categoryTrends?.map((item: any) => {
              const maxCount = Math.max(...insights.categoryTrends.map((c: any) => c.count));
              const width = `${(item.count / maxCount) * 100}%`;
              return (
                <div key={item._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 capitalize">{item._id.replace('_', ' ')}</span>
                    <span className="text-slate-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width }}></div>
                  </div>
                </div>
              );
            })}
            {(!insights.categoryTrends || insights.categoryTrends.length === 0) && (
              <p className="text-sm text-slate-500 italic text-center mt-8">No category data available.</p>
            )}
          </div>
        </div>

        {/* High Priority Unresolved */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            High Priority Action Required
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
            {insights.highPriorityUnresolved?.map((complaint: any) => (
              <Link 
                to={`/admin/complaints/${complaint._id}`} 
                key={complaint._id}
                className="block p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 pr-4">
                    {complaint.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 shrink-0 uppercase">
                    {complaint.priority || 'HIGH'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span className="capitalize">{complaint.category.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform">
                    View <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
            {(!insights.highPriorityUnresolved || insights.highPriorityUnresolved.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full space-y-3 py-12">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <p className="text-sm text-slate-500 font-medium">No critical unresolved issues.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
