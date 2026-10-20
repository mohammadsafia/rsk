import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { authApi } from '@api/handlers/auth';
import { DEMO_CREDENTIALS } from '@api/mock/auth';
import { APP_CONFIGURATIONS } from '@app-config';
import { Alert, Button } from '@components/ui';
import { FormContainer, FormInput } from '@components/forms';

import { useAppTranslation, useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

type LoginForm = { email: string; password: string };

/** Sign in. On success the session starts and AuthLayout sends the person on to ?next= (or the dashboard). */
function LoginPage() {
  const { t } = useAppTranslation('auth');
  const { signIn } = useAuth();
  const [failure, setFailure] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .pipe(z.email(t('login.emailInvalid'))),
        password: z.string().min(1, t('login.passwordRequired')),
      }),
    [t],
  );
  const form = useForm<LoginForm>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  return (
    <section aria-labelledby="login-title" className="flex w-full max-w-sm flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 id="login-title" className="text-fg text-xl font-semibold">
          {t('login.title')}
        </h1>
        <p className="text-fg-muted text-sm">{t('login.subtitle')}</p>
      </header>

      {APP_CONFIGURATIONS.AUTH_MOCK && (
        <Alert tone="info">
          <Alert.Title>{t('login.demoTitle')}</Alert.Title>
          <Alert.Description>
            <span dir="ltr">{t('login.demoBody', { email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password })}</span>
          </Alert.Description>
        </Alert>
      )}

      {failure && (
        <Alert tone="danger">
          <Alert.Description>{failure}</Alert.Description>
        </Alert>
      )}

      <FormContainer
        formContext={form}
        noValidate
        className="flex flex-col gap-4"
        onSuccess={async (values) => {
          setFailure(null);
          try {
            signIn(await authApi.signIn({ email: values.email.trim(), password: values.password }));
          } catch (error) {
            const status = (error as { status?: number } | null)?.status;
            setFailure(status === 401 ? t('login.invalid') : t('login.failed'));
          }
        }}
      >
        <FormInput<LoginForm> name="email" label={t('login.email')} type="email" autoComplete="email" dir="ltr" required />
        <FormInput<LoginForm>
          name="password"
          label={t('login.password')}
          type="password"
          autoComplete="current-password"
          dir="ltr"
          required
        />

        <Link
          to={FULL_ROUTES_PATH.AUTH.FORGOT_PASSWORD}
          className="text-fg-muted hover:text-fg focus-ring self-end rounded-sm text-sm underline-offset-4 hover:underline"
        >
          {t('login.forgot')}
        </Link>

        <Button type="submit" loading={form.formState.isSubmitting}>
          {t('login.submit')}
        </Button>
      </FormContainer>
    </section>
  );
}

export default LoginPage;
