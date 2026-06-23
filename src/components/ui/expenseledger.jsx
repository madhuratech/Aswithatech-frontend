import API_BASE_URL from "../../config/api";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
const API = `${API_BASE_URL}/expenses`;

const ExpenseLedger = ({ onClose, onMinimize, title = "Expense Report" }) => {
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const modalContainerRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  useOutsideClick([
    { ref: modalContainerRef, onClose: () => { if (!isMaximized) handleClose(); } }
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Today Date 

  useEffect (() => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      toDate: today
    }));
  },[])

  const [filters, setFilters] = useState({ fromDate: "", toDate: "", employee_name: "" });
  const [employeeList, setEmployeeList] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchEmployees = async (val = "") => {
    try {
      const res = await fetch(`${API}/expense-employees?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setEmployeeList(Array.isArray(data) ? data : []);
    } catch {
      setEmployeeList([]);
    }
  };

  const loadReport = async (employeeName, fromDate, toDate) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeName) params.set("employee_name", employeeName);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`${API}/employee-expenses?${params}`);
      const data = await res.json();

      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setTotalAmount(data.total_amount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees("");
    loadReport("", "", "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateReport = useCallback(() => {
    loadReport(filters.employee_name, filters.fromDate, filters.toDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleEmployeeChange = (e) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, employee_name: val }));
    loadReport(val, filters.fromDate, filters.toDate);
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
        .amount { color: #8b0000; font-weight: 600; }
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
      filename: `ExpenseReport_${filters.employee_name || "All"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    }).from(contentRef.current).save();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const employeeLabel = filters.employee_name || "ALL_EMPLOYEES";

    const rows = entries.map((row) => [
      row.sno,
      row.expense_no || "",
      row.date ? fmtDate(row.date) : "",
      row.employee_name || "",
      row.category || "",
      row.remarks || "",
      Number(fmt(row.amount)),
    ]);
    const totalsRow = ["", "", "", "", "", "TOTAL", Number(fmt(totalAmount))];
    const ws = XLSX.utils.aoa_to_sheet([
      ["SNO", "VOUCHER NO", "DATE", "EMPLOYEE NAME", "EXPENSE CATEGORY", "REMARKS", "AMOUNT"],
      ...rows,
      totalsRow,
    ]);
    ws["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 30 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "Expense Report");
    XLSX.writeFile(wb, `ExpenseReport_${employeeLabel}.xlsx`);
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
  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN") : "";
 

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

        {/* Toolbar - black bar matching Customer Ledger style */}
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

          {/* EMPLOYEE NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white tracking-wide">EMPLOYEE NAME</label>
            <select
              value={filters.employee_name}
              onChange={handleEmployeeChange}
              className="w-[220px] px-2 py-1 border border-gray-400 text-sm bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: '30px' }}
            >
              <option value="">-- ALL EMPLOYEES --</option>
              {employeeList.map((c, i) => (
                <option key={i} value={c.employee_name}>{c.employee_name}</option>
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
        <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative max-w-full">

          {/* Action buttons */}
          <div className="flex gap-2 mb-3 px-0 no-print bg-white py-3">
            <button onClick={exportExcel} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold ml-4">Main Report</button>
            <button onClick={handlePrint} className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold flex items-center gap-1">
              <Printer size={12} /> Print
            </button>
            <button onClick={exportPDF} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-[3px] font-semibold">Export PDF</button>
          </div>

          {/* Header */}
          <div className="w-full mb-4 border-b border-gray-400 pb-3 px-8 max-w-[97%] ml-5">
            <div className="text-sm font-bold text-gray-800">
              <span>From : </span>
              <span className="text-black">{filters.fromDate ? fmtDate(filters.fromDate) : "—"}</span>
              <span className="ml-8">To : </span>
              <span className="text-black">{filters.toDate ? fmtDate(filters.toDate) : "—"}</span>
            </div>
            <div className="text-sm font-bold mt-1 text-gray-800">
              NAME : <span className="uppercase">{filters.employee_name || "ALL EMPLOYEES"}</span>
              <span className="text-gray-600 font-normal"> - EXPENSE STATEMENT</span>
            </div>
          </div>

          {/* Expense Table */}
          <div className="w-full p-3" style={{ fontFamily: "'Tahoma','Arial',sans-serif" }} ref={contentRef}>
            <table className="w-full border-collapse table-auto" style={{ fontSize: '13px', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '42px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '250px' }} />
                <col style={{ width: '100px' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#c5d7e9', color: '#0d2340', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 5px', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SNO</th>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>VOUCHER NO</th>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DATE</th>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>EMPLOYEE NAME</th>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>EXPENSE CATEGORY</th>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>REMARKS</th>
                  <th style={{ border: '1px solid #8ca8c5', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#666', fontStyle: 'italic', border: '1px solid #ddd' }}>
                        Loading...
                      </td>
                    </tr>
                  ) : entries.length > 0 ? (
                    entries.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#edf2f8' }}>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 5px', textAlign: 'center', color: '#555' }}>{row.sno}</td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#00008b', fontWeight: '600' }}>
                          {row.expense_no || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#222', whiteSpace: 'nowrap' }}>{fmtDate(row.date)}</td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#333' }}>
                          {row.employee_name
                            ? row.employee_name
                            : <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#333' }}>
                          {row.category || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.remarks || <span style={{ color: '#bbb' }}>—</span>}
                        </td>
                        <td style={{ border: '1px solid #d0d0d0', padding: '4px 8px', textAlign: 'right', color: '#8b0000', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(row.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontStyle: 'italic', border: '1px solid #ddd' }}>
                        No expenses found.
                      </td>
                    </tr>
                  )}

                {/* Grand total row */}
                {entries.length > 0 && (
                  <tr style={{ background: '#d5e3f0', fontWeight: 'bold', borderTop: '2px solid #6a90b5' }}>
                    <td colSpan="6" style={{ border: '1px solid #a0bbd0', padding: '5px 8px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.4px' }}>GRAND TOTAL</td>
                    <td style={{ border: '1px solid #a0bbd0', padding: '5px 8px', textAlign: 'right', color: '#8b0000', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
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
          .printable-area { width: 100% !important; overflow: visible !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default ExpenseLedger;
