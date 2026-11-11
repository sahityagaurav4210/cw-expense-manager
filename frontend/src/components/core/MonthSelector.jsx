import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';

/**
 * Generates month selection list (e.g. past 24 months + next 6 months).
 */
const generateMonthOptions = (pastMonths = 24, futureMonths = 6) => {
  const current = dayjs();
  const currentKey = current.format('YYYY-MM');
  const options = [];

  for (let i = futureMonths; i >= -pastMonths; i--) {
    const d = current.add(i, 'month');
    const key = d.format('YYYY-MM');
    const isCurrent = key === currentKey;
    options.push({
      label: isCurrent ? `${d.format('MMMM YYYY')} (Current Month)` : d.format('MMMM YYYY'),
      displayMonth: d.format('MMMM YYYY'),
      value: key,
      isCurrent,
    });
  }
  return options;
};

/**
 * Core MonthSelector Component.
 * Provides a standardized, reusable month selection dropdown for reports and statements.
 *
 * @param {string} value - Selected month key (format: "YYYY-MM")
 * @param {function} onChange - Callback triggered when month changes (receives new month key string "YYYY-MM")
 * @param {string} [label="Select Statement Month:"] - Label text displayed next to icon
 * @param {number} [pastMonths=24] - How many months in the past to show
 * @param {number} [futureMonths=6] - How many months in the future to show
 * @param {boolean} [disabled=false] - Whether dropdown is disabled
 * @param {string} [size="small"] - Size of input ("small" | "medium")
 * @param {object} [sx={}] - Container sx overrides
 */
const MonthSelector = ({
  value,
  onChange,
  label = 'Select Statement Month:',
  pastMonths = 24,
  futureMonths = 6,
  disabled = false,
  size = 'small',
  sx = {},
}) => {
  const options = useMemo(
    () => generateMonthOptions(pastMonths, futureMonths),
    [pastMonths, futureMonths],
  );

  const selectedOption = useMemo(() => {
    if (!value) {
      return options.find((o) => o.isCurrent) || options[futureMonths] || options[0];
    }
    return options.find((o) => o.value === value) || {
      label: dayjs(`${value}-01`).format('MMMM YYYY'),
      displayMonth: dayjs(`${value}-01`).format('MMMM YYYY'),
      value,
      isCurrent: value === dayjs().format('YYYY-MM'),
    };
  }, [options, value, futureMonths]);

  const handleChange = (event, newOption) => {
    if (newOption && onChange) {
      onChange(newOption.value);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={2}
      p={1.5}
      sx={{
        bgcolor: '#f8fafc',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        ...sx,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={0.75}>
          <CalendarMonthIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            {label}
          </Typography>
        </Box>

        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.label || ''}
          isOptionEqualToValue={(option, val) => option.value === val?.value}
          value={selectedOption}
          onChange={handleChange}
          disableClearable
          disabled={disabled}
          size={size}
          sx={{ width: { xs: '100%', sm: 260 } }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Choose Month"
              variant="outlined"
              size={size}
            />
          )}
        />
      </Box>

      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          label={selectedOption?.displayMonth || 'Selected Month'}
          color={selectedOption?.isCurrent ? 'primary' : 'default'}
          variant={selectedOption?.isCurrent ? 'filled' : 'outlined'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Box>
  );
};

MonthSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  pastMonths: PropTypes.number,
  futureMonths: PropTypes.number,
  disabled: PropTypes.bool,
  size: PropTypes.string,
  sx: PropTypes.object,
};

export default React.memo(MonthSelector);
