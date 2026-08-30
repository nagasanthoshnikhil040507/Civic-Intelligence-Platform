import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import { Building2, ArrowLeft, Loader2, ShieldCheck, HardHat, Mail, Phone, Eye } from 'lucide-react';
import { format } from 'date-fns';

const DEPARTMENT_INFO: Record<string, any> = {
  sanitation: {
    name: 'SANITATION DEPARTMENT',
    key: 'SANITATION',
    icon: ShieldCheck,
    color: 'emerald',
    description: 'Responsible for waste management, garbage collection and sanitation-related civic issues.'
  },
  roads: {
    name: 'ROADS DEPARTMENT',
    key: 'ROADS',
    icon: HardHat,
    color: 'blue',
    description: 'Responsible for road damage, potholes, road cracks and other road infrastructure issues.'
  }
};

export default function AdminDepartmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [officers, setOfficers] = useState<any[]>([]);

  const deptInfo = id ? DEPARTMENT_INFO[id.toLowerCase()] : null;

  const fetchDepartmentOfficers = async () => {
    setIsLoading(true);
    try {
      if (!deptInfo?.key) return;
      const deptOfficers = await AdminService.getDepartmentOfficersWorkload(deptInfo.key);
      // Sort by active workload ascending
      deptOfficers.sort((a: any, b: any) => (a.workload?.activeWorkload || 0) - (b.workload?.activeWorkload || 0));
      setOfficers(deptOfficers);
    } catch (error) {
      console.error('Failed to fetch officers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (deptInfo) {
      fetchDepartmentOfficers();
    } else {
      navigate('/admin/departments');
    }
  }, [id]);

  if (!deptInfo) return null;

  const Icon = deptInfo.icon;
  const colorClass = deptInfo.color === 'emerald' ? 'text-emerald-600 bg-emerald-100' : 'text-blue-600 bg-blue-100';

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/departments')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Departments
      </button>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-6">
        <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{deptInfo.name}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">{deptInfo.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Officers</h3>
          <p className="text-3xl font-bold text-slate-900">{isLoading ? '-' : officers.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Department Officers</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : officers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No officers are currently assigned to this department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Officer Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Assigned</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">In Progress</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center bg-indigo-50/50">Active Workload</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Resolved</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officers.map((officer, index) => (
                  <tr key={officer._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {officer.firstName} {officer.lastName}
                        {index === 0 && officers.length > 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black uppercase tracking-wider">Lowest</span>
                        )}
                        {index === officers.length - 1 && officers.length > 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-black uppercase tracking-wider">Highest</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{officer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        officer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {officer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {officer.workload?.assigned || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {officer.workload?.inProgress || 0}
                    </td>
                    <td className="px-6 py-4 text-center bg-indigo-50/30">
                      <span className="font-black text-indigo-700 text-lg">{officer.workload?.activeWorkload || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {officer.workload?.resolved || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {officer.workload?.totalAssigned || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/users/${officer._id}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
