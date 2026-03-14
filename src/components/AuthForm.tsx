/**
 * Reusable app component: A ut hF or m.
 */
// src/components/AuthForm.tsx
import { useState } from 'react';

export function AuthForm({ onAuth }: { onAuth: (data: { email: string; password: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); onAuth({ email, password }); }} className="space-y-4">
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input input-bordered w-full" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="input input-bordered w-full" />
      <button type="submit" className="btn btn-primary">Sign In</button>
    </form>
  );
}

