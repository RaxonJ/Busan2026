import { useState, useCallback } from 'react';

// PIN 碼的 SHA-256 hash（HTTPS 環境用）
// 目前 PIN: 0331
const CORRECT_PIN_HASH = 'b5076a1fecbea736a5f27ff97e0b5d777c94d0b5cf2bad72291d63657fc6355f';

// HTTP 非 localhost 環境（如區網 IP）的 fallback：btoa('0331')
const FALLBACK_PIN_ENCODED = 'MDMzMQ==';

const SESSION_KEY = 'pin_verified';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function usePinAuth() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const isVerified = sessionStorage.getItem(SESSION_KEY) === 'true';

  const requestAccess = useCallback((onGranted: () => void) => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      onGranted();
    } else {
      setPendingCallback(() => onGranted);
      setShowPinModal(true);
    }
  }, []);

  const verify = useCallback(async (pin: string): Promise<boolean> => {
    // 在 HTTP 非 localhost 環境（如區網 IP 測試）中，crypto.subtle 不可用
    // 此時使用 btoa fallback，對家庭旅遊 App 的保護等級已足夠
    if (!crypto?.subtle) {
      return btoa(pin) === FALLBACK_PIN_ENCODED;
    }
    const hash = await sha256(pin);
    return hash === CORRECT_PIN_HASH;
  }, []);

  const onPinSuccess = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowPinModal(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  const onPinCancel = useCallback(() => {
    setShowPinModal(false);
    setPendingCallback(null);
  }, []);

  return {
    isVerified,
    showPinModal,
    requestAccess,
    verify,
    onPinSuccess,
    onPinCancel,
  };
}
