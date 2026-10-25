import { redirect } from 'next/navigation';

// Starter default: "/en" opens the app (the proxy sends a signed-out visitor to sign in). Replace it with a public
// landing page when you have one.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/dashboard`);
}
