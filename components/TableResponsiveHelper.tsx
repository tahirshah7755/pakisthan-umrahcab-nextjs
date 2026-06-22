"use client";

import { useEffect } from "react";

export default function TableResponsiveHelper() {
  useEffect(() => {
    const updateTableLabels = () => {
      const tables = document.querySelectorAll("table");
      tables.forEach((table) => {
        // Find all th elements in the thead
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) => {
          return th.textContent?.trim() || "";
        });

        if (headers.length === 0) return;

        // Find all trs in tbody
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          cells.forEach((cell, index) => {
            // Ignore cells that span multiple columns or are meant as empty loaders/drawers
            if (cell.getAttribute("colspan")) return;

            const headerText = headers[index];
            if (headerText) {
              cell.setAttribute("data-label", headerText);
            } else {
              // Fallback for action or empty headers
              cell.setAttribute("data-label", "Action");
            }
          });
        });
      });
    };

    // Run on initial mount
    updateTableLabels();

    // Set up a MutationObserver to listen to DOM updates (e.g. data load, page navigation, filtering)
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldUpdate = true;
          break;
        }
      }
      if (shouldUpdate) {
        updateTableLabels();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
