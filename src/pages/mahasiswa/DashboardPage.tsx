import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleTest } from '@/components/test/RoleTest';

export function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mahasiswa Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.full_name || user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>✅ Mahasiswa Dashboard</CardTitle>
            <CardDescription>Protected route for students</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              You're logged in as: <strong>{user?.email}</strong> (Role: {user?.role})
            </p>
          </CardContent>
        </Card>

        {/* RBAC System Test */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">🧪 RBAC System Test</h2>
          <RoleTest />
        </div>
      </div>
    </div>
  );
}