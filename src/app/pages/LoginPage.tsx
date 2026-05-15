import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      const target = res.user.scopeIds.length > 1 ? '/select-scope' : '/dashboard';
      navigate(target, { replace: true });
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-stone-900 mb-2">Connexion</h1>
            <p className="text-stone-600">Accédez à votre espace de gestion PEV</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[13px] text-danger-700"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block mb-1.5 text-[13px] font-medium text-stone-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre.email@sante.gouv.td"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-[13px] font-medium text-stone-700">
                  Mot de passe
                </label>
                <a href="#forgot" className="text-[13px] text-primary-700 hover:underline">
                  Mot de passe oublié&nbsp;?
                </a>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-3 text-[13px]">
            <span className="text-stone-500">Langue :</span>
            <button
              type="button"
              className="text-stone-800 font-medium underline-offset-2 underline decoration-primary"
            >
              Français
            </button>
            <button
              type="button"
              disabled
              className="text-stone-400 cursor-not-allowed"
              title="Disponible en V2"
            >
              العربية
            </button>
          </div>

          <details className="mt-10 text-[12px] text-stone-500">
            <summary className="cursor-pointer hover:text-stone-700">
              Comptes de démonstration (Sprint 0)
            </summary>
            <ul className="mt-2 space-y-1 font-mono leading-snug">
              <li>admin@sante.td / admin123</li>
              <li>national@sante.td / national123</li>
              <li>provincial.lac@sante.td / lac123</li>
              <li>superviseur.bol@sante.td / bol123</li>
              <li>analyste@sante.td / analyste123</li>
            </ul>
          </details>
        </div>
      </div>

      {/* Right: institutional panel */}
      <div className="hidden md:flex md:w-[40%] relative bg-primary-50 items-center justify-center overflow-hidden">
        {/* Concentric circles motif */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden>
          {[600, 480, 360, 240, 120].map((size) => (
            <span
              key={size}
              style={{ width: size, height: size }}
              className="absolute rounded-full border border-primary-100"
            />
          ))}
        </div>
        <div className="relative z-10 max-w-md text-center px-8">
          <div
            className="text-primary-700"
            style={{ fontSize: 32, lineHeight: '40px', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            VACCI360
          </div>
          <p className="mt-4 text-stone-700 leading-relaxed">
            Plateforme Intégrée d'Optimisation de la Vaccination
          </p>
          <p className="mt-6 text-[12px] uppercase tracking-wider text-stone-500">
            Programme Élargi de Vaccination · République du Tchad
          </p>
        </div>
      </div>
    </div>
  );
}
