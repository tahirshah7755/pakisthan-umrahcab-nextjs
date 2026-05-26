"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { useGetLedgersQuery } from "@/store/api/ledgersApi";
import { useGetInvoicesQuery } from "@/store/api/invoicesApi";

export default function BalancePage() {
  const router = useRouter();

  const { data: companies = [], isLoading: loadingComp } = useGetCompaniesQuery(undefined);
  const { data: ledgers = [], isLoading: loadingLedger } = useGetLedgersQuery(undefined);
  const { data: invoices = [], isLoading: loadingInv } = useGetInvoicesQuery(undefined);

  const isLoading = loadingComp || loadingLedger || loadingInv;

  // Process data per company
  const companyBalances = companies.map((comp: any) => {
    // 1. Get last ledger balance
    const companyLedgers = ledgers.filter((l: any) => l.company === comp.name);
    // Sort by id to get the latest
    const sortedLedgers = [...companyLedgers].sort((a: any, b: any) => b.id - a.id);
    const lastBalance = sortedLedgers.length > 0 ? Number(sortedLedgers[0].balance) : 0;

    // 2. Get outstanding invoices (pending / unpaid amount)
    const companyInvoices = invoices.filter((i: any) => i.company === comp.name);
    // Assume if invoice is unpaid it has pending status, if Laravel schema has status or amount
    const outstandingInvoices = companyInvoices.filter((i: any) => i.status !== "Paid" && i.status !== "completed");
    const netReceivables = outstandingInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0);
    const invoiceCount = outstandingInvoices.length;

    return {
      name: comp.name,
      netReceivables,
      netLedgerBalance: lastBalance,
      invoiceCount,
    };
  });

  // Calculate totals
  const totalReceivables = companyBalances.reduce((sum, item) => sum + item.netReceivables, 0);
  const totalLedgerBalance = companyBalances.reduce((sum, item) => sum + item.netLedgerBalance, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
        <div>
          <h2>Accounts Receivable & Balances</h2>
          <p>Monitor company ledger balances, receivables, and net outstanding totals.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Return to Hub</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div className="spinner" style={{ borderTopColor: "#4f46e5" }}></div>
          <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Calculating Balances...</span>
        </div>
      ) : (
        <>
          <div className="db-stats-row">
            <div className="db-stat-card">
              <div className="db-stat-icon active" style={{ background: "#4f46e5" }}>
                <i className="fas fa-wallet"></i>
              </div>
              <div className="db-stat-info">
                <span className="db-stat-value">SR {totalReceivables.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="db-stat-label">Total Outstanding Receivable</span>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-icon completed" style={{ background: totalLedgerBalance >= 0 ? "#10b981" : "#ef4444" }}>
                <i className={totalLedgerBalance >= 0 ? "fas fa-arrow-trend-up" : "fas fa-arrow-trend-down"}></i>
              </div>
              <div className="db-stat-info">
                <span className="db-stat-value">SR {totalLedgerBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="db-stat-label">Net Ledger Balance</span>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ marginTop: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "15px" }}>Outstanding Receivables Ledger</h3>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Net Receivables</th>
                    <th>Net Ledger Balance</th>
                    <th>Invoice count</th>
                  </tr>
                </thead>
                <tbody>
                  {companyBalances.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
                        No company receivable records found.
                      </td>
                    </tr>
                  ) : (
                    companyBalances.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ color: item.netReceivables > 0 ? "var(--danger-color)" : "#64748b", fontWeight: 700 }}>
                          SR {item.netReceivables.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ color: item.netLedgerBalance >= 0 ? "var(--success-color)" : "var(--danger-color)", fontWeight: 700 }}>
                          SR {item.netLedgerBalance >= 0 ? "+" : ""}{item.netLedgerBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ color: item.invoiceCount > 0 ? "var(--danger-color)" : "#64748b", fontWeight: 600 }}>
                          {item.invoiceCount > 0 ? `${item.invoiceCount} Unpaid` : "Fully Settled"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
