import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email);
    setLoading(false);
    setSent(true);
    toast('Reset link sent to your email', 'info');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">Forgot password?</h1>
        <p className="text-sm text-ink-500 mb-6">Enter your email and we'll send you a reset link</p>

        {sent ? (
          <div className="p-4 rounded-xl bg-success-50 border border-success-200 text-sm text-success-700">
            Reset link sent! Check your email for instructions.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-10" required />
              </div>
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Send reset link <ArrowRight className="w-4 h-4" /></Button>
          </form>
        )}
      </div>
    </div>
  );
}
