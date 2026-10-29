import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type ManagerActionType =
  | 'delete_post'
  | 'delete_comment'
  | 'mute_user'
  | 'unmute_user'
  | 'dismiss_report'
  | 'delete_group_message'
  | 'post_status'
  | 'propose_feature'
  | 'submit_sandbox_build'
  | 'deploy_feature'
  | 'rollback_feature';

export interface ManagerLogPayload {
  managerId: string;
  managerName: string;
  managerUsername?: string;
  actionType: ManagerActionType;
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  targetSummary?: string;
  community?: string;
}

export async function logManagerAction(payload: ManagerLogPayload) {
  if (!db) return;
  try {
    await addDoc(collection(db, 'metadata', 'moderation', 'manager_logs'), {
      ...payload,
      community: payload.community || 'JEE',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Ignore logging errors so moderation actions never fail
  }
}
