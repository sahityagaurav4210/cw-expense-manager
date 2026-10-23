import { Box, Typography, useTheme } from "@mui/material";
import React from "react";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";

function Notes({ note, noteColor = "" }) {
  const theme = useTheme();
  const color = noteColor || theme.palette.error.main;

  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        columnGap: 1,
        alignItems: "center",
        color,
        my: 0.5,
      }}
    >
      <ArrowCircleRightIcon fontSize="small" />
      <Typography variant="caption">{note}</Typography>
    </Box>
  );
}

export default React.memo(Notes);
