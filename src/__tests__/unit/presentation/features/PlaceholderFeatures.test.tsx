import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ComponentName as AnswerInputPlaceholder } from "@/components/features/kuis/attempt/AnswerInput";
import { ComponentName as QuestionDisplayPlaceholder } from "@/components/features/kuis/attempt/QuestionDisplay";
import { ComponentName as AutoSaveIndicatorPlaceholder } from "@/components/features/kuis/builder/AutoSaveIndicator";
import { ComponentName as QuestionListPlaceholder } from "@/components/features/kuis/builder/QuestionList";
import { ComponentName as PendingSyncBadgePlaceholder } from "@/components/features/kuis/result/PendingSyncBadge";
import { ComponentName as DownloadForOfflinePlaceholder } from "@/components/features/materi/DownloadForOffline";
import { ComponentName as MateriUploadFormPlaceholder } from "@/components/features/materi/MateriUploadForm";
import { ComponentName as OfflineMateriListPlaceholder } from "@/components/features/materi/OfflineMateriList";
import { ComponentName as NilaiCardPlaceholder } from "@/components/features/nilai/NilaiCard";
import { ComponentName as NilaiChartPlaceholder } from "@/components/features/nilai/NilaiChart";
import { ComponentName as TranscriptTablePlaceholder } from "@/components/features/nilai/TranscriptTable";
import { ComponentName as QueuedItemsListPlaceholder } from "@/components/features/sync/QueuedItemsList";
import { ComponentName as SyncHistoryPlaceholder } from "@/components/features/sync/SyncHistory";
import { ComponentName as SyncPanelPlaceholder } from "@/components/features/sync/SyncPanel";

const PLACEHOLDERS = [
  { name: "AnswerInput", Component: AnswerInputPlaceholder },
  { name: "QuestionDisplay", Component: QuestionDisplayPlaceholder },
  { name: "AutoSaveIndicator", Component: AutoSaveIndicatorPlaceholder },
  { name: "QuestionList", Component: QuestionListPlaceholder },
  { name: "PendingSyncBadge", Component: PendingSyncBadgePlaceholder },
  { name: "DownloadForOffline", Component: DownloadForOfflinePlaceholder },
  { name: "MateriUploadForm", Component: MateriUploadFormPlaceholder },
  { name: "OfflineMateriList", Component: OfflineMateriListPlaceholder },
  { name: "NilaiCard", Component: NilaiCardPlaceholder },
  { name: "NilaiChart", Component: NilaiChartPlaceholder },
  { name: "TranscriptTable", Component: TranscriptTablePlaceholder },
  { name: "QueuedItemsList", Component: QueuedItemsListPlaceholder },
  { name: "SyncHistory", Component: SyncHistoryPlaceholder },
  { name: "SyncPanel", Component: SyncPanelPlaceholder },
] as const;

describe("Feature placeholder components", () => {
  it.each(PLACEHOLDERS)(
    "render placeholder TODO untuk $name",
    ({ Component }) => {
      render(<Component />);

      expect(
        screen.getByText("TODO: Implement [ComponentName]"),
      ).toBeInTheDocument();
      cleanup();
    },
  );
});
