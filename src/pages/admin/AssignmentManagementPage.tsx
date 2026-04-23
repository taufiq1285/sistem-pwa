/**
 * Legacy Admin Assignment Management Page
 *
 * Source of truth has moved to ManajemenAssignmentPage so old entry points
 * cannot bypass the newer academic-history guards.
 */

import ManajemenAssignmentPage from "@/pages/admin/ManajemenAssignmentPage";

export default function AssignmentManagementPage() {
  return <ManajemenAssignmentPage />;
}
