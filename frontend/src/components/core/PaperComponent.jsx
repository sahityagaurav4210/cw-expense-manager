import React from "react";
import { Paper } from "@mui/material";

function PaperComponent(props) {
  return <Paper {...props} sx={{ borderRadius: 3, boxShadow: 6, ...props.sx }} />;
}

export default PaperComponent;
