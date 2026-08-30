import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { FileText, CheckCircle2, XCircle, Clock, Check, Loader2 } from 'lucide-react';
import { AdminService } from '@/services/admin.service';
import { format } from 'date-fns';

const formatSafeDate = (value?: string | Date | null, fallback = 'Not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (isNaN(date.getTime())) return fallback;
  return format(date, 'PPpp');
};

export function AdminReportReview({ complaint, onReviewed }: { complaint: any, onReviewed: () => void }) {
  const [decision, setDecision] = useState<'COMPLETED' | 'REJECTED' | null>(null);
  const [note, setNote] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const report = complaint.resolutionReport;

  if (!report) return null;

  const handleSubmit = async () => {
    if (!decision) return;
    if (decision === 'COMPLETED' && !signature) {
      setError('Digital signature is required to complete the report.');
      return;
    }
    if (decision === 'REJECTED' && note.trim().length < 5) {
      setError('A valid rejection reason is required (min 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await AdminService.reviewReport(complaint._id, {
        decision,
        note,
        signatureImage: decision === 'COMPLETED' ? signature : undefined
      });
      onReviewed();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (report.status !== 'SUBMITTED') {
    return (
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b pb-2">Resolution Report Details</h3>
        
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
          {report.status === 'COMPLETED' ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500" />
          )}
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Report {report.status || 'Unknown'}</p>
            <p className="text-sm text-slate-500">Reviewed on {formatSafeDate(report.adminReview?.reviewedAt)}</p>
          </div>
        </div>

        {report.adminReview?.verificationId && (
          <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 rounded-xl text-center">
            <p className="text-xs font-bold uppercase text-emerald-700 tracking-widest mb-1">Verification ID</p>
            <p className="font-mono font-black text-emerald-800 text-lg">{report.adminReview.verificationId}</p>
          </div>
        )}

        {report.status === 'COMPLETED' && report.adminReview?.signatureImage && (
          <div className="mt-6 text-center border p-4 rounded-xl">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Signature</p>
             <img src={report.adminReview.signatureImage} alt="Signature" className="h-16 mx-auto mix-blend-multiply dark:mix-blend-lighten" />
          </div>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border-t-4 border-t-indigo-500">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Resolution Report
          </h3>
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase mt-2 inline-block">
            Pending Admin Review
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">Work Performance</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Started</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatSafeDate(report.workTimelineSnapshot?.workStartedAt, 'Not started')}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Completed</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatSafeDate(report.workTimelineSnapshot?.actualCompletionAt, 'Not set')}
              </p>
            </div>
            <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 mb-1">Performance</p>
              <p className={`font-black ${report.workTimelineSnapshot?.performance?.includes('LATE') ? 'text-red-500' : 'text-emerald-500'}`}>
                {report.workTimelineSnapshot?.performance || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">Resolution Notes</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {report.resolutionDetails?.description || 'No description provided.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          {!decision ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDecision('COMPLETED')}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>Mark Completed</span>
              </button>
              <button
                onClick={() => setDecision('REJECTED')}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <XCircle className="w-6 h-6" />
                <span>Reject Report</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase">
                  {decision === 'COMPLETED' ? 'Complete & Verify' : 'Reject & Request Correction'}
                </h4>
                <button 
                  onClick={() => setDecision(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              {decision === 'COMPLETED' && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Digital Signature Required
                  </p>
                  <SignaturePad onSign={setSignature} onClear={() => setSignature('')} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {decision === 'COMPLETED' ? 'Verification Note (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={3}
                  placeholder={decision === 'COMPLETED' ? 'e.g. All work visually verified...' : 'e.g. Images are not clear enough...'}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${
                  decision === 'COMPLETED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Confirm {decision}
              </button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
