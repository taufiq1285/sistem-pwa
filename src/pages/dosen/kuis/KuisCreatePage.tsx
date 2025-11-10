/**
 * KuisCreatePage
 * 
 * Purpose: Create new quiz page (Dosen)
 * Route: /dosen/kuis/create
 * Note: KuisBuilderPage will auto-detect create mode from URL
 */

import KuisBuilderPage from './KuisBuilderPage';

export default function KuisCreatePage() {
  // KuisBuilderPage akan detect mode dari URL path
  return <KuisBuilderPage />;
}