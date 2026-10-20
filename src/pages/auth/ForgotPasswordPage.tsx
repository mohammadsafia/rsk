import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { authApi } from '@api/handlers/auth';
import { Alert, Button } from '@components/ui';
import { FormContainer, FormInput } from '@components/forms';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

type ForgotForm = { email: string };

/**
 * Requests a reset link. The confirmation reads the same whether or not an account exists, so the page can't be used
 * to find out who has one.
 */
function ForgotPasswordPage() {
  const { t } = useAppTranslation('auth');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .pipe(z.email(t('login.emailInvalid'))),
      }),
    [t],
  );
  const form = useForm<ForgotForm>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  return (
    <section aria-labelledby="forgot-title" className="flex w-full max-w-sm flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 id="forgot-title" className="text-fg text-xl font-semibold">
          {t('forgot.title')}
        </h1>
        <p className="text-fg-muted text-sm">{t('forgot.subtitle')}</p>
      </header>

      {sentTo ? (
        <Alert tone="success">
          <Alert.Description>{t('forgot.sent', { email: sentTo })}</Alert.Description>
        </Alert>
      ) : (
        <FormContainer
          formContext={form}
          noValidate
          className="flex flex-col gap-4"
          onSuccess={async ({ email }) => {
            setFailed(false);
            try {
              await authApi.requestPasswordReset(email.trim());
              setSentTo(email.trim());
            } catch {
              setFailed(true);
            }
          }}
        >
          {failed && (
            <Alert tone="danger">
              <Alert.Description>{t('forgot.failed')}</Alert.Description>
            </Alert>
          )}
          <FormInput<ForgotForm> name="email" label={t('forgot.email')} type="email" autoComplete="email" dir="ltr" required />
          <Button type="submit" loading={form.formState.isSubmitting}>
            {t('forgot.submit')}
          </Button>
        </FormContainer>
      )}

      <Link
        to={FULL_ROUTES_PATH.AUTH.LOGIN}
        className="text-fg-muted hover:text-fg focus-ring self-center rounded-sm text-sm underline-offset-4 hover:underline"
      >
        {t('forgot.back')}
      </Link>
    </section>
  );
}

export default ForgotPasswordPage;
