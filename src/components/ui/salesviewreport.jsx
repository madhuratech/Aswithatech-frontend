import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import API_BASE_URL from "../../config/api";

const API_SALES = `${API_BASE_URL}/salesinvoices`;

const fmt = (val) => Number(val || 0).toFixed(2);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "");

const SalesViewReport = ({ onClose, onMinimize, title = "Sales View Report" }) => {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const TODAY = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: TODAY,
    customer_name: "",
    invoice_no: "",
    item_name: "",
  });

  const [customerList, setCustomerList] = useState([]);
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const loadReport = useCallback(async (overrides = {}) => {
    const f = { ...filters, ...overrides };
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      if (f.customer_name) params.set("customer_name", f.customer_name);
      if (f.invoice_no) params.set("invoice_no", f.invoice_no);
      if (f.item_name) params.set("item_name", f.item_name);

      const res = await fetch(`${API_SALES}/view-report?${params}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch(`${API_SALES}/report/customers`)
      .then((r) => r.json())
      .then((d) => setCustomerList(Array.isArray(d) ? d : []))
      .catch(() => setCustomerList([]));

    loadReport({});
  }, [loadReport]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (onMinimize) onMinimize();
  };

  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const totalAmt = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePrint = () => {
    const win = window.open("", "", "width=1200,height=800");
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; }
        @page { size: A4 landscape; margin: 10mm; }
        h2 { margin: 0 0 4px; font-size: 16px; }
        .meta { margin-bottom: 12px; font-size: 12px; color: #444; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #aaa; padding: 5px 8px; }
        th { background: #c5d7e9; color: #0d2340; font-weight: bold; }
        tr:nth-child(even) td { background: #edf2f8; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals td { background: #d5e3f0 !important; font-weight: bold; }
      </style>
      </head><body>
      <h2>SALES VIEW REPORT</h2>
      <div class="meta">
        From: ${filters.fromDate ? fmtDate(filters.fromDate + "T00:00:00") : "All"} &nbsp;|&nbsp;
        To: ${filters.toDate ? fmtDate(filters.toDate + "T00:00:00") : "All"} &nbsp;|&nbsp;
        Customer: ${filters.customer_name || "All"}
      </div>
      ${contentRef.current ? contentRef.current.innerHTML : ""}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const exportPDF = () => {
    if (!contentRef.current) return;
    html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `SalesViewReport.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(contentRef.current)
      .save();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const dataRows = rows.map((r, i) => [
      i + 1,
      r.invoice_no || "",
      fmtDate(r.invoice_date),
      r.customer_name || "",
      r.item_name || "",
      r.serial_number || "—",
      r.hsn_number || "",
      Number(r.quantity || 0),
      Number(fmt(r.price)),
      Number(fmt(r.amount)),
    ]);
    const totalsRow = ["", "", "", "", "", "", "TOTAL", totalQty, "", Number(fmt(totalAmt))];
    const ws = XLSX.utils.aoa_to_sheet([
      ["S.No", "Invoice No", "Invoice Date", "Customer Name", "Product Name", "Serial Number", "HSN Code", "Quantity", "Rate", "Amount"],
      ...dataRows,
      totalsRow,
    ]);
    ws["!cols"] = [
      { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 30 },
      { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Sales View");
    XLSX.writeFile(wb, "SalesViewReport.xlsx");
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

        {/* Toolbar */}
        <div className="bg-black px-4 py-3 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">FROM DATE</label>
            <input type="date" name="fromDate" value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-[140px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">TO DATE</label>
            <input type="date" name="toDate" value={filters.toDate}
              onChange={handleFilterChange}
              className="w-[140px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">CUSTOMER NAME</label>
            <select name="customer_name" value={filters.customer_name}
              onChange={handleFilterChange}
              className="w-[200px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: "30px" }}>
              <option value="">-- ALL CUSTOMERS --</option>
              {customerList.map((c, i) => (
                <option key={i} value={c.customer_name}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">INVOICE NO</label>
            <input type="text" name="invoice_no" value={filters.invoice_no}
              onChange={handleFilterChange}
              placeholder="AT/INV/001"
              className="w-[130px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">PRODUCT NAME</label>
            <input type="text" name="item_name" value={filters.item_name}
              onChange={handleFilterChange}
              placeholder="Search product..."
              className="w-[150px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex gap-2 ml-auto items-end pb-0.5">
            <button onClick={() => loadReport()}
              className="px-5 py-1.5 text-sm font-bold bg-white text-black border border-gray-300 hover:bg-gray-100 active:bg-gray-200 tracking-wide">
              GENERATE REPORT
            </button>
            <button onClick={handleClose}
              className="px-5 py-1.5 text-sm font-bold bg-white text-black border border-gray-300 hover:bg-gray-100 active:bg-gray-200 tracking-wide">
              CLOSE
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative max-w-full">

          {/* Action buttons */}
          <div className="flex gap-2 mb-3 px-4 no-print bg-white py-3 items-center flex-wrap">
            <button onClick={exportExcel} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold">Export Excel</button>
            <button onClick={handlePrint} className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold flex items-center gap-1">
              <Printer size={12} /> Print
            </button>
            <button onClick={exportPDF} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold">Export PDF</button>
            <span className="ml-auto text-xs text-gray-500 font-semibold">
              {rows.length} record{rows.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Report header info */}
          <div className="w-full mb-3 border-b border-gray-300 pb-2 px-5">
            <div className="text-sm font-bold text-gray-700">
              From: <span className="text-black">{filters.fromDate ? fmtDate(filters.fromDate + "T00:00:00") : "All"}</span>
              <span className="ml-6">To: <span className="text-black">{filters.toDate ? fmtDate(filters.toDate + "T00:00:00") : "All"}</span></span>
              <span className="ml-6">Customer: <span className="text-black uppercase">{filters.customer_name || "ALL CUSTOMERS"}</span></span>
            </div>
          </div>

          {/* Table */}
          <div className="w-full px-3 pb-4" ref={contentRef} style={{ fontFamily: "'Tahoma','Arial',sans-serif" }}>
            <table className="w-full border-collapse" style={{ fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                  {["S.No", "Invoice No", "Invoice Date", "Customer Name", "Product Name", "Serial Number", "HSN Code", "Quantity", "Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{
                      border: "1px solid #8ca8c5", padding: "6px 8px",
                      textAlign: i === 0 || i === 10 ? "center" : i >= 7 ? "right" : "left",
                      fontWeight: "bold", whiteSpace: "nowrap"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "30px", color: "#666", fontStyle: "italic", border: "1px solid #ddd" }}>
                      Loading...
                    </td>
                  </tr>
                ) : pageRows.length > 0 ? (
                  <>
                    {pageRows.map((row, i) => {
                      const globalIdx = (currentPage - 1) * PAGE_SIZE + i + 1;
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 6px", textAlign: "center", color: "#555" }}>{globalIdx}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>
                            {row.invoice_no || <span style={{ color: "#bbb" }}>—</span>}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", whiteSpace: "nowrap" }}>{fmtDate(row.invoice_date)}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px" }}>{row.customer_name || "—"}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px" }}>{row.item_name || "—"}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#555" }}>
                            {row.serial_number || <span style={{ color: "#bbb" }}>—</span>}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#555" }}>
                            {row.hsn_number || <span style={{ color: "#bbb" }}>—</span>}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {Number(row.quantity || 0)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {fmt(row.price)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", fontWeight: "600", color: "#006400", fontVariantNumeric: "tabular-nums" }}>
                            {fmt(row.amount)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Totals row */}
                    <tr style={{ background: "#d5e3f0", fontWeight: "bold", borderTop: "2px solid #6a90b5" }}>
                      <td colSpan="7" style={{ border: "1px solid #a0bbd0", padding: "6px 8px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        TOTAL
                      </td>
                      <td style={{ border: "1px solid #a0bbd0", padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {totalQty}
                      </td>
                      <td style={{ border: "1px solid #a0bbd0", padding: "6px 8px" }}></td>
                      <td style={{ border: "1px solid #a0bbd0", padding: "6px 8px", textAlign: "right", color: "#006400", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(totalAmt)}
                      </td>
                      <td style={{ border: "1px solid #a0bbd0" }}></td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "30px", color: "#aaa", fontStyle: "italic", border: "1px solid #ddd" }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 px-5 pb-4 no-print">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold bg-gray-200 border border-gray-400 disabled:opacity-40 hover:bg-gray-300">
                ◀ Prev
              </button>
              <span className="text-xs text-gray-600 font-semibold">
                Page {currentPage} of {totalPages} &nbsp;|&nbsp; {rows.length} records
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold bg-gray-200 border border-gray-400 disabled:opacity-40 hover:bg-gray-300">
                Next ▶
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e0e0; border: 2px solid #808080; box-shadow: inset 1px 1px 0px white; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
};

export default SalesViewReport;
