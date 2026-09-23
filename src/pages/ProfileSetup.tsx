import React from "react";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Upload, Loader2, ChevronDown } from 'lucide-react';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];


const CustomSelect = ({ value, onChange, options, name, placeholder = "", disabled = false }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"}`} ref={containerRef}>
      <div
        className={`w-full px-4 py-3 rounded-xl border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 flex justify-between items-center cursor-pointer transition-all`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto py-1">
          {options.map((option: any) => (
            <li
              key={option.value}
              className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors ${value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
              onClick={() => {
                onChange({ target: { name, value: option.value } });
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function ProfileSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || user?.displayName || '',
    username: profile?.username || '',
    targetExam: profile?.targetExam || 'JEE',
    studentClass: profile?.studentClass || '12th',
    state: profile?.state || '',
    bio: profile?.bio || '',
  });

  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || user?.displayName || '',
        username: profile.username || '',
        targetExam: profile.targetExam || 'JEE',
        studentClass: profile.studentClass || '12th',
        state: profile.state || '',
        bio: profile.bio || '',
      });
      setPhotoURL(profile.photoURL || '');
    } else if (user?.displayName && !formData.fullName) {
      setFormData(prev => ({ ...prev, fullName: user.displayName! }));
    }
  }, [profile, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary configuration is missing. Check .env');
      return;
    }

    setUploadingImage(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);

    try {
      let res;
      try {
        res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: uploadData,
        });
      } catch (err: any) {
        throw new Error('Network error (Failed to fetch). Please check if your Cloudinary variables are correct in Settings > Secrets, and disable any ad blockers.');
      }
      
      const data = await res.json();
      if (res.ok) {
        setPhotoURL(data.secure_url);
      } else {
        throw new Error(data.error?.message || 'Failed to upload image');
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate username format (alphanumeric and underscores only, length 3-20)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores.');
      return;
    }

    if (formData.username.toLowerCase() === 'admin' || formData.fullName.toLowerCase().includes('admin')) {
      setError('You cannot use "Admin" in your username or full name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          const config = {
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing'
          };
          reject(new Error(`Firestore connection timed out. Project ID: "${config.projectId}". Please ensure no spaces or typos in your Secrets. Try opening in a New Tab if using mobile.`))
        }, 15000)
      );

      // Check if username is taken
      const q = query(collection(db, 'users'), where('username', '==', formData.username));
      const querySnapshot = await Promise.race([
        getDocs(q),
        timeoutPromise
      ]) as any;
      
      const isTaken = querySnapshot.docs.some((d: any) => d.id !== user.uid);
      if (isTaken) {
        setError('This username is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', String(user.uid));
      const userSnap = await Promise.race([getDoc(userRef), timeoutPromise]) as any;
      const isNewUser = !userSnap.exists();

      await Promise.race([
        setDoc(userRef, {
          uid: String(user.uid),
          email: String(user.email || ''),
          role: user.email === 'aistoryimage1999@gmail.com' ? 'admin' : 'user',
          fullName: String(formData.fullName),
          username: String(formData.username),
          targetExam: String(formData.targetExam),
          studentClass: String(formData.studentClass),
          state: String(formData.state),
          bio: String(formData.bio),
          photoURL: photoURL ? String(photoURL) : null,
          createdAt: new Date(),
        }, { merge: true }),
        timeoutPromise
      ]);
      
      if (isNewUser) {
        fetch('/api/admin/stats/users/increment', { method: 'POST' }).catch(console.error);
      }
      
      await refreshProfile();
      navigate('/community');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === 'username') {
      // Remove @, spaces, and make lowercase
      value = value.replace(/[@\s]/g, '').toLowerCase();
    }
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl w-full mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Complete Your Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Tell the community a bit about yourself to get started on your JEE journey.</p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative group">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-2 ${photoURL ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'} transition-colors`}>
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-transform hover:scale-105"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png,image/webp"
              className="hidden" 
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Upload a profile photo (optional)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-50">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="e.g. John Doe"
              value={formData.fullName ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none font-medium">@</span>
              <input
                type="text"
                name="username"
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="johndoe11"
                value={formData.username ?? ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-50">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Goal</label>
            <CustomSelect name="targetExam" value={formData.targetExam ?? ""} onChange={handleChange} options={[
  { value: "JEE", label: "JEE" }
]} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Class</label>
            <CustomSelect name="studentClass" value={formData.studentClass ?? ""} onChange={handleChange} options={[
  { value: "11th", label: "11th" },
  { value: "12th", label: "12th" },
  { value: "Dropper", label: "Dropper" }
]} />
          </div>
        </div>

        <div className="space-y-2 relative z-40">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">State / Union Territory</label>
          <CustomSelect name="state" value={formData.state ?? ""} onChange={handleChange} options={INDIAN_STATES.map(s => ({ value: s, label: s }))} placeholder="Select your state" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Short Bio (optional)</label>
          <textarea
            name="bio"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
            placeholder="A brief intro about your preparation journey, goals, or hobbies..."
            value={formData.bio ?? ""}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full py-4 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <span>Save Profile</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
