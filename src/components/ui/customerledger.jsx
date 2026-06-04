import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";

const API = "http://localhost:3000/api/receipts";

const CustomerLedger = ({ onClose, onMinimize, title = "Customer Ledger" }) => {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const [ledgerType, setLedgerType] = useState("ledger"); // "ledger" | "outstanding"
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", customer_name: "" });

  const [customerList, setCustomerList] = useState([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Ledger data
  const [entries, setEntries] = useState([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  // Outstanding data
  const [outstanding, setOutstanding] = useState([]);

  const fetchCustomers = async (val = "") => {
    try {
      const res = await fetch(`${API}/ledger-customers?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setCustomerList(Array.isArray(data) ? data : []);
    } catch {
      setCustomerList([]);
    }
  };

  // Core fetch — takes explicit params so it works from mount, onChange, and button
  const loadReport = async (customerName, fromDate, toDate, type) => {
    setLoading(true);
    setReportGenerated(true);
    try {
      const params = new URLSearchParams({ type });
      if (customerName) params.set("customer_name", customerName);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`${API}/customer-ledger?${params}`);
      const data = await res.json();

      if (type === "outstanding") {
        setOutstanding(Array.isArray(data.outstanding) ? data.outstanding : []);
        setEntries([]);
      } else {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setTotalDebit(data.total_debit || 0);
        setTotalCredit(data.total_credit || 0);
        setClosingBalance(data.closing_balance || 0);
        setOutstanding([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load ALL customers report when window opens
  useEffect(() => {
    fetchCustomers("");
    loadReport("", "", "", "ledger");
  }, []);

  // Manual GENERATE REPORT button
  const generateReport = useCallback(() => {
    loadReport(filters.customer_name, filters.fromDate, filters.toDate, ledgerType);
  }, [filters, ledgerType]);

  // Customer dropdown — auto-reload immediately on change
  const handleCustomerChange = (e) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, customer_name: val }));
    loadReport(val, filters.fromDate, filters.toDate, ledgerType);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (onMinimize) onMinimize();
  };

  const handlePrint = () => {
    const win = window.open("", "", "width=1000,height=700");
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; }
        @page { size: A4 landscape; margin: 10mm; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; }
        th { background: #f0f0f0; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .debit { color: #c00; font-weight: 600; }
        .credit { color: #060; font-weight: 600; }
        .balance { color: #00c; font-weight: 600; }
        .op-balance { background: #fffbe6; font-style: italic; }
        h3 { margin: 0 0 6px; }
        .header-info { margin-bottom: 12px; }
      </style>
      </head><body>${contentRef.current.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const exportPDF = () => {
    if (!contentRef.current) return;
    html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: `CustomerLedger_${filters.customer_name || "Report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    }).from(contentRef.current).save();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const customerLabel = filters.customer_name || "ALL_CUSTOMERS";

    if (ledgerType === "ledger") {
      const rows = entries.map((row) => [
        row.sno,
        row.bill_no || "",
        fmtDate(row.date),
        Number(row.debit) > 0 ? Number(fmt(row.debit)) : "",
        Number(row.credit) > 0 ? Number(fmt(row.credit)) : "",
        row.paid_date ? fmtDate(row.paid_date) : "",
        row.receipt_no || "",
        row.payment_mode || "",
      ]);
      const totalsRow = ["", "", "TOTAL", Number(fmt(totalDebit)), Number(fmt(totalCredit)), "", "", `Closing Balance: ${fmt(Math.abs(closingBalance))} ${closingBalance >= 0 ? "Dr" : "Cr"}`];
      const ws = XLSX.utils.aoa_to_sheet([
        ["SNO", "BILL NO", "DATE", "DEBIT", "CREDIT", "PAID DATE", "RECEIPT NO", "PAYMENT MODE"],
        ...rows,
        totalsRow,
      ]);
      ws["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 28 }];
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    } else {
      const rows = outstanding.map((row, i) => [
        i + 1,
        row.bill_no || "",
        fmtDate(row.date),
        Number(fmt(row.bill_amount)),
        Number(fmt(row.paid_amount)),
        Number(fmt(row.balance)),
      ]);
      const totalsRow = ["", "", "TOTAL",
        Number(fmt(outstanding.reduce((s, r) => s + r.bill_amount, 0))),
        Number(fmt(outstanding.reduce((s, r) => s + r.paid_amount, 0))),
        Number(fmt(outstanding.reduce((s, r) => s + r.balance, 0))),
      ];
      const ws = XLSX.utils.aoa_to_sheet([
        ["SNO", "BILL NO", "DATE", "BILL AMOUNT", "PAID AMOUNT", "BALANCE DUE"],
        ...rows,
        totalsRow,
      ]);
      ws["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "Outstanding");
    }

    XLSX.writeFile(wb, `CustomerLedger_${customerLabel}_${ledgerType}.xlsx`);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600"
        >
          <div className="w-3 h-3 border border-white/50" />
          {title}
        </button>
      </div>
    );
  }

  const fmt = (val) => Number(val || 0).toFixed(2);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "";

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-4 bg-black/30"}`}>
      <div className={`bg-[#f0f0f0] border-2 border-white flex flex-col shadow-2xl transition-all duration-200
        ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* Title bar */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold">{title}</span>
          <div className="flex shrink-0">
            <button onClick={handleMinimize} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Minimize">
              <Minus size={12} strokeWidth={3} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Maximize">
              <Square size={10} strokeWidth={3} />
            </button>
            <button onClick={handleClose} className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5">
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Toolbar - black bar matching Quotation Format style */}
        <div className="bg-black px-4 py-3 flex flex-wrap items-end gap-4">

          {/* FROM DATE */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">FROM DATE</label>
            <input type="date" value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-[140px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          {/* TO DATE */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">TO DATE</label>
            <input type="date" value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-[140px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          {/* LEDGER TYPE */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">LEDGER TYPE</label>
            <div className="flex items-center gap-4 py-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-white text-[12px] font-bold">
                <input type="radio" name="ledgerType" value="ledger"
                  checked={ledgerType === "ledger"}
                  onChange={() => setLedgerType("ledger")}
                  className="accent-white" />
                LEDGER
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-white text-[12px] font-bold">
                <input type="radio" name="ledgerType" value="outstanding"
                  checked={ledgerType === "outstanding"}
                  onChange={() => setLedgerType("outstanding")}
                  className="accent-white" />
                OUT STANDING
              </label>
            </div>
          </div>

          {/* CLIENT NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">CLIENT NAME</label>
            <select
              value={filters.customer_name}
              onChange={handleCustomerChange}
              className="w-[220px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: '30px' }}
            >
              <option value="">-- ALL CUSTOMERS --</option>
              {customerList.map((c, i) => (
                <option key={i} value={c.customer_name}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 ml-auto items-end pb-0.5">
            <button onClick={generateReport}
              className="px-5 py-1.5 text-sm font-bold bg-white text-black border border-gray-300 hover:bg-gray-100 active:bg-gray-200 tracking-wide">
              GENERATE REPORT
            </button>
            <button onClick={handleClose}
              className="px-5 py-1.5 text-sm font-bold bg-white text-black border border-gray-300 hover:bg-gray-100 active:bg-gray-200 tracking-wide">
              CLOSE
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative max-w-full ">

          {/* Action buttons */}
          <div className="flex gap-2 mb-3 px-0 no-print bg-white py-3">
            <button onClick={exportExcel} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold ml-4">Main Report</button>
            <button onClick={handlePrint} className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold flex items-center gap-1">
              <Printer size={12} /> Print
            </button>
            <button onClick={exportPDF} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold">Export PDF</button>
          </div>

          {/* Printable report */}
          {/* <div className="printable-area w-full"> */}

          {/* Header */}
          <div className="w-full mb-4 border-b border-gray-400 pb-3 px-8 max-w-[97%] ml-5  ">
            <div className="text-sm font-bold text-gray-800 ">
              <span>From : </span>
              <span className="text-black">{filters.fromDate ? fmtDate(filters.fromDate + "T00:00:00") : "—"}</span>
              <span className="ml-8">To : </span>
              <span className="text-black">{filters.toDate ? fmtDate(filters.toDate + "T00:00:00") : "—"}</span>
            </div>
            <div className="text-sm font-bold mt-1 text-gray-800">
              NAME : <span className="uppercase">{filters.customer_name || "ALL CUSTOMERS"}</span>
              <span className="text-gray-600 font-normal"> - ACCOUNTS STATEMENTS</span>
            </div>
          </div>

          {/* LEDGER TABLE */}
          {ledgerType === "ledger" && (
            <div className="w-full p-3" style={{ fontFamily: "'Tahoma','Arial',sans-serif" }} ref={contentRef}>
              <table className="w-full border-collapse table-auto" style={{ fontSize: '13px', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '42px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '95px' }} />
                  <col style={{ width: '120px' }} />
                  <col />
                </colgroup>
                <thead>
                  <tr style={{ background: '#c5d7e9', color: '#0d2340', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 5px', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SNO</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BILL NO</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DATE</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DEBIT</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>CREDIT</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>PAID DATE</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>RECEIPT NO</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap', width: '200px' }}>PAYMENT MODE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#666', fontStyle: 'italic', border: '1px solid #ddd' }}>
                        Loading...
                      </td>
                    </tr>
                  ) : entries.length > 0 ? (
                    entries.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#edf2f8' }}>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 5px', textAlign: 'center', color: '#555' }}>{row.sno}</td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#00008b', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.bill_no || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#222', whiteSpace: 'nowrap' }}>{fmtDate(row.date)}</td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', textAlign: 'right', color: '#8b0000', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                          {Number(row.debit) > 0 ? fmt(row.debit) : <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', textAlign: 'right', color: '#006400', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                          {Number(row.credit) > 0 ? fmt(row.credit) : <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#333', whiteSpace: 'nowrap' }}>
                          {row.paid_date ? fmtDate(row.paid_date) : <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.receipt_no || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#333', whiteSpace: 'nowrap' }}>
                          {row.payment_mode || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontStyle: 'italic', border: '1px solid #ddd' }}>
                        No transactions found.
                      </td>
                    </tr>
                  )}

                  {/* Totals row */}
                  {entries.length > 0 && (
                    <tr style={{ background: '#d5e3f0', fontWeight: 'bold', borderTop: '2px solid #6a90b5' }}>
                      <td colSpan="3" style={{ border: '1px solid #a0bbd0', padding: '5px 8px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.4px' }}>TOTAL</td>
                      <td style={{ border: '1px solid #a0bbd0', padding: '5px 8px', textAlign: 'right', color: '#8b0000', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalDebit)}</td>
                      <td style={{ border: '1px solid #a0bbd0', padding: '5px 8px', textAlign: 'right', color: '#006400', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCredit)}</td>
                      <td colSpan="3" style={{ border: '1px solid #a0bbd0', padding: '5px 8px', textAlign: 'right' }}>
                        <span style={{ color: '#444', marginRight: '8px' }}>Closing Balance :</span>
                        <span style={{ color: closingBalance >= 0 ? '#8b0000' : '#006400', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(Math.abs(closingBalance))} {closingBalance >= 0 ? "Dr" : "Cr"}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* OUTSTANDING TABLE */}
          {ledgerType === "outstanding" && (
            <div className="w-full overflow-x-auto">
              <table className="w-full border border-gray-600 border-collapse" style={{ fontSize: '13px', fontFamily: "'Tahoma','Arial',sans-serif" }}>
                <thead>
                  <tr style={{ background: '#c5d7e9', color: '#0d2340', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 5px', textAlign: 'center', width: '42px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SNO</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BILL NO</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DATE</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BILL AMOUNT</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>PAID AMOUNT</th>
                    <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BALANCE DUE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500 italic">Loading...</td></tr>
                  ) : outstanding.length > 0 ? (
                    outstanding.map((row, i) => (
                      <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"} hover:bg-yellow-50`}>
                        <td className="border border-gray-300 px-3 py-1.5 text-center">{i + 1}</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-semibold text-blue-800">{row.bill_no}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-gray-700">{fmtDate(row.date)}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-700">{fmt(row.bill_amount)}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-700">{fmt(row.paid_amount)}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-right font-bold text-gray-800">{fmt(row.balance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-400 italic">
                        No outstanding bills found.
                      </td>
                    </tr>
                  )}

                  {outstanding.length > 0 && (
                    <tr className="bg-[#dde3ec] font-bold border-t-2 border-gray-600">
                      <td colSpan="3" className="border border-gray-400 px-3 py-2 text-right uppercase">Total</td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-gray-700">
                        {fmt(outstanding.reduce((s, r) => s + r.bill_amount, 0))}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-gray-700">
                        {fmt(outstanding.reduce((s, r) => s + r.paid_amount, 0))}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-gray-800 font-bold">
                        {fmt(outstanding.reduce((s, r) => s + r.balance, 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {/* </div> */}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e0e0; border: 2px solid #808080; box-shadow: inset 1px 1px 0px white; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .printable-area { width: 100% !important; overflow: visible !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default CustomerLedger;
