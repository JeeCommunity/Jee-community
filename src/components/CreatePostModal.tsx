import React from "react";
import { useState, useRef } from 'react';
import { X, Image as ImageIcon, FileText, Upload, Loader2, Tag, BarChart2, Plus, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { getToxicWords } from '../lib/moderation';
import { cn } from '../lib/utils';
import { uploadFileToCloudinary } from '../lib/cloudinary';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (post?: any) => void;
  currentCommunity?: string;
}

const TAGS = ['Physics', 'Chemistry', 'Maths', 'Doubts', 'Notes', 'General'];

export default function CreatePostModal({ isOpen, onClose, onSuccess, currentCommunity = "JEE" }: CreatePostModalProps) {
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [tag, setTag] = useState('General');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  if (!isOpen) return null;

  

  const handleSubmit = async () => {
    if (!text.trim() && imageFiles.length === 0 && !pdfFile) return;
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      let imageUrls: string[] = [];
      let pdfUrl = '';

      if (imageFiles.length > 0) {
        imageUrls = await Promise.all(imageFiles.map(file => uploadFileToCloudinary(file)));
      }
      if (pdfFile) {
        pdfUrl = await uploadFileToCloudinary(pdfFile);
      }

      
      const toxicWordsFound = getToxicWords(String(text).trim());
      const isToxic = toxicWordsFound.length > 0;

      const postData: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,
        authorId: String(user.uid),
        text: String(text).trim(),
        tag: String(tag),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // TTL: 48 hours
        likesCount: 0,
        dislikesCount: 0,
        communityType: String(currentCommunity),
      };

      if (isPoll) {
        const validOptions = pollOptions.filter(opt => String(opt).trim() !== '');
        if (validOptions.length >= 2) {
          postData.poll = {
            options: validOptions.map((opt, idx) => ({ id: `opt_${idx}`, text: String(opt).trim(), votes: 0 })),
            voters: {}
          };
        } else {
          setError('Poll must have at least 2 valid options.');
          setLoading(false);
          return;
        }
      }

      if (imageUrls.length > 0) {
        postData.images = imageUrls.map(String);
      }
      if (pdfUrl) {
        postData.pdfUrl = String(pdfUrl);
      }

      const docRef = await addDoc(collection(db, 'posts'), postData);
      

      fetch('/api/admin/stats/posts/increment', { method: 'POST' }).catch(console.error);
      setText('');
      setImageFiles([]);
      setPdfFile(null);
      setIsPoll(false);
      setPollOptions(['', '']);
      onSuccess({ id: docRef.id, ...postData, createdAt: new Date() });
      onClose();
    } catch (err: any) {
      console.error("Failed to post", err?.message || 'Error');
      setError(err.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
      if (validFiles.length < files.length) {
        setError('Some images were skipped because they exceed 5MB');
      }
      setImageFiles(prev => [...prev, ...validFiles].slice(0, 3));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('PDF must be less than 10MB');
        return;
      }
      setPdfFile(file);
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Post</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <textarea
            className="w-full h-32 resize-none outline-none text-gray-800 dark:text-slate-200 placeholder-gray-400 text-lg bg-transparent"
            placeholder="What do you want to share with the community?"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <div className="text-right text-xs text-gray-400 font-medium">
            {text.length}/1000
          </div>
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}
          
                    <div className="mt-4">
            <button
              onClick={() => setIsPoll(!isPoll)}
              className={cn(
                "flex items-center text-sm font-medium px-3 py-1.5 rounded-xl border transition-colors",
                isPoll ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800"
              )}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              {isPoll ? 'Remove Poll' : 'Add Poll'}
            </button>
            {isPoll && (
              <div className="mt-3 space-y-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Poll Options</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => handleRemovePollOption(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button onClick={handleAddPollOption} className="text-sm text-blue-600 font-medium flex items-center mt-2">
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Tag className="w-4 h-4 mr-2 text-blue-500" /> Select Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full border transition-colors",
                    tag === t 
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 mt-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <ImageIcon className="w-4 h-4 mr-2 text-blue-500" /> Image (Optional)
              </label>
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-center text-sm text-gray-500 dark:text-slate-400"
              >
                {imageFiles.length > 0 ? (
                  <span className="font-medium text-blue-600 truncate">{imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} selected</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Click to upload images (max 3, 5MB each)
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*" multiple
                ref={imageInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
              {imageFiles.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative shrink-0">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-700" />
                      <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {imageFiles.length < 3 && (
                     <button type="button" onClick={() => imageInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 shrink-0">
                       <Upload className="w-5 h-5 mb-1 text-gray-400" />
                       <span className="text-[10px] font-medium text-center leading-tight">Add<br/>More</span>
                     </button>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <FileText className="w-4 h-4 mr-2 text-blue-500" /> PDF Document (Optional)
              </label>
              <div 
                onClick={() => pdfInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-center text-sm text-gray-500 dark:text-slate-400"
              >
                {pdfFile ? (
                  <span className="font-medium text-blue-600 truncate">{pdfFile.name}</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Click to upload PDF (max 10MB)
                  </>
                )}
              </div>
              <input
                type="file"
                accept="application/pdf"
                ref={pdfInputRef}
                className="hidden"
                onChange={handlePdfChange}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && imageFiles.length === 0 && !pdfFile)}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
