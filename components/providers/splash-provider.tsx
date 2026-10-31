"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";

interface SplashContextType {
  showSplash: () => void;
  hideSplash: () => void;
  isSplashVisible: boolean;
}

const SplashContext = createContext<SplashContextType>({
  showSplash: () => {},
  hideSplash: () => {},
  isSplashVisible: false,
});

export function useSplash() {
  return useContext(SplashContext);
}

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [isSplashVisible, setIsSplashVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if the splash screen has already been shown in this browser session
    try {
      const hasSeenSplash = sessionStorage.getItem("cha_adda_splash_shown");
      if (!hasSeenSplash) {
        setIsSplashVisible(true);
      }
    } catch {
      // In case sessionStorage is blocked, fallback to showing once
      setIsSplashVisible(true);
    }
  }, []);

  const hideSplash = useCallback(() => {
    setIsSplashVisible(false);
    try {
      sessionStorage.setItem("cha_adda_splash_shown", "true");
    } catch {
      // Ignore storage errors
    }
  }, []);

  const showSplash = useCallback(() => {
    setIsSplashVisible(true);
  }, []);

  return (
    <SplashContext.Provider value={{ showSplash, hideSplash, isSplashVisible }}>
      {children}
      {isMounted && (
        <SplashScreen
          isVisible={isSplashVisible}
          onFinish={hideSplash}
          autoDismissMs={2600}
        />
      )}
    </SplashContext.Provider>
  );
}
