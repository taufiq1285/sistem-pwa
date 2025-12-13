# KuisListPage Implementation Guide

## File Location
`src/pages/mahasiswa/kuis/KuisListPage.tsx`

## Overview
This page displays the list of available quizzes for students with filtering, searching, and status management.

## Features Implemented
✅ Display all quizzes using `getUpcomingQuizzes()` API
✅ 4 summary stat cards (Upcoming, Ongoing, Completed, Missed)
✅ Search by quiz title, course code, course name, or class name
✅ Filter by status using tabs
✅ Responsive quiz cards (3 columns on large screens)
✅ Action buttons based on quiz status
✅ Loading and error states
✅ Empty state handling
✅ URL params for status filter persistence

## Implementation

Replace the entire contents of `src/pages/mahasiswa/kuis/KuisListPage.tsx` with the implementation below.

The implementation is approximately 400 lines and includes:
- State management for quizzes, filters, search
- API integration with `getUpcomingQuizzes()`
- Quiz card component with dynamic status badges
- Navigation to attempt and result pages
- Responsive grid layout
- Error handling

## Key Components

### Summary Stats (4 cards)
- Akan Datang (Upcoming) - Blue
- Berlangsung (Ongoing) - Green
- Selesai (Completed) - Gray
- Terlewat (Missed) - Red

### Quiz Card Features
- Status badge and icon
- Course code and name
- Class name
- Duration in minutes
- Total questions
- Start and end dates
- Attempts counter (used/max)
- Best score display (if available)
- Action button:
  - "Mulai Kuis" - Start quiz (first attempt)
  - "Coba Lagi" - Retry (subsequent attempts)
  - "Lihat Hasil" - View results (completed)
  - Disabled states for upcoming/missed/no attempts

### Search & Filter
- Search input with icon
- Tabs for status filtering
- Live filtering on type
- URL param integration

## Routes Used
- `/mahasiswa/kuis/${id}/attempt` - Start quiz
- `/mahasiswa/kuis/${id}/result` - View results

## API Integration
```typescript
import { getUpcomingQuizzes } from '@/lib/api/kuis.api';
import type { UpcomingQuiz } from '@/types/kuis.types';
```

## Status Flow
1. **upcoming** - Quiz not started yet → Button disabled "Belum Dimulai"
2. **ongoing** - Quiz active → "Mulai Kuis" or "Coba Lagi" button
3. **completed** - Quiz ended → "Lihat Hasil" button
4. **missed** - Quiz ended without attempts → Button disabled "Terlewat"

## Next Steps
After implementing this file:
1. Test the quiz list page loads correctly
2. Verify filters and search work
3. Test navigation to attempt page
4. Test navigation to results page (for completed quizzes)
5. Verify responsive design on mobile
