import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getServerEnv } from '@server/env';

import { sameOrigin } from '../same-origin';

const body = z.object({ email: z.string().max(254) });

/** A reset link by email. Always 204, so the answer never tells whether an email has an account. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: 'Enter an email.' }, { status: 400 });
  try {
    const env = getServerEnv();
    if (env.AUTH_MOCK === 'false')
      await fetch(`${env.API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.data),
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
  } catch (error) {
    console.warn('Requesting a password reset failed', error);
  }
  return new NextResponse(null, { status: 204 });
}
