import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComplaintService, ComplaintResponse } from '@/services/complaint.service';
import { Loader2, Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AssignedComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'assigned', // Default filter for this view
    category: '',
    priority: '',
  });

  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(filters.keyword), 500);
    return () => clearTimeout(timer);
  }, [filters.keyword]);

  useEffect(() => {
    fetchComplaints();
  }, [page, debouncedKeyword, filters.status, filters.category, filters.priority]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const queryParams: any = { page, limit };
      
      if (debouncedKeyword) queryParams.keyword = debouncedKeyword;
      if (filters.status) queryParams.status = filters.status;
      if (filters.category) queryParams.category = filters.category;
      if (filters.priority) queryParams.priority = filters.priority;

      const result = await ComplaintService.getComplaintsPaginated(queryParams);
      
      if (result && result.data) {
        setComplaints(result.data);
        setTotalPages(result.totalPages || 1);
        setTotal(result.total || 0);
      } else {
        const raw = await ComplaintService.getMyComplaints(queryParams);
        setComplaints(raw);
        setTotalPages(1);
        setTotal(raw.length);
      }
    } catch (error) {
      console.error('Failed to fetch complaints', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Complaints</h1>
          <p className="text-slate-500 mt-1">Complaints currently assigned to you or your department.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, title, or description..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={filters.keyword}
            onChange={(e) => { setFilters(prev => ({ ...prev, keyword: e.target.value })); setPage(1); }}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filters.status}
            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select 
            className="flex-1 md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filters.priority}
            onChange={(e) => { setFilters(prev => ({ ...prev, priority: e.target.value })); setPage(1); }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">ID & Title</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    <p className="mt-2 text-slate-500">Loading complaints...</p>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No assigned complaints found.
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]" title={complaint.title}>
                        {complaint.title}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        #{complaint._id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-600">
                      {complaint.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {complaint.department ? complaint.department.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${getStatusBadge(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/officer/complaints/${complaint._id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-medium text-slate-900">{total}</span> results
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
