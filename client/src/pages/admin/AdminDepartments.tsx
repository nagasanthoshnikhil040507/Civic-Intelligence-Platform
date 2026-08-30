import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/admin.service';
import { Building2, Users, ArrowRight, ShieldCheck, HardHat, Loader2, RefreshCw } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export default function AdminDepartments() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [officers, setOfficers] = useState<any[]>([]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await AdminService.getUsers({ role: 'officer', limit: 1000 });
      setOfficers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch officers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const sanitationOfficers = officers.filter(o => o.department === 'SANITATION');
  const roadsOfficers = officers.filter(o => o.department === 'ROADS');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Management</h1>
          <p className="text-slate-500 mt-1">Monitor departments, officers, workloads and civic complaint operations.</p>
        </div>
        <button onClick={fetchDepartments} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Departments" value="2" icon={<Building2 className="w-5 h-5" />} />
        <StatCard title="Total Officers" value={officers.length.toString()} icon={<Users className="w-5 h-5 text-indigo-500" />} />
        <StatCard title="Sanitation Officers" value={sanitationOfficers.length.toString()} icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />} />
        <StatCard title="Roads Officers" value={roadsOfficers.length.toString()} icon={<HardHat className="w-5 h-5 text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sanitation Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">SANITATION DEPARTMENT</h2>
              <p className="text-sm text-slate-500 mt-1">Responsible for waste management, garbage collection and sanitation-related civic issues.</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Assigned Officers</p>
              <p className="text-2xl font-bold text-slate-900">{sanitationOfficers.length}</p>
            </div>
            {/* Future expansion for complaints could go here */}
          </div>
          
          <div className="mt-6 mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/admin/departments/sanitation')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200"
            >
              View Department <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Roads Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">ROADS DEPARTMENT</h2>
              <p className="text-sm text-slate-500 mt-1">Responsible for road damage, potholes, road cracks and other road infrastructure issues.</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Assigned Officers</p>
              <p className="text-2xl font-bold text-slate-900">{roadsOfficers.length}</p>
            </div>
          </div>
          
          <div className="mt-6 mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/admin/departments/roads')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200"
            >
              View Department <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
