import React from "react";
import { Box, Tooltip } from "@mui/material";

const NavbarLogo = ({ src = "/ind.svg", height = 16, hidePadding = false, hideTooltip = false, alt = "India Flag" }) => {
  const imgElement = (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        height: height,
        verticalAlign: "middle",
        display: "inline-block",
        px: hidePadding ? 0 : 0.5,
      }}
    />
  );

  if (hideTooltip) return imgElement;

  return <Tooltip title="India">{imgElement}</Tooltip>;
};

export default React.memo(NavbarLogo);
