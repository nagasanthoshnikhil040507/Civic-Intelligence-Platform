import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ComplaintService, ComplaintResponse } from '@/services/complaint.service';
import { Loader2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function Complaints() {
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await ComplaintService.getMyComplaints();
        setComplaints(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load complaints.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Complaints</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Manage and track your reported issues.</p>
        </div>
        <Link 
          to="/dashboard/report" 
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          New Complaint
        </Link>
      </div>
      
      {isLoading ? (
        <GlassCard className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-4 text-slate-500 font-medium">Loading your history...</p>
        </GlassCard>
      ) : error ? (
        <GlassCard variant="alert" className="p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="font-medium text-red-800 dark:text-red-300">{error}</p>
        </GlassCard>
      ) : complaints.length === 0 ? (
        <GlassCard className="p-16 text-center border-dashed flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No complaints yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">When you report a civic issue, you'll be able to track its progress here.</p>
          <Link to="/dashboard/report" className="mt-6 px-6 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
            Report your first issue
          </Link>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {complaints.map(complaint => (
            <GlassCard key={complaint._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6" hoverEffect>
              <div className="flex flex-col sm:flex-row gap-5 flex-grow">
                {complaint.images && complaint.images.length > 0 ? (
                  <div className="relative w-full sm:w-36 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm">
                    <img src={complaint.images[0].url} alt={complaint.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                    {complaint.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                        +{complaint.images.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full sm:w-36 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                
                <div className="flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge type="status" value={complaint.status} />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{complaint.category}</span>
                    <span className="text-sm text-slate-400">• {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{complaint.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2 text-sm">{complaint.description}</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <Link 
                  to={`/dashboard/complaints/${complaint._id}`} 
                  className="group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-xl transition-colors"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
