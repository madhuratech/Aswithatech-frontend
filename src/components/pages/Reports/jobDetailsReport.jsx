import API_BASE_URL from "../../../config/api";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Printer, FileDown, Table } from "lucide-react";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
const Api_url = `${API_BASE_URL}/jobdcentry`;

const fmtDate = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
};

const JobDetailsReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const custRef = useRef(null);

  // Filters state
  const TODAY = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: TODAY,
    customerName: "",
    dcNo: ""
  });

  const printAreaRef = useRef(null);

  const fetchCustomers = useCallback(async () => {
      try {
          const res = await fetch(`${API_BASE_URL}/customers/all`);
          const clientData = await res.json();
          setCustomers(Array.isArray(clientData) ? clientData : []);
      } catch {
          setCustomers([]);
      }
  }, []);

  const fetchReportData = useCallback(async () => {
      setLoading(true);
      try {
          const params = new URLSearchParams();
          if (filters.fromDate) params.append("fromDate", filters.fromDate);
          if (filters.toDate) params.append("toDate", filters.toDate);
          if (filters.customerName) params.append("customerName", filters.customerName);
          if (filters.dcNo) params.append("dcNo", filters.dcNo);

          const res = await fetch(`${Api_url}/report/filters?${params.toString()}`);
          const result = await res.json();
          setData(Array.isArray(result) ? result : []);
      } catch {
          toast.error("Failed to load report data");
          setData([]);
      } finally {
          setLoading(false);
      }
  }, [filters]);

  useEffect(() => {
    fetchReportData();
    fetchCustomers();
  }, [fetchReportData, fetchCustomers]);

  useOutsideClick([
    { ref: custRef, onClose: () => setShowCustDropdown(false) },
  ]);

  const handleSearch = (e) => {
      e.preventDefault();
      fetchReportData();
  };

  const clearFilters = () => {
      setFilters({
          fromDate: "",
          toDate: "",
          customerName: "",
          dcNo: ""
      });
      setCustSearch("");
      setTimeout(() => {
          setLoading(true);
          fetch(`${API_BASE_URL}/jobdcentry/report/filters`)
            .then(res => res.json())
            .then(result => setData(Array.isArray(result) ? result : []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
      }, 50);
  };

  const handleCustomerSelect = (c) => {
      setFilters(p => ({ ...p, customerName: c.customer_name }));
      setCustSearch(c.customer_name);
      setShowCustDropdown(false);
  };

  const handlePrint = () => {
      const win = window.open("", "", "width=1200,height=750");
      win.document.write(`
        <html><head><title>Job Pending Details Report</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 11px; }
          h2 { font-size: 16px; margin: 0 0 5px; text-transform: uppercase; text-align: center; }
          p { margin: 0 0 15px; text-align: center; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f2f2f2; border: 1px solid #ccc; padding: 6px 8px; font-size: 10px; font-weight: bold; text-align: left; }
          td { border: 1px solid #ddd; padding: 6px 8px; font-size: 10px; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
        </style>
        </head><body>
          <h2>Job Pending Details Report</h2>
          <p>Generated on ${new Date().toLocaleDateString("en-GB")}</p>
          ${printAreaRef.current.innerHTML}
        </body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
  };

  const exportPDF = () => {
      if (!printAreaRef.current) return;
      html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `Job_Pending_Details_Report_${new Date().toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(printAreaRef.current)
        .save();
  };

  const exportExcel = () => {
      const wb = XLSX.utils.book_new();
      const header = [
        [
          "SNO",
          "NAME",
          "DC NO",
          "DC DATE",
          "ITEM NAME",
          "ORDER QTY",
          "DESPATCH QTY",
          "PENDING QTY"
        ],
      ];
      const rows = data.map((r, i) => [
        i + 1,
        r.name,
        r.dc_no,
        r.dc_date ? new Date(r.dc_date).toLocaleDateString('en-GB') : "—",
        r.item_name || "—",
        r.order_qty,
        r.despatch_qty,
        r.pending_qty
      ]);
      const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, "Job Pending Report");
      XLSX.writeFile(wb, `Job_Pending_Details_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const filteredCustomers = customers.filter(c =>
      c.customer_name.toLowerCase().includes(custSearch.toLowerCase())
  );

  const inputCls = "w-full p-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white shadow-sm";
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 select-none";

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">JOB PENDING DETAILS REPORT</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Summary of pending delivery challan quantities</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold shadow-sm transition"
        >
          ← Go Back
        </button>
      </div>

      {/* Filters Form Card */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* From Date */}
          <div>
            <label className={labelCls}>From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters(p => ({ ...p, fromDate: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* To Date */}
          <div>
            <label className={labelCls}>To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters(p => ({ ...p, toDate: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* Customer Name Autocomplete */}
          <div className="relative" ref={custRef}>
            <label className={labelCls}>Customer Name</label>
            <input
              type="text"
              placeholder="Search Customer..."
              value={custSearch}
              onFocus={() => setShowCustDropdown(true)}
              onChange={(e) => {
                  setCustSearch(e.target.value);
                  setFilters(p => ({ ...p, customerName: e.target.value }));
                  setShowCustDropdown(true);
              }}
              className={inputCls}
            />
            {showCustDropdown && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleCustomerSelect(c)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs font-semibold border-b border-gray-50 last:border-0"
                  >
                    {c.customer_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DC No */}
          <div>
            <label className={labelCls}>DC No</label>
            <input
              type="text"
              placeholder="e.g. AT/JBDC-001"
              value={filters.dcNo}
              onChange={(e) => setFilters(p => ({ ...p, dcNo: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-5 border-t pt-4">
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg text-[13px] flex items-center gap-1.5 shadow-sm transition"
            >
              <Search size={15} /> SEARCH
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="border border-gray-250 bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg text-[13px] transition"
            >
              CLEAR FILTERS
            </button>
          </div>

          {data.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="border bg-white hover:bg-gray-50 text-gray-800 font-bold py-2 px-4.5 rounded-lg text-[13px] flex items-center gap-1.5 transition"
              >
                <Printer size={15} /> PRINT
              </button>
              <button
                type="button"
                onClick={exportPDF}
                className="border bg-white hover:bg-gray-50 text-red-600 font-bold py-2 px-4.5 rounded-lg text-[13px] flex items-center gap-1.5 transition"
              >
                <FileDown size={15} /> EXPORT PDF
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="border bg-white hover:bg-gray-50 text-green-700 font-bold py-2 px-4.5 rounded-lg text-[13px] flex items-center gap-1.5 transition"
              >
                <Table size={15} /> EXPORT EXCEL
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Report Summary Details */}
      <div className="mb-4 flex justify-between items-center px-2">
        <span className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">
          Job Pending Details list ({data.length} items found)
        </span>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto" ref={printAreaRef}>
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="bg-gray-800 text-white font-bold">
                <th className="px-4 py-3 text-center border-r border-gray-700 w-[5%] whitespace-nowrap">S.NO</th>
                <th className="px-4 py-3 border-r border-gray-700 w-[20%] whitespace-nowrap">NAME</th>
                <th className="px-4 py-3 border-r border-gray-700 w-[15%] whitespace-nowrap">DC NO</th>
                <th className="px-4 py-3 border-r border-gray-700 w-[12%] whitespace-nowrap">DC DATE</th>
                <th className="px-4 py-3 border-r border-gray-700 w-[22%] whitespace-nowrap">ITEM NAME</th>
                <th className="px-4 py-3 text-center border-r border-gray-700 w-[8%] whitespace-nowrap">ORDER QTY</th>
                <th className="px-4 py-3 text-center border-r border-gray-700 w-[9%] whitespace-nowrap">DESPATCH QTY</th>
                <th className="px-4 py-3 text-center w-[9%] whitespace-nowrap">PENDING QTY</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-gray-400 text-sm font-semibold">
                    Loading report details...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-gray-400 text-sm font-semibold">
                    No pending items found
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-center text-gray-400 font-bold border-r border-gray-100">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100">{row.name}</td>
                    <td className="px-4 py-3 font-bold text-blue-600 border-r border-gray-100">{row.dc_no}</td>
                    <td className="px-4 py-3 border-r border-gray-100">{fmtDate(row.dc_date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 border-r border-gray-100">{row.item_name || "—"}</td>
                    <td className="px-4 py-3 text-center font-bold border-r border-gray-100">{row.order_qty}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-700 border-r border-gray-100">{row.despatch_qty}</td>
                    <td className="px-4 py-3 text-center font-black text-red-650">{row.pending_qty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsReport;
