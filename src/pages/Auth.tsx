import React from "react";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function Auth({ isLogin }: { isLogin: boolean }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email) {
        const bannedRef = doc(db, 'banned_emails', user.email);
        const bannedSnap = await getDoc(bannedRef);
        if (bannedSnap.exists()) {
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          setError('Your account has been banned. You cannot sign in or sign up.');
          setLoading(false);
          return;
        }
      }
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        navigate('/community');
      } else {
        navigate('/setup-profile');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto mt-20 p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Join the Community
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign in to connect with other JEE aspirants.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 shadow-sm"
      >
        <div className="bg-white dark:bg-slate-900 p-1 rounded-full">
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.5181H37.4434C36.9055 31.4398 35.177 34.0598 32.6461 35.7718V41.5339H40.4037C44.9274 37.33 47.532 31.5204 47.532 24.5528Z" fill="#4285F4"/>
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8766 40.4037 41.5339L32.6461 35.7718C30.4901 37.22 27.7253 38.1044 24.48 38.1044C18.027 38.1044 12.5452 33.7629 10.6309 28.0003H2.60742V34.0538C6.67198 42.1485 14.8696 48.0016 24.48 48.0016Z" fill="#34A853"/>
            <path d="M10.6309 27.9997C10.1228 26.5056 9.84074 24.9392 9.84074 23.361C9.84074 21.7828 10.1228 20.2163 10.6309 18.7222V12.6687H2.60742C0.941655 15.9324 0 19.5383 0 23.361C0 27.1838 0.941655 30.7896 2.60742 34.0533L10.6309 27.9997Z" fill="#FBBC05"/>
            <path d="M24.48 8.6186C27.9922 8.6186 31.1511 9.81308 33.6339 12.1672L40.5756 5.22557C36.3939 1.34139 30.9352 0 24.48 0C14.8696 0 6.67198 5.8531 2.60742 13.9478L10.6309 20.0013C12.5452 14.2387 18.027 8.6186 24.48 8.6186Z" fill="#EA4335"/>
          </svg>
        </div>
        <span>Continue with Google</span>
      </button>
      
      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2">We use Google verification to keep the community spam-free.</p>
      </div>
    </div>
  );
}
