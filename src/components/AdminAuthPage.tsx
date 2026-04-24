import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminAuthPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!token) {
        setError('Security token missing');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-token?token=${token}&type=admin`);
        const data = await res.json();
        
        if (data.success) {
          // Success! Store a temporary bypass flag
          localStorage.setItem('admin_token_auth', token);
          localStorage.setItem('admin_token_report_id', data.reportId);
          
          // Redirect to the actual admin dashboard
          // The App component will check for this localStorage flag
          setTimeout(() => {
            navigate('/admin', { replace: true });
            window.location.reload(); // Force a reload to trigger App.tsx logic
          }, 1500);
        } else {
          setError(data.error || 'Unauthorized or expired token');
          setLoading(false);
        }
      } catch (e) {
        setError('Server connection failed');
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl"
        >
          {loading ? (
            <>
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <Lock className="absolute inset-0 m-auto text-red-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Authenticating</h2>
              <p className="text-zinc-500">Verifying secure administrative link...</p>
            </>
          ) : error ? (
            <>
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-zinc-500 mb-8">{error}</p>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                Exit Secure Zone
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-green-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Access Granted</h2>
              <p className="text-zinc-500">Redirecting to Admin Dashboard...</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
