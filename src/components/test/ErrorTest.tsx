/**
 * Error Test Component
 * Component for testing ErrorBoundary functionality
 * USE ONLY FOR DEVELOPMENT/TESTING
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Bug } from 'lucide-react';

export function ErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // Trigger render error
  if (shouldThrow) {
    throw new Error('Test Error: ErrorBoundary is working! This is a test error thrown from ErrorTest component.');
  }

  const triggerRenderError = () => {
    setShouldThrow(true);
  };

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('Test Error: Unhandled Promise Rejection'));
  };

  const triggerJSError = () => {
    const obj = null;
    console.log((obj as any).nonExistent.property);
  };

  const triggerAsyncError = async () => {
    throw new Error('Test Error: Async function error');
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-orange-500" />
            <CardTitle>Error Boundary Test</CardTitle>
          </div>
          <CardDescription>
            Test different types of errors to verify ErrorBoundary is working correctly
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These buttons will trigger real errors. The ErrorBoundary should catch them and display a fallback UI.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">1. Render Error (Caught by ErrorBoundary)</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Throws an error during component render. ErrorBoundary will catch this.
              </p>
              <Button onClick={triggerRenderError} variant="destructive">
                Trigger Render Error
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">2. Unhandled Promise Rejection (Global handler)</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Rejects a promise without catch. Global error handler will log this.
              </p>
              <Button onClick={triggerPromiseRejection} variant="destructive">
                Trigger Promise Rejection
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">3. JavaScript Error (Global handler)</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Triggers a null reference error. Global error handler will log this.
              </p>
              <Button onClick={triggerJSError} variant="destructive">
                Trigger JS Error
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">4. Async Error (Unhandled)</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Throws error in async function without try/catch. Will be caught by global handlers.
              </p>
              <Button onClick={() => triggerAsyncError()} variant="destructive">
                Trigger Async Error
              </Button>
            </div>
          </div>

          <Alert className="bg-blue-50">
            <AlertDescription>
              <strong>How to verify:</strong>
              <ul className="ml-4 mt-2 list-disc text-sm">
                <li>Check browser console for error logs</li>
                <li>Render error should show ErrorFallback UI</li>
                <li>Other errors should be logged but not crash the app</li>
                <li>In production, errors will be sent to error tracking service</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorTest;
