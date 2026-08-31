import type { LiffClient, LiffProfile, LiffShareMessage } from "@/types/liff";

const liffSdkUrl = "https://static.line-scdn.net/liff/edge/2/sdk.js";

let sdkPromise: Promise<LiffClient> | null = null;
let initPromise: Promise<LiffClient> | null = null;

export type LiffInitResult = {
  liff: LiffClient | null;
  isConfigured: boolean;
  isInitialized: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  error: string | null;
};

export const getLiffId = () => process.env.NEXT_PUBLIC_LIFF_ID ?? "";

const loadLiffSdk = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("LIFF can initialize only in the browser"));
  }

  if (window.liff) {
    return Promise.resolve(window.liff);
  }

  if (!sdkPromise) {
    sdkPromise = new Promise<LiffClient>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${liffSdkUrl}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.liff) resolve(window.liff);
          else reject(new Error("LIFF SDK loaded without window.liff"));
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("โหลด LIFF SDK ไม่สำเร็จ"));
        });
        return;
      }

      const script = document.createElement("script");
      script.src = liffSdkUrl;
      script.async = true;
      script.onload = () => {
        if (window.liff) resolve(window.liff);
        else reject(new Error("LIFF SDK loaded without window.liff"));
      };
      script.onerror = () => reject(new Error("โหลด LIFF SDK ไม่สำเร็จ"));
      document.head.appendChild(script);
    });
  }

  return sdkPromise;
};

export async function initializeLiff(): Promise<LiffInitResult> {
  const liffId = getLiffId();

  if (!liffId) {
    return {
      liff: null,
      isConfigured: false,
      isInitialized: false,
      isInClient: false,
      isLoggedIn: false,
      profile: null,
      error: null,
    };
  }

  try {
    if (!initPromise) {
      initPromise = loadLiffSdk().then(async (liff) => {
        await liff.init({ liffId });
        return liff;
      });
    }

    const liff = await initPromise;
    const isInClient = liff.isInClient();
    const isLoggedIn = liff.isLoggedIn();
    const profile = isInClient && isLoggedIn ? await liff.getProfile() : null;

    return {
      liff,
      isConfigured: true,
      isInitialized: true,
      isInClient,
      isLoggedIn,
      profile,
      error: null,
    };
  } catch (error) {
    return {
      liff: null,
      isConfigured: true,
      isInitialized: false,
      isInClient: false,
      isLoggedIn: false,
      profile: null,
      error: error instanceof Error ? error.message : "LIFF เริ่มทำงานไม่สำเร็จ",
    };
  }
}

export async function shareWithLine(messages: LiffShareMessage[]) {
  const result = await initializeLiff();

  if (!result.liff || !result.isInitialized) {
    throw new Error("LIFF ยังไม่พร้อมใช้งาน");
  }

  return result.liff.shareTargetPicker(messages);
}
