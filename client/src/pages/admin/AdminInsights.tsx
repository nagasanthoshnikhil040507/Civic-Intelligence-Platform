import { useEffect, useState } from 'react';
import { AdminService } from '@/services/admin.service';
import { 
  Activity, AlertTriangle, Layers, BrainCircuit,
  FileText, ArrowRight, ShieldAlert, Loader2, CheckCircle2,
  RefreshCw, Network, Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const res = await AdminService.getAiInsights();
      setInsights(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyzing Intelligence Data</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aggregating platform-wide metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
        <GlassCard variant="alert" className="p-8 flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Insight Generation Failed</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={fetchInsights}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Analysis
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            AI Intelligence Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Automated intelligence and system overview.</p>
        </div>
        
        <button 
          onClick={fetchInsights}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="AI Processing Rate"
          value={insights.aiOverview ? `${insights.aiOverview.processingRate.toFixed(1)}%` : '0%'}
          icon={<Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          trend={{ value: insights.aiOverview ? `${insights.aiOverview.aiProcessedCount} of ${insights.aiOverview.totalComplaints} analyzed` : '0 of 0 analyzed', isPositive: true }}
        />
        <StatCard
          title="Duplicate Intelligence"
          value={insights.duplicateIntelligence?.totalDuplicates || 0}
          icon={<Network className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          trend={insights.duplicateIntelligence?.totalDuplicates > 0 ? { value: 'Duplicates flagged by AI', isPositive: false } : undefined}
        />
        <StatCard
          title="Critical Unresolved"
          value={insights.highPriorityUnresolved?.length || 0}
          icon={<ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />}
          trend={insights.highPriorityUnresolved?.length > 0 ? { value: 'Requires immediate action', isPositive: false } : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Trends */}
        <GlassCard className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-500" />
              Category Trends
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Volume</span>
          </div>
          
          <div className="space-y-6 flex-1">
            {insights.categoryTrends?.map((item: any) => {
              const maxCount = Math.max(...insights.categoryTrends.map((c: any) => c.count));
              const width = `${(item.count / maxCount) * 100}%`;
              return (
                <div key={item._id} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item._id.replace('_', ' ')}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width }}></div>
                  </div>
                </div>
              );
            })}
            {(!insights.categoryTrends || insights.categoryTrends.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full space-y-3 py-12 text-slate-400 dark:text-slate-500">
                <Lightbulb className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium italic">No category data available.</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* High Priority Unresolved */}
        <GlassCard className="p-8 flex flex-col h-full border-red-200/50 dark:border-red-900/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              Critical Action Queue
            </h3>
            <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {insights.highPriorityUnresolved?.length || 0} Issues
            </span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '450px' }}>
            {insights.highPriorityUnresolved?.map((complaint: any) => (
              <Link 
                to={`/admin/complaints/${complaint._id}`} 
                key={complaint._id}
                className="block p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3 gap-4">
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug">
                    {complaint.title}
                  </h4>
                  <StatusBadge type="priority" value={complaint.priority || 'high'} className="shrink-0" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                    <FileText className="w-3 h-3" />
                    <span className="capitalize">{complaint.category.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    View Case <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
            {(!insights.highPriorityUnresolved || insights.highPriorityUnresolved.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-base text-slate-600 dark:text-slate-400 font-semibold">Zero critical unresolved issues.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
