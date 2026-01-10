'use client';

import { loginAction, registerUser } from '@/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    
    if (isRegistering) {
        const res = await registerUser(formData);
        if (res?.error) {
            setError(res.error);
            setLoading(false);
            return;
        }
        // If success, try logging in
        const loginRes = await loginAction(formData);
        if (loginRes?.error) setError(loginRes.error);
    } else {
        const res = await loginAction(formData);
        if (res?.error) setError(res.error);
    }
    setLoading(false);
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

        <form action={handleSubmit} className="space-y-4">
          {isRegistering && (
             <div>
                <input 
                  name="name" 
                  type="text" 
                  placeholder="NAME (OPTIONAL)" 
                  className="w-full bg-card border border-card-border p-4 rounded-xl font-bold uppercase tracking-wider focus:border-accent outline-none"
                />
             </div>
          )}
          <div>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="EMAIL" 
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold uppercase tracking-wider focus:border-accent outline-none"
            />
          </div>
          <div>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="PASSWORD" 
              className="w-full bg-card border border-card-border p-4 rounded-xl font-bold uppercase tracking-wider focus:border-accent outline-none"
            />
          </div>

          {error && (
            <div className="bg-error-bg border border-error-border text-error p-3 rounded-xl text-xs font-black uppercase tracking-wider text-center">
                {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-accent-foreground p-4 rounded-xl font-black text-xl uppercase italic tracking-tighter hover:opacity-90 disabled:opacity-50 transition-all mt-4"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Join Atlas' : 'Enter Gym')}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-bold text-text-muted uppercase tracking-widest hover:text-accent transition-colors"
            >
                {isRegistering ? 'Already have an account? Login' : 'New here? Create Account'}
            </button>
        </div>
      </div>
    </main>
  );
}
