import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { QrCode, RefreshCcw, X, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../config/api";
import "./index.scss";

const StaffQrCheckin = () => {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanError, setQrScanError] = useState("");
  const [isProcessingQr, setIsProcessingQr] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isBarcodeSupported, setIsBarcodeSupported] = useState(
    typeof window !== "undefined" && "BarcodeDetector" in window
  );

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const zxingControlsRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    setIsBarcodeSupported(
      typeof window !== "undefined" && "BarcodeDetector" in window
    );
  }, []);

  const stopQrScanner = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    barcodeDetectorRef.current = null;
    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch (error) {
        console.log("Error stopping ZXing controls:", error);
      }
      zxingControlsRef.current = null;
    }
    zxingReaderRef.current = null;
    processingRef.current = false;
    setIsProcessingQr(false);
  }, []);

  const submitQrPayload = useCallback(
    async (payload) => {
      try {
        const res = await api.post("/reservations/qr-check", payload);
        const message = res.data?.message || "Check-in bằng QR thành công";

        stopQrScanner();
        setIsQrScannerOpen(false);
        setStatusMessage(message);
        setQrScanError("");
      } catch (error) {
        const errMessage =
          error.response?.data?.message ||
          "Không thể xác thực mã QR. Vui lòng thử lại.";
        setQrScanError(errMessage);
      } finally {
        setIsProcessingQr(false);
        processingRef.current = false;
      }
    },
    [stopQrScanner]
  );

  const handleQrPayload = useCallback(
    async (rawValue) => {
      try {
        const parsed =
          typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
        if (!parsed?.reservationId || !parsed?.hash) {
          throw new Error("INVALID_QR_DATA");
        }
        setIsProcessingQr(true);
        await submitQrPayload(parsed);
      } catch (error) {
        const isInvalid = error.message === "INVALID_QR_DATA";
        setQrScanError(
          isInvalid
            ? "Dữ liệu QR không hợp lệ. Vui lòng quét lại mã chính xác."
            : "Không thể đọc mã QR. Hãy giữ chắc thiết bị và thử lại."
        );
        setIsProcessingQr(false);
        processingRef.current = false;
      }
    },
    [submitQrPayload]
  );

  const scanVideoFrame = useCallback(async () => {
    if (
      !barcodeDetectorRef.current ||
      !videoRef.current ||
      !isQrScannerOpen
    ) {
      return;
    }

    if (videoRef.current.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(() => {
        scanVideoFrame();
      });
      return;
    }

    try {
      const bitmap = await createImageBitmap(videoRef.current);
      const barcodes = await barcodeDetectorRef.current.detect(bitmap);
      bitmap.close();

      if (barcodes.length && !processingRef.current) {
        setIsProcessingQr(true);
        processingRef.current = true;
        await handleQrPayload(barcodes[0].rawValue);
      }
    } catch (error) {
      console.error("QR detect error:", error);
    } finally {
      if (barcodeDetectorRef.current && isQrScannerOpen) {
        animationFrameRef.current = requestAnimationFrame(() => {
          scanVideoFrame();
        });
      }
    }
  }, [handleQrPayload, isQrScannerOpen]);

  const startBarcodeDetectorScanner = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setQrScanError("Thiết bị không hỗ trợ camera.");
      return;
    }

    if (!window.isSecureContext) {
      setQrScanError("Camera chỉ hoạt động trên HTTPS hoặc localhost.");
      return;
    }

    try {
      barcodeDetectorRef.current = new window.BarcodeDetector({
        formats: ["qr_code"],
      });
    } catch (error) {
      setQrScanError(
        "Không thể khởi tạo trình quét. Vui lòng cập nhật trình duyệt."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            animationFrameRef.current = requestAnimationFrame(() => {
              scanVideoFrame();
            });
          } catch (playError) {
            console.error("Video play error:", playError);
            setQrScanError("Không thể phát video từ camera.");
          }
        };
      }
    } catch (error) {
      console.error("Camera access error:", error);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setQrScanError(
          "Quyền truy cập camera bị từ chối. Vui lòng cho phép quyền camera trong cài đặt trình duyệt."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setQrScanError(
          "Không tìm thấy camera. Vui lòng kiểm tra kết nối camera của thiết bị."
        );
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setQrScanError(
          "Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại."
        );
      } else {
        setQrScanError(
          `Lỗi camera: ${error.message || "Vui lòng cho phép quyền sử dụng camera."}`
        );
      }
    }
  }, [scanVideoFrame]);

  const startZxingScanner = useCallback(async () => {
    if (!videoRef.current) {
      setQrScanError("Không tìm thấy phần hiển thị camera để quét.");
      return;
    }

    if (!window.isSecureContext) {
      setQrScanError("Camera chỉ hoạt động trên HTTPS hoặc localhost.");
      return;
    }

    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 300,
        delayBetweenScanSuccess: 800,
      });
      zxingReaderRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result && !processingRef.current) {
            processingRef.current = true;
            setIsProcessingQr(true);
            handleQrPayload(result.getText());
          }
          if (err && err.name !== "NotFoundException") {
            console.error("ZXing scan error:", err);
          }
        }
      );
      zxingControlsRef.current = controls;
    } catch (error) {
      console.error("ZXing error:", error);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setQrScanError(
          "Quyền truy cập camera bị từ chối. Vui lòng cho phép quyền camera trong cài đặt trình duyệt."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setQrScanError(
          "Không tìm thấy camera. Vui lòng kiểm tra kết nối camera của thiết bị."
        );
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setQrScanError(
          "Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại."
        );
      } else {
        setQrScanError(
          `Không thể mở camera: ${
            error.message || "Vui lòng kiểm tra quyền camera của trình duyệt."
          }`
        );
      }
    }
  }, [handleQrPayload]);

  const startQrScanner = useCallback(async () => {
    setQrScanError("");
    setStatusMessage("");
    setIsProcessingQr(false);
    processingRef.current = false;

    if (isBarcodeSupported) {
      await startBarcodeDetectorScanner();
    } else {
      await startZxingScanner();
    }
  }, [isBarcodeSupported, startBarcodeDetectorScanner, startZxingScanner]);

  useEffect(() => {
    if (isQrScannerOpen) {
      startQrScanner();
    } else {
      stopQrScanner();
      setQrScanError("");
    }

    return () => {
      stopQrScanner();
    };
  }, [isQrScannerOpen, startQrScanner, stopQrScanner]);

  return (
    <div className="staff-qr-card">
      <div className="qr-card__header">
        <div>
          <p className="eyebrow">QR Check-in</p>
          <h3>Quét mã đặt chỗ của khách</h3>
          <p className="muted">
            Mở camera để quét nhanh mã QR.
          </p>
        </div>
        <div className="qr-actions">
          <button
            className="btn ghost"
            onClick={() => setIsQrScannerOpen((prev) => !prev)}
          >
            {isQrScannerOpen ? (
              <>
                <X size={16} />
                Đóng camera
              </>
            ) : (
              <>
                <QrCode size={16} />
                Mở camera
              </>
            )}
          </button>
          <button
            className="btn secondary"
            onClick={() => setIsQrScannerOpen(true)}
          >
            <RefreshCcw size={16} />
            Quét lại
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="qr-status success">
          <CheckCircle size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {qrScanError && (
        <div className="qr-status error">
          <AlertCircle size={16} />
          <span>{qrScanError}</span>
        </div>
      )}

      {isQrScannerOpen && (
        <div className="qr-scanner">
          <div className="video-wrapper">
            <video ref={videoRef} playsInline muted autoPlay />
            <div className="scan-guide" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffQrCheckin;
