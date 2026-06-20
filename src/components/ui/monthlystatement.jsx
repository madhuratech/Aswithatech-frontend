import API_BASE_URL from "../../config/api";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { X, Square, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOutsideClick } from "../../hooks/useOutsideClick";
const fmt = (n) => Number(n || 0).toFixed(2);

const PurchaseReport = ({ onMinimize, onClose, setIsMinimizedInternal, title }) => {
  const [data, setData] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  const [reportMode, setReportMode] = useState("billwise");

  const [receiptList, setReceiptList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [openBillNo, setOpenBillNo] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  const billDropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);
  const modalContainerRef = useRef(null);

  useOutsideClick([
    { ref: billDropdownRef, onClose: () => setOpenBillNo(false) },
    { ref: supplierDropdownRef, onClose: () => setOpenSupplier(false) },
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

  const [filters, setFilters] = useState({ fromdate: "", todate: "", bill_no: "", supplier_name: "" });

  const baseApi = reportMode === "billwise"
    ? `${API_BASE_URL}/billpayment`
    : `${API_BASE_URL}/taxpurchases`;

  const generateReport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.fromdate && filters.todate) { params.append("fromdate", filters.fromdate); params.append("todate", filters.todate); }
      if (filters.bill_no) params.append("billno", filters.bill_no);
      if (filters.supplier_name) params.append("suppliername", filters.supplier_name);
      const endpoint = reportMode === "billwise" ? `${baseApi}/report/filters` : `${baseApi}/report`;
      const res = await fetch(`${endpoint}?${params}`);
      setData(await res.json());
    } catch (e) { console.error(e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportMode, filters, baseApi]);

  useEffect(() => { generateReport(); }, [generateReport]);



  const fetchBillNos = async (q) => {
    const res = await fetch(`${baseApi}/billno/search?q=${encodeURIComponent(q)}`);
    setReceiptList(await res.json());
  };

  const fetchSuppliers = async (q) => {
    const endpoint = reportMode === "billwise" ? `${baseApi}/clients/search` : `${baseApi}/supplier/search`;
    const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setSupplierList([...new Set(d.map(r => r.supplier_name))].map(n => ({ supplier_name: n })));
  };

  const groupedData = useMemo(() => {
    if (!Array.isArray(data) || !data.length) return [];
    if (reportMode === "billwise") {
      const months = {};
      data.forEach(row => {
        const month = row.entry_date ? row.entry_date.substring(0, 7) : "Unknown";
        if (!months[month]) months[month] = [];
        months[month].push(row);
      });
      return Object.keys(months).sort().map(month => ({ month, transactions: months[month] }));
    } else {
      const months = {};
      data.forEach(row => {
        const month = row.bill_date ? row.bill_date.substring(0, 7) : "Unknown";
        if (!months[month]) months[month] = {};
        const bill = row.bill_no;
        if (!months[month][bill]) {
          months[month][bill] = {
            ...row, items: []
          };
        }
        if (row.item_name) {
          months[month][bill].items.push({
            item_name: row.item_name, hsn: row.hsn, uom: row.uom,
            quantity: row.quantity, price: row.price, amount: row.amount
          });
        }
      });
      return Object.keys(months).sort().map(month => {
        const bills = Object.values(months[month]);
        const totals = bills.reduce((acc, b) => ({
          subtotal: acc.subtotal + Number(b.subtotal || 0),
          cgst: acc.cgst + Number(b.cgst || 0),
          sgst: acc.sgst + Number(b.sgst || 0),
          igst: acc.igst + Number(b.igst || 0),
          other_charges: acc.other_charges + Number(b.other_charges || 0),
          discount: acc.discount + Number(b.discount || 0),
          grand_total: acc.grand_total + Number(b.grand_total || 0)
        }), { subtotal: 0, cgst: 0, sgst: 0, igst: 0, other_charges: 0, discount: 0, grand_total: 0 });
        return { month, bills, totals };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reportMode]);

  const overall = useMemo(() => {
    if (reportMode === "billwise") {
      return groupedData.reduce((acc, g) => {
        const t = g.transactions.reduce((tAcc, row) => ({
          bill_amount: tAcc.bill_amount + Number(row.bill_amount || 0),
          paid_amount: tAcc.paid_amount + Number(row.paid_amount || 0),
          balance_amount: tAcc.balance_amount + Number(row.balance_amount || 0),
          grand_total: tAcc.grand_total + Number(row.grand_total || 0)
        }), { bill_amount: 0, paid_amount: 0, balance_amount: 0, grand_total: 0 });
        return {
          bill_amount: acc.bill_amount + t.bill_amount,
          paid_amount: acc.paid_amount + t.paid_amount,
          balance_amount: acc.balance_amount + t.balance_amount,
          grand_total: acc.grand_total + t.grand_total
        };
      }, { bill_amount: 0, paid_amount: 0, balance_amount: 0, grand_total: 0 });
    } else {
      return groupedData.reduce((acc, g) => ({
        subtotal: acc.subtotal + g.totals.subtotal,
        cgst: acc.cgst + g.totals.cgst,
        sgst: acc.sgst + g.totals.sgst,
        igst: acc.igst + g.totals.igst,
        other_charges: acc.other_charges + g.totals.other_charges,
        discount: acc.discount + g.totals.discount,
        grand_total: acc.grand_total + g.totals.grand_total
      }), { subtotal: 0, cgst: 0, sgst: 0, igst: 0, other_charges: 0, discount: 0, grand_total: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedData, reportMode]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.fromdate && filters.todate) { params.append("fromdate", filters.fromdate); params.append("todate", filters.todate); }
    if (filters.bill_no) params.append("billno", filters.bill_no);
    if (filters.supplier_name) params.append("suppliername", filters.supplier_name);
    const endpoint = reportMode === "billwise" ? `${baseApi}/report/excel` : `${baseApi}/report/excel`;
    window.open(`${endpoint}?${params}`, "_blank");
  };

  const handleMinimize = () => {
    if (setIsMinimizedInternal) setIsMinimizedInternal(true);
    onMinimize ? onMinimize() : setIsMinimized(true);
  };

  const handleClose = () => onClose ? onClose() : navigate(-1);

  if (isMinimized) return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
      <button onClick={() => { setIsMinimized(false); if (setIsMinimizedInternal) setIsMinimizedInternal(false); }}
        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600">
        <div className="w-3 h-3 border border-white/50" />
        {title || "Purchase Report"}
      </button>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex",
        alignItems: isMaximized ? "stretch" : "center",
        justifyContent: isMaximized ? "stretch" : "center",
        background: isMaximized ? "transparent" : "rgba(0,0,0,0.45)",
        padding: isMaximized ? 0 : "0",
      }}
    >
      <div
        ref={modalContainerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          border: "2px solid #888",
          width: isMaximized ? "100%" : "calc(100vw - 40px)",
          maxWidth: isMaximized ? "100%" : "1500px",
          height: isMaximized ? "100%" : "90vh",
          background: "#f0f0f0",
          pointerEvents: "auto",
        }}
      >

        {/* ── TITLE BAR ── */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          style={{
            background: "linear-gradient(to right, #0050a0, #1478d4)",
            color: "white",
            padding: "3px 6px 3px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "default",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>{title || "Purchase / Tax Report"}</span>
            <select
              value={reportMode}
              onChange={(e) => {
                const mode = e.target.value;
                setReportMode(mode);
                setData([]);
                setFilters({ fromdate: "", todate: "", bill_no: "", supplier_name: "" });
              }}
              style={{
                fontSize: "11px",
                border: "1px solid #aaa",
                borderRadius: "3px",
                padding: "2px 4px",
                background: "white",
                color: "black",
                outline: "none",
              }}
            >
              <option value="billwise">Billwise Payment Report</option>
              <option value="taxpurchase">Tax Purchase Report</option>
            </select>
          </div>
          <div style={{ display: "flex" }}>
            <button
              onClick={handleMinimize}
              title="Minimize"
              style={{
                width: 28, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Minus size={12} strokeWidth={3} />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore Down" : "Maximize"}
              style={{
                width: 28, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Square size={10} strokeWidth={3} />
            </button>
            <button
              onClick={handleClose}
              style={{
                width: 32, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2,
              }}
              onMouseOver={e => e.currentTarget.style.background = "#e81123"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div
          style={{
            background: "#000",
            padding: "8px 16px 10px 16px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {/* Left: filter fields */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>

            {/* FROM DATE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                FROM DATE
              </label>
              <input
                type="date"
                value={filters.fromdate}
                onChange={e => setFilters({ ...filters, fromdate: e.target.value })}
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
            </div>

            {/* TO DATE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                TO DATE
              </label>
              <input
                type="date"
                value={filters.todate}
                onChange={e => setFilters({ ...filters, todate: e.target.value })}
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
            </div>

            {/* BILL NUMBER */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }} className="bill-dropdown" ref={billDropdownRef}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                BILL NUMBER
              </label>
              <input
                type="text"
                placeholder="Bill Number"
                value={filters.bill_no}
                onFocus={() => { setOpenBillNo(true); fetchBillNos(""); }}
                onChange={e => { const val = e.target.value.trim(); setFilters({ ...filters, bill_no: val }); fetchBillNos(val); }}
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
              {openBillNo && receiptList.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, minWidth: "100%",
                    background: "white", border: "1px solid #ccc", zIndex: 9999,
                    maxHeight: 200, overflowY: "auto", boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {receiptList.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setFilters({ ...filters, bill_no: item.bill_no.trim() }); setOpenBillNo(false); }}
                      style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                      onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                      onMouseOut={e => e.currentTarget.style.background = "white"}
                    >
                      {item.bill_no}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUPPLIER NAME */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }} className="supplier-dropdown" ref={supplierDropdownRef}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                SUPPLIER NAME
              </label>
              <input
                type="text"
                placeholder="Supplier Name"
                value={filters.supplier_name}
                onFocus={() => { setOpenSupplier(true); fetchSuppliers(""); }}
                onChange={e => { const val = e.target.value.trim(); setFilters({ ...filters, supplier_name: val }); fetchSuppliers(val); }}
                style={{
                  width: 150, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
              {openSupplier && supplierList.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, minWidth: "100%",
                    background: "white", border: "1px solid #ccc", zIndex: 9999,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    maxHeight: 200, overflowY: "auto",
                  }}
                >
                  {supplierList.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setFilters({ ...filters, supplier_name: item.supplier_name.trim() }); setOpenSupplier(false); }}
                      style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                      onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                      onMouseOut={e => e.currentTarget.style.background = "white"}
                    >
                      {item.supplier_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right: action buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <button
              onClick={generateReport}
              style={{
                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#fff"}
              onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
            >
              GENERATE
            </button>
            <button
              onClick={handleExport}
              style={{
                background: "#28a745", color: "#fff", border: "1px solid #1e7e34",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#218838"}
              onMouseOut={e => e.currentTarget.style.background = "#28a745"}
            >
              EXPORT EXCEL
            </button>
            <button
              onClick={handleClose}
              style={{
                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#fff"}
              onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div
          className="custom-scrollbar"
          style={{ flex: 1, overflowY: "auto", background: "#f0f0f0", padding: "12px 14px" }}
        >
          {/* Main report area wrapper mimicking SalesWindowModal printable-area */}
          <div
            style={{
              background: "white",
              border: "1px solid #bbb",
              padding: "16px 18px 20px 18px",
              minHeight: "297mm",
              width: "100%",
            }}
          >
            <div className="mb-3 flex gap-6 text-sm font-semibold no-print">
              {filters.fromdate && <span>FROM: <span className="text-red-600">{filters.fromdate}</span></span>}
              {filters.todate && <span>TO: <span className="text-red-600">{filters.todate}</span></span>}
              {filters.supplier_name && <span>SUPPLIER: <span className="text-red-600">{filters.supplier_name}</span></span>}
            </div>

            <div className="overflow-x-auto">
              {reportMode === "billwise" ? (
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1300 }}>
                  <thead>
                    <tr className="bg-gray-200 border-b-2 border-gray-500 text-[11px] font-bold">
                      <th className="p-2 text-left w-8">SNO</th>
                      <th className="p-2 text-left">RECEIPT NO</th>
                      <th className="p-2 text-left">BILL NO</th>
                      <th className="p-2 text-left">BILL DATE</th>
                      <th className="p-2 text-left">ENTRY DATE</th>
                      <th className="p-2 text-left">SUPPLIER NAME</th>
                      <th className="p-2 text-left">PAYMENT MODE</th>
                      <th className="p-2 text-left">BANK NAME</th>
                      <th className="p-2 text-right">BILL AMOUNT</th>
                      <th className="p-2 text-right">PAID AMOUNT</th>
                      <th className="p-2 text-right">BALANCE</th>
                      <th className="p-2 text-right">GRAND TOTAL</th>
                      <th className="p-2 text-left">REFERENCE NO</th>
                      <th className="p-2 text-left">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.length > 0 ? groupedData.map((group) => (
                      <React.Fragment key={group.month}>
                        <tr className="bg-blue-700">
                          <td colSpan={14} className="p-1.5 text-white font-bold text-[12px] pl-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
                          </td>
                        </tr>
                        {group.transactions.map((row, i) => (
                          <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <td className="p-1.5 text-center text-gray-500">{i + 1}</td>
                            <td className="p-1.5 font-medium text-purple-800">{row.receipt_no || "—"}</td>
                            <td className="p-1.5 font-medium text-blue-800">{row.bill_no}</td>
                            <td className="p-1.5">{row.bill_date}</td>
                            <td className="p-1.5">{row.entry_date}</td>
                            <td className="p-1.5 truncate max-w-[160px]">{row.supplier_name}</td>
                            <td className="p-1.5">{row.payment_mode}</td>
                            <td className="p-1.5">{row.bank_name || "—"}</td>
                            <td className="p-1.5 text-right">{fmt(row.bill_amount)}</td>
                            <td className="p-1.5 text-right">{fmt(row.paid_amount)}</td>
                            <td className="p-1.5 text-right">{fmt(row.balance_amount)}</td>
                            <td className="p-1.5 text-right font-semibold text-blue-700">{fmt(row.grand_total)}</td>
                            <td className="p-1.5">{row.reference_no || row.reference_number || "—"}</td>
                            <td className="p-1.5">{row.remarks}</td>
                          </tr>
                        ))}
                        <tr className="bg-yellow-50 border-t-2 border-gray-400 font-bold text-[12px]">
                          <td colSpan={9} className="p-1.5 text-right text-red-700 pr-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long" })} Total :
                          </td>
                          <td className="p-1.5 text-right">{fmt(group.transactions.reduce((s, r) => s + Number(r.bill_amount || 0), 0))}</td>
                          <td className="p-1.5 text-right">{fmt(group.transactions.reduce((s, r) => s + Number(r.paid_amount || 0), 0))}</td>
                          <td className="p-1.5 text-right">{fmt(group.transactions.reduce((s, r) => s + Number(r.balance_amount || 0), 0))}</td>
                          <td className="p-1.5 text-right text-blue-800">{fmt(group.transactions.reduce((s, r) => s + Number(r.grand_total || 0), 0))}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </React.Fragment>
                    )) : (
                      <tr><td colSpan={14} className="text-center p-6 text-gray-400">No data found</td></tr>
                    )}

                    <tr className="bg-blue-50 border-t-2 border-blue-700 font-bold text-[13px]">
                      <td colSpan={9} className="p-2 text-right text-red-700 pr-3">GRAND TOTAL :</td>
                      <td className="p-2 text-right">{fmt(overall.bill_amount)}</td>
                      <td className="p-2 text-right">{fmt(overall.paid_amount)}</td>
                      <td className="p-2 text-right">{fmt(overall.balance_amount)}</td>
                      <td className="p-2 text-right text-blue-900">{fmt(overall.grand_total)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1300 }}>
                  <thead>
                    <tr className="bg-gray-200 border-b-2 border-gray-500 text-[11px] font-bold">
                      <th className="p-2 text-left w-8">SNO</th>
                      <th className="p-2 text-left">BILL NO</th>
                      <th className="p-2 text-left">BILL DATE</th>
                      <th className="p-2 text-left">ORDER NO</th>
                      <th className="p-2 text-left">SUPPLIER NAME</th>
                      <th className="p-2 text-left">ITEM NAME</th>
                      <th className="p-2 text-center">HSN</th>
                      <th className="p-2 text-center">UOM</th>
                      <th className="p-2 text-right">QTY</th>
                      <th className="p-2 text-right">PRICE</th>
                      <th className="p-2 text-right">AMOUNT</th>
                      <th className="p-2 text-right">SUBTOTAL</th>
                      <th className="p-2 text-right">CGST</th>
                      <th className="p-2 text-right">SGST</th>
                      <th className="p-2 text-right">IGST</th>
                      <th className="p-2 text-right">OTHER CHG</th>
                      <th className="p-2 text-right">DISCOUNT</th>
                      <th className="p-2 text-right">GRAND TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.length > 0 ? groupedData.map((group) => (
                      <React.Fragment key={group.month}>
                        <tr className="bg-blue-700">
                          <td colSpan={18} className="p-1.5 text-white font-bold text-[12px] pl-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
                          </td>
                        </tr>
                        {group.bills.map((bill, bi) => (
                          <React.Fragment key={bill.bill_no}>
                            {bill.items.length > 0 ? bill.items.map((item, ii) => (
                              <tr key={ii} className={`border-b border-gray-200 ${ii % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                                <td className="p-1.5 text-center text-gray-500">{ii === 0 ? bi + 1 : ""}</td>
                                <td className="p-1.5 font-medium text-blue-800">{ii === 0 ? bill.bill_no : ""}</td>
                                <td className="p-1.5">{ii === 0 ? bill.bill_date : ""}</td>
                                <td className="p-1.5">{ii === 0 ? bill.order_no : ""}</td>
                                <td className="p-1.5 truncate max-w-[160px]">{ii === 0 ? bill.supplier_name : ""}</td>
                                <td className="p-1.5">{item.item_name}</td>
                                <td className="p-1.5 text-center">{item.hsn}</td>
                                <td className="p-1.5 text-center">{item.uom}</td>
                                <td className="p-1.5 text-right">{item.quantity}</td>
                                <td className="p-1.5 text-right">{fmt(item.price)}</td>
                                <td className="p-1.5 text-right">{fmt(item.amount)}</td>
                                {ii === 0 ? (
                                  <>
                                    <td className="p-1.5 text-right" rowSpan={bill.items.length}>{fmt(bill.subtotal)}</td>
                                    <td className="p-1.5 text-right" rowSpan={bill.items.length}>{fmt(bill.cgst)}</td>
                                    <td className="p-1.5 text-right" rowSpan={bill.items.length}>{fmt(bill.sgst)}</td>
                                    <td className="p-1.5 text-right" rowSpan={bill.items.length}>{fmt(bill.igst)}</td>
                                    <td className="p-1.5 text-right" rowSpan={bill.items.length}>{fmt(bill.other_charges)}</td>
                                    <td className="p-1.5 text-right" rowSpan={bill.items.length}>{fmt(bill.discount)}</td>
                                    <td className="p-1.5 text-right font-semibold text-blue-700" rowSpan={bill.items.length}>{fmt(bill.grand_total)}</td>
                                  </>
                                ) : null}
                              </tr>
                            )) : (
                              <tr className="border-b border-gray-200 bg-white">
                                <td className="p-1.5 text-center text-gray-500">{bi + 1}</td>
                                <td className="p-1.5 font-medium text-blue-800">{bill.bill_no}</td>
                                <td className="p-1.5">{bill.bill_date}</td>
                                <td className="p-1.5">{bill.order_no}</td>
                                <td className="p-1.5 truncate max-w-[160px]">{bill.supplier_name}</td>
                                <td className="p-1.5" colSpan={6} />
                                <td className="p-1.5 text-right">{fmt(bill.subtotal)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.cgst)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.sgst)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.igst)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.other_charges)}</td>
                                <td className="p-1.5 text-right">{fmt(bill.discount)}</td>
                                <td className="p-1.5 text-right font-semibold text-blue-700">{fmt(bill.grand_total)}</td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        <tr className="bg-yellow-50 border-t-2 border-gray-400 font-bold text-[12px]">
                          <td colSpan={11} className="p-1.5 text-right text-red-700 pr-3">
                            {new Date(group.month + "-01").toLocaleString("default", { month: "long" })} Total :
                          </td>
                          <td className="p-1.5 text-right">{fmt(group.totals.subtotal)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.cgst)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.sgst)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.igst)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.other_charges)}</td>
                          <td className="p-1.5 text-right">{fmt(group.totals.discount)}</td>
                          <td className="p-1.5 text-right text-blue-800">{fmt(group.totals.grand_total)}</td>
                        </tr>
                      </React.Fragment>
                    )) : (
                      <tr><td colSpan={18} className="text-center p-6 text-gray-400">No data found</td></tr>
                    )}

                    <tr className="bg-blue-50 border-t-2 border-blue-700 font-bold text-[13px]">
                      <td colSpan={11} className="p-2 text-right text-red-700 pr-3">GRAND TOTAL :</td>
                      <td className="p-2 text-right">{fmt(overall.subtotal)}</td>
                      <td className="p-2 text-right">{fmt(overall.cgst)}</td>
                      <td className="p-2 text-right">{fmt(overall.sgst)}</td>
                      <td className="p-2 text-right">{fmt(overall.igst)}</td>
                      <td className="p-2 text-right">{fmt(overall.other_charges)}</td>
                      <td className="p-2 text-right">{fmt(overall.discount)}</td>
                      <td className="p-2 text-right text-blue-900">{fmt(overall.grand_total)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <div
          style={{
            background: "#f0f0f0",
            borderTop: "1px solid #aaa",
            padding: "2px 12px",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#555",
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ borderRight: "1px solid #aaa", paddingRight: "16px" }}>Total Page No: 1</span>
            <span>READY</span>
          </span>
          <span>ZOOM: 100%</span>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #d1d5db; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #9ca3af; }
        .printable-area { width: 100% !important; max-width: 100% !important; }
        @media print {
          body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .printable-area { width: 100% !important; overflow: visible !important; }
          tr { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};

export default PurchaseReport;
