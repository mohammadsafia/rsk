import { useState } from 'react';
import { Link } from 'react-router';

import { useForm } from 'react-hook-form';

import { Alert, Button } from '@components/ui';

import { FormContainer, FormInput } from '@components/forms';
import { Conditional } from '@components/utils';

import { useAppTranslation, useAuth } from '@hooks/shared';

import { authApi } from '@api/handlers/auth';
import { DEMO_CREDENTIALS } from '@api/mock/auth';
import { APP_CONFIGURATIONS } from '@app-config';
import { FULL_ROUTES_PATH } from '@routes';

import { emailRules, requiredRules } from './fields';

type LoginForm = { email: string; password: string };

/** Sign in. On success the session starts and AuthLayout sends the person on to ?next= (or the dashboard). */
function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useAppTranslation('auth');

  const form = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });

  const [failure, setFailure] = useState<string | null>(null);

  const handleSubmit = async (values: LoginForm) => {
    setFailure(null);
    try {
      signIn(await authApi.signIn({ email: values.email.trim(), password: values.password }));
    } catch (error) {
      // A wrong password (401) reads as such; anything else is a connection or server problem.
      const status = (error as { status?: number } | null)?.status;
      setFailure(status === 401 ? t('login.invalid') : t('login.failed'));
    }
  };

  return (
    <section aria-labelledby="login-title" className="flex w-full max-w-sm flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 id="login-title" className="text-fg text-xl font-semibold">
          {t('login.title')}
        </h1>
        <p className="text-fg-muted text-sm">{t('login.subtitle')}</p>
      </header>

      <Conditional.If condition={APP_CONFIGURATIONS.AUTH_MOCK}>
        <Alert tone="info">
          <Alert.Title>{t('login.demoTitle')}</Alert.Title>
          <Alert.Description>
            {/* The values are LTR inside the sentence's own direction, so Arabic reads in order. */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-2">
              <dt>{t('login.email')}</dt>
              <dd dir="ltr" className="text-fg justify-self-start font-mono">
                {DEMO_CREDENTIALS.email}
              </dd>
              <dt>{t('login.password')}</dt>
              <dd dir="ltr" className="text-fg justify-self-start font-mono">
                {DEMO_CREDENTIALS.password}
              </dd>
            </dl>
          </Alert.Description>
        </Alert>
      </Conditional.If>

      <Conditional.If condition={!!failure}>
        <Alert tone="danger">
          <Alert.Description>{failure}</Alert.Description>
        </Alert>
      </Conditional.If>

      <FormContainer formContext={form} noValidate className="flex flex-col gap-4" onSuccess={handleSubmit}>
        <FormInput<LoginForm>
          name="email"
          label={t('login.email')}
          type="email"
          autoComplete="email"
          dir="ltr"
          required
          rules={emailRules(t('login.emailInvalid'))}
        />
        <FormInput<LoginForm>
          name="password"
          label={t('login.password')}
          type="password"
          autoComplete="current-password"
          dir="ltr"
          required
          rules={requiredRules(t('login.passwordRequired'))}
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
