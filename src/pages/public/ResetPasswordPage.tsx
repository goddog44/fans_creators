import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  // The password-reset email links to this page with a recovery token in the
  // URL. Supabase's client picks that up automatically and fires a
  // PASSWORD_RECOVERY auth event with a valid session -- that session (not a
  // token we manage ourselves) is what authorizes the password update below.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecoverySession(true);
        setCheckingLink(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true);
      setCheckingLink(false);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password);
      toast('Password reset successfully');
      navigate('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">Set new password</h1>
        <p className="text-sm text-ink-500 mb-6">Enter your new password below</p>

        {checkingLink ? (
          <p className="text-sm text-ink-500">Verifying your reset link...</p>
        ) : !hasRecoverySession ? (
          <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
            This reset link is invalid or has expired. Please request a new one from the{' '}
            <Link to="/forgot-password" className="font-semibold underline">forgot password</Link> page.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="New password">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="pl-10" required />
              </div>
            </Field>
            <Field label="Confirm password">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="********" className="pl-10" required />
              </div>
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Reset password <ArrowRight className="w-4 h-4" /></Button>
          </form>
        )}
      </div>
    </div>
  );
}