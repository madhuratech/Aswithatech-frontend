import React, { useState, useRef, useEffect } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import * as XLSX from "xlsx";

const ReportModal = ({
  title,
  isOpen,
  onClose,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  clientList,
  clientName,
  onClientNameChange,
  clientLabel = "CLIENT NAME",
  showClientFilter = true,
  loading,
  children,
  contentRef,
  exportFileName = "Report",
  exportColumns,
  exportData,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const modalContainerRef = useRef(null);

  useOutsideClick([
    { ref: modalContainerRef, onClose: () => { if (!isMaximized) onClose?.(); } }
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen && !isMinimized) return null;

  const handlePrint = () => {
    const el = contentRef?.current;
    if (!el) return;
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
        .no-print { display: none; }
      </style>
      </head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleExportExcel = () => {
    if (!exportColumns || !exportData) return;
    const wb = XLSX.utils.book_new();
    const header = exportColumns.map((c) => c.label);
    const rows = exportData.map((row) =>
      exportColumns.map((c) => c.accessor ? row[c.accessor] ?? "" : "")
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  };

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN") : "—";

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
      <div ref={modalContainerRef} className={`bg-[#f0f0f0] border-2 border-white flex flex-col shadow-2xl transition-all duration-200
        ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* Title bar */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold">{title}</span>
          <div className="flex shrink-0">
            <button onClick={() => setIsMinimized(true)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Minimize">
              <Minus size={12} strokeWidth={3} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Maximize">
              <Square size={10} strokeWidth={3} />
            </button>
            <button onClick={onClose} className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5">
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-black px-4 py-3 flex flex-wrap items-end gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">FROM DATE</label>
            <input type="date" value={fromDate}
              onChange={(e) => onFromDateChange?.(e.target.value)}
              className="w-[140px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">TO DATE</label>
            <input type="date" value={toDate}
              onChange={(e) => onToDateChange?.(e.target.value)}
              className="w-[140px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400" />
          </div>

          {showClientFilter && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-white tracking-wide">{clientLabel}</label>
              <select
                value={clientName || ""}
                onChange={(e) => onClientNameChange?.(e.target.value)}
                className="w-[220px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400 font-semibold"
                style={{ height: "30px" }}
              >
                <option value="">-- ALL --</option>
                {(clientList || []).map((c, i) => (
                  <option key={i} value={c.customer_name || c.supplier_name || c.name || c.spare_name || c.pcb_name}>
                    {c.customer_name || c.supplier_name || c.name || c.spare_name || c.pcb_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 ml-auto items-end pb-0.5">
            <button onClick={onClose}
              className="px-5 py-1.5 text-sm font-bold bg-white text-black border border-gray-300 hover:bg-gray-100 active:bg-gray-200 tracking-wide">
              CLOSE
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative max-w-full">

          {/* Action buttons */}
          <div className="flex gap-2 mb-3 px-0 no-print bg-white py-3">
            <button onClick={handleExportExcel}
              className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold ml-4">
              Main Report
            </button>
            <button onClick={handlePrint}
              className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold flex items-center gap-1">
              <Printer size={12} /> Print
            </button>
          </div>

          {/* Report header */}
          <div className="w-full mb-4 border-b border-gray-400 pb-3 px-8 max-w-[97%] ml-5">
            <div className="text-sm font-bold text-gray-800">
              <span>From : </span>
              <span className="text-black">{fromDate ? fmtDate(fromDate) : "—"}</span>
              <span className="ml-8">To : </span>
              <span className="text-black">{toDate ? fmtDate(toDate) : "—"}</span>
            </div>
            <div className="text-sm font-bold mt-1 text-gray-800">
              NAME : <span className="uppercase">{clientName || "ALL"}</span>
              <span className="text-gray-600 font-normal"> - {title}</span>
            </div>
          </div>

          {/* Table area */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm italic">Loading...</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e0e0; border: 2px solid #808080; box-shadow: inset 1px 1px 0px white; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
};

export default ReportModal;
