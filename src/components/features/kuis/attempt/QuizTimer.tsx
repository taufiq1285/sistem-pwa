/**
 * QuizTimer Component
 * 
 * Purpose: Countdown timer for quiz attempts with persistence
 * Used by: QuizAttempt (Mahasiswa)
 * Features: Countdown, warning states, auto-submit, localStorage backup
 */

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface QuizTimerProps {
  /**
   * Quiz duration in minutes
   */
  durationMinutes: number;
  
  /**
   * Attempt ID for localStorage key
   */
  attemptId: string;
  
  /**
   * Callback when time is up
   */
  onTimeUp: () => void;
  
  /**
   * Show timer in header (compact mode)
   */
  compact?: boolean;
  
  /**
   * Optional start time (for resuming)
   */
  startTime?: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WARNING_THRESHOLD_MINUTES = 5;
const CRITICAL_THRESHOLD_MINUTES = 1;
const STORAGE_KEY_PREFIX = 'quiz_timer_';

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizTimer({
  durationMinutes,
  attemptId,
  onTimeUp,
  compact = false,
  startTime,
}: QuizTimerProps) {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    // Try to restore from localStorage
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
    if (stored) {
      const data = JSON.parse(stored);
      return Math.max(0, data.timeRemaining);
    }
    // If startTime is provided, calculate remaining time
    if (startTime) {
      return calculateTimeRemaining(startTime, durationMinutes);
    }
    return durationMinutes * 60; // Convert to seconds
  });
  
  const [isRunning, setIsRunning] = useState(true);
  const [hasWarned, setHasWarned] = useState(false);
  const [hasCriticalWarned, setHasCriticalWarned] = useState(false);
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / (durationMinutes * 60)) * 100;
  
  const isWarning = minutes < WARNING_THRESHOLD_MINUTES && minutes >= CRITICAL_THRESHOLD_MINUTES;
  const isCritical = minutes < CRITICAL_THRESHOLD_MINUTES;
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Timer countdown effect
   */
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1);
        
        // Save to localStorage
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${attemptId}`,
          JSON.stringify({
            timeRemaining: newTime,
            updatedAt: new Date().toISOString(),
          })
        );
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, attemptId]);
  
  /**
   * Time up effect
   */
  useEffect(() => {
    if (timeRemaining === 0) {
      setIsRunning(false);
      onTimeUp();
      
      // Clear localStorage
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
    }
  }, [timeRemaining, onTimeUp, attemptId]);
  
  /**
   * Warning notifications effect
   */
  useEffect(() => {
    if (isCritical && !hasCriticalWarned) {
      setHasCriticalWarned(true);
      // Could trigger a notification here
    } else if (isWarning && !hasWarned) {
      setHasWarned(true);
      // Could trigger a notification here
    }
  }, [isWarning, isCritical, hasWarned, hasCriticalWarned]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Save final state
      if (timeRemaining > 0) {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${attemptId}`,
          JSON.stringify({
            timeRemaining,
            updatedAt: new Date().toISOString(),
          })
        );
      }
    };
  }, [timeRemaining, attemptId]);
  
  // ============================================================================
  // HELPERS
  // ============================================================================
  
  /**
   * Format time display
   */
  const formatTime = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  /**
   * Get color class based on time remaining
   */
  const getColorClass = (): string => {
    if (isCritical) return 'text-red-600 dark:text-red-400';
    if (isWarning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };
  
  /**
   * Get background color for progress
   */
  const getProgressColor = (): string => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (compact) {
    // Compact mode for header
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
        isCritical && "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950",
        isWarning && !isCritical && "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
        !isWarning && !isCritical && "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
      )}>
        <Clock className={cn("h-4 w-4", getColorClass())} />
        <span className={cn("font-mono font-semibold text-sm", getColorClass())}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    );
  }
  
  // Full mode
  return (
    <div className="space-y-4">
      {/* Timer Display */}
      <div className={cn(
        "p-6 rounded-lg border text-center transition-all",
        isCritical && "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950 animate-pulse",
        isWarning && !isCritical && "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
        !isWarning && !isCritical && "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
      )}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Clock className={cn("h-6 w-6", getColorClass())} />
          <span className="text-sm font-medium text-muted-foreground">
            Waktu Tersisa
          </span>
        </div>
        
        <div className={cn(
          "text-5xl font-mono font-bold mb-4",
          getColorClass()
        )}>
          {formatTime(timeRemaining)}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-linear",
              getProgressColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {percentage.toFixed(0)}% waktu tersisa
        </p>
      </div>
      
      {/* Warning Messages */}
      {isCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Waktu hampir habis!</strong> Kuis akan otomatis tersubmit dalam {minutes} menit {seconds} detik.
          </AlertDescription>
        </Alert>
      )}
      
      {isWarning && !isCritical && (
        <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Perhatian! Waktu tinggal {minutes} menit. Segera selesaikan jawaban Anda.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS (Export for external use)
// ============================================================================

/**
 * Clear timer data from localStorage
 */
export function clearTimerData(attemptId: string): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
}

/**
 * Get remaining time from localStorage
 */
export function getStoredTimeRemaining(attemptId: string): number | null {
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    return data.timeRemaining;
  } catch {
    return null;
  }
}

/**
 * Calculate time remaining from start time
 */
export function calculateTimeRemaining(
  startTime: Date,
  durationMinutes: number
): number {
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const total = durationMinutes * 60;
  return Math.max(0, total - elapsed);
}