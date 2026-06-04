import React, { useState, useRef, useEffect } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";

const API = "http://localhost:3000/api/salesinvoices";

const SalesReport = ({ onClose, onMinimize, title = "Sales Report" }) => {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ fromDate: "", toDate: "", clientName: "" });
  const [clientList, setClientList] = useState([]);
  const [data, setData] = useState([]);

  const fmt = (val) => Number(val || 0).toFixed(2);
  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString("en-IN");
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API}/report/customers`);
      const json = await res.json();
      setClientList(Array.isArray(json) ? json : []);
    } catch {
      setClientList([]);
    }
  };

  const loadReport = async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      if (f.clientName) params.set("clientName", f.clientName);
      const res = await fetch(`${API}/report/filters?${params}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    loadReport({ fromDate: "", toDate: "", clientName: "" });
  }, []);

  const handleClose = () => { if (onClose) onClose(); else navigate(-1); };
  const handleMinimize = () => { setIsMinimized(true); if (onMinimize) onMinimize(); };

  const handlePrint = () => {
    const win = window.open("", "", "width=1200,height=750");
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { margin: 0; padding: 14px; font-family: Arial, sans-serif; font-size: 10px; }
        @page { size: A4 landscape; margin: 8mm; }
        h2 { font-size: 13px; margin: 0 0 4px; }
        .hdr { margin-bottom: 8px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #c5d7e9; color: #0d2340; border: 1px solid #8ca8c5; padding: 4px 5px; font-size: 10px; font-weight: bold; white-space: nowrap; }
        td { border: 1px solid #ccc; padding: 3px 5px; font-size: 10px; }
        .tr { text-align: right; }
        .tc { text-align: center; }
        .tot { background: #d5e3f0; font-weight: bold; }
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
      margin: [5, 3, 5, 3],
      filename: `SalesReport_${filters.clientName || "All"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    }).from(contentRef.current).save();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const header = [["GST NO", "CUSTOMER NAME", "HSN/SAC", "INVOICE NO", "DATE",
      "TOTAL INVOICE VALUE", "TAXABLE VALUE", "QTY",
      "CGST %", "CGST AMOUNT", "SGST %", "SGST AMOUNT", "IGST %", "IGST AMOUNT"]];
    const rows = data.map((r) => [
      r.gst_no || "",
      r.customer_name || "",
      r.hsn_sac || "",
      r.invoice_no || "",
      fmtDate(r.invoice_date),
      Number(fmt(r.total_invoice_value)),
      Number(fmt(r.taxable_value)),
      Number(r.total_qty || 0),
      Number(fmt(r.cgst_percent)),
      Number(fmt(r.cgst_amount)),
      Number(fmt(r.sgst_percent)),
      Number(fmt(r.sgst_amount)),
      Number(fmt(r.igst_percent)),
      Number(fmt(r.igst_amount)),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    ws["!cols"] = [14, 22, 12, 14, 11, 16, 14, 6, 8, 13, 8, 13, 8, 13].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `SalesReport_${filters.clientName || "All"}.xlsx`);
  };

  // Totals
  const totals = data.reduce((acc, r) => ({
    total_invoice_value: acc.total_invoice_value + Number(r.total_invoice_value || 0),
    taxable_value: acc.taxable_value + Number(r.taxable_value || 0),
    total_qty: acc.total_qty + Number(r.total_qty || 0),
    cgst_amount: acc.cgst_amount + Number(r.cgst_amount || 0),
    sgst_amount: acc.sgst_amount + Number(r.sgst_amount || 0),
    igst_amount: acc.igst_amount + Number(r.igst_amount || 0),
  }), { total_invoice_value: 0, taxable_value: 0, total_qty: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0 });

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
        <button onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600">
          <div className="w-3 h-3 border border-white/50" />
          {title}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-4 bg-black/30"}`}>
      <div className={`bg-[#f0f0f0] border-2 border-white flex flex-col shadow-2xl transition-all duration-200 ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* ── Title Bar ── */}
        <div onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none">
          <span className="text-xs font-bold tracking-wide">{title}</span>
          <div className="flex shrink-0">
            <button onClick={handleMinimize} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Minimize"><Minus size={12} strokeWidth={3} /></button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Maximize"><Square size={10} strokeWidth={3} /></button>
            <button onClick={handleClose} className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5"><X size={14} strokeWidth={3} /></button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-black px-4 py-2 flex flex-wrap items-end gap-4">

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">FROM DATE</label>
            <input type="date" value={filters.fromDate}
              onChange={(e) => setFilters(p => ({ ...p, fromDate: e.target.value }))}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">TO DATE</label>
            <input type="date" value={filters.toDate}
              onChange={(e) => setFilters(p => ({ ...p, toDate: e.target.value }))}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">CUSTOMER NAME</label>
            <select value={filters.clientName}
              onChange={(e) => {
                const updated = { ...filters, clientName: e.target.value };
                setFilters(updated);
                loadReport(updated);
              }}
              className="w-[210px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: "26px" }}>
              <option value="">-- ALL CUSTOMERS --</option>
              {clientList.map((c, i) => (
                <option key={i} value={c.customer_name}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 ml-auto items-end pb-0">
            <button onClick={() => loadReport(filters)}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}>
              GENERATE REPORT
            </button>
            <button onClick={handleClose}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}>
              CLOSE
            </button>
          </div>
        </div>

        {/* ── Report Area ── */}
        <div className="flex-1 overflow-auto bg-[#f4f4f4] custom-scrollbar">

          {/* Action strip */}
          <div className="flex gap-1.5 px-3 py-2 bg-[#ececec] border-b border-gray-300 no-print">
            <button onClick={exportExcel}
              className="bg-green-600 text-white text-[10px] px-3 py-1 font-bold border border-green-700 hover:bg-green-700 active:bg-green-800"
              style={{ letterSpacing: "0.5px" }}>
              MAIN REPORT
            </button>
            <button onClick={handlePrint}
              className="bg-[#1a5ea8] text-white text-[10px] px-3 py-1 font-bold border border-[#154c8a] hover:bg-[#154c8a] flex items-center gap-1">
              <Printer size={10} /> PRINT
            </button>
            <button onClick={exportPDF}
              className="bg-[#b22222] text-white text-[10px] px-3 py-1 font-bold border border-[#8b1a1a] hover:bg-[#8b1a1a]">
              EXPORT PDF
            </button>
          </div>

          {/* White report canvas */}
          <div className="bg-white mx-2 my-2 border border-gray-300" ref={contentRef}>

            {/* Report heading */}
            <div className="border-b border-gray-300 px-4 py-2 bg-white">
              <div className="text-[13px] font-bold text-black tracking-wide uppercase">Sales Report</div>
              <div className="flex gap-8 mt-1 text-[10px] text-gray-700 font-semibold">
                <span>FROM : <span className="text-black">{filters.fromDate ? fmtDate(filters.fromDate + "T00:00:00") : "—"}</span></span>
                <span>TO : <span className="text-black">{filters.toDate ? fmtDate(filters.toDate + "T00:00:00") : "—"}</span></span>
                <span>CUSTOMER : <span className="text-black uppercase">{filters.clientName || "ALL CUSTOMERS"}</span></span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse table-auto min-w-full" style={{ fontSize: "13px", fontFamily: "Arial, sans-serif" }}>
                <thead>
                  <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                    {[
                      ["SNO", "center", "36px"],
                      ["GST NO", "left", "110px"],
                      ["CUSTOMER NAME", "left", "300px"],
                      ["HSN/SAC", "center", "80px"],
                      ["INVOICE NO", "left", "130px"],
                      ["DATE", "center", "80px"],
                      ["TOTAL INVOICE VALUE", "right", "110px"],
                      ["TAXABLE VALUE", "right", "95px"],
                      ["QTY", "right", "50px"],
                      ["CGST %", "right", "58px"],
                      ["CGST AMT", "right", "82px"],
                      ["SGST %", "right", "58px"],
                      ["SGST AMT", "right", "82px"],
                      ["IGST %", "right", "58px"],
                      ["IGST AMT", "right", "82px"],
                    ].map(([label, align, width]) => (
                      <th key={label} style={{
                        border: "1px solid #8ca8c5",
                        padding: "4px 5px",
                        textAlign: align,
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        width,
                        minWidth: width,
                      }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="15" style={{ textAlign: "center", padding: "20px", color: "#666", fontStyle: "italic", border: "1px solid #ddd" }}>
                        Loading...
                      </td>
                    </tr>
                  ) : data.length > 0 ? (
                    <>
                      {data.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#333", whiteSpace: "nowrap" }}>{row.gst_no || <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{row.customer_name}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#444" }}>{row.hsn_sac || <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>{row.invoice_no}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", whiteSpace: "nowrap" }}>{fmtDate(row.invoice_date)}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#8b0000", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{fmt(row.total_invoice_value)}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(row.taxable_value)}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right" }}>{row.total_qty || "—"}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#555" }}>{Number(row.cgst_percent) > 0 ? `${fmt(row.cgst_percent)}%` : <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(row.cgst_amount) > 0 ? fmt(row.cgst_amount) : <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#555" }}>{Number(row.sgst_percent) > 0 ? `${fmt(row.sgst_percent)}%` : <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(row.sgst_amount) > 0 ? fmt(row.sgst_amount) : <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#555" }}>{Number(row.igst_percent) > 0 ? `${fmt(row.igst_percent)}%` : <span style={{ color: "#bbb" }}>—</span>}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(row.igst_amount) > 0 ? fmt(row.igst_amount) : <span style={{ color: "#bbb" }}>—</span>}</td>
                        </tr>
                      ))}

                      {/* Totals row */}
                      <tr style={{ background: "#d5e3f0", fontWeight: "bold", borderTop: "2px solid #6a90b5" }}>
                        <td colSpan="6" style={{ border: "1px solid #a0bbd0", padding: "4px 8px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>TOTAL</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#8b0000", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.total_invoice_value)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.taxable_value)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right" }}>{totals.total_qty}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.cgst_amount)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.sgst_amount)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(totals.igst_amount)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="15" style={{ textAlign: "center", padding: "24px", color: "#aaa", fontStyle: "italic", border: "1px solid #ddd" }}>
                        No sales records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e0e0; border: 2px solid #808080; box-shadow: inset 1px 1px 0px white; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default SalesReport;
