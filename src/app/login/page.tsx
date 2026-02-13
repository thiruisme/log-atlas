'use client';

import { loginAction, registerUser } from '@/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    setError('');
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isRegistering) {
          const res = await registerUser(formData);
          if (res?.error) {
              setError(res.error);
              setLoading(false);
              return;
          }
      }

      // Use client-side signIn for both login and post-registration login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        // Force a full page load to / to ensure all contexts are clean and session is fresh
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-sm">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-1 tracking-tighter italic uppercase leading-none">LOG</h1>
          <h1 className="text-4xl font-black mb-3 tracking-tighter text-accent uppercase leading-none italic">ATLAS</h1>
          <div className="h-1.5 w-12 bg-accent rounded-full mx-auto mb-6"></div>
          <p className="text-text-secondary uppercase tracking-widest text-xs font-bold">
            {isRegistering ? 'Create Account' : 'Member Access'}
          </p>
        </header>

        <form onSubmit={handleSubmit} className={`space-y-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isRegistering && (
             <div>
                <input 
                  name="name" 
                  type="text" 
                  disabled={loading}
                  placeholder="NAME (OPTIONAL)" 
                  className="w-full bg-card border border-card-border p-4 rounded-xl font-bold uppercase tracking-wider focus:border-accent outline-none disabled:opacity-50"
                />
             </div>
          )}
          <div>
            <input 
              name="email" 
              type="email" 
              required 
              disabled={loading}
              placeholder="EMAIL" 
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold uppercase tracking-wider focus:border-accent outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <input 
              name="password" 
              type="password" 
              required 
              disabled={loading}
              placeholder="PASSWORD" 
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold uppercase tracking-wider focus:border-accent outline-none disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-error-bg border-2 border-error-border text-error p-4 rounded-2xl text-sm font-black uppercase tracking-tighter text-center italic animate-in shake-in duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Access Denied</span>
                </div>
                <p className="text-[10px] opacity-80 tracking-widest leading-tight">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="relative w-full bg-accent text-accent-foreground p-4 rounded-xl font-black text-xl uppercase italic tracking-tighter hover:opacity-90 disabled:opacity-50 transition-all mt-4 flex items-center justify-center overflow-hidden"
          >
            {loading && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            )}
            <span className={loading ? 'animate-bounce' : ''}>
                {loading ? 'SYNCING WITH ATLAS...' : (isRegistering ? 'Join Atlas' : 'Enter Gym')}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-xs font-bold text-text-muted uppercase tracking-widest hover:text-accent transition-colors"
            >
                {isRegistering ? 'Already have an account? Login' : 'New here? Create Account'}
            </button>
        </div>
      </div>

      {/* Loading Modal Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-card border-2 border-card-border p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center scale-100 transition-transform duration-300">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                {/* Spinning Outer Ring */}
                <div className="w-24 h-24 border-4 border-accent/10 rounded-full"></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                
                {/* Pulsing Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-3 leading-none text-foreground">
              {isRegistering ? 'Building' : 'Syncing'}
            </h2>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-accent leading-none mb-6">
              Atlas
            </h2>
            
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
            </div>
            
            <p className="mt-6 text-text-muted font-black uppercase tracking-[0.2em] text-[10px] italic">
              {isRegistering ? 'Preparing your routine...' : 'Accessing coordinates...'}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
