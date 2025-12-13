/**
 * KuisEditPage
 *
 * Purpose: Edit existing quiz page (Dosen)
 * Route: /dosen/kuis/:kuisId/edit
 * Note: KuisBuilderPage will auto-detect edit mode and quiz ID from URL
 */

import KuisBuilderPage from "./KuisBuilderPage";

export default function KuisEditPage() {
  // KuisBuilderPage akan detect mode dan kuisId dari URL params
  return <KuisBuilderPage />;
}
