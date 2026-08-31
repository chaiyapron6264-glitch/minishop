"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initializeLiff, type LiffInitResult } from "@/lib/liff";

type LiffContextValue = LiffInitResult & {
  isLoading: boolean;
};

const initialState: LiffContextValue = {
  liff: null,
  isConfigured: false,
  isInitialized: false,
  isInClient: false,
  isLoggedIn: false,
  profile: null,
  error: null,
  isLoading: true,
};

const LiffContext = createContext<LiffContextValue>(initialState);

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiffContextValue>(initialState);

  useEffect(() => {
    let isMounted = true;

    initializeLiff().then((result) => {
      if (!isMounted) return;
      setState({ ...result, isLoading: false });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export const useLiff = () => useContext(LiffContext);
