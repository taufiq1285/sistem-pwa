import React, { useEffect, useRef } from "react";

const CHART_JS_CDN_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";

let chartJsLoadPromise: Promise<any> | null = null;

function loadChartJs(): Promise<any> {
  const existingChart = (window as any).Chart;
  if (existingChart) {
    return Promise.resolve(existingChart);
  }

  if (chartJsLoadPromise) {
    return chartJsLoadPromise;
  }

  chartJsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CHART_JS_CDN_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve((window as any).Chart),
        {
          once: true,
        },
      );
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Chart.js")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CHART_JS_CDN_URL;
    script.async = true;
    script.onload = () => resolve((window as any).Chart);
    script.onerror = () => {
      chartJsLoadPromise = null;
      reject(new Error("Failed to load Chart.js"));
    };
    document.head.appendChild(script);
  });

  return chartJsLoadPromise;
}

interface LegendItem {
  label: string;
  color: string;
}

interface DashboardChartProps {
  type: "line" | "doughnut" | "bar";
  title: string;
  subTitle: string;
  icon?: React.ReactNode;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[] | ((context: any) => string);
      borderColor?: string;
      borderWidth?: number;
      fill?: boolean;
    }[];
  };
  periodBadge?: string;
  legendItems?: LegendItem[];
  className?: string;
}

export function DashboardChart({
  type,
  title,
  subTitle,
  icon,
  data,
  periodBadge = "Bulan Ini",
  legendItems = [],
  className = "",
}: DashboardChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canvasRef.current) return;

    // Destroy previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const createChart = async () => {
      const ChartJS = await loadChartJs();

      if (cancelled || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      // Read design tokens from computed CSS variables
      const style = getComputedStyle(document.documentElement);
      const accentColor =
        style.getPropertyValue("--role-accent").trim() || "#3b82f6";
      const textPrimary =
        style.getPropertyValue("--text-primary").trim() || "#0d1f17";
      const textMuted =
        style.getPropertyValue("--text-muted").trim() || "#7a9486";

      // Setup basic config
      const config: any = {
        type: type,
        data: {
          labels: data.labels,
          datasets: data.datasets.map((dataset) => ({ ...dataset })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false, // We render the legend manually or use custom layouts
            },
            tooltip: {
              enabled: true,
              backgroundColor: "#ffffff",
              titleColor: textPrimary,
              bodyColor: textMuted,
              borderColor: "rgba(0, 0, 0, 0.08)",
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              cornerRadius: 10,
              titleFont: {
                family: "Plus Jakarta Sans",
                size: 12,
                weight: "700",
              },
              bodyFont: {
                family: "Plus Jakarta Sans",
                size: 11,
                weight: "500",
              },
            },
          },
          scales: {},
        },
      };

      // Apply specific styles
      if (type === "line") {
        config.options.scales = {
          x: {
            grid: {
              color: "rgba(0, 0, 0, 0.04)",
            },
            ticks: {
              font: {
                family: "Plus Jakarta Sans",
                size: 11,
              },
              color: textMuted,
            },
          },
          y: {
            grid: {
              color: "rgba(0, 0, 0, 0.04)",
            },
            ticks: {
              font: {
                family: "Plus Jakarta Sans",
                size: 11,
              },
              color: textMuted,
            },
          },
        };

        if (config.data.datasets.length > 0) {
          config.data.datasets[0] = {
            ...config.data.datasets[0],
            borderColor: accentColor,
            backgroundColor: (context: any) => {
              const chart = context.chart;
              const { ctx: chartCtx, chartArea } = chart;
              if (!chartArea) return "rgba(0,0,0,0)";
              const gradient = chartCtx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom,
              );
              // var(--role-accent) with 0.08 opacity (approx '14' in hex)
              gradient.addColorStop(0, accentColor + "14");
              gradient.addColorStop(1, accentColor + "00");
              return gradient;
            },
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: accentColor,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: accentColor,
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2,
          };
        }
      } else if (type === "bar") {
        config.options.scales = {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: "Plus Jakarta Sans",
                size: 11,
              },
              color: textMuted,
            },
          },
          y: {
            grid: {
              color: "rgba(0, 0, 0, 0.04)",
            },
            ticks: {
              font: {
                family: "Plus Jakarta Sans",
                size: 11,
              },
              color: textMuted,
            },
          },
        };

        if (config.data.datasets.length > 0) {
          config.data.datasets[0] = {
            ...config.data.datasets[0],
            backgroundColor: accentColor,
            hoverBackgroundColor: accentColor + "cc", // opacity 0.8 is 'cc'
            borderRadius: {
              topLeft: 4,
              topRight: 4,
              bottomLeft: 0,
              bottomRight: 0,
            },
            borderSkipped: false,
            barThickness: 20,
          };
        }
      } else if (type === "doughnut") {
        config.options.cutout = "70%";
        if (config.data.datasets.length > 0) {
          config.data.datasets[0] = {
            ...config.data.datasets[0],
            borderWidth: 2,
            borderColor: "#ffffff",
          };
        }
      }

      chartInstanceRef.current = new ChartJS(ctx, config);
    };

    createChart().catch((error) => {
      console.error("Chart.js failed to load.", error);
    });

    return () => {
      cancelled = true;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [type, data]);

  return (
    <div className={`chart-container-card ${className}`}>
      <div className="chart-header-wrap">
        <div className="chart-header-left">
          {icon && <div className="chart-header-icon">{icon}</div>}
          <div className="chart-header-text">
            <h4 className="chart-title">{title}</h4>
            <span className="chart-subtitle">{subTitle}</span>
          </div>
        </div>
        {periodBadge && <div className="chart-period-badge">{periodBadge}</div>}
      </div>
      <div className="chart-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      {type === "doughnut" && legendItems && legendItems.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 pt-3 border-t border-border-light">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-semibold text-text-secondary select-none">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardChart;
