import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ComplaintService, ComplaintResponse } from '@/services/complaint.service';
import { useAuthStore } from '@/store/authStore';
import { 
  Loader2, AlertCircle, ArrowLeft, Calendar, User, FileText, 
  MapPin, Camera, Clock, CheckCircle, Sparkles, Building2, Pencil, Trash2
} from 'lucide-react';
import LocationPicker from '@/components/map/LocationPicker';

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
        <p className="text-slate-500 font-medium">Loading complaint details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-slate-500 text-center max-w-md">
          {error || "The complaint you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <Link to="/dashboard/complaints" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard/complaints')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </button>
        <div className="flex items-center gap-3">
          <button disabled className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2" title="Implemented in future phases">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button disabled className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2" title="Implemented in future phases">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Primary Info) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${getStatusBadge(complaint.status)}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium text-slate-500">ID: {complaint._id.slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{complaint.title}</h1>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Reported By</p>
                  <p className="font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Created At</p>
                  <p className="font-medium text-slate-900">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              Location
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-200">
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
              <Camera className="w-5 h-5 text-indigo-500" />
              Evidence & Media
            </h2>
            
            {complaint.images && complaint.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.images.map((img, index) => (
                  <div key={img.publicId} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer">
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
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No images attached</p>
                <p className="text-xs mt-1">This complaint was submitted without photographic evidence.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Metadata & Timeline) */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">Metadata</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Category</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="capitalize">{complaint.category.replace('_', ' ')}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Priority</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <AlertCircle className={`w-4 h-4 ${complaint.priority === 'high' || complaint.priority === 'critical' ? 'text-red-500' : 'text-slate-400'}`} />
                  <span className="capitalize">{complaint.priority || 'Medium'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Department</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{complaint.department ? complaint.department.name : 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Last Updated</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : new Date(complaint.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Placeholder */}
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Analysis
            </h3>
            <p className="text-sm text-indigo-700/80 mb-3">
              Automated categorization, priority scoring, and department routing.
            </p>
            <div className="w-full py-2 border border-indigo-200 border-dashed rounded bg-indigo-100/50 text-center">
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest">(Phase 2.5)</p>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Timeline
            </h3>
            
            {(() => {
              // Define the standard progression of statuses
              const statusProgression = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
              
              // Normalize status names for display
              const getStatusDisplay = (s: string) => {
                switch (s) {
                  case 'pending': return 'Complaint Submitted';
                  case 'assigned': return 'Under Review';
                  case 'in_progress': return 'In Progress';
                  case 'resolved': return 'Resolved';
                  case 'closed': return 'Closed';
                  case 'rejected': return 'Rejected';
                  default: return s.replace('_', ' ');
                }
              };

              // Map timeline events from DB, or generate a fallback from createdAt/updatedAt
              let events = [...(complaint.timeline || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              
              if (events.length === 0) {
                events.push({ status: 'pending', timestamp: complaint.createdAt });
                if (complaint.status !== 'pending') {
                  events.push({ status: complaint.status, timestamp: complaint.updatedAt || complaint.createdAt });
                }
              }

              // Build the full visual timeline
              const currentStatusIndex = complaint.status === 'rejected' ? -1 : statusProgression.indexOf(complaint.status);
              
              const timelineNodes = complaint.status === 'rejected' 
                ? [
                    { status: 'pending', display: 'Complaint Submitted', done: true, time: events.find(e => e.status === 'pending')?.timestamp || complaint.createdAt },
                    { status: 'rejected', display: 'Rejected', done: true, time: events.find(e => e.status === 'rejected')?.timestamp || complaint.updatedAt }
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
                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-200 before:to-transparent">
                  {timelineNodes.map((node, i) => (
                    <div key={i} className={`relative ${!node.done ? 'opacity-50' : ''}`}>
                      <div className={`absolute -left-8 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${
                        node.current ? 'border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' : 
                        node.done ? 'border-indigo-500 bg-indigo-50' : 
                        'border-slate-300'
                      }`}>
                        {node.done && !node.current && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        {node.current && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
                      </div>
                      <p className={`text-sm font-medium ${node.current ? 'text-indigo-700' : 'text-slate-900'}`}>
                        {node.display}
                      </p>
                      {node.time ? (
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(node.time).toLocaleString()}</p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Pending</p>
                      )}
                      {node.note && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
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
    </div>
  );
}
