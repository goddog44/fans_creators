import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    await resetPassword('mock-token', password);
    setLoading(false);
    toast('Password reset successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">Set new password</h1>
        <p className="text-sm text-ink-500 mb-6">Enter your new password below</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="New password">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required />
            </div>
          </Field>
          <Field label="Confirm password">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="pl-10" required />
            </div>
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={loading}>Reset password <ArrowRight className="w-4 h-4" /></Button>
        </form>
      </div>
    </div>
  );
}
