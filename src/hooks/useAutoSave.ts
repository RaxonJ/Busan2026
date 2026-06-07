import { useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  value: T,
  saveFn: (v: T) => Promise<void>,
  delay = 1500
): { status: AutoSaveStatus } {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setStatus('idle');

    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await saveFnRef.current(value);
        setStatus('saved');
        savedTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return { status };
}
