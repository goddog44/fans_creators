import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { roleHomeRoute } from '@/lib/rbac';

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast(`Welcome back, ${user.name}!`);
      navigate(roleHomeRoute[user.role]);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — branding */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-12 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero/hero-2.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/90 via-ink-950/65 to-brand-900/45" />
        <Link to="/" className="relative flex items-center gap-2">
          <img src="/image-removebg-preview.png" alt="CreatorHub" className="w-9 h-9 rounded-xl" />
          <span className="font-display font-bold text-xl text-white">CreatorHub</span>
        </Link>
        <div className="relative">
          <h2 className="font-display font-bold text-4xl text-white leading-tight">The premium platform for creators and their fans</h2>
          <p className="text-ink-300 mt-4 text-lg">Subscribe, message, and unlock exclusive content from your favorite creators.</p>
        </div>
        <div className="relative flex items-center gap-2 text-ink-400 text-sm">
          Trusted by 12,000+ creators worldwide
        </div>
      </div>

      {/* Right side — form */}
      <div className="relative flex-1 flex items-center justify-center p-6 bg-ink-50 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero-1.jpg')" }}>
        <div className="absolute inset-0 bg-white/80" />
        <div className="relative z-10 w-full max-w-sm bg-white/95 p-6 sm:p-8 rounded-2xl shadow-card">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="/image-removebg-preview.png" alt="CreatorHub" className="w-9 h-9 rounded-xl" />
            <span className="font-display font-bold text-xl text-ink-900">CreatorHub</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">Welcome back</h1>
          <p className="text-sm text-ink-500 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in <ArrowRight className="w-4 h-4" /></Button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            Don't have an account? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}