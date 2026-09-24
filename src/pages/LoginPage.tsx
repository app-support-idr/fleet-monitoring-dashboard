import { FormEvent, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    resetMessages();

    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);

      const result = await resetPassword(email.trim());

      setLoading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(
        'Si cette adresse est enregistrée, un email de réinitialisation a été envoyé.'
      );

      return;
    }

    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError(
          'Le mot de passe doit contenir au moins 6 caractères.'
        );
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }

      setLoading(true);

      const result = await signUp(email.trim(), password);

      setLoading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(
        'Votre compte a été créé. Vérifiez votre email si une confirmation est demandée. Votre accès au Monitoring devra ensuite être validé par un administrateur.'
      );

      setPassword('');
      setConfirmPassword('');

      return;
    }

    setLoading(true);

    const result = await signIn(email.trim(), password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  };

  const title =
    mode === 'login'
      ? 'Connexion'
      : mode === 'signup'
        ? 'Créer un compte'
        : 'Mot de passe oublié';

  const description =
    mode === 'login'
      ? 'Accédez au Monitoring des applications.'
      : mode === 'signup'
        ? 'Créez votre compte de Monitoring.'
        : 'Saisissez votre email pour recevoir un lien de réinitialisation.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Fleet Monitoring
          </h1>

          <h2 className="mt-4 text-xl font-semibold text-slate-800">
            {title}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Adresse email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="votre.email@entreprise.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Mot de passe
              </label>

              <input
                id="password"
                type="password"
                autoComplete={
                  mode === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirmer le mot de passe
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Chargement...'
              : mode === 'login'
                ? 'Se connecter'
                : mode === 'signup'
                  ? 'Créer mon compte'
                  : 'Envoyer le lien'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-slate-600 hover:text-slate-900 hover:underline"
              >
                Mot de passe oublié ?
              </button>

              <div>
                <span className="text-slate-500">
                  Pas encore de compte ?{' '}
                </span>

                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Créer un compte
                </button>
              </div>
            </>
          )}

          {mode !== 'login' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="font-medium text-slate-900 hover:underline"
            >
              Retour à la connexion
            </button>
          )}
        </div>

        {mode === 'signup' && (
          <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            La création d'un compte ne donne pas automatiquement accès
            au Monitoring. Un administrateur devra valider votre accès.
          </div>
        )}
      </div>
    </div>
  );
}