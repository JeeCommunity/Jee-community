import {
  createSupabaseNotification,
  sendSupabaseGlobalNotification,
} from './supabaseHub';

export interface NotificationData {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: string;
  postId?: string;
  postContent?: string;
  commentId?: string;
  commentContent?: string;
  noteId?: string;
  noteTitle?: string;
  videoId?: string;
  videoTitle?: string;
  targetUrl?: string;
}

export const createNotification = async (data: NotificationData) => {
  try {
    await createSupabaseNotification(data);
  } catch (error: any) {
    console.error('Error sending Supabase notification:', error?.message || 'Error');
  }
};

export const sendGlobalNotification = async (
  senderId: string,
  senderName: string,
  senderAvatar: string,
  type: string,
  extraData: any = {},
  _communityType?: string
) => {
  try {
    await sendSupabaseGlobalNotification(senderId, senderName, senderAvatar, type, extraData);
  } catch (error: any) {
    console.error('Error sending global Supabase notification:', error?.message || 'Error');
  }
};
