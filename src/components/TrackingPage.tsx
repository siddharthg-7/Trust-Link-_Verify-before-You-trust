import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyToken } from '../services/emailService';
import { Loader2, CheckCircle2, AlertCircle, Clock, Search, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('Tracking token is missing');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-token?token=${token}&type=user`);
        const data = await res.json();
        
        if (data.success) {
          // Now fetch the actual report details
          const reportRes = await fetch(`/api/reports`);
          const reports = await reportRes.json();
          const found = reports.find((r: any) => r.id === data.reportId);
          if (found) {
            setReport(found);
          } else {
            setError('Report not found');
          }
        } else {
          setError(data.error || 'Invalid tracking token');
        }
      } catch (e) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tracking Error</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a href="/" className="inline-block bg-white text-black px-6 py-2 rounded-lg font-medium">Return Home</a>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'under_review': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'resolved': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-blue-500" />
            <span className="text-zinc-500 font-medium">Verification Tracking</span>
          </div>
          <h1 className="text-3xl font-bold">Report ID: {report.id}</h1>
        </motion.div>

        <div className="grid gap-6">
          {/* Status Timeline */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Current Status</p>
                <div className={`px-3 py-1 rounded-full border inline-block text-sm font-bold uppercase ${getStatusColor(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Submitted On</p>
                <p className="font-medium">{new Date(report.timestamp).toLocaleDateString()} {new Date(report.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-800" />
              
              <div className="space-y-8">
                <div className="relative pl-12">
                  <div className={`absolute left-0 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center z-10 ${report.status === 'submitted' || report.status === 'under_review' || report.status === 'resolved' ? 'bg-blue-500' : 'bg-zinc-800'}`}>
                    <CheckCircle2 size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Complaint Submitted</h3>
                    <p className="text-zinc-400 text-sm">We have received your report and it is awaiting initial analysis.</p>
                  </div>
                </div>

                <div className="relative pl-12">
                  <div className={`absolute left-0 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center z-10 ${report.status === 'under_review' || report.status === 'resolved' ? 'bg-yellow-500' : 'bg-zinc-800'}`}>
                    <Clock size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Under Review</h3>
                    <p className="text-zinc-400 text-sm">A security moderator is actively reviewing the findings and AI risk scores.</p>
                  </div>
                </div>

                <div className="relative pl-12">
                  <div className={`absolute left-0 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center z-10 ${report.status === 'resolved' ? 'bg-green-500' : 'bg-zinc-800'}`}>
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Resolved</h3>
                    <p className="text-zinc-400 text-sm">The investigation is complete. View the official decision below.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Details (Visible if resolved) */}
          {report.status === 'resolved' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8"
            >
              <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle2 size={24} />
                Official Findings
              </h3>
              <div className="bg-black/40 rounded-xl p-6 text-zinc-300 italic leading-relaxed border border-white/5">
                "{report.adminFeedback || 'No specific comments provided. The report has been processed successfully.'}"
              </div>
            </motion.div>
          )}

          {/* Original Complaint Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h3 className="font-bold mb-4">Original Report Content</h3>
            <div className="p-4 bg-black/40 rounded-xl text-zinc-400 text-sm leading-relaxed border border-zinc-800/50">
              {report.content}
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase">Category</p>
                <p className="font-medium text-sm">{report.category}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Risk Level</p>
                <p className={`font-medium text-sm ${report.riskScore > 65 ? 'text-red-400' : 'text-green-400'}`}>
                  {report.riskScore > 65 ? 'High Risk' : 'Verified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
