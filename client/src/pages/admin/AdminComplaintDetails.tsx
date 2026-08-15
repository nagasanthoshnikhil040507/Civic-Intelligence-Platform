import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import { Loader2, ArrowLeft, MapPin, Calendar, User, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminComplaintDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [officers, setOfficers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
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
      const [compRes, offRes] = await Promise.all([
        AdminService.getComplaintDetails(complaintId),
        AdminService.getUsers({ role: 'officer', status: 'active', limit: 100 }) // fetch active officers for assignment
      ]);
      setComplaint(compRes.data);
      setOfficers(offRes.data.users);
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
      fetchData(id); // reload data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <button
        onClick={() => navigate('/admin/complaints')}
        className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Complaints
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Details */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{complaint.title}</h1>
                <p className="text-slate-500 text-sm mt-1">ID: {complaint._id}</p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold uppercase tracking-wider">
                {complaint.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-slate-700 whitespace-pre-wrap">{complaint.description}</p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span>{complaint.location?.coordinates?.join(', ')}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span>{format(new Date(complaint.createdAt), 'PPpp')}</span>
              </div>
            </div>

            {/* Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Attached Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.images.map((img: any, idx: number) => (
                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                      <img src={img.url} alt={`Complaint Image ${idx+1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Activity Timeline</h3>
            <div className="space-y-6">
              {complaint.timeline.map((event: any, idx: number) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== complaint.timeline.length - 1 && (
                    <div className="absolute top-8 bottom-[-24px] left-[15px] w-px bg-slate-200" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{event.status.replace('_', ' ')}</p>
                    {event.note && <p className="text-sm text-slate-600 mt-1">{event.note}</p>}
                    <p className="text-xs text-slate-400 mt-1">{format(new Date(event.timestamp), 'PPpp')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          {/* Citizen Info */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Reported By
            </h3>
            {complaint.citizenId ? (
              <div>
                <p className="font-medium text-slate-900">{complaint.citizenId.firstName} {complaint.citizenId.lastName}</p>
                <p className="text-sm text-slate-500">{complaint.citizenId.email}</p>
                {complaint.citizenId.phone && <p className="text-sm text-slate-500">{complaint.citizenId.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Unknown Citizen</p>
            )}
          </div>

          {/* Assignment Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-purple-500">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" /> Officer Assignment
            </h3>
            
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {successMsg && <p className="text-sm text-green-600 mb-4">{successMsg}</p>}

            {['resolved', 'closed', 'rejected'].includes(complaint.status) ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 text-center">
                Assignment locked. Complaint is {complaint.status}.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Officer</label>
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-sm"
                  >
                    <option value="">-- Select Officer --</option>
                    {officers.map(off => (
                      <option key={off._id} value={off._id}>
                        {off.firstName} {off.lastName} ({off.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={!selectedOfficer || isAssigning}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Complaint'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
