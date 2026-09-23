import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquareQuote, Check, Clock, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, profile } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const fetchFeedbacks = async () => {
      const q = query(
        collection(db, 'feedback'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const fb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      fb.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setMyFeedbacks(fb);
    };

    fetchFeedbacks();
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !user) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userName: profile?.fullName || user.displayName || 'Unknown User',
        userEmail: user.email,
        content: feedback.trim(),
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFeedback('');
        setActiveTab('history');
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting feedback:", error?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <MessageSquareQuote className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Feedback</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'submit' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
          >
            Submit Feedback
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
          >
            My Feedback {myFeedbacks.length > 0 && <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">{myFeedbacks.length}</span>}
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'submit' ? (
            success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">Thank you!</h4>
                <p className="text-slate-500 dark:text-slate-400">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    How can we improve? Or what do you like?
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px] resize-none text-slate-700 dark:text-slate-300"
                    placeholder="Share your thoughts, feature requests, or report bugs..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !feedback.trim()}
                  className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  {loading ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            <div className="space-y-4">
              {myFeedbacks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                  You haven't submitted any feedback yet.
                </div>
              ) : (
                myFeedbacks.map(item => (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-800 dark:text-slate-200 mb-2 whitespace-pre-wrap">{item.content}</p>
                    <div className="flex items-center text-[10px] text-slate-400 font-medium mb-3">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </div>
                    
                    {item.adminReply ? (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 relative mt-2">
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-50 border-t border-l border-blue-100 transform rotate-45"></div>
                        <div className="flex items-center mb-1 text-blue-700 relative z-10">
                          <User className="w-3 h-3 mr-1" />
                          <span className="text-xs font-bold">Admin Reply</span>
                        </div>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap relative z-10">{item.adminReply}</p>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Waiting for reply...</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
