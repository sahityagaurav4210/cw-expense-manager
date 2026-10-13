import { useState, useMemo } from "react";
import * as echarts from "echarts";

export const DASHBOARD_GRAPH_TYPES = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
];

export const DASHBOARD_METRIC_TYPES = [
  { value: "category", label: "Category Breakdown" },
  { value: "cashflow", label: "Cashflow & Budget" },
  { value: "debts", label: "Debts & Receivables" },
];

export const useDashboardGraph = (metrics, selectedMonth) => {
  const [graphType, setGraphType] = useState("bar"); // 'bar' | 'line' | 'area' | 'pie'
  const [metricType, setMetricType] = useState("category"); // 'category' | 'cashflow' | 'debts'

  const monthlyIncome = metrics?.monthlyIncome || 0;
  const totalExpense = metrics?.totalExpenseIncurred || 0;
  const moneyLeft =
    metrics?.amountofMoneyLeft !== undefined
      ? metrics.amountofMoneyLeft
      : metrics?.amountMoneyLeft || 0;
  const categoryBreakdown = metrics?.categoryBreakdown || [];

  const pendingReceivables =
    metrics?.pendingReceivables !== undefined
      ? metrics.pendingReceivables
      : metrics?.debtsSummary?.totalPendingReceivable || 0;
  const pendingPayables =
    metrics?.pendingPayables !== undefined
      ? metrics.pendingPayables
      : metrics?.debtsSummary?.totalPendingPayable || 0;

  const totalLent = metrics?.debtsSummary?.totalLent || 0;
  const totalRecovered = metrics?.debtsSummary?.totalRecovered || 0;
  const totalBorrowed = metrics?.debtsSummary?.totalBorrowed || 0;
  const totalRepaid = metrics?.debtsSummary?.totalRepaid || 0;

  const chartOption = useMemo(() => {
    // -------------------------------------------------------------------------
    // 1. CATEGORY BREAKDOWN METRIC
    // -------------------------------------------------------------------------
    if (metricType === "category") {
      if (!categoryBreakdown || categoryBreakdown.length === 0) {
        return {
          title: {
            text: `No Category Expenses Recorded for ${selectedMonth}`,
            left: "center",
            top: "middle",
            textStyle: { color: "#94a3b8", fontSize: 16, fontWeight: 500 },
          },
        };
      }

      if (graphType === "pie") {
        return {
          title: {
            text: `Category Expense Distribution - ${selectedMonth}`,
            left: "center",
            top: 8,
            textStyle: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
          },
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            borderColor: "#cbd5e1",
            borderWidth: 1,
            textStyle: { color: "#0f172a" },
            formatter: (p) => `
              <div style="padding: 4px 6px;">
                <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">${p.name}</div>
                <div style="display: flex; justify-content: space-between; gap: 14px; margin-bottom: 2px;">
                  <span style="color: #64748b;">Amount Spent:</span>
                  <strong style="color: #b91c1c;">₹${Number(p.value).toLocaleString("en-IN")}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 14px;">
                  <span style="color: #64748b;">Share of Total:</span>
                  <strong style="color: #2563eb;">${p.percent}%</strong>
                </div>
              </div>
            `,
          },
          legend: {
            orient: "horizontal",
            bottom: 8,
            type: "scroll",
            textStyle: { color: "#475569", fontSize: 12 },
          },
          series: [
            {
              name: "Category Expenses",
              type: "pie",
              radius: ["40%", "70%"],
              center: ["50%", "50%"],
              avoidLabelOverlap: true,
              itemStyle: {
                borderRadius: 8,
                borderColor: "#ffffff",
                borderWidth: 2,
              },
              label: {
                show: true,
                formatter: "{b}: {d}%",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 14,
                  fontWeight: 700,
                },
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.2)",
                },
              },
              data: categoryBreakdown.map((c) => ({
                name: c.category,
                value: c.amount,
              })),
            },
          ],
        };
      }

      const xLabels = categoryBreakdown.map((c) => c.category);
      const seriesData = categoryBreakdown.map((c) => c.amount);
      const isArea = graphType === "area";
      const isLine = graphType === "line" || isArea;

      return {
        title: {
          text: `Expenditure by Category - ${selectedMonth}`,
          left: "left",
          top: 0,
          textStyle: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          textStyle: { color: "#0f172a" },
          formatter: (params) => {
            if (!params || params.length === 0) return "";
            const p = params[0];
            const rawItem = categoryBreakdown[p.dataIndex];
            return `
              <div style="padding: 4px 6px;">
                <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">${p.name}</div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 2px;">
                  <span style="color: #64748b;">Amount Spent:</span>
                  <strong style="color: #b91c1c;">₹${Number(p.value).toLocaleString("en-IN")}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px;">
                  <span style="color: #64748b;">Share of Total:</span>
                  <strong style="color: #2563eb;">${rawItem?.percentage || 0}%</strong>
                </div>
              </div>
            `;
          },
        },
        grid: {
          top: "16%",
          left: "3%",
          right: "4%",
          bottom: "12%",
          containLabel: true,
        },
        toolbox: {
          show: true,
          feature: {
            saveAsImage: { title: "Save Chart" },
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
            interval: 0,
            rotate: xLabels.length > 5 ? 25 : 0,
          },
        },
        yAxis: {
          type: "value",
          name: "Amount (₹)",
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
            name: "Amount Spent",
            type: isLine ? "line" : "bar",
            smooth: isLine,
            data: seriesData,
            barMaxWidth: 44,
            itemStyle: isLine
              ? { color: "#1976d2", borderWidth: 2, borderColor: "#ffffff" }
              : {
                  borderRadius: [8, 8, 0, 0],
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "#3b82f6" },
                    { offset: 1, color: "#1d4ed8" },
                  ]),
                },
            lineStyle: isLine ? { width: 3.5, color: "#1976d2" } : undefined,
            areaStyle: isArea
              ? {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "rgba(59, 130, 246, 0.45)" },
                    { offset: 1, color: "rgba(29, 78, 216, 0.02)" },
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
        animationDuration: 750,
        animationEasing: "cubicOut",
      };
    }

    // -------------------------------------------------------------------------
    // 2. CASHFLOW & BUDGET METRIC
    // -------------------------------------------------------------------------
    if (metricType === "cashflow") {
      const cashflowItems = [
        { name: "Allocated Income", value: monthlyIncome, color: "#2196f3" },
        { name: "Incurred Expense", value: totalExpense, color: "#b91c1c" },
        { name: "Money Left", value: moneyLeft, color: "#228B22" },
        { name: "Pending Receivables", value: pendingReceivables, color: "#7c3aed" },
        { name: "Pending Payables", value: pendingPayables, color: "#ea580c" },
      ];

      if (graphType === "pie") {
        return {
          title: {
            text: `Monthly Cashflow Breakdown - ${selectedMonth}`,
            left: "center",
            top: 8,
            textStyle: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
          },
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            borderColor: "#cbd5e1",
            borderWidth: 1,
            textStyle: { color: "#0f172a" },
            formatter: (p) => `
              <div style="padding: 4px 6px;">
                <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">${p.name}</div>
                <div style="display: flex; justify-content: space-between; gap: 14px;">
                  <span style="color: #64748b;">Amount:</span>
                  <strong style="color: ${p.color};">₹${Number(p.value).toLocaleString("en-IN")}</strong>
                </div>
              </div>
            `,
          },
          legend: {
            orient: "horizontal",
            bottom: 8,
            type: "scroll",
            textStyle: { color: "#475569", fontSize: 12 },
          },
          series: [
            {
              name: "Cashflow",
              type: "pie",
              radius: ["40%", "70%"],
              center: ["50%", "50%"],
              itemStyle: {
                borderRadius: 8,
                borderColor: "#ffffff",
                borderWidth: 2,
              },
              label: {
                show: true,
                formatter: "{b}: ₹{c}",
                fontSize: 11,
                fontWeight: 600,
                color: "#334155",
              },
              data: cashflowItems.map((item) => ({
                name: item.name,
                value: item.value,
                itemStyle: { color: item.color },
              })),
            },
          ],
        };
      }

      const xLabels = cashflowItems.map((i) => i.name);
      const isArea = graphType === "area";
      const isLine = graphType === "line" || isArea;

      return {
        title: {
          text: `Cashflow & Budget Metrics - ${selectedMonth}`,
          left: "left",
          top: 0,
          textStyle: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          textStyle: { color: "#0f172a" },
          formatter: (params) => {
            if (!params || params.length === 0) return "";
            const p = params[0];
            return `
              <div style="padding: 4px 6px;">
                <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">${p.name}</div>
                <div style="display: flex; justify-content: space-between; gap: 16px;">
                  <span style="color: #64748b;">Amount:</span>
                  <strong style="color: ${cashflowItems[p.dataIndex]?.color || "#1976d2"};">₹${Number(p.value).toLocaleString("en-IN")}</strong>
                </div>
              </div>
            `;
          },
        },
        grid: {
          top: "16%",
          left: "3%",
          right: "4%",
          bottom: "12%",
          containLabel: true,
        },
        toolbox: {
          show: true,
          feature: {
            saveAsImage: { title: "Save Chart" },
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
            interval: 0,
            rotate: 15,
          },
        },
        yAxis: {
          type: "value",
          name: "Amount (₹)",
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
            name: "Financial Value",
            type: isLine ? "line" : "bar",
            smooth: isLine,
            data: cashflowItems.map((item) => ({
              value: item.value,
              itemStyle: {
                color: isLine ? undefined : item.color,
                borderRadius: isLine ? undefined : [8, 8, 0, 0],
              },
            })),
            barMaxWidth: 48,
            lineStyle: isLine ? { width: 3.5, color: "#1976d2" } : undefined,
            areaStyle: isArea
              ? {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "rgba(25, 118, 210, 0.45)" },
                    { offset: 1, color: "rgba(25, 118, 210, 0.02)" },
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
        animationDuration: 750,
        animationEasing: "cubicOut",
      };
    }

    // -------------------------------------------------------------------------
    // 3. DEBTS & RECEIVABLES METRIC
    // -------------------------------------------------------------------------
    if (metricType === "debts") {
      const debtData = [
        {
          group: "Money Lent (Receivables)",
          total: totalLent,
          settled: totalRecovered,
          pending: pendingReceivables,
          color: "#7c3aed",
        },
        {
          group: "Money Borrowed (Payables)",
          total: totalBorrowed,
          settled: totalRepaid,
          pending: pendingPayables,
          color: "#ea580c",
        },
      ];

      if (graphType === "pie") {
        return {
          title: {
            text: "Debts & Receivables Balances",
            left: "center",
            top: 8,
            textStyle: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
          },
          tooltip: {
            trigger: "item",
            formatter: "{b}: ₹{c} ({d}%)",
          },
          legend: {
            orient: "horizontal",
            bottom: 8,
            textStyle: { color: "#475569", fontSize: 12 },
          },
          series: [
            {
              name: "Debts Status",
              type: "pie",
              radius: ["40%", "70%"],
              center: ["50%", "50%"],
              itemStyle: {
                borderRadius: 8,
                borderColor: "#ffffff",
                borderWidth: 2,
              },
              data: [
                {
                  name: "Lent - Recovered",
                  value: totalRecovered,
                  itemStyle: { color: "#16a34a" },
                },
                {
                  name: "Lent - Pending",
                  value: pendingReceivables,
                  itemStyle: { color: "#7c3aed" },
                },
                {
                  name: "Borrowed - Repaid",
                  value: totalRepaid,
                  itemStyle: { color: "#0284c7" },
                },
                {
                  name: "Borrowed - Pending",
                  value: pendingPayables,
                  itemStyle: { color: "#ea580c" },
                },
              ].filter((d) => d.value > 0),
            },
          ],
        };
      }

      return {
        title: {
          text: "Debts & Receivables Recovery Status",
          left: "left",
          top: 0,
          textStyle: { fontSize: 15, fontWeight: 700, color: "#1e293b" },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            if (!params || params.length === 0) return "";
            let html = `<div style="padding: 4px 6px;"><strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((p) => {
              html += `<div style="display:flex; justify-content:space-between; gap:16px;">
                <span>${p.seriesName}:</span>
                <strong>₹${Number(p.value).toLocaleString("en-IN")}</strong>
              </div>`;
            });
            html += "</div>";
            return html;
          },
        },
        legend: {
          data: ["Total Principal", "Settled / Repaid", "Pending Balance"],
          top: 0,
          right: 120,
          textStyle: { color: "#475569", fontSize: 12 },
        },
        grid: {
          top: "16%",
          left: "3%",
          right: "4%",
          bottom: "10%",
          containLabel: true,
        },
        toolbox: {
          show: true,
          feature: {
            saveAsImage: { title: "Save Chart" },
            restore: { title: "Reset" },
          },
          right: 15,
          top: 0,
        },
        xAxis: {
          type: "category",
          data: debtData.map((d) => d.group),
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#475569", fontWeight: 600, fontSize: 13 },
        },
        yAxis: {
          type: "value",
          name: "Amount (₹)",
          splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
          axisLabel: {
            color: "#64748b",
            formatter: (val) => `₹${Number(val).toLocaleString("en-IN")}`,
          },
        },
        series: [
          {
            name: "Total Principal",
            type: graphType === "line" || graphType === "area" ? "line" : "bar",
            data: debtData.map((d) => d.total),
            barMaxWidth: 36,
            itemStyle: { color: "#3b82f6", borderRadius: [6, 6, 0, 0] },
          },
          {
            name: "Settled / Repaid",
            type: graphType === "line" || graphType === "area" ? "line" : "bar",
            data: debtData.map((d) => d.settled),
            barMaxWidth: 36,
            itemStyle: { color: "#16a34a", borderRadius: [6, 6, 0, 0] },
          },
          {
            name: "Pending Balance",
            type: graphType === "line" || graphType === "area" ? "line" : "bar",
            data: debtData.map((d) => d.pending),
            barMaxWidth: 36,
            itemStyle: { color: "#dc2626", borderRadius: [6, 6, 0, 0] },
          },
        ],
        animationDuration: 750,
      };
    }

    return {};
  }, [
    metricType,
    graphType,
    selectedMonth,
    categoryBreakdown,
    monthlyIncome,
    totalExpense,
    moneyLeft,
    pendingReceivables,
    pendingPayables,
    totalLent,
    totalRecovered,
    totalBorrowed,
    totalRepaid,
  ]);

  return {
    graphType,
    setGraphType,
    metricType,
    setMetricType,
    chartOption,
    graphTypes: DASHBOARD_GRAPH_TYPES,
    metricTypes: DASHBOARD_METRIC_TYPES,
  };
};
