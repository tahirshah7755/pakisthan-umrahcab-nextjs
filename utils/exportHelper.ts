/**
 * Centralized Formatted Export Utility (Excel, CSV, PDF / Print)
 * Generates styled Excel spreadsheets, CSVs, and PDF print documents for Heba Cab.
 */

interface ExportOptions {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string | number }[];
  companyName?: string;
  logoUrl?: string;
  orientation?: "landscape" | "portrait";
}

/**
 * Generates a formatted Excel (.xls) file with styled headers, logo/title banner,
 * borders, alternating row background colors, and totals section.
 */
export function exportToExcel(options: ExportOptions) {
  const {
    title,
    filename,
    headers,
    rows,
    summary = [],
    companyName = "HEBA CAB",
  } = options;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const headerCells = headers
    .map(
      (h) => `<th style="background-color: #0f172a; color: #d4af37; padding: 10px 12px; font-weight: 700; border: 1px solid #1e293b; text-align: left; font-size: 12px;">${h}</th>`
    )
    .join("");

  const bodyRows = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = row
        .map(
          (c) => `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #334155; vertical-align: middle;">${c ?? "—"}</td>`
        )
        .join("");
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join("");

  const summaryHtml = summary.length
    ? `<tr style="background-color: #f1f5f9; font-weight: bold;">
        <td colspan="${headers.length}" style="padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 12px; color: #0f172a;">
          ${summary.map((s) => `<strong>${s.label}:</strong> ${s.value}`).join("&nbsp;&nbsp;|&nbsp;&nbsp;")}
        </td>
       </tr>`
    : "";

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${title.substring(0, 30)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td colspan="${headers.length}" style="background-color: #0284c7; color: #ffffff; font-size: 18px; font-weight: bold; padding: 14px; text-align: center;">
              ${companyName} — ${title}
            </td>
          </tr>
          <tr>
            <td colspan="${headers.length}" style="background-color: #f1f5f9; color: #64748b; font-size: 11px; padding: 8px 12px; border-bottom: 2px solid #cbd5e1;">
              <strong>Generated Date:</strong> ${today} &nbsp;|&nbsp; <strong>Total Records:</strong> ${rows.length}
            </td>
          </tr>
          <thead>
            <tr>${headerCells}</tr>
          </thead>
          <tbody>
            ${bodyRows}
            ${summaryHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a clean UTF-8 CSV download file with proper column escaping.
 */
export function exportToCSV(options: ExportOptions) {
  const { filename, headers, rows } = options;

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a beautifully formatted PDF print document window.
 */
export function exportToPDF(options: ExportOptions) {
  const {
    title,
    headers,
    rows,
    summary = [],
    companyName = "HEBA CAB",
    logoUrl = "/logo2.png",
    orientation = "landscape",
  } = options;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked! Please allow pop-ups to generate PDF.");
    return;
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const headerCells = headers
    .map((h) => `<th style="background-color: #0f172a; color: #d4af37; padding: 8px 6px; font-weight: 700; font-size: 10px; border-bottom: 2px solid #1e293b; text-align: left; text-transform: uppercase;">${h}</th>`)
    .join("");

  const bodyRows = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = row
        .map((c) => {
          let cellStr = String(c ?? "—");
          let colorStyle = "";
          if (cellStr.toLowerCase() === "active" || cellStr.toLowerCase() === "paid" || cellStr.toLowerCase() === "completed") {
            colorStyle = "color: #059669; font-weight: bold;";
          } else if (cellStr.toLowerCase() === "pending" || cellStr.toLowerCase() === "unpaid") {
            colorStyle = "color: #d97706; font-weight: bold;";
          } else if (cellStr.toLowerCase() === "cancelled" || cellStr.toLowerCase() === "locked") {
            colorStyle = "color: #dc2626; font-weight: bold;";
          }
          return `<td style="padding: 7px 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155; ${colorStyle}">${cellStr}</td>`;
        })
        .join("");
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join("");

  const summaryRowsHtml = summary.length
    ? `<div style="margin-top: 15px; padding: 10px 14px; background: #f1f5f9; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 11px; display: flex; gap: 20px;">
        ${summary.map((s) => `<span><strong>${s.label}:</strong> ${s.value}</span>`).join("")}
       </div>`
    : "";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${companyName} - ${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #0f172a; background: #ffffff; }
          .banner { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d4af37; padding-bottom: 12px; margin-bottom: 16px; }
          .logo-box { display: flex; align-items: center; gap: 12px; }
          .logo-img { height: 42px; width: auto; object-fit: contain; }
          .company-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
          .report-title { font-size: 13px; color: #64748b; margin: 2px 0 0 0; font-weight: 600; }
          .meta-info { text-align: right; font-size: 11px; color: #475569; }
          .meta-info p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; table-layout: auto; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
          @media print {
            body { margin: 0; }
            @page { size: ${orientation}; margin: 8mm; }
          }
        </style>
      </head>
      <body>
        <div class="banner">
          <div class="logo-box">
            ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="${companyName}" />` : ""}
            <div>
              <h1 class="company-title">${companyName}</h1>
              <p class="report-title">${title}</p>
            </div>
          </div>
          <div class="meta-info">
            <p><strong>Generated Date:</strong> ${today}</p>
            <p><strong>Total Records:</strong> ${rows.length}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>${headerCells}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>

        ${summaryRowsHtml}

        <div class="footer">
          <span>Official Report — Generated by ${companyName} Portal</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
