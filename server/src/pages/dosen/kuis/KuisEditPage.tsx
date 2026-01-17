/**
 * KuisEditPage (Tugas Praktikum)
 *
 * Purpose: Edit existing task page (Dosen)
 * Route: /dosen/kuis/:kuisId/edit
 * Note: KuisBuilderPage will auto-detect edit mode and task ID from URL
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 */

import KuisBuilderPage from "./KuisBuilderPage";

export default function KuisEditPage() {
  // KuisBuilderPage akan detect mode dan kuisId dari URL params
  return <KuisBuilderPage />;
}
