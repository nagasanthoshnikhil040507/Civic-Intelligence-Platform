import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminTransferRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [rejectNote, setRejectNote] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [error, setError] = useState('');

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['transfer-request', id],
    queryFn: () => AdminService.getTransferRequestDetails(id!),
    enabled: !!id
  });

  const { data: officersData, isLoading: isLoadingOfficers } = useQuery({
    queryKey: ['department-officers-workload', request?.department],
    queryFn: () => AdminService.getDepartmentOfficersWorkload(request!.department),
    enabled: !!request?.department && request.status === 'PENDING'
  });

  const approveMutation = useMutation({
    mutationFn: () => AdminService.approveTransferRequest(id!, selectedOfficer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-request'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      navigate('/admin/transfer-requests');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to approve transfer');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => AdminService.rejectTransferRequest(id!, rejectNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-request'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      navigate('/admin/transfer-requests');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to reject transfer');
    }
  });

  if (isLoadingRequest) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  if (!request) return <div className="text-center p-12 text-slate-500 font-medium">Request not found</div>;

  const officers = Array.isArray(officersData) ? officersData : [];
  const minWorkload = officers.length > 0 ? Math.min(...officers.map((o: any) => o.workload?.activeWorkload || 0)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button 
        className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" 
        onClick={() => navigate('/admin/transfer-requests')}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Transfer Requests
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Transfer Request Review</h1>
        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
          request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
          request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
          'bg-slate-100 text-slate-800'
        }`}>
          {request.status}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Complaint Information</h2>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Complaint Title</p>
              <p className="font-medium text-slate-900 mt-0.5">{request.complaintId?.title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Category & Department</p>
              <p className="font-medium text-slate-900 mt-0.5">{request.complaintId?.category} / {request.department}</p>
            </div>
            <div className="pt-2">
              <button 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors w-full sm:w-auto"
                onClick={() => navigate(`/admin/complaints/${request.complaintId?._id}`)}
              >
                View Full Complaint Details
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4 bg-amber-50/30 border-amber-200/50">
          <h2 className="text-lg font-bold text-slate-900 border-b border-amber-200/50 pb-2">Transfer Details</h2>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Requested By</p>
              <p className="font-medium text-slate-900 mt-0.5">{request.requestedByOfficerId?.firstName} {request.requestedByOfficerId?.lastName}</p>
              <p className="text-sm text-slate-500">{request.requestedByOfficerId?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Requested On</p>
              <p className="font-medium text-slate-900 mt-0.5">{format(new Date(request.createdAt), 'PPpp')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Reason for Transfer</p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 mt-1.5 text-sm text-slate-800 whitespace-pre-wrap">
                {request.reason}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {request.status === 'PENDING' && (
        <GlassCard className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Admin Decision</h2>
          
          <div className="grid lg:grid-cols-2 gap-8 pt-2">
            {/* Approval Side */}
            <div className="space-y-4 border-r border-slate-100 pr-4">
              <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Option 1: Approve & Reassign
              </h3>
              <p className="text-sm text-slate-600">Select an eligible replacement officer from the {request.department} department.</p>
              
              {isLoadingOfficers ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : officers.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-center text-sm font-medium">
                  No active officers found in this department.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {officers.filter((o: any) => {
                    const currentOfficerId = request.requestedByOfficerId?._id || request.requestedByOfficerId;
                    return String(o._id) !== String(currentOfficerId);
                  }).map((off: any) => (
                    <div 
                      key={off._id}
                      onClick={() => setSelectedOfficer(off._id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedOfficer === off._id 
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-900 text-sm">
                          {off.firstName} {off.lastName}
                        </div>
                        {(off.workload?.activeWorkload === minWorkload && officers.length > 1) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            Lowest Workload
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active</p>
                          <p className="text-sm font-black text-indigo-600">{off.workload?.activeWorkload || 0}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total</p>
                          <p className="text-sm font-black text-slate-700">{off.workload?.totalAssigned || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                disabled={!selectedOfficer || approveMutation.isPending || rejectMutation.isPending}
                onClick={() => approveMutation.mutate()}
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Approve & Reassign
              </button>
            </div>

            {/* Rejection Side */}
            <div className="space-y-4 pl-4">
              <h3 className="font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Option 2: Reject Transfer
              </h3>
              <p className="text-sm text-slate-600">The complaint will be unlocked and returned to {request.requestedByOfficerId?.firstName}.</p>
              
              <div className="space-y-2 mt-6">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Rejection Note (Required)</label>
                <textarea 
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full min-h-[120px] p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none transition-all text-sm"
                  placeholder="Explain why this transfer request is denied..."
                />
              </div>

              <button 
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-4"
                disabled={rejectNote.trim().length < 5 || rejectMutation.isPending || approveMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reject Transfer Request
              </button>
            </div>
          </div>
        </GlassCard>
      )}
      
      {request.status !== 'PENDING' && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Admin Decision Record</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Status</p>
              <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
                request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {request.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Reviewed On</p>
              <p className="font-medium text-slate-900 mt-0.5">{request.reviewedAt ? format(new Date(request.reviewedAt), 'PPpp') : 'Unknown'}</p>
            </div>
            {request.status === 'APPROVED' && request.targetOfficerId && (
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Reassigned To</p>
                <p className="font-bold text-emerald-700 mt-0.5">Officer ID: {request.targetOfficerId}</p>
              </div>
            )}
            {request.status === 'REJECTED' && (
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Rejection Note</p>
                <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 mt-1.5 text-sm font-medium">
                  {request.adminDecisionNote || 'No note provided'}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
