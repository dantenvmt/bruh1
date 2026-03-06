import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Job } from '@/api/types';

const STORAGE_KEY = 'job_aggregator_saved_v1';

type SavedJobMap = Record<string, Job>;

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readSaved(): SavedJobMap {
  if (typeof window === 'undefined') return {};
  const raw = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!raw || typeof raw !== 'object') return {};

  const obj = raw as Record<string, unknown>;
  const items = obj.items;
  if (!items || typeof items !== 'object') return {};

  return items as SavedJobMap;
}

function writeSaved(next: SavedJobMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, items: next }));
}

/**
 * Get stable key for a job (dedupe_key preferred, fallback to id)
 */
function getJobKey(job: Job): string {
  return job.dedupe_key ?? job.id;
}

export function useSavedJobs() {
  const [savedMap, setSavedMap] = useState<SavedJobMap>(() => readSaved());

  const savedJobs = useMemo(() => {
    return Object.values(savedMap).sort((a, b) => {
      const aTime = a.updated_at ? Date.parse(a.updated_at) : 0;
      const bTime = b.updated_at ? Date.parse(b.updated_at) : 0;
      return bTime - aTime;
    });
  }, [savedMap]);

  const isSaved = useCallback(
    (key: string) => Boolean(savedMap[key]),
    [savedMap]
  );

  const isJobSaved = useCallback(
    (job: Job) => isSaved(getJobKey(job)),
    [isSaved]
  );

  const saveJob = useCallback((job: Job) => {
    const key = getJobKey(job);
    setSavedMap((prev) => {
      const next = { ...prev, [key]: job };
      writeSaved(next);
      return next;
    });
  }, []);

  const unsaveJob = useCallback((key: string) => {
    setSavedMap((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      writeSaved(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSavedMap(() => {
      writeSaved({});
      return {};
    });
  }, []);

  const toggleSaved = useCallback(
    (job: Job) => {
      const key = getJobKey(job);
      if (isSaved(key)) {
        unsaveJob(key);
      } else {
        saveJob(job);
      }
    },
    [isSaved, saveJob, unsaveJob]
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setSavedMap(readSaved());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return {
    savedJobs,
    savedCount: savedJobs.length,
    isSaved,
    isJobSaved,
    saveJob,
    unsaveJob,
    toggleSaved,
    clearAll,
    getJobKey,
  };
}

