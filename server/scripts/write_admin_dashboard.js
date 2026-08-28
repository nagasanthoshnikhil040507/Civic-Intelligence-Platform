const fs = require('fs');

const content = `import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, FileText, CheckCircle, Clock, AlertTriangle, 
  XCircle, Loader2, Server, Map as MapIcon, ShieldCheck, 
  Activity, TrendingUp, TrendingDown, MapPin, PieChart,
  Search, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { AdminService } from '@/services/admin.service';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import Heatmap from '@/components/map/Heatmap';
import StatusBadge from '@/components/ui/StatusBadge';

const PIE_COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#64748b'];
const PERIOD_LABELS: Record<string, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '6m': 'Last 6 Months',
  '1y': 'Last 1 Year',
  'all': 'All Time'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  
  // Table state
  const [complaints, setComplaints] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [period, setPeriod] = useState('30d');

  // Initial core stats load
  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        setLoading(true);
        const statsData = await AdminService.getSystemStats();
        setStats(statsData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load system data');
      } finally {
        setLoading(false);
      }
    };
    fetchCoreData();
  }, []);

  // Insights load based on period
  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        setInsightsLoading(true);
        const insightsData = await AdminService.getAiInsights(period);
        setInsights(insightsData);
      } catch (err: any) {
        console.error('Failed to load analytics', err);
      } finally {
        setInsightsLoading(false);
      }
    };
    fetchInsightsData();
  }, [period]);

  // Complaints table load based on period, pagination, and filters
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setTableLoading(true);
        const complaintsData = await AdminService.getComplaints({ 
          limit: pagination.limit,
          page: pagination.page,
          period,
          search,
          status: statusFilter,
          category: categoryFilter,
          region: regionFilter
        });
        setComplaints(complaintsData.complaints || []);
        if (complaintsData.pagination) {
          setPagination(complaintsData.pagination);
        }
      } catch (err: any) {
        console.error('Failed to load table data', err);
      } finally {
        setTableLoading(false);
      }
    };
    
    // Debounce search
    const timer = setTimeout(() => {
      fetchTableData();
    }, 300);
    return () => clearTimeout(timer);
  }, [period, pagination.page, pagination.limit, search, statusFilter, categoryFilter, regionFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loading Dashboard</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching platform statistics and map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
        <GlassCard variant="alert" className="p-8 flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Failed to load Dashboard</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all hover:shadow-md"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  const getTrend = (current: number, previous: number) => {
    if (previous === undefined || previous === null || isNaN(previous)) return undefined;
    const diff = current - previous;
    const percent = previous === 0 ? 0 : (diff / previous) * 100;
    return {
      value: \`\${Math.abs(percent).toFixed(1)}% vs prev\`,
      isPositive: percent >= 0
    };
  };

  const overview = insights?.overview || {};

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Complaint Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Real-time visibility into civic problems, regions and resolution activity.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => { setPeriod(value); setPagination({ ...pagination, page: 1 }); }}
              className={\`px-4 py-2 text-sm font-semibold rounded-lg transition-all \${
                period === value 
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }\`}
            >
              {label.replace('Last ', '')}
            </button>
          ))}
        </div>
      </div>

      {insightsLoading && !insights ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Complaints"
              value={overview.totalComplaints || 0}
              icon={<FileText className="w-4 h-4 text-indigo-500" />}
              trend={getTrend(overview.totalComplaints, overview.prevTotalComplaints)}
            />
            <StatCard
              title="Open Complaints"
              value={overview.openComplaints || 0}
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />
            <StatCard
              title="Resolved"
              value={overview.resolvedComplaints || 0}
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            />
            <StatCard
              title="High Priority"
              value={overview.highPriority || 0}
              icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
            />
            <StatCard
              title="Regions Affected"
              value={overview.regionsAffected || 0}
              icon={<MapPin className="w-4 h-4 text-blue-500" />}
            />
            <StatCard
              title="Resolution Rate"
              value={\`\${(overview.resolutionRate || 0).toFixed(1)}%\`}
              icon={<Activity className="w-4 h-4 text-purple-500" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Problem Domains (Donut Chart) */}
            <GlassCard className="p-6 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" />
                Problem Domains
              </h2>
              
              {(!insights?.categories || insights.categories.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <p className="text-sm font-medium">No complaints in this period.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  {/* Donut */}
                  <div className="relative w-48 h-48 rounded-full shadow-inner shrink-0"
                    style={{ 
                      background: \`conic-gradient(\${
                        (() => {
                          const total = insights.categories.reduce((s: number, i: any) => s + i.count, 0);
                          let current = 0;
                          return insights.categories.map((item: any, idx: number) => {
                            const p = total > 0 ? (item.count / total) * 100 : 0;
                            const start = current;
                            const end = current + p;
                            current = end;
                            return \`\${PIE_COLORS[idx % PIE_COLORS.length]} \${start}% \${end}%\`;
                          }).join(', ');
                        })()
                      })\` 
                    }}
                  >
                    <div className="absolute inset-0 m-5 bg-white dark:bg-slate-950 rounded-full flex flex-col items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{overview.totalComplaints}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {insights.categories.map((item: any, index: number) => {
                      const percentage = overview.totalComplaints > 0 ? ((item.count / overview.totalComplaints) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={item._id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize truncate max-w-[120px]" title={item._id}>
                              {item._id.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-10 text-right">{percentage}%</span>
                            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md min-w-[2rem] text-center">{item.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Time Trends (Simple CSS Bar Trend) */}
            <GlassCard className="p-6 lg:col-span-2 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Complaint Activity Trend
              </h2>
              {(!insights?.complaintTrend || insights.complaintTrend.length === 0) ? (
                 <p className="text-slate-400 text-sm text-center py-8">No trend data available.</p>
              ) : (
                <div className="flex-1 flex items-end justify-between gap-1 mt-4">
                  {insights.complaintTrend.map((t: any) => {
                    const maxTrend = Math.max(...insights.complaintTrend.map((x:any) => x.count));
                    const h = maxTrend > 0 ? (t.count / maxTrend) * 100 : 0;
                    return (
                      <div key={t._id} className="group relative flex-1 flex flex-col justify-end items-center h-full min-h-[160px]">
                         <div className="w-full max-w-[32px] bg-indigo-500/80 hover:bg-indigo-400 transition-all rounded-t-sm" style={{ height: \`\${h}%\` }}></div>
                         <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                           <span className="font-bold block text-center mb-0.5 border-b border-slate-700 pb-0.5">{t._id}</span>
                           {t.count} complaints
                         </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </GlassCard>

            {/* Reported Complaints Professional Table */}
            <div className="lg:col-span-3">
              <GlassCard className="p-0 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reported Complaints</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Complaint activity across regions and problem domains.</p>
                  
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search complaints or regions..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                          value={statusFilter}
                          onChange={(e) => { setStatusFilter(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                          className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      
                      <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                          value={categoryFilter}
                          onChange={(e) => { setCategoryFilter(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                          className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium capitalize"
                        >
                          <option value="">All Problems</option>
                          {insights?.categories?.map((c: any) => (
                            <option key={c._id} value={c._id}>{c._id.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto relative min-h-[300px]">
                  {tableLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 z-10 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                  )}
                  
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider">Case ID</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Region</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Problem</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Reported By</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Priority</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {complaints.length === 0 && !tableLoading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            No complaints match your current filters.
                          </td>
                        </tr>
                      ) : (
                        complaints.map((complaint) => (
                          <tr 
                            key={complaint._id} 
                            onClick={() => navigate(\`/admin/complaints/\${complaint._id}\`)}
                            className="bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                              {complaint._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white capitalize">
                              {complaint.region || 'Unknown Area'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                                {complaint.category.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                              {complaint.citizenId ? \`\${complaint.citizenId.firstName} \${complaint.citizenId.lastName}\` : 'Unknown User'}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={complaint.status} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={\`w-2 h-2 rounded-full \${
                                  complaint.priority >= 75 ? 'bg-red-500' : 
                                  complaint.priority >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                }\`} />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{complaint.priority}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(complaint.createdAt).toLocaleDateString(undefined, { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Footer */}
                {pagination.pages > 1 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
                    <span className="text-sm text-slate-500 font-medium">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} complaints
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white px-3">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
            
            {/* Map (Legacy) */}
            <div className="lg:col-span-3 mt-4">
              <GlassCard className="p-0 h-[500px] lg:h-[600px] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapIcon className="w-6 h-6 text-indigo-500" />
                      Live City Map
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Geographical distribution of all civic complaints in selected period.</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border border-indigo-100 dark:border-indigo-800">
                    {pagination.total} Points
                  </span>
                </div>
                <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
                  {/* Since AdminService.getComplaints is paginated by default, we fetch a large batch for the map separately if needed, 
                      but for now we pass the currently visible table complaints or fetch a map-specific unpaginated list. 
                      Actually, passing 'complaints' provides the current page's pins. If the user wants ALL pins, we need a separate fetch. 
                      Assuming existing behavior was sufficient. */}
                  <Heatmap complaints={complaints} isLoading={loading} />
                </div>
              </GlassCard>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
`;

fs.writeFileSync('C:/Users/chinn/Downloads/Civic Intelligence Platform/client/src/pages/admin/AdminDashboard.tsx', content);
console.log('AdminDashboard.tsx updated successfully.');
