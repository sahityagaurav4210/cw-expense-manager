import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import SecurityIcon from "@mui/icons-material/Security";

const CAPTCHA_SERVICE_URL = "http://localhost:11905";

/**
 * Plug-and-play CAPTCHA component connecting to Captcha Service (http://localhost:11905)
 * with robust client-side fallback generation if backend is unavailable.
 * Automatically reloads CAPTCHA upon any API failure across the application.
 */
const CaptchaComponent = ({
  value,
  onChange,
  onCaptchaIdChange,
  disabled = false,
  error = false,
  helperText = "",
  name = "",
}) => {
  const [captchaId, setCaptchaId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallbackCode, setFallbackCode] = useState("");
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const isFetchingRef = useRef(false);

  const drawFallbackCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, "#f1f5f9");
    grad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Text
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = "#000080";
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      ctx.translate(18 * i + 15, 24);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  const generateCaptcha = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${CAPTCHA_SERVICE_URL}/api/v1/captcha/generate`);
      if (res.ok) {
        const data = await res.json();
        const cid =
          data?.details?.details?.captchaId ||
          data?.details?.captchaId ||
          String(Date.now());
        setCaptchaId(cid);
        if (onCaptchaIdChange) onCaptchaIdChange(cid);
        setImageUrl(`${CAPTCHA_SERVICE_URL}/api/v1/captcha/image/${cid}`);
        setFallbackCode("");
      } else {
        throw new Error("Captcha service responded with error");
      }
    } catch {
      // Offline fallback
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const cid = `fallback_${btoa(code)}_${Date.now()}`;
      setFallbackCode(code);
      setCaptchaId(cid);
      if (onCaptchaIdChange) onCaptchaIdChange(cid);
      setImageUrl("");
      setTimeout(() => drawFallbackCaptcha(code), 50);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [onCaptchaIdChange]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Listen to global API error event to auto-reload CAPTCHA and reset text
  useEffect(() => {
    const handleApiError = () => {
      if (disabled) return;

      // If an active modal is displayed on screen, background page CAPTCHAs should not reload
      if (wrapperRef.current) {
        const closestDialog = wrapperRef.current.closest('[role="dialog"]');
        const activeModal = document.querySelector('[role="dialog"]');
        if (activeModal && !closestDialog) {
          return;
        }
      }

      generateCaptcha();
      if (onChange) {
        onChange({ target: { value: "" } });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cw-api-error", handleApiError);
      return () => {
        window.removeEventListener("cw-api-error", handleApiError);
      };
    }
  }, [disabled, generateCaptcha, onChange]);

  const handleAudioPlay = () => {
    if (captchaId && imageUrl) {
      const audio = new Audio(
        `${CAPTCHA_SERVICE_URL}/api/v1/captcha/audio/${captchaId}`,
      );
      audio.play().catch(() => {});
    } else if (fallbackCode) {
      const utterance = new SpeechSynthesisUtterance(
        fallbackCode.split("").join(" "),
      );
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box ref={wrapperRef} display="flex" flexDirection="column" gap={1} width="100%">
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box
          sx={{
            borderRadius: 1.5,
            my: 1,
            border: "1px solid gainsboro",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f8fafc",
            position: "relative",
          }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="CAPTCHA"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <canvas ref={canvasRef} width={140} height={40} />
          )}
        </Box>

        <Tooltip title="Refresh CAPTCHA">
          <IconButton
            size="small"
            onClick={generateCaptcha}
            disabled={loading || disabled}
            color="primary"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Audio CAPTCHA">
          <IconButton
            size="small"
            onClick={handleAudioPlay}
            disabled={loading || disabled}
            color="secondary"
          >
            <VolumeUpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <TextField
        label="Enter CAPTCHA"
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        error={error}
        helperText={helperText || "Enter the characters shown above"}
        inputProps={{ maxLength: 8 }}
        size="small"
        fullWidth
        required
        InputProps={{
          startAdornment: (
            <SecurityIcon fontSize="small" color="action" sx={{ mr: 1 }} />
          ),
        }}
      />
    </Box>
  );
};

export default React.memo(CaptchaComponent);
