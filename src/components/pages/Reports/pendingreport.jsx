import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000/api/pendings";

const fmtDate = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
};

const PendingReport = () => {
  const navigate = useNavigate();
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const TODAY = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState(TODAY);

  useEffect(() => {
    fetch(`${API_URL}/calculated`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((row) => {
    const matchCustomer = !search || row.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchFrom     = !fromDate || row.dc_date >= fromDate;
    const matchTo       = !toDate   || row.dc_date <= toDate;
    return matchCustomer && matchFrom && matchTo;
  });

  // Group by customer_name
  const grouped = filtered.reduce((acc, row) => {
    if (!acc[row.customer_name]) acc[row.customer_name] = [];
    acc[row.customer_name].push(row);
    return acc;
  }, {});

  const totalOrders    = filtered.reduce((s, r) => s + Number(r.order_qty    || 0), 0);
  const totalDespatch  = filtered.reduce((s, r) => s + Number(r.despatch_qty || 0), 0);
  const totalPending   = filtered.reduce((s, r) => s + Number(r.pending_qty  || 0), 0);
  const totalCustomers = Object.keys(grouped).length;
  const totalDCs       = new Set(filtered.map((r) => r.entry_id)).size;

  const summaryCards = [
    { label: "Total DCs",       value: totalDCs,       color: "text-gray-800",   bg: "bg-gray-50",   border: "border-gray-200"   },
    { label: "Customers",       value: totalCustomers, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
    { label: "Total Order Qty", value: totalOrders,    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
    { label: "Total Despatch",  value: totalDespatch,  color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
    { label: "Total Pending",   value: totalPending,   color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"    },
  ];

  const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400 bg-white";

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Report</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Customer-wise pending delivery quantity summary</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[13px] font-medium shadow-sm"
        >
          ← Go Back
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {summaryCards.map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-xl p-4`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
            <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} w-52`}
        />
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-500 font-semibold">From</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-500 font-semibold">To</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
        </div>
        {(search || fromDate || toDate) && (
          <button
            onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }}
            className="px-4 py-2 text-[12px] border rounded-lg hover:bg-gray-100 text-gray-600 font-semibold"
          >
            ✕ Clear Filters
          </button>
        )}
        <span className="ml-auto text-[12px] text-gray-400">{filtered.length} item(s) • {totalCustomers} customer(s)</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">Loading report data…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm">No pending records found</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse" style={{ minWidth: "960px" }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-800 text-white">
                  {["#", "Customer Name", "DC No", "DC Date", "Item Name", "Order Qty", "Despatch Qty", "Pending Qty", "Remarks"].map((col) => (
                    <th key={col} className="p-3 text-[11px] font-black uppercase tracking-wide text-center border-r border-gray-700 last:border-r-0 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([customer, rows]) => {
                  const subOrder    = rows.reduce((s, r) => s + Number(r.order_qty    || 0), 0);
                  const subDespatch = rows.reduce((s, r) => s + Number(r.despatch_qty || 0), 0);
                  const subPending  = rows.reduce((s, r) => s + Number(r.pending_qty  || 0), 0);
                  let rowCounter = 0;

                  return (
                    <React.Fragment key={customer}>
                      {rows.map((row, i) => {
                        rowCounter++;
                        return (
                          <tr key={`${row.entry_id}-${row.item_id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3 text-[12px] text-center text-gray-400 border-r border-gray-100">{rowCounter}</td>
                            <td className="p-3 text-[12px] font-bold text-black border-r border-gray-100 whitespace-nowrap">
                              {i === 0 ? customer : ""}
                            </td>
                            <td className="p-3 text-[12px] text-center text-gray-700 border-r border-gray-100">{row.dc_no}</td>
                            <td className="p-3 text-[12px] text-center text-gray-700 border-r border-gray-100 whitespace-nowrap">{fmtDate(row.dc_date)}</td>
                            <td className="p-3 text-[12px] text-gray-800 border-r border-gray-100">{row.item_name}</td>
                            <td className="p-3 text-[12px] text-center font-semibold text-blue-700 border-r border-gray-100">{row.order_qty ?? 0}</td>
                            <td className="p-3 text-[12px] text-center font-semibold text-green-700 border-r border-gray-100">{row.despatch_qty ?? 0}</td>
                            <td className="p-3 text-[12px] text-center font-black text-red-600 border-r border-gray-100">{row.pending_qty ?? 0}</td>
                            <td className="p-3 text-[12px] text-gray-400">{row.remarks || "-"}</td>
                          </tr>
                        );
                      })}

                      {/* Customer Subtotal */}
                      <tr className="bg-blue-50 border-b-2 border-blue-200">
                        <td colSpan={5} className="p-2 px-4 text-[11px] font-black text-blue-800 uppercase border-r border-blue-200">
                          {customer} — Subtotal &nbsp;
                          <span className="font-normal normal-case text-blue-500">({rows.length} item{rows.length !== 1 ? "s" : ""})</span>
                        </td>
                        <td className="p-2 text-[12px] font-black text-blue-800  text-center border-r border-blue-200">{subOrder}</td>
                        <td className="p-2 text-[12px] font-black text-green-700 text-center border-r border-blue-200">{subDespatch}</td>
                        <td className="p-2 text-[12px] font-black text-red-700   text-center border-r border-blue-200">{subPending}</td>
                        <td className="p-2 border-r border-blue-200" />
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Grand Total */}
                <tr className="bg-gray-900 text-white">
                  <td colSpan={5} className="p-3 px-5 text-[12px] font-black uppercase tracking-wide border-r border-gray-700">
                    Grand Total &nbsp;
                    <span className="font-normal normal-case text-gray-400">({totalCustomers} customer{totalCustomers !== 1 ? "s" : ""}, {totalDCs} DC{totalDCs !== 1 ? "s" : ""})</span>
                  </td>
                  <td className="p-3 text-[14px] font-black text-center text-blue-300  border-r border-gray-700">{totalOrders}</td>
                  <td className="p-3 text-[14px] font-black text-center text-green-300 border-r border-gray-700">{totalDespatch}</td>
                  <td className="p-3 text-[14px] font-black text-center text-red-300   border-r border-gray-700">{totalPending}</td>
                  <td className="p-3 border-r border-gray-700" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default PendingReport;
