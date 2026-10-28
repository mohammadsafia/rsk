// The end-to-end smoke test both starters' verify run in a real browser: sign in with the demo account, land on the
// dashboard, sign out from the user menu, and the dashboard sends to sign in again.
import type { Page } from 'playwright';

export type SmokeRoutes = {
  base: string;
  /** The sign-in page's path (/auth/login in Vite, /en/login in Next). */
  login: string;
  /** Where signing in lands (the dashboard). */
  home: string;
  /** The header's user-menu button and its sign-out item, by accessible name. */
  menuLabel: string;
  signOutLabel: string;
};

/** Runs the round trip; a step that fails throws with that step's name. */
export async function smokeSignInOut(page: Page, { base, login, home, menuLabel, signOutLabel }: SmokeRoutes): Promise<void> {
  const step = async (name: string, action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      throw new Error(`smoke: ${name}: ${(error as Error).message}`);
    }
  };
  const at = (pathname: string) => (url: URL) => url.pathname === pathname;

  await step('sign in with the demo account', async () => {
    await page.goto(`${base}${login}`);
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('demo-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
  });
  await step(`land on ${home}`, () => page.waitForURL(at(home)));
  await step('sign out from the user menu', async () => {
    await page.getByRole('button', { name: menuLabel }).click();
    await page.getByRole('menuitem', { name: signOutLabel }).click();
  });
  await step(`land on ${login}`, () => page.waitForURL(at(login)));
  await step(`${home} sends to sign in again`, async () => {
    await page.goto(`${base}${home}`);
    await page.waitForURL(at(login));
  });
}
