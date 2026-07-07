import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ComplaintService, ComplaintResponse } from '@/services/complaint.service';
import { Loader2, AlertCircle } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="text-slate-500 mt-1">Manage and track your reported issues.</p>
        </div>
        <Link to="/dashboard/report" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          New Complaint
        </Link>
      </div>
      
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-4 text-slate-500">Loading complaints...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl border-dashed">
          <h3 className="text-lg font-medium text-slate-900">No complaints yet</h3>
          <p className="text-slate-500 mt-1">When you report an issue, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {complaints.map(complaint => (
            <div key={complaint._id} className="p-6 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row gap-4 flex-grow">
                {complaint.images && complaint.images.length > 0 && (
                  <div className="relative w-full sm:w-32 h-32 sm:h-auto rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                    <img src={complaint.images[0].url} alt={complaint.title} className="w-full h-full object-cover" />
                    {complaint.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                        +{complaint.images.length - 1}
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      complaint.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500 capitalize">{complaint.category}</span>
                    <span className="text-sm text-slate-400">• {new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">{complaint.title}</h3>
                  <p className="text-slate-500 mt-1 line-clamp-2">{complaint.description}</p>
                </div>
              </div>
              <div className="shrink-0">
                <Link to={`/dashboard/complaints/${complaint._id}`} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap transition-colors block text-center">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
