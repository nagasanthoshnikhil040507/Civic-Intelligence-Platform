import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loader2, ArrowRightLeft, FileText, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminTransferRequests() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('PENDING');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['transfer-requests', filter],
    queryFn: () => AdminService.getTransferRequests({ status: filter === 'ALL' ? undefined : filter }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transfer Requests</h1>
          <p className="text-muted-foreground">Review and manage officer complaint transfer requests</p>
        </div>
        
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === status ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        </div>
      ) : requests?.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <ArrowRightLeft className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">No Transfer Requests Found</h3>
          <p className="text-slate-500 mt-2">
            There are no {filter !== 'ALL' ? filter.toLowerCase() : ''} transfer requests at this time.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {requests?.map((req: any) => (
            <GlassCard key={req._id} className="p-6">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-sm text-slate-500">
                      Requested {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                        <User className="w-4 h-4" />
                        Requested By
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {req.requestedByOfficerId?.firstName} {req.requestedByOfficerId?.lastName}
                        <div className="text-slate-500 font-normal">{req.requestedByOfficerId?.email}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                        <Building2 className="w-4 h-4" />
                        Department
                      </div>
                      <div className="text-sm font-medium text-slate-900">{req.department}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                      <FileText className="w-4 h-4" />
                      Reason for Transfer
                    </div>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-100">{req.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  <button 
                    onClick={() => navigate(`/admin/transfer-requests/${req._id}`)}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      req.status === 'PENDING' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {req.status === 'PENDING' ? 'Review Request' : 'View Details'}
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/complaints/${req.complaintId?._id}`)}
                    className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View Complaint
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
