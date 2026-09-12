import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, addDoc } from 'firebase/firestore';
import { Flag, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Report {
  id: string;
  animeId: string;
  animeTitle: string;
  episodeId: string;
  episodeNumber: number;
  seasonId: string;
  userId: string;
  userEmail: string;
  reasons: string[];
  details: string;
  status: 'pending' | 'resolved';
  createdAt: number;
}

export const ReportManager = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(fetched);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
      
      if (user) {
        await addDoc(collection(db, 'moderation_logs'), {
          actorId: user.uid,
          actorEmail: user.email,
          action: 'resolve_report',
          targetType: 'report',
          targetId: id,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Failed to resolve report", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      setReports(prev => prev.filter(r => r.id !== id));
      
      if (user) {
        await addDoc(collection(db, 'moderation_logs'), {
          actorId: user.uid,
          actorEmail: user.email,
          action: 'delete_report',
          targetType: 'report',
          targetId: id,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Failed to delete report", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">User Reports</h1>
        <p className="text-yoru-text-muted">Manage and resolve user submitted reports for playback issues.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-yoru-accent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-yoru-surface border border-yoru-border rounded-xl p-8 text-center space-y-3">
          <Flag className="w-10 h-10 text-yoru-text-muted mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-white">No Reports</h3>
          <p className="text-sm text-yoru-text-muted">There are currently no user reports to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-yoru-surface border border-yoru-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-start justify-between">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-yoru-text-muted">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {report.animeTitle} — Episode {report.episodeNumber}
                  </h3>
                  <p className="text-xs text-yoru-text-muted">Reported by: {report.userEmail}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {report.reasons.map(reason => (
                      <span key={reason} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/80">
                        {reason}
                      </span>
                    ))}
                  </div>
                  {report.details && (
                    <div className="p-3 rounded-lg bg-black/20 text-sm text-white/90 border border-white/5">
                      <span className="text-xs font-semibold text-yoru-text-muted block mb-1">Additional Details:</span>
                      {report.details}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:w-32 shrink-0">
                {report.status === 'pending' && (
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="flex-1 md:w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(report.id)}
                  className="flex-1 md:w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
