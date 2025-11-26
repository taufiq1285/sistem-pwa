/**
 * useAutoSave Hook
 *
 * React hook for automatic data saving with debouncing
 * - Auto-save on data changes
 * - Debouncing to reduce save frequency
 * - Save status tracking
 * - Manual save trigger
 * - Conflict detection
 * - Optimistic updates
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

// ============================================================================
// TYPES
// ============================================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface UseAutoSaveOptions<T> {
  /** Debounce delay in milliseconds */
  delay?: number;
  /** Enable auto-save (can be toggled) */
  enabled?: boolean;
  /** Only save when online */
  onlineOnly?: boolean;
  /** Custom save function */
  onSave?: (data: T) => Promise<void>;
  /** Callback when save succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when save fails */
  onError?: (error: Error, data: T) => void;
  /** Callback when conflict detected */
  onConflict?: (localData: T, serverData: T) => T | null;
  /** Enable conflict detection */
  detectConflicts?: boolean;
  /** Compare function to detect changes */
  isEqual?: (a: T, b: T) => boolean;
}

export interface UseAutoSaveReturn<T> {
  /** Current save status */
  status: SaveStatus;
  /** Whether currently saving */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Last save timestamp */
  lastSaved: number | null;
  /** Last save error */
  error: Error | null;
  /** Trigger manual save */
  save: () => Promise<void>;
  /** Reset to saved state */
  reset: () => void;
  /** Mark as saved without saving */
  markAsSaved: () => void;
  /** Update data (triggers auto-save) */
  updateData: (data: T | ((prev: T) => T)) => void;
  /** Current data */
  data: T;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Default equality check (deep comparison)
 */
function defaultIsEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for automatic data saving
 *
 * @param initialData - Initial data state
 * @param options - Auto-save options
 * @returns Auto-save helpers and state
 *
 * @example
 * ```tsx
 * function KuisEditor() {
 *   const {
 *     data,
 *     updateData,
 *     status,
 *     hasUnsavedChanges,
 *     save,
 *   } = useAutoSave(initialKuis, {
 *     delay: 2000, // Save 2 seconds after last change
 *     onSave: async (kuis) => {
 *       await kuisApi.update(kuis.id, kuis);
 *     },
 *     onlineOnly: true,
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         value={data.judul}
 *         onChange={(e) => updateData({ ...data, judul: e.target.value })}
 *       />
 *       <div>Status: {status}</div>
 *       {hasUnsavedChanges && <button onClick={save}>Save Now</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoSave<T>(
  initialData: T,
  options: UseAutoSaveOptions<T> = {}
): UseAutoSaveReturn<T> {
  const {
    delay = 1000,
    enabled = true,
    onlineOnly = false,
    onSave,
    onSuccess,
    onError,
    onConflict: _onConflict, // TODO: Implement conflict detection
    detectConflicts: _detectConflicts = false, // TODO: Implement conflict detection
    isEqual = defaultIsEqual,
  } = options;

  const { isOnline } = useNetworkStatus();

  // ============================================================================
  // STATE
  // ============================================================================

  const [data, setData] = useState<T>(initialData);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const savedDataRef = useRef<T>(initialData);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const mountedRef = useRef<boolean>(true);
  const savingRef = useRef<boolean>(false);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const isSaving = useMemo(() => status === 'saving', [status]);

  const hasUnsavedChanges = useMemo(() => {
    return !isEqual(data, savedDataRef.current);
  }, [data, isEqual]);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Perform save operation
   */
  const performSave = useCallback(
    async (dataToSave: T) => {
      // Check if online (if required)
      if (onlineOnly && !isOnline) {
        console.log('[AutoSave] Skipping save - offline and onlineOnly=true');
        return;
      }

      // Prevent concurrent saves
      if (savingRef.current) {
        console.log('[AutoSave] Save already in progress');
        return;
      }

      if (!onSave) {
        console.warn('[AutoSave] No onSave function provided');
        return;
      }

      if (!mountedRef.current) return;

      try {
        savingRef.current = true;
        setStatus('saving');
        setError(null);

        // Perform save
        await onSave(dataToSave);

        if (!mountedRef.current) return;

        // Update saved data reference
        savedDataRef.current = dataToSave;

        // Update status
        setStatus('saved');
        setLastSaved(Date.now());

        // Call success callback
        onSuccess?.(dataToSave);

        console.log('[AutoSave] Save successful');
      } catch (err) {
        if (!mountedRef.current) return;

        const saveError = err instanceof Error ? err : new Error('Save failed');
        setError(saveError);
        setStatus('error');

        // Call error callback
        onError?.(saveError, dataToSave);

        console.error('[AutoSave] Save failed:', saveError);
      } finally {
        savingRef.current = false;
      }
    },
    [onSave, onSuccess, onError, onlineOnly, isOnline]
  );

  /**
   * Trigger manual save
   */
  const save = useCallback(async () => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }

    await performSave(data);
  }, [data, performSave]);

  /**
   * Reset to saved state
   */
  const reset = useCallback(() => {
    setData(savedDataRef.current);
    setStatus('idle');
    setError(null);

    // Clear pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }
  }, []);

  /**
   * Mark as saved without saving
   */
  const markAsSaved = useCallback(() => {
    savedDataRef.current = data;
    setStatus('saved');
    setLastSaved(Date.now());

    // Clear pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }
  }, [data]);

  /**
   * Update data (triggers auto-save)
   */
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(newData);
    setStatus('idle');
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Auto-save when data changes
   */
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      performSave(data);
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, hasUnsavedChanges, delay, performSave]);

  /**
   * Handle online/offline transitions
   */
  useEffect(() => {
    // If we come back online and have unsaved changes, save them
    if (onlineOnly && isOnline && hasUnsavedChanges && enabled) {
      console.log('[AutoSave] Back online, triggering save');
      performSave(data);
    }
  }, [isOnline, onlineOnly, hasUnsavedChanges, enabled, data, performSave]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Warn about unsaved changes on unmount
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return useMemo(
    () => ({
      status,
      isSaving,
      hasUnsavedChanges,
      lastSaved,
      error,
      save,
      reset,
      markAsSaved,
      updateData,
      data,
    }),
    [
      status,
      isSaving,
      hasUnsavedChanges,
      lastSaved,
      error,
      save,
      reset,
      markAsSaved,
      updateData,
      data,
    ]
  );
}
