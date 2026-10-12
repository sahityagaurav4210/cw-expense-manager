import { useState, useCallback } from "react";
import dayjs from "dayjs";

export const DURATION_OPTIONS = [
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

export const useDurationFilter = (onFilterChange) => {
  const [duration, setDuration] = useState("last_3_months");
  const [startDate, setStartDate] = useState(dayjs().subtract(2, "month").startOf("month"));
  const [endDate, setEndDate] = useState(dayjs());

  const handleDurationChange = useCallback(
    (newDuration) => {
      setDuration(newDuration);
      if (newDuration !== "custom") {
        if (onFilterChange) {
          onFilterChange({
            duration: newDuration,
            startDate: undefined,
            endDate: undefined,
          });
        }
      } else {
        if (onFilterChange) {
          onFilterChange({
            duration: "custom",
            startDate: startDate ? startDate.format("YYYY-MM-DD") : undefined,
            endDate: endDate ? endDate.format("YYYY-MM-DD") : undefined,
          });
        }
      }
    },
    [onFilterChange, startDate, endDate]
  );

  const handleStartDateChange = useCallback(
    (newStartDate) => {
      setStartDate(newStartDate);
      if (duration === "custom" && onFilterChange && newStartDate && endDate) {
        onFilterChange({
          duration: "custom",
          startDate: newStartDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
        });
      }
    },
    [duration, endDate, onFilterChange]
  );

  const handleEndDateChange = useCallback(
    (newEndDate) => {
      setEndDate(newEndDate);
      if (duration === "custom" && onFilterChange && startDate && newEndDate) {
        onFilterChange({
          duration: "custom",
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: newEndDate.format("YYYY-MM-DD"),
        });
      }
    },
    [duration, startDate, onFilterChange]
  );

  return {
    duration,
    startDate,
    endDate,
    isCustom: duration === "custom",
    options: DURATION_OPTIONS,
    maxDate: dayjs(), // For disabling future dates
    handleDurationChange,
    handleStartDateChange,
    handleEndDateChange,
  };
};
