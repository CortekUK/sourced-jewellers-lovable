import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, Scan, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(source: HTMLVideoElement | ImageData | HTMLCanvasElement): Promise<Array<{
          rawValue: string;
          format: string;
        }>>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supportsBarcodeDetector, setSupportsBarcodeDetector] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if BarcodeDetector is supported
    if ('BarcodeDetector' in window) {
      setSupportsBarcodeDetector(true);
    }
  }, []);

  useEffect(() => {
    if (open && supportsBarcodeDetector) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, supportsBarcodeDetector]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setError(null);
      startScanning();
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    stopScanning();
  };

  const startScanning = () => {
    if (!supportsBarcodeDetector || !videoRef.current) return;

    setIsScanning(true);
    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          // @ts-ignore - BarcodeDetector might not be in types yet
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code']
          });
          
          const barcodes = await barcodeDetector.detect(videoRef.current);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            handleScan(barcode);
          }
        } catch (err) {
          console.error('Barcode scanning error:', err);
        }
      }
    }, 100); // Scan every 100ms
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleScan = (barcode: string) => {
    if (barcode.trim()) {
      onScan(barcode.trim());
      onOpenChange(false);
      toast({
        title: 'Barcode scanned',
        description: `Found: ${barcode}`
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleClose = () => {
    stopCamera();
    setManualBarcode('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Use your camera to scan a product barcode or enter it manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Section */}
          {supportsBarcodeDetector ? (
            <div className="space-y-3">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-48 bg-black rounded-lg object-cover"
                    playsInline
                    muted
                  />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary w-48 h-32 border-dashed rounded-lg opacity-60" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cameraStream ? stopCamera : startCamera}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraStream ? 'Stop Camera' : 'Start Camera'}
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Barcode scanning is not supported in this browser. You can still enter barcodes manually below.
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Entry Section */}
          <div className="border-t pt-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <Label htmlFor="manual-barcode">Or enter barcode manually:</Label>
                <Input
                  id="manual-barcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode or SKU..."
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Search Product
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}