import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import dayjs from 'dayjs';

/**
 * Calculates current financial year start year (April to March cycle).
 */
export const getCurrentFinancialYearStart = () => {
  const current = dayjs();
  const currentYear = current.year();
  const currentMonth = current.month() + 1; // 1 to 12
  return currentMonth >= 4 ? currentYear : currentYear - 1;
};

/**
 * Formats start year into standard FY key (e.g. 2026 -> "2026-27")
 */
export const formatFinancialYearKey = (startYear) => {
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(-2)}`;
};

/**
 * Generates financial year options (e.g. past 8 fiscal years + 1 future year).
 */
const generateFinancialYearOptions = (pastYears = 8, futureYears = 1) => {
  const currentFyStart = getCurrentFinancialYearStart();
  const options = [];

  for (let i = futureYears; i >= -pastYears; i--) {
    const start = currentFyStart + i;
    const end = start + 1;
    const key = `${start}-${String(end).slice(-2)}`;
    const isCurrent = start === currentFyStart;

    options.push({
      label: isCurrent ? `FY ${start}-${String(end).slice(-2)} (Current FY)` : `FY ${start}-${String(end).slice(-2)}`,
      displayLabel: `FY ${start}-${String(end).slice(-2)}`,
      periodRange: `Apr ${start} - Mar ${end}`,
      value: key,
      isCurrent,
    });
  }
  return options;
};

/**
 * Core FinancialYearSelector Component.
 * Standardized selector for Indian / statutory fiscal years (April 1 to March 31).
 *
 * @param {string} value - Selected FY key (format: "YYYY-YY", e.g. "2026-27")
 * @param {function} onChange - Callback triggered when FY changes (receives new FY key string)
 * @param {string} [label="Select Financial Year:"] - Label text displayed next to icon
 * @param {boolean} [disabled=false] - Whether dropdown is disabled
 * @param {string} [size="small"] - Size of input ("small" | "medium")
 * @param {object} [sx={}] - Container sx overrides
 */
const FinancialYearSelector = ({
  value,
  onChange,
  label = 'Select Financial Year:',
  disabled = false,
  size = 'small',
  sx = {},
}) => {
  const options = useMemo(() => generateFinancialYearOptions(), []);
  const currentFyStart = getCurrentFinancialYearStart();
  const currentFyKey = formatFinancialYearKey(currentFyStart);

  const selectedOption = useMemo(() => {
    if (!value) {
      return options.find((o) => o.isCurrent) || options[1] || options[0];
    }
    return (
      options.find((o) => o.value === value) || {
        label: `FY ${value}`,
        displayLabel: `FY ${value}`,
        periodRange: '',
        value,
        isCurrent: value === currentFyKey,
      }
    );
  }, [options, value, currentFyKey]);

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
          <DateRangeIcon color="primary" fontSize="small" />
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
              placeholder="Choose FY"
              variant="outlined"
              size={size}
            />
          )}
        />
      </Box>

      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          label={selectedOption?.displayLabel || 'Selected FY'}
          color={selectedOption?.isCurrent ? 'primary' : 'default'}
          variant={selectedOption?.isCurrent ? 'filled' : 'outlined'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Box>
  );
};

FinancialYearSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.string,
  sx: PropTypes.object,
};

export default React.memo(FinancialYearSelector);
