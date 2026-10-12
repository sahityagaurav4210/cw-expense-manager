import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useReports } from "../../hooks/useReports";
import { useDurationFilter } from "../../hooks/useDurationFilter";
import { useGraphView } from "../../hooks/useGraphView";
import ExpenditureCard from "../../components/reports/ExpenditureCard";
import DurationFilter from "../../components/reports/DurationFilter";
import GraphViewDialog from "../../components/dialogs/GraphViewDialog";
import useAppCss from "../../hooks/css/useAppCss";

const ReportsView = () => {
  const { GlobalPaperCss } = useAppCss();

  // 1. Core Reports Data Hook
  const { reportItems, loading, handleFilterChange, refetch } = useReports();

  // 2. Duration Filter Hook
  const {
    duration,
    startDate,
    endDate,
    isCustom,
    options,
    maxDate,
    handleDurationChange,
    handleStartDateChange,
    handleEndDateChange,
  } = useDurationFilter(handleFilterChange);

  // 3. Graph View Hook
  const {
    open: graphModalOpen,
    graphType,
    chartOption,
    handleOpen: handleOpenGraphModal,
    handleClose: handleCloseGraphModal,
    handleGraphTypeChange,
  } = useGraphView(reportItems);

  // Reusable duration filter element
  const durationFilterElement = (
    <DurationFilter
      duration={duration}
      startDate={startDate}
      endDate={endDate}
      isCustom={isCustom}
      options={options}
      maxDate={maxDate}
      onDurationChange={handleDurationChange}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
    />
  );

  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      {/* Page Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 128, 0.2)",
            }}
          >
            <AssessmentIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Expenditure Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly expenditure breakdown, variance analysis & graph analytics
            </Typography>
          </Box>
        </Box>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="medium"
            onClick={refetch}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            Refresh
          </Button>

          {/* Graph View Button at top right corner */}
          <Button
            variant="contained"
            color="primary"
            size="medium"
            onClick={handleOpenGraphModal}
            startIcon={<BarChartIcon />}
            sx={{
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(0, 0, 128, 0.25)",
            }}
          >
            Graph View
          </Button>
        </Stack>
      </Box>

      {/* Filter Toolbar row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        p={2}
        mb={3}
        bgcolor="#f8fafc"
        borderRadius={2.5}
        border="1px solid #e2e8f0"
      >
        {durationFilterElement}

        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Showing {reportItems.length}{" "}
          {reportItems.length === 1 ? "month" : "months"}
        </Typography>
      </Box>

      {/* Loading Indicator */}
      {loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
          gap={1.5}
        >
          <CircularProgress size={40} color="primary" />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Loading expenditure reports...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && reportItems.length === 0 && (
        <Alert severity="info" sx={{ my: 4, borderRadius: 2 }}>
          No expenditure records found for the selected time duration. Try
          choosing a different range or add new expenses.
        </Alert>
      )}

      {/* List of Monthly Expenditure Cards */}
      {!loading && reportItems.length > 0 && (
        <Grid container spacing={3}>
          {reportItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.month}>
              <ExpenditureCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Graph View Modal Dialog */}
      <GraphViewDialog
        open={graphModalOpen}
        onClose={handleCloseGraphModal}
        chartOption={chartOption}
        graphType={graphType}
        onGraphTypeChange={handleGraphTypeChange}
        durationFilterComponent={durationFilterElement}
      />
    </Paper>
  );
};

export default ReportsView;
