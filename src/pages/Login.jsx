import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import Logo from '../components/Logo.jsx';
import { Alert, Button, Field, Input } from '../components/ui.jsx';

/** Ondas do "no ar" no painel da marca (decoração). */
function OnAir() {
  const bars = [0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.65, 0.4, 0.85, 0.55, 0.3, 0.7, 0.95, 0.45, 0.6];
  return (
    <div className="flex h-24 items-end gap-1.5" aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className="eq-bar w-2 rounded-full bg-brand/80"
          style={{ height: `${h * 100}%`, animationDelay: `${-i * 0.13}s`, animationDuration: `${0.8 + (i % 4) * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="dark relative hidden flex-col justify-between overflow-hidden bg-gray-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/15 blur-3xl" />
        <Logo />
        <div className="relative">
          <OnAir />
          <h1 className="mt-8 max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Todas as rádios do MyRadio, <span className="text-brand">num só lugar.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-400">
            Cadastre rádios, teste os streams ao vivo antes de publicar e acompanhe o que os ouvintes estão salvando nas listas.
          </p>
        </div>
        <p className="text-xs text-gray-500">Painel de administração · uso restrito</p>
      </aside>

      <main className="flex items-center justify-center bg-white px-6 py-12 dark:bg-gray-900">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            <span className="inline-flex rounded-xl bg-gray-950 px-3 py-2 text-white">
              <Logo />
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Entrar no painel</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use sua conta de administrador do MyRadio.</p>
          </div>
          <Alert>{error}</Alert>
          <Field label="E-mail">
            <Input type="email" required autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </Field>
          <Field label="Senha">
            <div className="relative">
              <Input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={show}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Button type="submit" loading={busy} className="h-10 w-full">
            Entrar
          </Button>
        </form>
      </main>
    </div>
  );
}
