import { Link, useNavigate } from 'react-router-dom';

import { Button, Card } from '@components/ui';

import { ROUTES_PATH } from '@routes';

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

function ErrorBoundary() {
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="from-background via-background to-primary-50/30 flex min-h-dvh items-center justify-center bg-gradient-to-br p-4 md:p-8">
      <Card className="border-border w-full max-w-2xl shadow-xl">
        <Card.Content className="flex flex-col items-center gap-8 p-8 text-center md:p-12">
          <div className="relative">
            <div className="bg-destructive/20 absolute inset-0 animate-pulse rounded-full blur-2xl" />
            <div className="bg-destructive/10 relative flex h-24 w-24 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-12 w-12" strokeWidth={2} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">Oops! Something went wrong</h1>
            <p className="text-muted text-base md:text-lg">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
          </div>

          <div className="border-border bg-primary/20 w-full space-y-3 rounded-lg border p-4 text-left">
            <p className="text-muted text-sm font-medium">What you can try:</p>
            <ul className="text-muted space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Refresh the page to reload the application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Go back to the previous page and try again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Return to the dashboard and start fresh</span>
              </li>
            </ul>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handleReload} className="w-full sm:w-auto" size="lg" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button onClick={() => navigate(-1)} className="w-full sm:w-auto" size="lg" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild className="w-full sm:w-auto" size="lg" variant="outline">
              <Link to={ROUTES_PATH.HOME.INDEX}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
