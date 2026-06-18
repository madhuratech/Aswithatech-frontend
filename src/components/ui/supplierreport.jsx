import React, { useEffect, useState, useCallback, useRef } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

const SupplierModel = ({ onMinimize, onClose, title, setIsMinimizedInternal }) => {
  const [data, setData] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const contentRef = useRef(null);

  // States for search dropdowns
  const [receiptList, setReceiptList] = useState([]);
  const [showReceiptList, setShowReceiptList] = useState(false);
  const [supplierList, setSupplierList] = useState([]);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [loading, setLoading] = useState(false);

  const TODAY = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: TODAY,
    receipt_no: "",
    supplier_name: ""
  });

  const Api_urls = "http://localhost:3000/api/suppliers";

  const gentratereport = useCallback(async () => {
    try {
      setLoading(true);
      let query = [];
      if (filters.fromDate && filters.toDate) {
        query.push(`fromDate=${filters.fromDate}`);
        query.push(`toDate=${filters.toDate}`);
      }
      if (filters.receipt_no) {
        query.push(`receipt_no=${filters.receipt_no}`);
      }
      if (filters.supplier_name) {
        query.push(`supplier_name=${encodeURIComponent(filters.supplier_name)}`);
      }
      const url = `${Api_urls}/report?${query.join("&")}`;
      const res = await fetch(url);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Report Error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch functions for dropdowns
  const fetchReceipts = async (val) => {
    try {
      const res = await fetch(`${Api_urls}/report?receipt_no=${val}`);
      const result = await res.json();
      setReceiptList(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async (val) => {
    try {
      const res = await fetch(`${Api_urls}/report?supplier_name=${encodeURIComponent(val)}`);
      const result = await res.json();
      const uniqueSuppliers = [...new Set(result.map(item => item.supplier_name))].map(name => ({ supplier_name: name }));
      setSupplierList(uniqueSuppliers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    gentratereport();
  }, [gentratereport]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (setIsMinimizedInternal) setIsMinimizedInternal(true);
    if (onMinimize) onMinimize();
  };

  const handlePrint = () => {
    const win = window.open("", "", "width=1200,height=750");
    win.document.write(`
      <html><head><title>${title || "Supplier Ledger"}</title>
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

  const exportToPdf = () => {
    if (!contentRef.current) return;
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `${title || "Supplier_Report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 1200
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
    };
    html2pdf().set(opt).from(contentRef.current).save();
  };

  // Totals
  const totalPaid    = data.reduce((s, r) => s + (Number(r.paid_amount)    || 0), 0);
  const totalTds     = data.reduce((s, r) => s + (Number(r.tds)            || 0), 0);
  const totalOthers  = data.reduce((s, r) => s + (Number(r.others)         || 0), 0);
  const totalGrand   = data.reduce((s, r) => s + (Number(r.po_grand_total) || 0), 0);
  const totalBalance = data.reduce((s, r) => s + (
    (Number(r.po_grand_total) || 0) -
    (Number(r.paid_amount)    || 0) -
    (Number(r.tds)            || 0) -
    (Number(r.others)         || 0)
  ), 0);

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
        <button
          onClick={() => { setIsMinimized(false); if (setIsMinimizedInternal) setIsMinimizedInternal(false); }}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600"
        >
          <div className="w-3 h-3 border border-white/50"></div>
          {title || "Supplier Ledger"}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-4 bg-black/30"}`}>
      <div className={`bg-[#f0f0f0] border-2 border-white flex flex-col shadow-2xl transition-all duration-200 ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* ── Title Bar ── */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold tracking-wide">{title || "Supplier Ledger"}</span>
          <div className="flex shrink-0">
            <button onClick={handleMinimize} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Minimize">
              <Minus size={12} strokeWidth={3} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title={isMaximized ? "Restore Down" : "Maximize"}>
              <Square size={10} strokeWidth={3} />
            </button>
            <button onClick={handleClose} className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5">
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-black px-4 py-2 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">FROM DATE</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">TO DATE</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>

          {/* Receipt No */}
          <div className="flex flex-col gap-0.5 relative">
            <label className="text-[10px] font-bold text-white tracking-widest">RECEIPT NUMBER</label>
            <input
              type="text"
              placeholder="SUP-2026-001"
              value={filters.receipt_no}
              onFocus={() => { setShowReceiptList(true); fetchReceipts(""); }}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, receipt_no: val });
                fetchReceipts(val);
                setShowReceiptList(true);
              }}
              className="w-[150px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
            {showReceiptList && receiptList.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                {receiptList.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                    onClick={() => { setFilters({ ...filters, receipt_no: item.receipt_no }); setShowReceiptList(false); }}
                  >
                    {item.receipt_no}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Name */}
          <div className="flex flex-col gap-0.5 relative">
            <label className="text-[10px] font-bold text-white tracking-widest">SUPPLIER NAME</label>
            <input
              type="text"
              placeholder="Supplier Name"
              value={filters.supplier_name}
              onFocus={() => { setShowSupplierList(true); fetchSuppliers(""); }}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, supplier_name: val });
                fetchSuppliers(val);
                setShowSupplierList(true);
              }}
              className="w-[180px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
            {showSupplierList && supplierList.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                {supplierList.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                    onClick={() => { setFilters({ ...filters, supplier_name: item.supplier_name }); setShowSupplierList(false); }}
                  >
                    {item.supplier_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-auto items-end">
            <button
              onClick={gentratereport}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}
            >
              GENERATE REPORT
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* ── Report Area ── */}
        <div className="flex-1 overflow-auto bg-[#f4f4f4] custom-scrollbar">

          {/* Action Strip */}
          <div className="flex gap-1.5 px-3 py-2 bg-[#ececec] border-b border-gray-300 no-print">
            <button
              onClick={handlePrint}
              className="bg-[#1a5ea8] text-white text-[10px] px-3 py-1 font-bold border border-[#154c8a] hover:bg-[#154c8a] flex items-center gap-1"
            >
              <Printer size={10} /> PRINT
            </button>
            <button
              onClick={exportToPdf}
              className="bg-[#b22222] text-white text-[10px] px-3 py-1 font-bold border border-[#8b1a1a] hover:bg-[#8b1a1a]"
            >
              EXPORT PDF
            </button>
          </div>

          {/* White report canvas */}
          <div className="bg-white mx-2 my-2 border border-gray-300" ref={contentRef}>

            {/* Report heading */}
            <div className="border-b border-gray-300 px-4 py-2 bg-white">
              <div className="text-[13px] font-bold text-black tracking-wide uppercase">Supplier Ledger</div>
              <div className="flex gap-8 mt-1 text-[10px] text-gray-700 font-semibold">
                <span>FROM : <span className="text-black">{filters.fromDate || "—"}</span></span>
                <span>TO : <span className="text-black">{filters.toDate || "—"}</span></span>
                <span>SUPPLIER : <span className="text-black uppercase">{filters.supplier_name || "ALL SUPPLIERS"}</span></span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse table-auto min-w-full" style={{ fontSize: "13px", fontFamily: "Arial, sans-serif" }}>
                <thead>
                  <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                    {[
                      ["SNO",            "center", "36px"],
                      ["RECEIPT NUMBER", "left",   "140px"],
                      ["DATE",           "center", "90px"],
                      ["SUPPLIER NAME",  "left",   "220px"],
                      ["PAID AMOUNT",    "right",  "100px"],
                      ["TDS",            "right",  "70px"],
                      ["OTHERS",         "right",  "70px"],
                      ["GRAND TOTAL",    "right",  "100px"],
                      ["BALANCE AMOUNT", "right",  "110px"],
                      ["PAYMENT METHOD", "center", "110px"],
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
                      <td colSpan="10" style={{ textAlign: "center", padding: "20px", color: "#666", fontStyle: "italic", border: "1px solid #ddd" }}>
                        Loading...
                      </td>
                    </tr>
                  ) : data.length > 0 ? (
                    <>
                      {data.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>{row.receipt_no}</td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", whiteSpace: "nowrap" }}>
                            {row.date ? new Date(row.date).toLocaleDateString("en-IN") : ""}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }} title={row.supplier_name}>
                            {row.supplier_name}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#006400", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>
                            {Number(row.paid_amount || 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {Number(row.tds || 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {Number(row.others || 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#00008b", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>
                            {Number(row.po_grand_total || 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#8b0000", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>
                            {((Number(row.po_grand_total) || 0) - (Number(row.paid_amount) || 0) - (Number(row.tds) || 0) - (Number(row.others) || 0)).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#00008b", fontWeight: "600" }}>
                            {row.payment_mode}
                          </td>
                        </tr>
                      ))}

                      {/* Totals row */}
                      <tr style={{ background: "#d5e3f0", fontWeight: "bold", borderTop: "2px solid #6a90b5" }}>
                        <td colSpan="4" style={{ border: "1px solid #a0bbd0", padding: "4px 8px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>OVERALL TOTAL</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#006400", fontVariantNumeric: "tabular-nums" }}>{totalPaid.toFixed(2)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalTds.toFixed(2)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalOthers.toFixed(2)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#00008b", fontVariantNumeric: "tabular-nums" }}>{totalGrand.toFixed(2)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#8b0000", fontVariantNumeric: "tabular-nums" }}>{totalBalance.toFixed(2)}</td>
                        <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px" }}></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "24px", color: "#aaa", fontStyle: "italic", border: "1px solid #ddd" }}>
                        No supplier records found.
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

export default SupplierModel;