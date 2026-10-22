/**
 * What an error page needs, whatever the router: Vite's block index fills it from React Router's error hooks, a Next
 * app's error.tsx from its { error, reset }.
 */
export type ErrorScreenProps = { error: unknown; retry(): void; retrying?: boolean; notFound?: boolean };
