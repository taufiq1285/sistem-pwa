/**
 * UnauthorizedPage (403)
 * Displayed when user tries to access a route they don't have permission for
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';
import { getRoleDashboard } from '@/config/routes.config';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    if (user) {
      const dashboardPath = getRoleDashboard(user.role);
      navigate(dashboardPath);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* 403 Icon */}
            <div className="mb-4">
              <div className="text-6xl font-bold text-red-300">403</div>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            
            {/* Description */}
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
              Please contact your administrator if you believe this is an error.
            </p>
            
            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
              
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}