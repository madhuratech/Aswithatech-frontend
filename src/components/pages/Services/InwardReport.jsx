import React, { useState, useRef, useEffect } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import API_BASE_URL from "../../../config/api";

const API = `${API_BASE_URL}/Inwardentries`;

const InwardReport = ({ onClose, onMinimize, title = "Inward Details Report" }) => {
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ fromDate: "", toDate: "", clientName: "" });
  const [supplierList, setSupplierList] = useState([]);
  const [data, setData] = useState([]);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString("en-IN");
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API}/report/suppliers`);
      const json = await res.json();
      setSupplierList(Array.isArray(json) ? json : []);
    } catch {
      setSupplierList([]);
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
    fetchSuppliers();
    loadReport({ fromDate: "", toDate: "", clientName: "" });
  }, []);

  const handleClose = () => { if (onClose) onClose(); };
  const handleMinimize = () => { setIsMinimized(true); if (onMinimize) onMinimize(); };

  const handlePrint = () => {
    const win = window.open("", "", "width=1200,height=750");
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { margin: 0; padding: 14px; font-family: Arial, sans-serif; font-size: 10px; }
        @page { size: A4 landscape; margin: 8mm; }
        h2 { font-size: 13px; margin: 0 0 4px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #c5d7e9; color: #0d2340; border: 1px solid #8ca8c5; padding: 4px 5px; font-size: 10px; font-weight: bold; white-space: nowrap; }
        td { border: 1px solid #ccc; padding: 3px 5px; font-size: 10px; }
        .tot { background: #d5e3f0; font-weight: bold; }
        .no-print { display: none !important; }
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
      filename: `InwardReport_${filters.clientName || "All"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    }).from(contentRef.current).save();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const header = [["SNO", "SUPPLIER NAME", "DC NO", "DC DATE", "ENTRY DATE", "ITEM NAME", "QTY", "PROBLEMS", "REMARKS"]];
    const rows = data.map((r, i) => [
      i + 1,
      r.client_name || "",
      r.dc_number || "",
      fmtDate(r.dc_date),
      fmtDate(r.entry_date),
      r.item_name || "",
      Number(r.quantity || 0),
      r.problems || "",
      r.remarks || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    ws["!cols"] = [6, 25, 14, 12, 12, 25, 8, 20, 20].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Inward Report");
    XLSX.writeFile(wb, `InwardReport_${filters.clientName || "All"}.xlsx`);
  };

  const totalQty = data.reduce((acc, r) => acc + Number(r.quantity || 0), 0);

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

        {/* Title Bar */}
        <div onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none">
          <span className="text-xs font-bold tracking-wide">{title}</span>
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
            <label className="text-[10px] font-bold text-white tracking-widest">SUPPLIER NAME</label>
            <select value={filters.clientName}
              onChange={(e) => {
                const updated = { ...filters, clientName: e.target.value };
                setFilters(updated);
              }}
              className="w-[220px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: "26px" }}>
              <option value="">-- ALL SUPPLIERS --</option>
              {supplierList.map((s, i) => (
                <option key={i} value={s.supplier_name}>{s.supplier_name}</option>
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

        {/* Report Area */}
        <div className="flex-1 overflow-auto bg-[#f4f4f4] custom-scrollbar">

          {/* Action Strip */}
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

          {/* White Report Canvas */}
          <div className="bg-white mx-2 my-2 border border-gray-300" ref={contentRef}>

            {/* Report Heading */}
            <div className="border-b border-gray-300 px-4 py-2 bg-white">
              <div className="text-[13px] font-bold text-black tracking-wide uppercase">Inward Details</div>
              <div className="flex gap-8 mt-1 text-[10px] text-gray-700 font-semibold">
                <span>FROM : <span className="text-black">{filters.fromDate ? fmtDate(filters.fromDate + "T00:00:00") : "—"}</span></span>
                <span>TO : <span className="text-black">{filters.toDate ? fmtDate(filters.toDate + "T00:00:00") : "—"}</span></span>
                <span>SUPPLIER : <span className="text-black uppercase">{filters.clientName || "ALL SUPPLIERS"}</span></span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse table-auto min-w-full" style={{ fontSize: "13px", fontFamily: "Arial, sans-serif" }}>
                <thead>
                  <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                    {[
                      ["SNO", "center", "40px"],
                      ["NAME", "left", "200px"],
                      ["DC NO", "left", "110px"],
                      ["DC DATE", "center", "90px"],
                      ["ENTRY DATE", "center", "90px"],
                      ["ITEM NAME", "left", "200px"],
                      ["QTY", "right", "60px"],
                      ["REMARKS", "left", "130px"],
                    ].map(([label, align, width]) => (
                      <th key={label} style={{
                        border: "1px solid #8ca8c5",
                        padding: "4px 6px",
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
                      <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "#666", fontStyle: "italic", border: "1px solid #ddd" }}>
                        Loading...
                      </td>
                    </tr>
                  ) : data.length > 0 ? (
                    <>
                      {data.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>{row.client_name}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>{row.dc_number}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", whiteSpace: "nowrap" }}>{fmtDate(row.dc_date)}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", whiteSpace: "nowrap" }}>{fmtDate(row.entry_date)}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px" }}>{row.item_name}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontWeight: "600" }}>{row.quantity}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px" }}>{row.remarks || "—"}</td>
                        </tr>
                      ))}

                      {/* Total row */}
                      <tr style={{ background: "#d5e3f0", fontWeight: "bold", borderTop: "2px solid #6a90b5" }}>
                        <td colSpan="6" style={{ border: "1px solid #a0bbd0", padding: "4px 8px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>TOTAL</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right" }}>{totalQty}</td>
                        <td colSpan="2" style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "24px", color: "#aaa", fontStyle: "italic", border: "1px solid #ddd" }}>
                        No inward records found.
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

export default InwardReport;
