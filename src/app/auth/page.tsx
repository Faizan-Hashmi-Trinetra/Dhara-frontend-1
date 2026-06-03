'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { login, register, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        await login(username, password);
        router.push('/chat');
      } else {
        await register(email, password, username);
        setMessage('Account created! You can now sign in.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setEmail('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const e = prompt('Enter your email address to receive a password reset link:');
    if (e && e.includes('@')) {
      setMessage('If an account with that email exists, a password reset link has been sent.');
    }
  };

  return (
    <div className="auth-container">
      <div className="card animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#d97757] to-[#e68a6d] flex items-center justify-center text-white shadow-xl shadow-[#d97757]/20 mb-4 rotate-3">
            <Sparkles size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1d1d1b]">Dhara</h1>
          <p className="text-[10px] font-bold text-[#d97757] uppercase tracking-[0.3em] mt-1">PMC Intelligence</p>
        </div>

        <p className="text-center mb-8 text-gray-500 font-medium">
          {isLogin ? 'Sign in to access PMC records' : 'Create an officer account'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email or Username"
              className="w-full px-4 py-3.5 bg-[#f5f5f2] border border-[#e5e5e0] rounded-xl text-[#1d1d1b] placeholder-[#9ca3af] font-medium focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 focus:border-[#d97757] transition-all"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3.5 bg-[#f5f5f2] border border-[#e5e5e0] rounded-xl text-[#1d1d1b] placeholder-[#9ca3af] font-medium focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 focus:border-[#d97757] transition-all"
                required
              />
            </div>
          )}

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={8}
              className="w-full px-4 py-3.5 bg-[#f5f5f2] border border-[#e5e5e0] rounded-xl text-[#1d1d1b] placeholder-[#9ca3af] font-medium focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 focus:border-[#d97757] transition-all"
              required
            />
          </div>

          {!isLogin && (
            <p className="text-xs text-gray-500 -mt-2">
              Password must be at least 8 characters.
            </p>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#d1d5db] text-[#d97757] focus:ring-[#d97757]" />
                <span className="text-gray-500 font-medium">Remember me</span>
              </label>
              <button type="button" className="text-[#d97757] font-semibold hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1d1d1b] text-white font-bold rounded-xl hover:bg-[#2d2d2b] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#e5e5e0] text-center">
          <p className="text-gray-500 font-medium text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => { 
                setIsLogin(!isLogin); 
                setError(''); 
                setMessage('');
                setUsername('');
                setPassword('');
                setEmail('');
              }}
              className="ml-1 text-[#d97757] font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
