/**
 * ConflictsPage - Demo/Test Page for Conflict Resolution
 *
 * FASE 3 - Week 4: Manual Conflict Resolution Demo
 * For testing and demonstrating the conflict resolution UI
 */

import React, { useState } from "react";
import { ConflictResolver } from "@/components/features/sync/ConflictResolver";
import { useConflicts } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Shield } from "lucide-react";

export function ConflictsPage() {
  const [showResolver, setShowResolver] = useState(false);
  const { conflicts, pendingConflicts, loading, error, refreshConflicts } =
    useConflicts();

  const resolvedConflicts = conflicts.filter((c) => c.status === "resolved");
  const rejectedConflicts = conflicts.filter((c) => c.status === "rejected");

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold mb-2">Conflict Resolution</h1>
        <p className="text-muted-foreground">
          Manage and resolve data conflicts between local and server
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-extrabold">
                {pendingConflicts.length}
              </span>
              {pendingConflicts.length > 0 && (
                <Badge variant="destructive">Action Required</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-extrabold text-green-600">
                {resolvedConflicts.length}
              </span>
              <Badge variant="outline">Success</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-extrabold">{conflicts.length}</span>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load conflicts: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-xl p-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conflict Management</CardTitle>
              <CardDescription>
                {pendingConflicts.length > 0
                  ? `You have ${pendingConflicts.length} conflict${pendingConflicts.length !== 1 ? "s" : ""} that need attention`
                  : "All conflicts have been resolved"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshConflicts()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingConflicts.length > 0 ? (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Data conflicts occur when changes are made offline and online
                  simultaneously. Review each conflict and choose which version
                  to keep.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setShowResolver(true)}
                size="lg"
                className="w-full"
              >
                Resolve {pendingConflicts.length} Pending Conflict
                {pendingConflicts.length !== 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Shield className="h-16 w-16 mx-auto text-green-500" />
              <h3 className="font-semibold">No Pending Conflicts</h3>
              <p className="text-sm text-muted-foreground">
                All your data is synchronized successfully!
              </p>
            </div>
          )}

          {/* Recent Conflicts List */}
          {conflicts.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold">Recent Conflicts</h3>
              <div className="space-y-2">
                {conflicts.slice(0, 5).map((conflict) => (
                  <div
                    key={conflict.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{conflict.table_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(conflict.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge
                      variant={
                        conflict.status === "pending"
                          ? "destructive"
                          : conflict.status === "resolved"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {conflict.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border-0 shadow-xl p-6">
        <CardHeader>
          <CardTitle>How Conflict Resolution Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Conflict Detection</h4>
                <p className="text-sm text-muted-foreground">
                  When you make changes offline and someone else modifies the
                  same data online, a conflict is detected using version
                  numbers.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Smart Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  The system applies business rules (e.g., teacher's grades
                  always win). If no rule applies, you'll need to choose
                  manually.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Manual Review</h4>
                <p className="text-sm text-muted-foreground">
                  For each conflict, you can see both versions side-by-side and
                  choose which value to keep for each field.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold">Apply & Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Once resolved, the chosen data is saved and synced to the
                  server. The conflict is marked as resolved.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolver Dialog */}
      <ConflictResolver open={showResolver} onOpenChange={setShowResolver} />
    </div>
  );
}
