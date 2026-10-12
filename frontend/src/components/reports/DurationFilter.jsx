import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

const DurationFilter = ({
  duration,
  startDate,
  endDate,
  isCustom,
  options,
  maxDate,
  onDurationChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        flexWrap="wrap"
      >
        {/* MUI Select for time duration */}
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
          <InputLabel id="duration-select-label">Time Duration</InputLabel>
          <Select
            labelId="duration-select-label"
            id="duration-select"
            value={duration}
            label="Time Duration"
            onChange={(e) => onDurationChange(e.target.value)}
            startAdornment={
              <FilterAltIcon
                fontSize="small"
                sx={{ color: "text.secondary", mr: 1, ml: -0.5 }}
              />
            }
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Custom Range: MUI DatePickers with future dates disabled */}
        {isCustom && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{
              p: 1,
              bgcolor: "background.paper",
              borderRadius: 2,
              border: "1px solid #e2e8f0",
            }}
          >
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={onStartDateChange}
              maxDate={maxDate}
              disableFuture
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: isMobile,
                  sx: { minWidth: { sm: 150 } },
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={onEndDateChange}
              maxDate={maxDate}
              disableFuture
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: isMobile,
                  sx: { minWidth: { sm: 150 } },
                },
              }}
            />
          </Stack>
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default React.memo(DurationFilter);
