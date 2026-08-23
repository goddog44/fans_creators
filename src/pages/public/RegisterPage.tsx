import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import type { Role } from '@/types';
import { roleHomeRoute } from '@/lib/rbac';

export function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ name, email, password, role });
      toast(`Welcome to CreatorHub, ${user.name}!`);
      navigate(roleHomeRoute[user.role]);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-brand-600 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-600 font-bold">C</div>
          <span className="font-display font-bold text-xl text-white">CreatorHub</span>
        </Link>
        <div className="relative">
          <h2 className="font-display font-bold text-4xl text-white leading-tight">Join thousands of creators and fans today</h2>
          <p className="text-brand-100 mt-4 text-lg">Create an account and start your journey in minutes.</p>
        </div>
        <div className="relative" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">C</div>
            <span className="font-display font-bold text-xl text-ink-900">CreatorHub</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">Create your account</h1>
          <p className="text-sm text-ink-500 mb-6">Join CreatorHub in just a few seconds</p>

          {error && <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Carter" className="pl-10" required />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-10" required />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="I want to">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'USER' as Role, label: 'Be a fan', desc: 'Subscribe & support' },
                  { val: 'MODEL' as Role, label: 'Be a creator', desc: 'Create & earn' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRole(opt.val)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === opt.val ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-ink-900">{opt.label}</p>
                    <p className="text-xs text-ink-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Create account <ArrowRight className="w-4 h-4" /></Button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
