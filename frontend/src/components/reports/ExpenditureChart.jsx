import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import * as echarts from "echarts";

const ExpenditureChart = ({ option, height = 400 }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, null, {
        renderer: "canvas",
      });
    }

    const instance = chartInstanceRef.current;
    if (option) {
      instance.setOption(option, true);
    }

    const handleResize = () => {
      if (instance && !instance.isDisposed()) {
        instance.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [option]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <Box
      ref={chartRef}
      sx={{
        width: "100%",
        height: height,
        minHeight: 320,
      }}
    />
  );
};

export default React.memo(ExpenditureChart);
