import { useState, useCallback, useMemo } from "react";
import * as echarts from "echarts";

export const GRAPH_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
];

export const useGraphView = (reportItems = []) => {
  const [open, setOpen] = useState(false);
  const [graphType, setGraphType] = useState("bar");

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleGraphTypeChange = useCallback((type) => setGraphType(type), []);

  // Format chronological data for graph (earliest to latest)
  const chronologicalData = useMemo(() => {
    return [...reportItems].sort((a, b) => a.month.localeCompare(b.month));
  }, [reportItems]);

  // Construct Apache ECharts option
  const chartOption = useMemo(() => {
    if (!chronologicalData || chronologicalData.length === 0) {
      return {
        title: {
          text: "No Expenditure Data Available",
          left: "center",
          top: "middle",
          textStyle: { color: "#999", fontSize: 16 },
        },
      };
    }

    const xLabels = chronologicalData.map((d) => d.monthName);
    const seriesData = chronologicalData.map((d) => d.totalExpenditure);

    const isArea = graphType === "area";
    const isLine = graphType === "line" || isArea;

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        textStyle: { color: "#1e293b", fontSize: 13 },
        formatter: (params) => {
          if (!params || params.length === 0) return "";
          const p = params[0];
          const rawItem = chronologicalData[p.dataIndex];
          const formattedAmount = Number(p.value).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          });

          let html = `
            <div style="padding: 4px 6px;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #000080;">
                ${p.name}
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                <span style="color: #64748b;">Total Expenditure:</span>
                <span style="font-weight: 700; color: #b91c1c;">₹${formattedAmount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 12px; color: #64748b;">
                <span>Total Items:</span>
                <span>${rawItem?.expenseCount || 0}</span>
              </div>
            </div>
          `;
          return html;
        },
      },
      grid: {
        top: "14%",
        left: "3%",
        right: "4%",
        bottom: "8%",
        containLabel: true,
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: { title: "Save Chart" },
          magicType: {
            type: ["line", "bar"],
            title: { line: "Line Mode", bar: "Bar Mode" },
          },
          restore: { title: "Reset" },
        },
        right: 15,
        top: 0,
      },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: {
          color: "#475569",
          fontWeight: 600,
          fontSize: 12,
        },
      },
      yAxis: {
        type: "value",
        name: "Expenditure (₹)",
        nameTextStyle: {
          color: "#64748b",
          fontWeight: 600,
          padding: [0, 0, 8, 0],
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: {
          color: "#64748b",
          formatter: (val) => `₹${Number(val).toLocaleString("en-IN")}`,
        },
      },
      series: [
        {
          name: "Expenditure",
          type: isLine ? "line" : "bar",
          smooth: isLine,
          data: seriesData,
          barMaxWidth: 48,
          itemStyle: isLine
            ? {
                color: "#000080",
                borderWidth: 2,
                borderColor: "#fff",
              }
            : {
                borderRadius: [8, 8, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#2563eb" },
                  { offset: 1, color: "#000080" },
                ]),
              },
          lineStyle: isLine
            ? {
                width: 3.5,
                color: "#000080",
              }
            : undefined,
          areaStyle: isArea
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgba(37, 99, 235, 0.45)" },
                  { offset: 1, color: "rgba(0, 0, 128, 0.02)" },
                ]),
              }
            : undefined,
          label: {
            show: !isArea,
            position: "top",
            formatter: (p) => `₹${Number(p.value).toLocaleString("en-IN")}`,
            fontSize: 11,
            fontWeight: 600,
            color: "#334155",
          },
        },
      ],
      animationDuration: 800,
      animationEasing: "cubicOut",
    };
  }, [chronologicalData, graphType]);

  return {
    open,
    graphType,
    graphTypes: GRAPH_TYPES,
    chartOption,
    handleOpen,
    handleClose,
    handleGraphTypeChange,
  };
};
