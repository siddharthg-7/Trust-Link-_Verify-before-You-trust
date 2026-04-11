import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type AuditAction =
  | 'report_approved' | 'report_rejected' | 'report_deleted' | 'report_flagged'
  | 'user_banned' | 'user_role_changed' | 'user_warned'
  | 'bulk_action' | 'threat_intel_synced' | 'settings_updated'
  | 'detailed_review_submitted'
  | 'admin_login' | 'notification_sent';

export async function logAudit(
  action: AuditAction,
  details: string,
  targetId?: string,
  extra?: Record<string, any>
) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      details,
      targetId: targetId || null,
      adminId: auth.currentUser?.uid || 'system',
      adminEmail: auth.currentUser?.email || 'system',
      timestamp: serverTimestamp(),
      ...extra,
    });
  } catch (e) {
    console.error('Failed to log audit:', e);
  }
}
