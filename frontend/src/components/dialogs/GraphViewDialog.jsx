import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import PaperComponent from "../core/PaperComponent";
import ExpenditureChart from "../reports/ExpenditureChart";
import AppDialogTitle from "../core/AppDialogTitle";

const GraphViewDialog = ({
  open,
  onClose,
  chartOption,
  graphType,
  onGraphTypeChange,
  durationFilterComponent,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={PaperComponent}
      aria-labelledby="graph-view-dialog-title"
    >
      <AppDialogTitle
        title="Expenditure Graph Analytics"
        onClose={onClose}
        Icon={<BarChartIcon sx={{ color: "white" }} />}
      />

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Controls Bar: Duration selector & Graph type toggle */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={2.5}
        >
          {/* Optional inline duration filter */}
          {durationFilterComponent && (
            <Box flexGrow={1}>{durationFilterComponent}</Box>
          )}

          {/* Graph Type Toggles */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
            >
              Graph Type:
            </Typography>
            <ToggleButtonGroup
              value={graphType}
              exclusive
              onChange={(e, nextType) => {
                if (nextType !== null) onGraphTypeChange(nextType);
              }}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  px: 1.5,
                  py: 0.5,
                  border: "none",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "primary.hover" },
                  },
                },
              }}
            >
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Bar
              </ToggleButton>
              <ToggleButton value="line" aria-label="line chart">
                <ShowChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Line
              </ToggleButton>
              <ToggleButton value="area" aria-label="area chart">
                <TimelineIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Area
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ECharts Chart Component */}
        <Box sx={{ width: "100%", height: 420 }}>
          <ExpenditureChart option={chartOption} height={420} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.75, bgcolor: "#f8fafc" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{ fontWeight: 600, textTransform: "none" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(GraphViewDialog);
