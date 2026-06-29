'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: any) => void
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure }: BarcodeScannerProps) {
  const scannerId = useMemo(() => "barcode-scanner-" + Math.random().toString(36).substring(2, 9), [])
  const html5QrCode = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Prevent double initialization in React strict mode
    if (html5QrCode.current) return

    const initScanner = async () => {
      try {
        html5QrCode.current = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        })

        const config = { fps: 10, qrbox: { width: 250, height: 100 } }

        await html5QrCode.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            onScanSuccess(decodedText)
          },
          (errorMessage) => {
            if (onScanFailure) onScanFailure(errorMessage)
          }
        )
      } catch (err) {
        setError('Não foi possível acessar a câmera. Verifique as permissões.')
        console.error('Camera start error:', err)
      }
    }
    
    // Give a short delay to ensure DOM is fully ready (important for some Next.js transitions)
    const timeout = setTimeout(initScanner, 50);

    return () => {
      clearTimeout(timeout);
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current.stop().then(() => {
          html5QrCode.current?.clear()
        }).catch(err => console.error('Error stopping scanner:', err))
      }
    }
  }, [onScanSuccess, onScanFailure, scannerId])

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2)' }}>
      {error && <div className="alert alert-danger" style={{ marginBottom: '10px' }}>{error}</div>}
      <div id={scannerId} style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }} />
      <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
        Aponte a câmera para o código de barras
      </p>
    </div>
  )
}
