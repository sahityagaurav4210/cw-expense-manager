import React from "react";
import { Paper } from "@mui/material";

function PaperComponent(props) {
  return (
    <Paper
      {...props}
      sx={{
        borderRadius: 3,
        boxShadow: 6,
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100% - 64px)",
        overflow: "hidden",
        "& > form, & > div[component='form']": {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        },
        ...props.sx,
      }}
    />
  );
}

export default PaperComponent;
