import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import { useAuthStore } from '@/store/authStore';
import { Loader2, ArrowLeft, Mail, Calendar, User, Shield, AlertTriangle, Phone, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [showChangeDept, setShowChangeDept] = useState(false);
  const [pendingDept, setPendingDept] = useState<'SANITATION' | 'ROADS' | 'UNASSIGNED' | ''>('');

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await AdminService.getUserDetails(userId);
      setUserData(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChangeRequest = (status: 'active' | 'inactive' | 'suspended') => {
    setPendingStatus(status);
    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!id) return;
    setIsUpdating(true);
    setError('');
    setSuccessMsg('');
    setShowConfirm(false);
    try {
      await AdminService.updateUserStatus(id, pendingStatus);
      setSuccessMsg(`User status successfully updated to ${pendingStatus}`);
      fetchData(id); // reload data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  if (!userData?.user) return null;

  const { user, stats } = userData;
  const isSelf = currentUser?.id === user._id || currentUser?._id === user._id;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-slate-100 text-slate-700 border-slate-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
    };
    return `px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${styles[status] || styles.inactive}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 relative">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-6">
            <div className={`w-20 h-20 rounded-full flex flex-shrink-0 items-center justify-center text-white text-2xl font-bold ${user.role === 'officer' ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{user.firstName} {user.lastName}</h1>
                  <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold mt-1 flex items-center gap-2">
                    {user.role === 'officer' ? <Shield className="w-4 h-4 text-blue-500"/> : <User className="w-4 h-4 text-purple-500"/>}
                    {user.role}
                  </p>
                </div>
                <span className={getStatusBadge(user.status)}>
                  {user.status}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-5 h-5 text-slate-400" />
                  {user.email} {user.emailVerified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">Verified</span>}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-5 h-5 text-slate-400" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Activity Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    {user.role === 'citizen' ? 'Total Complaints Filed' : 'Total Complaints Assigned'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalComplaints || stats.assignedComplaints || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Management Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Account Status
            </h3>
            
            {isSelf ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500 text-center">
                You cannot modify your own account status.
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-4">
                  Changing the user's status will immediately affect their ability to log in and use the platform.
                </p>
                
                {user.status !== 'active' && (
                  <button
                    onClick={() => handleStatusChangeRequest('active')}
                    disabled={isUpdating}
                    className="w-full py-2 px-4 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 font-medium rounded-lg transition-colors text-sm"
                  >
                    Activate Account
                  </button>
                )}
                
                {user.status !== 'inactive' && (
                  <button
                    onClick={() => handleStatusChangeRequest('inactive')}
                    disabled={isUpdating}
                    className="w-full py-2 px-4 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 font-medium rounded-lg transition-colors text-sm"
                  >
                    Deactivate Account
                  </button>
                )}
                
                {user.status !== 'suspended' && (
                  <button
                    onClick={() => handleStatusChangeRequest('suspended')}
                    disabled={isUpdating}
                    className="w-full py-2 px-4 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-medium rounded-lg transition-colors text-sm"
                  >
                    Suspend Account
                  </button>
                )}
              </div>
            )}
          </div>

          {user.role === 'officer' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> Department Assignment
              </h3>
              
              <div className="space-y-4">
                <div className="text-sm text-slate-500 mb-2 space-y-1">
                  <div>Requested Department: <span className="font-semibold text-slate-700">{user.requestedDepartment || 'None'}</span></div>
                  <div>Current Department: <span className="font-semibold text-slate-700">{user.department || 'UNASSIGNED'}</span></div>
                  <div>Department Status: <span className={`font-semibold ${user.departmentStatus === 'APPROVED' ? 'text-green-600' : 'text-amber-500'}`}>{user.departmentStatus || 'PENDING'}</span></div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {user.departmentStatus === 'PENDING' && user.requestedDepartment && (
                    <button
                      onClick={async () => {
                        try {
                          setIsUpdating(true);
                          await AdminService.updateUserDepartment(user._id, user.requestedDepartment);
                          fetchData(user._id);
                          setSuccessMsg('Requested department approved successfully');
                        } catch (err: any) {
                          setError(err.response?.data?.message || 'Failed to approve department');
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      disabled={isUpdating}
                      className="w-full py-2 px-4 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-lg transition-colors text-sm disabled:opacity-50 mb-2"
                    >
                      Approve Requested Department
                    </button>
                  )}

                  {user.departmentStatus === 'APPROVED' && user.department !== 'UNASSIGNED' && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 mb-2 flex items-center gap-2">
                      <div className="bg-emerald-100 p-1 rounded-full w-5 h-5 flex items-center justify-center font-bold">✓</div>
                      <span className="text-sm font-medium">Officer is currently assigned to {user.department.charAt(0) + user.department.slice(1).toLowerCase()} Department</span>
                    </div>
                  )}

                  {((user.departmentStatus === 'APPROVED' && user.department !== 'UNASSIGNED') || (!user.requestedDepartment && user.department === 'UNASSIGNED')) && !showChangeDept && (
                    <button
                      onClick={() => setShowChangeDept(true)}
                      className="w-full py-2 px-4 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium rounded-lg transition-colors text-sm"
                    >
                      {user.department === 'UNASSIGNED' ? 'Assign to Department' : 'Change Department'}
                    </button>
                  )}

                  {showChangeDept && (
                    <div className="mt-2 p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <p className="text-sm font-semibold mb-3">Select New Department:</p>
                      <div className="space-y-3 mb-4">
                        {user.department !== 'SANITATION' && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name="dept" value="SANITATION" checked={pendingDept === 'SANITATION'} onChange={(e) => setPendingDept(e.target.value as any)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                            <span className="font-medium text-slate-700">SANITATION</span>
                          </label>
                        )}
                        {user.department !== 'ROADS' && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name="dept" value="ROADS" checked={pendingDept === 'ROADS'} onChange={(e) => setPendingDept(e.target.value as any)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                            <span className="font-medium text-slate-700">ROADS</span>
                          </label>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!pendingDept) return;
                            try {
                              setIsUpdating(true);
                              await AdminService.updateUserDepartment(user._id, pendingDept);
                              fetchData(user._id);
                              setShowChangeDept(false);
                              setPendingDept('');
                              setSuccessMsg('Department updated successfully');
                            } catch (err: any) {
                              setError(err.response?.data?.message || 'Failed to update department');
                            } finally {
                              setIsUpdating(false);
                            }
                          }}
                          disabled={!pendingDept || isUpdating}
                          className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                          Confirm {user.department === 'UNASSIGNED' ? 'Assignment' : 'Change'}
                        </button>
                        <button
                          onClick={() => { setShowChangeDept(false); setPendingDept(''); }}
                          disabled={isUpdating}
                          className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Status Change</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to change this user's status to <span className="font-bold">{pendingStatus}</span>? 
              {pendingStatus === 'suspended' && " They will be immediately logged out and unable to access the platform."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                  pendingStatus === 'suspended' ? 'bg-red-600 hover:bg-red-700' :
                  pendingStatus === 'active' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
