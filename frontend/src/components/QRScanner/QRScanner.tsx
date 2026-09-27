import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { Camera, UploadCloud, Keyboard, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import './QRScanner.css';

interface QRScannerProps {
  onScanSuccess: (decodedToken: string) => void;
  onScanError?: (errorMessage: string) => void;
  isLoading?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [manualToken, setManualToken] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = 'qr-reader-viewport';

  // Play audio chime on successful scan
  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio playback fails silently if user has not interacted
    }
  };

  // Helper to extract clean token
  const extractToken = (rawText: string): string => {
    const trimmed = rawText.trim();
    // 1. Try parsing as JSON if backend encoded payload
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        if (parsed.token) return parsed.token;
        if (parsed.qrToken) return parsed.qrToken;
        if (parsed.id) return parsed.id;
      }
    } catch {
      // Not JSON, continue
    }

    // 2. Try parsing URL query parameter
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const urlToken = url.searchParams.get('token') || url.searchParams.get('qr') || url.searchParams.get('t');
        if (urlToken) return urlToken;
      }
    } catch {
      // Not a valid URL, continue
    }

    return trimmed;
  };

  const handleDecoded = (decodedText: string) => {
    const token = extractToken(decodedText);
    playSuccessBeep();
    // Stop camera before passing token
    stopCamera();
    onScanSuccess(token);
  };

  // Enumerate cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCameraError('No camera devices found on this system.');
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error:', err);
        setCameraError('Unable to access camera. Please check browser permissions.');
      });
  }, []);

  // Start Camera
  const startCamera = async (cameraId?: string) => {
    setCameraError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      // If already scanning, stop first
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const cameraConfig: any = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };
      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Ignored per-frame decode errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setCameraError(
        typeof err === 'string'
          ? err
          : err?.message || 'Could not start camera. Please verify camera permissions.'
      );
      setIsScanning(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Manage camera on tab changes
  useEffect(() => {
    if (activeTab === 'camera') {
      // Small timeout to allow DOM node to render
      const timer = setTimeout(() => {
        startCamera(selectedCameraId);
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeTab, selectedCameraId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle file scan
  const processImageFile = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setCameraError('');
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      handleDecoded(decodedText);
    } catch (err: any) {
      const msg = 'No readable QR code found in this image. Please try a clearer picture.';
      setCameraError(msg);
      if (onScanError) onScanError(msg);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleDecoded(manualToken.trim());
  };

  return (
    <div className="qr-scanner-container animate-in">
      {/* Tabs */}
      <div className="qr-tabs">
        <button
          type="button"
          className={`qr-tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          <Camera size={18} />
          Live Camera
        </button>
        <button
          type="button"
          className={`qr-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={18} />
          Upload QR
        </button>
        <button
          type="button"
          className={`qr-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <Keyboard size={18} />
          Manual Code
        </button>
      </div>

      {/* Error alert */}
      {cameraError && (
        <div className="login-error" style={{ justifyContent: 'center' }}>
          <AlertCircle size={16} />
          {cameraError}
        </div>
      )}

      {/* TAB 1: Live Camera View */}
      {activeTab === 'camera' && (
        <div className="flex-col gap-sm">
          <div className="camera-viewport-card">
            <div id={containerId} />

            {/* Futuristic Overlay Viewfinder */}
            {isScanning && (
              <div className="scanner-overlay">
                <div className="scanner-target-box">
                  <div className="scanner-corner tl" />
                  <div className="scanner-corner tr" />
                  <div className="scanner-corner bl" />
                  <div className="scanner-corner br" />
                  <div className="scanner-laser" />
                </div>
                <div className="scanner-hint-text">
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Align patient QR code within frame
                </div>
              </div>
            )}
          </div>

          {/* Camera controls toolbar */}
          {cameras.length > 0 && (
            <div className="camera-controls-bar">
              <select
                className="input select camera-select"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                disabled={isLoading}
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    📷 {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => startCamera(selectedCameraId)}
                title="Restart Camera"
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isScanning ? '' : 'spin'} />
                Reload
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Upload Image */}
      {activeTab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            className={`qr-dropzone ${dragActive ? 'drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processImageFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <div className="qr-dropzone-icon">
              <UploadCloud size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
                {isProcessingFile ? 'Scanning image...' : 'Choose or Drag QR Image'}
              </div>
              <div className="text-xs text-muted">Supports PNG, JPG, JPEG, WEBP files</div>
            </div>
            {isProcessingFile && <span className="spinner" />}
          </div>
        </div>
      )}

      {/* TAB 3: Manual Code Entry */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="flex-col gap-md">
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>QR Token or Patient Code</label>
            <input
              className="input"
              placeholder="Paste or type token UUID / code..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={!manualToken.trim() || isLoading}
          >
            {isLoading ? <span className="spinner" /> : 'Verify Code'}
          </button>
        </form>
      )}
    </div>
  );
};
