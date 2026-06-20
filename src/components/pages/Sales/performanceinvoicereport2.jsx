import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, Eye, Printer } from "lucide-react";
import API_BASE_URL from "../../../config/api";

const PerformanceInvoiceReport2 = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const API_URL = `${API_BASE_URL}/performanceinvoices2`;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_URL}/report/all`);
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
        setFiltered(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching PI2 report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    let result = [...invoices];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (inv) =>
          (inv.invoice_no || "").toLowerCase().includes(q) ||
          (inv.customer_name || "").toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      result = result.filter((inv) => {
        const d = inv.invoice_date ? inv.invoice_date.slice(0, 10) : "";
        return d >= fromDate;
      });
    }

    if (toDate) {
      result = result.filter((inv) => {
        const d = inv.invoice_date ? inv.invoice_date.slice(0, 10) : "";
        return d <= toDate;
      });
    }

    setFiltered(result);
  }, [search, fromDate, toDate, invoices]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const totalGrand = filtered.reduce((s, inv) => s + Number(inv.grandtotal || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">

      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm">
        ← Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">

        {/* Title */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Performance Invoice 2 — Report</h2>
              <p className="text-[12px] text-gray-400 mt-1">All PI2 invoices</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase font-bold">Total (Filtered)</p>
            <p className="text-[22px] font-black text-indigo-700">₹{totalGrand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice no or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold focus:outline-none focus:border-blue-400 bg-white shadow-sm"
            />
          </div>
          <div>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold focus:outline-none focus:border-blue-400 bg-white shadow-sm" />
          </div>
          <div>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold focus:outline-none focus:border-blue-400 bg-white shadow-sm" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-[14px] font-medium">Loading invoices…</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Invoice No", "Customer", "Date", "DC No", "Order No", "Items", "Grand Total", "Actions"].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${i === 0 ? "w-10 text-center" : i >= 6 ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((inv, index) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-[13px] font-bold text-indigo-700">{inv.invoice_no}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">{inv.customer_name}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600">{inv.dc_no || "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600">{inv.order_no || "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{inv.item_count || 0}</td>
                      <td className="px-4 py-3 text-[13px] font-black text-gray-900 text-center">
                        ₹{Number(inv.grandtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => navigate(`/sales/pi2-format/${encodeURIComponent(inv.invoice_no)}`)}
                            title="View Invoice"
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-[12px] font-bold transition-colors">
                            <Eye size={13} /> View
                          </button>
                          <button
                            onClick={() => navigate(`/sales/pi2-format/${encodeURIComponent(inv.invoice_no)}?print=true`)}
                            title="Print Invoice"
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-[12px] font-bold transition-colors">
                            <Printer size={13} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="9" className="py-14 text-center">
                        <div className="text-gray-300 text-4xl mb-3">📋</div>
                        <p className="text-[13px] text-gray-400 font-medium">No Performance Invoice 2 records found.</p>
                        <p className="text-[12px] text-gray-300 mt-1">Create your first PI2 invoice to see it here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan="7" className="px-4 py-3 text-[13px] font-black text-gray-600 uppercase text-right">
                        Total ({filtered.length} invoice{filtered.length !== 1 ? "s" : ""})
                      </td>
                      <td className="px-4 py-3 text-[13px] font-black text-indigo-700 text-center">
                        ₹{totalGrand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceInvoiceReport2;
