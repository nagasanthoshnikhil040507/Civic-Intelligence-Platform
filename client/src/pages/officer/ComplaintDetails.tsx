import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ComplaintService, ComplaintResponse } from '@/services/complaint.service';
import { useAuthStore } from '@/store/authStore';
import { 
  Loader2, AlertCircle, ArrowLeft, Calendar, User, FileText, 
  MapPin, Camera, Clock, Sparkles, Building2, ShieldAlert, CheckCircle, X
} from 'lucide-react';
import LocationPicker from '@/components/map/LocationPicker';

export default function OfficerComplaintDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [complaint, setComplaint] = useState<ComplaintResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Action states
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [resolutionImages, setResolutionImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeComplaint = async () => {
    if (!id) return;
    try {
      setIsAnalyzing(true);
      await ComplaintService.analyzeComplaint(id);
      await fetchComplaint();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to analyze complaint');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchComplaint = async () => {
    try {
      setIsLoading(true);
      if (!id) throw new Error('No complaint ID provided');
      const data = await ComplaintService.getById(id);
      setComplaint(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load complaint details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleAssignToMe = async () => {
    if (!id || !user) return;
    try {
      setIsUpdating(true);
      await ComplaintService.assignComplaint(id, { officerId: user._id || user.id });
      await fetchComplaint();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    try {
      setIsUpdating(true);
      await ComplaintService.updateStatus(id, { status: newStatus });
      await fetchComplaint();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsUpdating(true);
      await ComplaintService.resolveComplaint(id, { resolutionNote, workPerformed }, resolutionImages);
      setShowResolveModal(false);
      await fetchComplaint();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve complaint');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading case file...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Case Not Found</h2>
        <p className="text-slate-500 text-center max-w-md">
          {error || "The complaint you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <Link to="/officer/complaints" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Back to Complaints
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const renderActionButtons = () => {
    if (complaint.status === 'pending') {
      return (
        <button 
          onClick={handleAssignToMe}
          disabled={isUpdating}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : 'Assign to Me'}
        </button>
      );
    }
    if (complaint.status === 'assigned') {
      return (
        <button 
          onClick={() => handleStatusUpdate('in_progress')}
          disabled={isUpdating}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : 'Start Work (In Progress)'}
        </button>
      );
    }
    if (complaint.status === 'in_progress') {
      return (
        <button 
          onClick={() => setShowResolveModal(true)}
          disabled={isUpdating}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : 'Mark Resolved'}
        </button>
      );
    }
    if (complaint.status === 'resolved') {
      return (
        <button 
          onClick={() => handleStatusUpdate('closed')}
          disabled={isUpdating}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : 'Close Case'}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 relative">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
        <button 
          onClick={() => navigate('/officer/complaints')}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
        <div className="flex items-center gap-3">
          {renderActionButtons()}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Primary Info) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileText className="w-48 h-48" />
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${getStatusBadge(complaint.status)}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
                <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  CASE #{complaint._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{complaint.title}</h1>
            </div>

            <div className="prose prose-slate max-w-none relative">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 relative">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Reporter ID</p>
                  <p className="font-medium text-slate-900 font-mono text-xs mt-0.5">{complaint.citizenId || 'Anonymous'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Filed On</p>
                  <p className="font-medium text-slate-900">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Incident Coordinates
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <LocationPicker 
                value={complaint.location?.coordinates as [number, number]} 
                onChange={() => {}} 
                readOnly={true} 
              />
            </div>
          </div>

          {/* Evidence Section */}
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Photographic Evidence
            </h2>
            
            {complaint.images && complaint.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.images.map((img, index) => (
                  <div key={img.publicId} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer shadow-sm">
                    <img 
                      src={img.url} 
                      alt={`Evidence ${index + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium">No images attached by citizen</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Metadata & Timeline) */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100 uppercase text-xs tracking-widest">Metadata</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Category</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="capitalize font-medium">{complaint.category.replace('_', ' ')}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Priority</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <AlertCircle className={`w-4 h-4 ${complaint.priority === 'high' || complaint.priority === 'critical' ? 'text-red-500' : 'text-slate-400'}`} />
                  <span className="capitalize font-medium">{complaint.priority || 'Medium'}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Department</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{complaint.department ? complaint.department.name : 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last Updated</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium">{complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : new Date(complaint.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm text-white">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Intelligence Engine
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Automated image classification, priority scoring, and text sentiment analysis.
            </p>
            
            {complaint.aiAnalysis ? (
              <div className="space-y-3 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                  <span className="text-xs font-semibold text-blue-400">{complaint.aiAnalysis.processingStatus?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category</p>
                    <p className="text-sm font-medium text-slate-200">{complaint.aiAnalysis.categoryPrediction || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confidence</p>
                    <p className="text-sm font-medium text-slate-200">{complaint.aiAnalysis.confidence ? `${(complaint.aiAnalysis.confidence * 100).toFixed(1)}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Severity Score</p>
                    <p className="text-sm font-medium text-slate-200">{complaint.aiAnalysis.severity || 'N/A'}/100</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Damage Type</p>
                    <p className="text-sm font-medium text-slate-200">{complaint.aiAnalysis.roadDamage || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sentiment</p>
                    <p className="text-sm font-medium text-slate-200">{complaint.aiAnalysis.sentiment || 'N/A'}</p>
                  </div>
                </div>

                {complaint.aiAnalysis.recommendations && complaint.aiAnalysis.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Recommendations</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {complaint.aiAnalysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-xs text-slate-300">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {complaint.aiAnalysis.analyzedAt && (
                  <div className="pt-2 border-t border-slate-700 text-right">
                    <span className="text-[9px] text-slate-500">Analyzed: {new Date(complaint.aiAnalysis.analyzedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full py-4 border border-slate-700 border-dashed rounded-xl bg-slate-800/50 flex flex-col items-center justify-center space-y-3">
                <p className="text-xs font-medium text-slate-400">No AI analysis available</p>
                <button 
                  onClick={handleAnalyzeComplaint}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Analyze Complaint
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Timeline Section */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-400" />
              Audit Log
            </h3>
            
            {(() => {
              const statusProgression = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
              
              const getStatusDisplay = (s: string) => {
                switch (s) {
                  case 'pending': return 'Complaint Received';
                  case 'assigned': return 'Assigned to Dept';
                  case 'in_progress': return 'Work in Progress';
                  case 'resolved': return 'Marked Resolved';
                  case 'closed': return 'Case Closed';
                  case 'rejected': return 'Case Rejected';
                  default: return s.replace('_', ' ');
                }
              };

              let events = [...(complaint.timeline || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              
              if (events.length === 0) {
                events.push({ status: 'pending', timestamp: complaint.createdAt });
                if (complaint.status !== 'pending') {
                  events.push({ status: complaint.status, timestamp: complaint.updatedAt || complaint.createdAt });
                }
              }

              const currentStatusIndex = complaint.status === 'rejected' ? -1 : statusProgression.indexOf(complaint.status);
              
              const timelineNodes = complaint.status === 'rejected' 
                ? [
                    { status: 'pending', display: 'Complaint Received', done: true, time: events.find(e => e.status === 'pending')?.timestamp || complaint.createdAt },
                    { status: 'rejected', display: 'Case Rejected', done: true, time: events.find(e => e.status === 'rejected')?.timestamp || complaint.updatedAt }
                  ]
                : statusProgression.map((status, index) => {
                    const event = events.find(e => e.status === status) || [...events].reverse().find(e => statusProgression.indexOf(e.status) >= index);
                    const isDone = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    
                    return {
                      status,
                      display: getStatusDisplay(status),
                      done: isDone,
                      current: isCurrent,
                      time: isDone && event ? event.timestamp : null,
                      note: isDone && event?.note ? event.note : null
                    };
                  });

              return (
                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-slate-200">
                  {timelineNodes.map((node, i) => (
                    <div key={i} className={`relative ${!node.done ? 'opacity-40' : ''}`}>
                      <div className={`absolute -left-8 w-4 h-4 rounded-full border-[3px] flex items-center justify-center bg-white ${
                        node.current ? 'border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 
                        node.done ? 'border-blue-400 bg-blue-50' : 
                        'border-slate-200'
                      }`}>
                        {node.done && !node.current && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        {node.current && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
                      </div>
                      <p className={`text-sm font-semibold ${node.current ? 'text-blue-700' : 'text-slate-700'}`}>
                        {node.display}
                      </p>
                      {node.time ? (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{new Date(node.time).toLocaleString()}</p>
                      ) : (
                        <p className="text-[10px] uppercase font-bold text-slate-300 mt-0.5 tracking-wider">Awaiting</p>
                      )}
                      {node.note && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                          {node.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Resolution Details Section */}
      {(complaint.status === 'resolved' || complaint.status === 'closed') && complaint.resolutionDetails && (
        <div className="mt-6 p-8 bg-green-50 border border-green-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CheckCircle className="w-48 h-48 text-green-900" />
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold text-green-900 flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Resolution Report
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Resolution Summary</p>
                <div className="bg-white/60 p-4 rounded-xl border border-green-100 text-slate-800 text-sm leading-relaxed">
                  {complaint.resolutionDetails.resolutionNote}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Completion Evidence</p>
                {complaint.resolutionDetails.proofImages && complaint.resolutionDetails.proofImages.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {complaint.resolutionDetails.proofImages.map((img, idx) => (
                      <div key={idx} className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-green-200 cursor-pointer group relative">
                         <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onClick={() => window.open(img, '_blank')}/>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/60 p-4 rounded-xl border border-green-100 text-green-700/50 text-sm flex items-center justify-center h-32 italic">
                    No completion images provided.
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm text-green-800 border-t border-green-200/50 pt-4">
               <div><span className="font-bold opacity-75">Resolved By:</span> {complaint.resolutionDetails.resolvedBy}</div>
               <div><span className="font-bold opacity-75">Resolved At:</span> {new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resolve Case #{complaint._id.slice(-8).toUpperCase()}
              </h3>
              <button 
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isUpdating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleResolveSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Resolution Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    required
                    minLength={10}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none h-24"
                    placeholder="Describe how the issue was resolved..."
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Provide a clear explanation for the citizen.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Work Performed (Internal)
                  </label>
                  <textarea 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none h-24"
                    placeholder="Technical details of the work performed (optional)..."
                    value={workPerformed}
                    onChange={e => setWorkPerformed(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Completion Evidence
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {resolutionImages.map((file, idx) => (
                      <div key={idx} className="w-24 h-24 rounded-lg border border-slate-200 overflow-hidden relative group">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setResolutionImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                    {resolutionImages.length < 5 && (
                      <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 hover:border-green-500 hover:bg-green-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-green-600">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={e => {
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files).slice(0, 5 - resolutionImages.length);
                              setResolutionImages(prev => [...prev, ...newFiles]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Upload up to 5 photos showing the resolved issue.</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowResolveModal(false)}
                  disabled={isUpdating}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating || resolutionNote.length < 10}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
