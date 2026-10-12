import React, { useState, useEffect, useContext } from "react";
import { Typography, Box, Tooltip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { AuthContext } from "../../context/AuthContext";

const SessionTimerTypography = ({ sx = {} }) => {
  const { token } = useContext(AuthContext);
  const [timeLeftStr, setTimeLeftStr] = useState("");

  useEffect(() => {
    if (!token) {
      setTimeLeftStr("");
      return;
    }

    const updateTimer = () => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!payload || !payload.exp) {
          setTimeLeftStr("");
          return;
        }

        const expMs = payload.exp * 1000;
        const now = Date.now();
        const diffMs = expMs - now;

        if (diffMs <= 0) {
          setTimeLeftStr("00:00");
          return;
        }

        const totalSec = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;

        const formattedMins = String(mins).padStart(2, "0");
        const formattedSecs = String(secs).padStart(2, "0");

        setTimeLeftStr(`${formattedMins}:${formattedSecs}`);
      } catch (err) {
        setTimeLeftStr("");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [token]);

  if (!timeLeftStr) return null;

  return (
    <Tooltip title={`Session expires in ${timeLeftStr}`} arrow>
      <Typography
        variant="body2"
        component="div"
        sx={{
          color: "text.secondary",
          fontSize: { xs: "0.75rem", sm: "0.85rem" },
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: { xs: 0.4, sm: 0.75 },
          whiteSpace: "nowrap",
          lineHeight: 1,
          ...sx,
        }}
      >
        <AccessTimeIcon
          sx={{
            fontSize: { xs: "0.85rem", sm: "1.1rem" },
            verticalAlign: "middle",
          }}
        />
        <Box
          component="span"
          sx={{
            display: { xs: "none", sm: "inline" },
          }}
        >
          Session expires in :&nbsp;
        </Box>
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        >
          {timeLeftStr}
        </Box>
      </Typography>
    </Tooltip>
  );
};

export default SessionTimerTypography;
