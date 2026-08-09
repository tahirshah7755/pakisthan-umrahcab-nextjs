import { api } from "@/utils/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSaudiTodayDate } from "@/utils/formatters";

interface ExportOptions {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string | number }[];
  companyName?: string;
  logoUrl?: string;
  orientation?: "landscape" | "portrait";
  mode?: "PDF" | "Print";
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
    timeZone: "Asia/Riyadh",
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
  link.setAttribute("download", `${filename.replace(/\.[^/.]+$/, "")}_${getSaudiTodayDate()}.xls`);
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
  link.setAttribute("download", `${filename.replace(/\.[^/.]+$/, "")}_${getSaudiTodayDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function loadLogoBase64(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    let fullUrl = url;
    if (typeof window !== "undefined") {
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
        fullUrl = url;
      } else if (url.startsWith("/")) {
        fullUrl = window.location.origin + url;
      } else {
        const apiEnv = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
        const backendOrigin = apiEnv.replace(/\/api\/.*$/, "").replace(/\/+$/, "");
        fullUrl = `${backendOrigin}/${url}`;
      }
    }
    const res = await fetch(fullUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string" && reader.result.startsWith("data:image")) {
          resolve(reader.result);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

export async function exportToPDF(options: ExportOptions) {
  let {
    title,
    filename,
    headers,
    rows,
    summary = [],
    companyName = "HEBA CAB",
    logoUrl,
    orientation = "landscape",
    mode = "Print",
  } = options;

  // Resolve dynamic website settings logo and title
  if (typeof window !== "undefined") {
    const cachedSettings = (window as any).__WEBSITE_SETTINGS__;
    if (cachedSettings?.website_logo) {
      logoUrl = cachedSettings.website_logo;
    }
    if (cachedSettings?.site_title) {
      companyName = cachedSettings.site_title;
    }
  }

  if (!logoUrl && typeof window !== "undefined") {
    try {
      const dynamicSettings = await api.getWebsiteSettings();
      if (dynamicSettings?.website_logo) {
        logoUrl = dynamicSettings.website_logo;
        (window as any).__WEBSITE_SETTINGS__ = dynamicSettings;
      }
      if (dynamicSettings?.site_title) {
        companyName = dynamicSettings.site_title;
      }
    } catch (e) {
      // fallback
    }
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });

  if (mode === "Print") {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print.");
      return;
    }

    const headerCells = headers
      .map((h) => `<th style="background-color: #0f172a; color: #d4af37; padding: 5px 3px; font-weight: 700; font-size: 8px; border-bottom: 2px solid #1e293b; text-align: left; text-transform: uppercase; white-space: nowrap;">${h}</th>`)
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
            return `<td style="padding: 4px 3px; border-bottom: 1px solid #e2e8f0; font-size: 8px; color: #334155; ${colorStyle}">${cellStr}</td>`;
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
              ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="${companyName}" onerror="this.src='/logo2.png'" />` : ""}
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
    return;
  }

  // mode === "PDF": Native jsPDF + autoTable package matching Print Header Design!
  const doc = new jsPDF({
    orientation: orientation === "landscape" ? "l" : "p",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;

  // Load logo as Base64 if available
  let logoBase64: string | null = null;
  if (logoUrl) {
    logoBase64 = await loadLogoBase64(logoUrl);
  }

  // Header Layout (Clean White Background)
  let textStartX = 14;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 14, 5.5, 12, 12);
      textStartX = 29;
    } catch (e) {
      console.warn("Error drawing logo in jsPDF", e);
      textStartX = 14;
    }
  }

  // Company Name
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, textStartX, 11);

  // Subtitle
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(title, textStartX, 17);

  // Meta Info Right
  doc.setTextColor(71, 85, 105); // #475569
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Generated Date: ${today}`, pageWidth - 14, 11, { align: "right" });
  doc.text(`Total Records: ${rows.length}`, pageWidth - 14, 16, { align: "right" });

  // Gold Accent Line under Header
  doc.setFillColor(212, 175, 55); // #d4af37
  doc.rect(14, 21, pageWidth - 28, 1.2, "F");

  // Table starts directly below Gold Line
  const startY = 25;

  const numCols = headers.length;
  const dynamicFontSize = numCols > 16 ? 5.5 : numCols > 12 ? 6.5 : 7.5;
  const dynamicPadding = numCols > 16 ? 1 : 1.5;

  // AutoTable render
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows.map((r) => r.map((cell) => String(cell ?? "—"))),
    theme: "striped",
    styles: {
      fontSize: dynamicFontSize,
      cellPadding: dynamicPadding,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [212, 175, 55],
      fontStyle: "bold",
      fontSize: dynamicFontSize,
      cellPadding: dynamicPadding,
      lineWidth: { bottom: 0.6 },
      lineColor: [212, 175, 55],
    },
    bodyStyles: {
      fontSize: dynamicFontSize,
      textColor: [51, 65, 85],
      cellPadding: dynamicPadding,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 8, right: 8, bottom: 10 },
    didParseCell: (data) => {
      if (data.row.raw && String((data.row.raw as any)[0]).toUpperCase().includes("GRAND TOTAL")) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    didDrawPage: (data) => {
      // Footer
      const totalPages = doc.getNumberOfPages();
      const str = `Official Report — Generated by ${companyName} Portal  |  Page ${data.pageNumber} of ${totalPages}`;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 5);
    },
  });

  // Render Summary Banner at the end if space permits
  if (summary && summary.length > 0) {
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : startY + 20;
    if (finalY + 12 < doc.internal.pageSize.height - 8) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(8, finalY, pageWidth - 16, 9, 1.5, 1.5, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      const summaryText = summary.map((s) => `${s.label}: ${s.value}`).join("   |   ");
      doc.text(summaryText, pageWidth / 2, finalY + 5.5, { align: "center" });
    }
  }

  const outFilename = filename.endsWith(".pdf") ? filename : `${filename}_${getSaudiTodayDate()}.pdf`;
  doc.save(outFilename);
}

export interface VoucherPrintOptions {
  id?: string;
  type?: string;
  customerName?: string;
  companyName?: string;
  route?: string;
  vehicle?: string;
  tafweej?: string;
  serviceName?: string;
  details?: string;
  time?: string;
  price?: number;
}

/**
 * Prints a clean, dedicated service/transport voucher modal preview without background elements.
 */
export function printVoucher(v: VoucherPrintOptions) {
  if (!v) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked! Please allow pop-ups to print.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${v.type || "Transport Voucher"} - ${v.id || ""}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body { background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 30px; color: #1e293b; }
          .voucher-card { width: 100%; max-width: 580px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed #cbd5e1; padding-bottom: 18px; margin-bottom: 20px; }
          .brand-title { font-size: 20px; font-weight: 800; color: #d97706; }
          .brand-sub { font-size: 10px; color: #94a3b8; font-weight: 700; margin-top: 3px; letter-spacing: 0.5px; }
          .header-right { text-align: right; }
          .voucher-type { font-size: 14px; font-weight: 700; color: #334155; }
          .voucher-ref { font-size: 11px; color: #d97706; font-weight: 700; margin-top: 2px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .col-span-2 { grid-column: span 2; }
          .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: block; }
          .val { font-size: 14px; font-weight: 700; color: #1e293b; display: block; }
          .val-agency { color: #10b981; }
          .val-desc { color: #334155; }
          .val-sub { color: #475569; }
          .val-italic { font-style: italic; color: #64748b; font-size: 13px; }
          .divider { border-top: 1px solid #f1f5f9; grid-column: span 2; padding-top: 10px; }
          .price-val { font-size: 18px; font-weight: 800; color: #10b981; }
          .footer { border-top: 2px dashed #cbd5e1; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print {
            body { background: #ffffff; padding: 0; min-height: auto; }
            .voucher-card { box-shadow: none; border: 1px solid #e2e8f0; max-width: 100%; margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <div class="voucher-card">
          <div class="header">
            <div>
              <div class="brand-title">UmrahCab</div>
              <div class="brand-sub">OFFICIAL ADMINISTRATIVE VOUCHER</div>
            </div>
            <div class="header-right">
              <div class="voucher-type">${v.type || "Transport Voucher"}</div>
              <div class="voucher-ref">REF: ${v.id || "N/A"}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <span class="label">Passenger Customer</span>
              <span class="val">${v.customerName || "Guest"}</span>
            </div>
            <div>
              <span class="label">Corporate Agency</span>
              <span class="val val-agency">${v.companyName || "Independent"}</span>
            </div>

            ${v.route ? `
              <div class="col-span-2">
                <span class="label">Route Sector</span>
                <span class="val val-desc">${v.route}</span>
              </div>
              <div>
                <span class="label">Vehicle Type</span>
                <span class="val val-sub">${v.vehicle || "Sedan"}</span>
              </div>
              <div>
                <span class="label">Tafweej Reference</span>
                <span class="val val-sub">${v.tafweej || "N/A"}</span>
              </div>
            ` : `
              <div class="col-span-2">
                <span class="label">Service Provided</span>
                <span class="val val-desc">${v.serviceName || "Service"}</span>
              </div>
              <div class="col-span-2">
                <span class="label">Service Details</span>
                <span class="val val-italic">${v.details || "No details provided"}</span>
              </div>
            `}

            <div class="divider"></div>

            <div>
              <span class="label">Issue Time</span>
              <span class="val val-sub" style="font-weight: 600; font-size: 13px;">${v.time || "N/A"}</span>
            </div>
            <div style="text-align: right;">
              <span class="label">Voucher Price</span>
              <span class="price-val">SAR ${Number(v.price || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            Official Voucher &bull; Umrah Cab Administrative Operations Registry
          </div>
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
