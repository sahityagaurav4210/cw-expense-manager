import React from "react";
import { Box, Typography } from "@mui/material";

const Heading = ({
  Icon,
  text,
  color,
  iconColor,
  mb = 1,
  hideAnimation = false,
}) => {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={mb}>
      {Icon && <Icon sx={{ color: iconColor || color || "primary.main" }} />}
      <Typography
        variant="h6"
        component="span"
        sx={{ color: color || "text.primary", fontWeight: 700 }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default React.memo(Heading);
