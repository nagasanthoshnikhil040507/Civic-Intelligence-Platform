import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import { Loader2, ArrowLeft, MapPin, Calendar, User, Shield, Clock, FileText, Printer, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { generateOfficialReport } from '@/utils/pdfReportGenerator';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getDepartmentForCategory } from '@/utils/departmentMapping';
import { AdminReportReview } from '@/components/complaints/AdminReportReview';

export default function AdminComplaintDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [officers, setOfficers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (complaintId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const compRes = await AdminService.getComplaintDetails(complaintId);
      setComplaint(compRes);
      
      const reqDept = getDepartmentForCategory(compRes.category);
      if (reqDept !== 'UNASSIGNED') {
        const offRes = await AdminService.getDepartmentOfficersWorkload(reqDept);
        setOfficers(offRes);
      } else {
        setOfficers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOfficer || !id) return;
    setIsAssigning(true);
    setError('');
    setSuccessMsg('');
    try {
      await AdminService.assignComplaint(id, selectedOfficer);
      setSuccessMsg('Complaint assigned successfully');
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!complaint || complaint.status.toUpperCase() !== 'CLOSED') return;
    setIsGeneratingPDF(true);
    try {
      await generateOfficialReport(complaint);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setError('Unable to generate report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Loading Case File...</p>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  if (!complaint) return null;

  const isResolved = complaint.status.toUpperCase() === 'RESOLVED';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 print:max-w-none print:m-0 print:p-0">
      
      {/* Non-printable header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <button
          onClick={() => navigate('/admin/complaints')}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-semibold text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {complaint.status.toLowerCase() === 'closed' && (
          <button
            onClick={handlePrintPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {isGeneratingPDF ? 'Generating Report...' : 'Download Official Report (PDF)'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Details (Printable) */}
        <div className="flex-1 space-y-8 print:w-full print:border-none print:shadow-none">
          
          <GlassCard className="p-8 print:border-slate-300 print:shadow-none print:bg-white print:text-black">
            {/* Print Header only visible during print */}
            <div className="hidden print:flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-slate-900" />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">Civic Intelligence Platform</h1>
                  <p className="text-xs font-bold text-slate-500">Official Case Record</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">Generated On</p>
                <p className="text-sm font-bold text-slate-900">{format(new Date(), 'PPpp')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight print:text-black">
                  {complaint.title}
                </h1>
                <div className="flex items-center gap-3 mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs tracking-wider">
                    ID: {complaint._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="hidden print:inline-block border-l pl-3 border-slate-300">
                    Category: {complaint.category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <StatusBadge type="status" value={complaint.status} className="text-sm px-4 py-1.5" />
                <StatusBadge type="priority" value={complaint.priority} className="text-sm px-4 py-1.5" />
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-lg leading-relaxed print:text-black print:border-l-4 print:border-slate-300 print:pl-4 print:my-6">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 print:border-slate-300">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 print:bg-white print:border-slate-300">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 print:hidden">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Precise Location</h4>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white print:text-black">
                    {complaint.location?.coordinates?.join(', ')}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 print:bg-white print:border-slate-300">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 print:hidden">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Time Reported</h4>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white print:text-black">
                    {complaint.createdAt ? format(new Date(complaint.createdAt), 'PPpp') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Summary Block for Print Only if exists */}
            {complaint.aiAnalysis?.summary && (
              <div className="hidden print:block mt-8 p-6 border-2 border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-200 pb-2">AI Diagnostic Summary</h4>
                <p className="text-sm text-slate-800 italic">"{complaint.aiAnalysis.summary}"</p>
              </div>
            )}

            {/* Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 print:border-slate-300">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Attached Photographic Evidence
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {complaint.images.map((img: any, idx: number) => (
                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10 print:hidden" />
                      <img src={img.url} alt={`Evidence ${idx+1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md z-20 print:hidden">
                        IMG_{idx+1}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Timeline (Printable) */}
          <GlassCard className="p-8 print:border-slate-300 print:shadow-none print:bg-white print:text-black print:break-inside-avoid">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 print:border-slate-300 pb-4">Activity Timeline</h3>
            <div className="space-y-8">
              {complaint.timeline.map((event: any, idx: number) => (
                <div key={idx} className="flex gap-6 relative">
                  {idx !== complaint.timeline.length - 1 && (
                    <div className="absolute top-10 bottom-[-32px] left-[19px] w-0.5 bg-slate-200 dark:bg-slate-700 print:bg-slate-300" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border-[3px] border-white dark:border-slate-900 print:border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10 print:bg-slate-100">
                    {event.status === 'resolved' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-base font-bold text-slate-900 dark:text-white capitalize print:text-black">
                      {event.status.replace('_', ' ')}
                    </p>
                    {event.note && (
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border print:border-slate-300 p-3 rounded-lg">
                        {event.note}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2 font-mono tracking-tight">
                      {format(new Date(event.timestamp), 'PPpp')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Print Official Footer */}
            <div className="hidden print:block mt-16 pt-8 border-t-2 border-slate-900 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">End of Official Record</p>
              <p className="text-[10px] text-slate-400 mt-1">Generated by Civic Intelligence Platform Admin Portal</p>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar (Hidden on Print) */}
        <div className="w-full lg:w-96 space-y-6 print:hidden">
          
          <GlassCard className="p-6">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <User className="w-4 h-4" /> Reporting Citizen
            </h3>
            {complaint.citizenId ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  {complaint.citizenId.firstName[0]}{complaint.citizenId.lastName[0]}
                </div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">
                  {complaint.citizenId.firstName} {complaint.citizenId.lastName}
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{complaint.citizenId.email}</p>
                  {complaint.citizenId.phone && <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{complaint.citizenId.phone}</p>}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                Unknown or Deleted Citizen
              </div>
            )}
          </GlassCard>

          {/* Report Review Section */}
          {complaint.resolutionReport && complaint.resolutionReport.submittedAt && ['resolved', 'closed'].includes(complaint.status.toLowerCase()) && (
            <AdminReportReview complaint={complaint} onReviewed={() => fetchData(id!)} />
          )}

          {/* Assignment Section */}
          <GlassCard className="p-6 border-t-4 border-t-indigo-500">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> Officer Assignment
            </h3>
            
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-sm font-bold mb-5">{error}</div>}
            {successMsg && <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-sm font-bold mb-5">{successMsg}</div>}

            {['resolved', 'closed', 'rejected'].includes(complaint.status.toLowerCase()) ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 text-center">
                Assignment locked.<br/>Case is currently <span className="uppercase text-slate-900 dark:text-white">{complaint.status}</span>.
              </div>
            ) : (complaint.aiAnalysis?.duplicateDetected && complaint.aiAnalysis?.duplicateLevel === 'HIGH') ? (
              <div className="p-5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-sm text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <span className="font-black text-red-900 dark:text-red-400 block mb-1">🚨 DUPLICATE BLOCK</span>
                  <span className="text-red-700 dark:text-red-300 font-medium">Assignment unavailable. Case is a confirmed duplicate of an existing reported issue.</span>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
                    <span className="text-xs font-bold text-slate-500">Match Confidence</span>
                    <span className="text-xs font-black text-red-600">{complaint.aiAnalysis.confidence.toFixed(0)}%</span>
                  </div>
                  {complaint.aiAnalysis.matchedComplaintId && (
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
                      <span className="text-xs font-bold text-slate-500">Reference Case</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">#{complaint.aiAnalysis.matchedComplaintId.slice(-6).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (complaint.assignmentHistory && complaint.assignmentHistory.length > 0) || ['assigned', 'in_progress'].includes(complaint.status.toLowerCase()) ? (
              <div className="space-y-4">
                <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Current Assignment</span>
                  </div>
                  
                  {(() => {
                    const currentAssignment = complaint.assignmentHistory[complaint.assignmentHistory.length - 1];
                    const currentOfficer = currentAssignment?.officerId;
                    const isPopulated = currentOfficer && typeof currentOfficer === 'object' && currentOfficer.firstName;
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Assigned Officer</p>
                            <p className="text-base font-bold text-slate-900 dark:text-white">
                              {isPopulated ? `${currentOfficer.firstName} ${currentOfficer.lastName}` : 'Unknown Officer'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-indigo-100/50 dark:border-indigo-800/30">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department</p>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                              getDepartmentForCategory(complaint.category) === 'SANITATION' ? 'bg-emerald-100 text-emerald-700' :
                              getDepartmentForCategory(complaint.category) === 'ROADS' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {getDepartmentForCategory(complaint.category) === 'SANITATION' ? 'Sanitation' :
                               getDepartmentForCategory(complaint.category) === 'ROADS' ? 'Roads' : 'Unassigned'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned On</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {currentAssignment?.assignedAt ? format(new Date(currentAssignment.assignedAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Shield className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">🔒 Assignment Locked</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Direct reassignment is disabled. Any officer transfer must follow the official transfer request process.
                    </p>
                  </div>
                </div>

                {complaint.activeTransferRequest && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50 mt-4">
                    <ArrowRightLeft className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-500">Transfer Request Pending</p>
                      <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                        The assigned officer has requested a transfer.
                      </p>
                      <button 
                        onClick={() => navigate(`/admin/transfer-requests/${complaint.activeTransferRequest}`)}
                        className="mt-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        Review Transfer Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Department Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{complaint.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Responsible Dept</span>
                    <span className={`text-sm font-bold ${
                      getDepartmentForCategory(complaint.category) === 'SANITATION' ? 'text-emerald-600 dark:text-emerald-400' :
                      getDepartmentForCategory(complaint.category) === 'ROADS' ? 'text-blue-600 dark:text-blue-400' :
                      'text-amber-600 dark:text-amber-400'
                    }`}>
                      {getDepartmentForCategory(complaint.category) === 'SANITATION' ? 'Sanitation Department' :
                       getDepartmentForCategory(complaint.category) === 'ROADS' ? 'Roads Department' : 'Unassigned / Needs Review'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">Select Officer</label>
                  
                  {getDepartmentForCategory(complaint.category) === 'UNASSIGNED' ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <p className="text-sm font-bold text-amber-700">Department Mapping Required</p>
                      <p className="text-xs text-amber-600 mt-1">This complaint category is not mapped to a department. Unrestricted assignment is blocked for security.</p>
                    </div>
                  ) : officers.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-sm font-semibold text-slate-600">No approved active officers are currently available in the {getDepartmentForCategory(complaint.category)} Department.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {(() => {
                        const minWorkload = Math.min(...officers.map(o => o.workload?.activeWorkload || 0));
                        return officers.map(off => (
                          <div 
                            key={off._id}
                            onClick={() => setSelectedOfficer(off._id)}
                            className={`p-3 border rounded-xl cursor-pointer transition-all ${
                              selectedOfficer === off._id 
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
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
                              <div className="bg-slate-50 p-2 rounded-lg">
                                <div className="text-[10px] uppercase font-bold text-slate-500">Active Workload</div>
                                <div className="text-lg font-black text-indigo-600 leading-none mt-1">{off.workload?.activeWorkload || 0}</div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  ({off.workload?.assigned || 0} Assigned, {off.workload?.inProgress || 0} In Progress)
                                </div>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-slate-500">Resolved</div>
                                  <div className="text-sm font-bold text-slate-700 mt-0.5">{off.workload?.resolved || 0}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Total Cases</div>
                                  <div className="text-sm font-bold text-slate-700">{off.workload?.totalAssigned || 0}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAssign}
                  disabled={!selectedOfficer || isAssigning}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  {isAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Assign Complaint'}
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
