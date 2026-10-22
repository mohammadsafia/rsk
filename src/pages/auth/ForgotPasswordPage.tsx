'use client';

import { useEffect, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Alert, Button } from '@components/ui';

import { FormContainer, FormInput } from '@components/forms';
import { Conditional } from '@components/utils';

import { KitLink } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { authApi } from '@api/handlers/auth';
import { FULL_ROUTES_PATH } from '@routes';

import { emailRules } from './fields';

type ForgotForm = { email: string };

/**
 * Requests a reset link. The confirmation reads the same whether or not an account exists, so the page can't be used
 * to find out who has one.
 */
function ForgotPasswordPage() {
  const { t } = useAppTranslation('auth');

  const form = useForm<ForgotForm>({ defaultValues: { email: '' } });

  const confirmation = useRef<HTMLDivElement>(null);

  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const handleRequestReset = async ({ email }: ForgotForm) => {
    setFailed(false);
    try {
      await authApi.requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch {
      // Shown in the form: the request didn't reach the server.
      setFailed(true);
    }
  };

  // The form (and its focused button) is replaced by the confirmation: focus moves to it, so it is read out.
  useEffect(() => {
    if (sentTo) confirmation.current?.focus();
  }, [sentTo]);

  return (
    <section aria-labelledby="forgot-title" className="flex w-full max-w-sm flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 id="forgot-title" className="text-fg text-xl font-semibold">
          {t('forgot.title')}
        </h1>
        <p className="text-fg-muted text-sm">{t('forgot.subtitle')}</p>
      </header>

      <Conditional>
        <Conditional.If condition={!!sentTo}>
          <div ref={confirmation} tabIndex={-1} className="outline-none">
            <Alert tone="success">
              <Alert.Description>{t('forgot.sent', { email: sentTo })}</Alert.Description>
            </Alert>
          </div>
        </Conditional.If>

        <Conditional.Else>
          <FormContainer formContext={form} noValidate className="flex flex-col gap-4" onSuccess={handleRequestReset}>
            <Conditional.If condition={failed}>
              <Alert tone="danger">
                <Alert.Description>{t('forgot.failed')}</Alert.Description>
              </Alert>
            </Conditional.If>

            <FormInput<ForgotForm>
              name="email"
              label={t('forgot.email')}
              type="email"
              autoComplete="email"
              dir="ltr"
              required
              rules={emailRules(t('login.emailInvalid'))}
            />
            <Button type="submit" loading={form.formState.isSubmitting}>
              {t('forgot.submit')}
            </Button>
          </FormContainer>
        </Conditional.Else>
      </Conditional>

      <KitLink
        href={FULL_ROUTES_PATH.AUTH.LOGIN}
        className="text-fg-muted hover:text-fg focus-ring self-center rounded-sm text-sm underline-offset-4 hover:underline"
      >
        {t('forgot.back')}
      </KitLink>
    </section>
  );
}

export default ForgotPasswordPage;
