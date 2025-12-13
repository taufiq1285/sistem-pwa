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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            System statistics and insights
          </p>
        </div>
        <Button variant="outline" onClick={loadMetrics}>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  All system users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipment</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.totalEquipment}
                </div>
                <p className="text-xs text-muted-foreground">Inventory items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Borrowings
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.totalBorrowings}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeBorrowings} active requests
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Classes
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.activeClasses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current semester
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Overall system status</CardDescription>
                </div>
                <Badge variant="default" className={healthColor}>
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
