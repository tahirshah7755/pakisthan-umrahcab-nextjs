/**
 * Reusable High-Fidelity Excel Export Engine for UmrahCab
 * Generates beautiful, styled, auto-spaced spreadsheets with MS Excel compatibility.
 */

export interface ExcelColumnConfig {
  label: string;
  width?: number;
  align?: "left" | "center" | "right";
  type?: "text" | "number" | "date" | "status";
}

interface ExportExcelParams {
  title: string;
  headers: (string | ExcelColumnConfig)[];
  rows: any[][];
  filename: string;
  totalsIndices?: number[]; // indices of columns to sum up at the bottom
  statusIndex?: number;      // specific index to force status styling
  centerIndices?: number[];  // specific indices to force center alignment
}

export function exportToExcel({
  title,
  headers,
  rows,
  filename,
  totalsIndices = [],
  statusIndex = -1,
  centerIndices = [],
}: ExportExcelParams) {
  const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // 1. Process headers and automatically determine width, alignment, and data type
  const headerConfigs: ExcelColumnConfig[] = headers.map((h, idx) => {
    if (typeof h === "string") {
      const lower = h.toLowerCase();
      let align: "left" | "center" | "right" = "left";
      let type: "text" | "number" | "date" | "status" = "text";
      let width = 120;

      // Smart Defaults based on Header Label
      if (lower.includes("date") || lower.includes("time") || lower.includes("created")) {
        align = "center";
        type = "date";
        width = 110;
      } else if (
        lower.includes("status") ||
        lower.includes("state") ||
        lower.includes("security") ||
        lower.includes("lock")
      ) {
        align = "center";
        type = "status";
        width = 95;
      } else if (
        lower.includes("rate") ||
        lower.includes("price") ||
        lower.includes("cash") ||
        lower.includes("fuel") ||
        lower.includes("parking") ||
        lower.includes("wash") ||
        lower.includes("oil") ||
        lower.includes("maintenance") ||
        lower.includes("received") ||
        lower.includes("misc") ||
        lower.includes("total") ||
        lower.includes("amount") ||
        lower.includes("balance") ||
        lower.includes("voucher") ||
        lower.includes("fare") ||
        lower.includes("discount") ||
        lower.includes("cost") ||
        lower.includes("charges") ||
        lower.includes("tax") ||
        lower.includes("fee")
      ) {
        align = "right";
        type = "number";
        width = 105;
      } else if (
        lower.includes("id") ||
        lower.includes("code") ||
        lower.includes("phone") ||
        lower.includes("type") ||
        lower.includes("no") ||
        lower.includes("number") ||
        lower.includes("sl") ||
        lower.includes("sn") ||
        lower.includes("ref")
      ) {
        align = "center";
        width = 100;
      } else if (lower.includes("description") || lower.includes("note") || lower.includes("trip") || lower.includes("comment")) {
        width = 220;
      } else if (
        lower.includes("name") ||
        lower.includes("driver") ||
        lower.includes("company") ||
        lower.includes("agent") ||
        lower.includes("customer") ||
        lower.includes("user") ||
        lower.includes("vehicle") ||
        lower.includes("hotel")
      ) {
        width = 160;
      }

      // Overrides via params
      if (totalsIndices.includes(idx)) {
        align = "right";
        type = "number";
      }
      if (centerIndices.includes(idx)) {
        align = "center";
      }
      if (statusIndex === idx) {
        align = "center";
        type = "status";
      }

      return { label: h, width, align, type };
    }

    // Explicit config passed by caller
    return {
      label: h.label,
      width: h.width || 120,
      align: h.align || "left",
      type: h.type || "text",
    };
  });

  // 2. Build the Excel-compatible HTML Table
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta charset="utf-8" />
    <!--[if gte mso 9]>
    <xml>
     <x:ExcelWorkbook>
      <x:ExcelWorksheets>
       <x:ExcelWorksheet>
        <x:Name>${title.replace(/[\\/*?:[\]]/g, "").substring(0, 30)}</x:Name>
        <x:WorksheetOptions>
         <x:DisplayGridlines/>
        </x:WorksheetOptions>
       </x:ExcelWorksheet>
      </x:ExcelWorksheets>
     </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      table { border-collapse: collapse; font-family: 'Segoe UI', 'Arial', sans-serif; font-size: 10pt; width: 100%; }
      th { 
        background-color: #0f172a; 
        color: #d4af37; 
        font-weight: bold; 
        border: 1px solid #1e293b; 
        padding: 10px 8px; 
        text-align: center;
        vertical-align: middle;
      }
      td { 
        border: 1px solid #cbd5e1; 
        padding: 8px 6px; 
        vertical-align: middle;
        color: #334155;
      }
      tr:nth-child(even) { background-color: #f8fafc; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .font-bold { font-weight: bold; }
      
      /* Dynamic status badge colors */
      .status-locked, .status-inactive, .status-cancelled, .status-failed, .status-rejected, .status-block, .status-blocked { 
        background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; 
      }
      .status-open, .status-active, .status-completed, .status-success, .status-paid, .status-confirmed, .status-approved, .status-verified { 
        background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; 
      }
      .status-pending, .status-processing, .status-partial, .status-unlocked { 
        background-color: #fef9c3; color: #854d0e; font-weight: bold; text-align: center; 
      }
      .summary-row { background-color: #e2e8f0; font-weight: bold; color: #0f172a; }
    </style>
    </head>
    <body>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 12px;">
        <tr>
          <td colspan="${headerConfigs.length}" style="background-color: #0284c7; color: #ffffff; font-size: 16pt; font-weight: bold; padding: 12px; text-align: center; border: 1px solid #0284c7;">
            HEBA CAB — ${title}
          </td>
        </tr>
        <tr>
          <td colspan="${headerConfigs.length}" style="background-color: #f1f5f9; color: #64748b; font-size: 9pt; padding: 6px 10px; border: 1px solid #cbd5e1;">
            <strong>Generated Date:</strong> ${todayStr} &nbsp;|&nbsp; <strong>Total Records:</strong> ${rows.length}
          </td>
        </tr>
      </table>
      
      <table>
        <thead>
          <tr>
  `;

  // Append Headers with custom widths
  headerConfigs.forEach((h) => {
    html += `<th style="width: ${h.width}px;">${h.label}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  // Append Rows
  rows.forEach((row) => {
    html += `<tr>`;
    row.forEach((cell, cellIdx) => {
      const hConfig = headerConfigs[cellIdx];
      let cellClass = `text-${hConfig.align}`;
      let cellStyle = "";
      let displayValue = cell === null || cell === undefined || cell === "—" ? "" : cell;

      if (hConfig.type === "number") {
        const numVal = Number(cell || 0);
        displayValue = numVal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        
        // Color totals green if positive, red if negative
        if (
          hConfig.label.toLowerCase().includes("total") || 
          hConfig.label.toLowerCase().includes("balance") || 
          hConfig.label.toLowerCase().includes("net")
        ) {
          cellStyle = `style="color: ${numVal >= 0 ? "#166534" : "#b91c1c"}; font-weight: bold;"`;
        }
      } else if (hConfig.type === "status") {
        const statusStr = String(cell).toLowerCase().trim();
        displayValue = String(cell); // preserve casing
        
        if (
          statusStr.includes("lock") ||
          statusStr.includes("inactive") ||
          statusStr.includes("cancel") ||
          statusStr.includes("fail") ||
          statusStr.includes("reject") ||
          statusStr.includes("block")
        ) {
          cellClass = "status-locked";
        } else if (
          statusStr.includes("open") ||
          statusStr.includes("active") ||
          statusStr.includes("complete") ||
          statusStr.includes("success") ||
          statusStr.includes("paid") ||
          statusStr.includes("confirm") ||
          statusStr.includes("approve") ||
          statusStr.includes("verify")
        ) {
          cellClass = "status-open";
        } else if (
          statusStr.includes("pending") ||
          statusStr.includes("process") ||
          statusStr.includes("partial") ||
          statusStr.includes("unlock")
        ) {
          cellClass = "status-pending";
        } else {
          cellClass = "text-center font-bold";
        }
      } else if (hConfig.type === "date") {
        cellClass = "text-center";
      }

      html += `<td class="${cellClass}" ${cellStyle}>${displayValue}</td>`;
    });
    html += `</tr>`;
  });

  // 3. Append Summary Totals Row if totalsIndices are provided
  if (totalsIndices.length > 0) {
    html += `<tr class="summary-row">`;
    
    // Find the first index that will show totals to merge columns before it
    const firstTotalIdx = Math.min(...totalsIndices);
    
    if (firstTotalIdx > 0) {
      html += `<td colspan="${firstTotalIdx}" class="text-right font-bold" style="padding: 10px; background-color: #e2e8f0; border-top: 2px solid #94a3b8;">Total:</td>`;
    }

    headerConfigs.forEach((hConfig, cellIdx) => {
      if (cellIdx < firstTotalIdx) return; // merged in colspan

      if (totalsIndices.includes(cellIdx)) {
        const sum = rows.reduce((acc, row) => acc + Number(row[cellIdx] || 0), 0);
        let cellStyle = `style="background-color: #e2e8f0; border-top: 2px solid #94a3b8;"`;
        
        if (
          hConfig.label.toLowerCase().includes("total") ||
          hConfig.label.toLowerCase().includes("balance") ||
          hConfig.label.toLowerCase().includes("net")
        ) {
          cellStyle = `style="background-color: #e2e8f0; border-top: 2px solid #94a3b8; color: ${sum >= 0 ? "#166534" : "#b91c1c"};"`;
        }
        
        html += `<td class="text-right font-bold" ${cellStyle}>${sum.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>`;
      } else {
        html += `<td style="background-color: #e2e8f0; border-top: 2px solid #94a3b8;"></td>`;
      }
    });

    html += `</tr>`;
  }

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  // 4. Download Trigger
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
