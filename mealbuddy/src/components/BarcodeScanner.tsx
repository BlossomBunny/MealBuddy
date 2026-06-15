"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

const REGION_ID = "barcode-scanner-region";

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (cancelled) return;

        html5QrCode = new Html5Qrcode(REGION_ID);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
          },
          (decodedText) => {
            if (detectedRef.current) return;
            detectedRef.current = true;
            onDetected(decodedText);
          },
          () => {
            // Ignore per-frame "no barcode found" callbacks
          }
        );
      } catch (err) {
        console.error("Camera error", err);
        setError("Couldn't access the camera. Check camera permissions and try again.");
      }
    })();

    return () => {
      cancelled = true;
      if (html5QrCode) {
        html5QrCode
          .stop()
          .then(() => html5QrCode?.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-white font-display font-black text-lg">📷 Scan barcode</h2>
        <button onClick={onClose} className="text-white text-3xl leading-none px-2">
          ×
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {error ? (
          <div className="text-center text-white/90 max-w-sm">
            <div className="text-4xl mb-3">🚫</div>
            <p className="font-semibold mb-1">Camera unavailable</p>
            <p className="text-sm text-white/70">{error}</p>
          </div>
        ) : (
          <div id={REGION_ID} className="w-full max-w-md rounded-2xl overflow-hidden" />
        )}
      </div>

      <p className="text-center text-white/70 text-sm pb-8 px-6">
        Point your camera at the barcode on the packaging
      </p>
    </div>
  );
}
