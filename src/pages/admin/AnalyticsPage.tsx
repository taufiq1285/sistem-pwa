import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSystemMetrics, type SystemMetrics } from "@/lib/api/analytics.api";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalEquipment: 0,
    totalBorrowings: 0,
    activeClasses: 0,
    activeBorrowings: 0,
    systemHealth: "Good",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getSystemMetrics();
      setMetrics(data);
    } catch (error) {
      toast.error("Failed to load analytics data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const healthColor =
    metrics.systemHealth === "Good"
      ? "bg-green-600"
      : metrics.systemHealth === "Warning"
        ? "bg-yellow-600"
        : "bg-red-600";

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Analytics Dashboard</h1>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            System statistics and insights
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadMetrics}
          className="font-semibold border-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Users"
              value={metrics.totalUsers}
              description="All system users"
              icon={Users}
              color="primary"
            />
            <DashboardCard
              title="Equipment"
              value={metrics.totalEquipment}
              description="Inventory items"
              icon={Package}
              color="accent"
            />
            <DashboardCard
              title="Borrowings"
              value={metrics.totalBorrowings}
              description={`${metrics.activeBorrowings} active requests`}
              icon={Activity}
              color="success"
            />
            <DashboardCard
              title="Active Classes"
              value={metrics.activeClasses}
              description="Current semester"
              icon={Users}
              color="warning"
            />
          </div>
          <Card className="border-0 shadow-xl">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    System Health
                  </CardTitle>
                  <CardDescription className="text-base font-semibold mt-1">
                    Overall system status
                  </CardDescription>
                </div>
                <Badge variant="default" className={`${healthColor} font-bold`}>
                  {metrics.systemHealth}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Analytics and reporting system
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Monitoring {metrics.totalUsers} users,{" "}
                  {metrics.totalEquipment} equipment items, and{" "}
                  {metrics.activeBorrowings} active borrowings
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
