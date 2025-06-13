// src/reportWebVitals.ts

import type { ReportHandler } from "web-vitals";

/**
 * reportWebVitals can be passed a callback to receive performance metrics.
 * It dynamically imports the web-vitals library and invokes the callback
 * for each metric (CLS, FID, FCP, LCP, TTFB).
 *
 * @param onPerfEntry - Optional callback to handle each metric entry.
 */
const reportWebVitals = (onPerfEntry?: ReportHandler): void => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
