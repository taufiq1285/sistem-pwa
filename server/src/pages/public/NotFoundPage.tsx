/**
 * NotFoundPage (404)
 * Displayed when user navigates to a route that doesn't exist
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/config/routes.config";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mb-4">
              <div className="text-6xl font-bold text-gray-300">404</div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to={ROUTES.HOME}>Go to Home</Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link to={ROUTES.LOGIN}>Go to Login</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
