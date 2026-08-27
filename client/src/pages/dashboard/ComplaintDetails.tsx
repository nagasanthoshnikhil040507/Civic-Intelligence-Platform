import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ComplaintService, ComplaintResponse } from '@/services/complaint.service';
import { useAuthStore } from '@/store/authStore';
import { 
  Loader2, AlertCircle, ArrowLeft, Calendar, User, FileText, 
  MapPin, Camera, Clock, Sparkles, Building2, Pencil, Activity,
  CheckCircle2, Network
} from 'lucide-react';
import LocationPicker from '@/components/map/LocationPicker';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ComplaintDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [complaint, setComplaint] = useState<ComplaintResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchComplaint();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading case details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <GlassCard variant="alert" className="p-8 flex flex-col items-center max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Complaint Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {error || "The complaint you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Go Back
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/dashboard/complaints')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to complaints
        </button>
        <div className="flex items-center gap-3">
          <button disabled className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 rounded-xl opacity-50 cursor-not-allowed flex items-center gap-2" title="Implemented in future phases">
            <Pencil className="w-4 h-4" />
            Edit Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Primary Info & Map) */}
        <div className="lg:col-span-2 space-y-6">
          
          <GlassCard className="p-8 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <FileText className="w-48 h-48" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <StatusBadge type="status" value={complaint.status} animate={complaint.status === 'pending' || complaint.status === 'in_progress'} />
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  CASE-ID: {complaint._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                {complaint.title}
              </h1>

              <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Reported By</p>
                    <p className="font-medium text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Created At</p>
                    <p className="font-medium text-slate-900 dark:text-white">{new Date(complaint.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Evidence Section */}
          <GlassCard className="p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Camera className="w-5 h-5 text-indigo-500" />
              Evidence & Media
            </h2>
            
            {complaint.images && complaint.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {complaint.images.map((img, index) => (
                  <div key={img.publicId} className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-sm">
                    <img 
                      src={img.url} 
                      alt={`Evidence ${index + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white font-semibold tracking-wider text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-opacity">View</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Camera className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No images attached</p>
                <p className="text-xs mt-1">This complaint was submitted without photographic evidence.</p>
              </div>
            )}
          </GlassCard>

          {/* Map Section */}
          <GlassCard className="p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-indigo-500" />
              Geographic Location
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
              <LocationPicker 
                value={complaint.location?.coordinates as [number, number]} 
                onChange={() => {}} 
                readOnly={true} 
              />
            </div>
          </GlassCard>
        </div>

        {/* Right Column (Metadata & Timeline) */}
        <div className="space-y-6">
          
          {/* AI Intelligence Card */}
          {complaint.aiAnalysis && complaint.aiAnalysis.processingStatus !== 'FAILED' ? (
            <GlassCard variant="primary" className="p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 rotate-12 pointer-events-none">
                <Sparkles className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  AI Intelligence
                </h3>
                
                <div className="space-y-5">
                  {complaint.aiAnalysis.summary && (
                    <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3"/> AI Summary
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-300 font-medium italic leading-relaxed">"{complaint.aiAnalysis.summary}"</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-1">Classification</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{complaint.aiAnalysis.garbageDetected ? 'Garbage' : complaint.category}</span>
                    </div>
                    {complaint.aiAnalysis.priority !== undefined && (
                      <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                        <span className="block text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                          <Activity className="w-3 h-3"/> Score
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(Number(complaint.aiAnalysis.priority))}/100</span>
                      </div>
                    )}
                  </div>
                  
                  {complaint.aiAnalysis.duplicateDetected && (
                    <div className="p-4 bg-red-100/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                      <Network className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wider mb-0.5">Duplicate Candidate</span>
                        <span className="text-xs text-red-800 dark:text-red-300 font-medium leading-relaxed block">This issue shares strong geospatial and semantic similarities with an existing open complaint.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 border-dashed">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-slate-400" />
                AI Analysis Pending
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI Intelligence was not available at the time of submission or is currently processing.
              </p>
            </GlassCard>
          )}

          {/* Metadata Section */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-slate-900 dark:text-white pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">Case Routing</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1.5">Assigned Category</p>
                <div className="flex items-center gap-3">
                  <StatusBadge type="severity" value="MEDIUM" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{complaint.category.replace('_', ' ')}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1.5">Priority Level</p>
                <StatusBadge type="priority" value={String(complaint.priority || '50')} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1.5">Department</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span>{complaint.department ? complaint.department.name : 'Unassigned Route'}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Timeline Section */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-slate-400" />
              Resolution Timeline
            </h3>
            
            {(() => {
              const statusProgression = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
              
              const getStatusDisplay = (s: string) => {
                switch (s) {
                  case 'pending': return 'Complaint Received';
                  case 'assigned': return 'Assigned to Dept';
                  case 'in_progress': return 'Work In Progress';
                  case 'resolved': return 'Issue Resolved';
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
                    { status: 'pending', display: 'Complaint Received', done: true, current: false, note: null, time: events.find(e => e.status === 'pending')?.timestamp || complaint.createdAt },
                    { status: 'rejected', display: 'Case Rejected', done: true, current: true, note: null, time: events.find(e => e.status === 'rejected')?.timestamp || complaint.updatedAt }
                  ]
                : statusProgression.map((status, index) => {
                    const event = events.find(e => e.status === status) || events.reverse().find(e => statusProgression.indexOf(e.status) >= index);
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
                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-[2px] before:bg-gradient-to-b before:from-indigo-500 before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                  {timelineNodes.map((node, i) => (
                    <div key={i} className={`relative ${!node.done ? 'opacity-40' : ''}`}>
                      <div className={`absolute -left-10 w-6 h-6 rounded-full border-4 flex items-center justify-center bg-white dark:bg-slate-900 transition-all ${
                        node.current ? 'border-indigo-600 dark:border-indigo-500 shadow-[0_0_0_4px_rgba(79,70,229,0.1)] scale-110' : 
                        node.done ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 
                        'border-slate-200 dark:border-slate-700'
                      }`}>
                        {node.done && !node.current && <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                        {node.current && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500 animate-pulse" />}
                      </div>
                      <div className="pl-2">
                        <p className={`text-sm font-bold ${node.current ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-300'}`}>
                          {node.display}
                        </p>
                        {node.time ? (
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{new Date(node.time).toLocaleString()}</p>
                        ) : (
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Pending Phase</p>
                        )}
                        {node.note && (
                          <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed font-medium">
                            "{node.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
