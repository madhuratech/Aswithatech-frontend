import React, { useCallback, useEffect, useState, useRef } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Logo from "../../asset/Logo.jpeg";

const API = "http://localhost:3000/api/taxpurchases";

const COMPANY = {
  name: "ASWITHA TECH",
  addr1: "17, Abirami Nagar, Avarampalayam Road,",
  addr2: "K.R. Puram, Ganapathi,",
  addr3: "Coimbatore - 641006",
  email: "Email: aswithatech2020@gmail.com",
  ph1: "80725  37036",
  ph2: "96551  48537",
  gstin: "33GYLPS7134C1Z9",
};

function numberToWords(amount) {
  let n = Math.round(Number(amount) || 0);
  if (n === 0) return "ZERO ONLY";
  const ones = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN", "NINETEEN",
  ];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const b100  = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
  const b1000 = (x) => x < 100 ? b100(x) : ones[Math.floor(x / 100)] + " HUNDRED" + (x % 100 ? " " + b100(x % 100) : "");
  const parts = [];
  if (n >= 10000000) { parts.push(b1000(Math.floor(n / 10000000)) + " CRORE"); n %= 10000000; }
  if (n >= 100000)   { parts.push(b100(Math.floor(n / 100000))    + " LAKH");  n %= 100000;  }
  if (n >= 1000)     { parts.push(b1000(Math.floor(n / 1000))     + " THOUSAND"); n %= 1000; }
  if (n > 0)         { parts.push(b1000(n)); }
  return parts.join(" ") + " ONLY";
}

const fmt = (val) => Number(val || 0).toFixed(2);

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(dt.getDate()).padStart(2, "0")}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
};

function groupByBill(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.bill_no)) {
      map.set(row.bill_no, {
        bill_no:       row.bill_no,
        supplier_name: row.supplier_name,
        bill_date:     row.bill_date,
        other_charges: row.other_charges,
        discount:      row.discount,
        grand_total:   row.grand_total,
        items: [],
      });
    }
    map.get(row.bill_no).items.push({
      item_name: row.item_name,
      hsn:       row.hsn,
      uom:       row.uom,
      quantity:  row.quantity,
      price:     row.price,
      subtotal:  row.subtotal,
      cgst:      row.cgst,
      sgst:      row.sgst,
    });
  });
  return Array.from(map.values());
}

/* ─── Single Purchase Order Voucher ─────────────────────────────────────── */
const PurchaseVoucher = ({ voucher }) => {
  const items      = voucher.items || [];
  const emptyRows  = Math.max(0, 7 - items.length);
  const grandTotal = Number(voucher.grand_total  || 0);
  const discount   = Number(voucher.discount     || 0);
  const otherChg   = Number(voucher.other_charges || 0);

  const totalCgst     = items.reduce((s, i) => s + Number(i.cgst     || 0), 0);
  const totalSgst     = items.reduce((s, i) => s + Number(i.sgst     || 0), 0);
  const totalSubtotal = items.reduce((s, i) => s + Number(i.subtotal || 0), 0);

  const cellStyle = (align = "left", extra = {}) => ({
    border: "1px solid #000",
    padding: "3px 5px",
    textAlign: align,
    fontSize: "11px",
    ...extra,
  });

  const thStyle = (align = "left", width) => ({
    border: "1px solid #000",
    padding: "4px 5px",
    textAlign: align,
    fontWeight: "bold",
    fontSize: "10px",
    background: "#fff",
    whiteSpace: "nowrap",
    ...(width ? { width, minWidth: width } : {}),
  });

  return (
    <div
      className="voucher-page"
      style={{
        width: "740px",
        background: "#fff",
        border: "1px solid #000",
        fontFamily: "Arial, sans-serif",
        marginBottom: "24px",
        pageBreakAfter: "always",
      }}
    >
      {/* ── TOP HEADER ─────────────────────────────────────────── */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000" }}>
        <tbody>
          {/* Row 1 — Company Name & Info centered */}
          <tr>
            <td style={{ width: "100%", padding: "12px 10px", verticalAlign: "middle", borderBottom: "1px solid #000", textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: "#cc0000", letterSpacing: "1px" }}>
                {COMPANY.name}
              </div>
              <div style={{ fontSize: "13px", lineHeight: "1.55", color: "#222", marginTop: "2px" }}>
                <div>{COMPANY.addr1} {COMPANY.addr2} {COMPANY.addr3}</div>
                <div>{COMPANY.email}</div>
              </div>
              <div style={{ fontSize: "10px", marginTop: "4px", display: "flex", gap: "14px", justifyContent: "center", alignItems: "center" }}>
                <span>
                  <span style={{ color: "#1a5ea8", fontWeight: "bold", marginRight: "3px" }}>&#9990;</span>
                  {COMPANY.ph1}
                </span>
                <span>
                  <span style={{ color: "#cc0000", fontWeight: "bold", marginRight: "3px" }}>&#9990;</span>
                  {COMPANY.ph2}
                </span>
                <span style={{ fontWeight: "bold", marginLeft: "14px" }}>
                  GSTIN : {COMPANY.gstin}
                </span>
              </div>
            </td>
          </tr>

          {/* Row 2 — Supplier Info (left) + PO title & NO & DATE (right) — same row */}
          <tr>
            <td style={{ padding: "6px 10px", verticalAlign: "top", minHeight: "68px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#008080" }}>FROM :</div>
              <div style={{ fontSize: "15px", fontWeight: "bold", color: "#00008b", marginTop: "1px" }}>
                {(voucher.supplier_name || "").toUpperCase()}
              </div>
            </td>
            <td style={{
              padding: "10px 14px",
              verticalAlign: "top",
              borderLeft: "1px solid #000",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: "#cc0000",
                textDecoration: "underline",
                letterSpacing: "3px",
                marginBottom: "10px",
              }}>
                PURCHASE ORDER
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "bold", padding: "2px 6px 2px 0", textAlign: "right", width: "40%" }}>NO</td>
                    <td style={{ padding: "2px 4px", textAlign: "left", width: "5%" }}>:</td>
                    <td style={{ padding: "2px 0", textAlign: "left", fontWeight: "bold" }}>{voucher.bill_no}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", padding: "2px 6px 2px 0", textAlign: "right" }}>DATE</td>
                    <td style={{ padding: "2px 4px", textAlign: "left" }}>:</td>
                    <td style={{ padding: "2px 0", textAlign: "left" }}>{fmtDate(voucher.bill_date)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── ITEMS TABLE ────────────────────────────────────────── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle("center", "36px")}>SNO</th>
            <th style={thStyle("left")}>ITEM NAME</th>
            <th style={thStyle("center", "60px")}>HSN</th>
            <th style={thStyle("center", "50px")}>UOM</th>
            <th style={thStyle("right",  "55px")}>QTY</th>
            <th style={thStyle("right",  "70px")}>PRICE</th>
            <th style={thStyle("right",  "75px")}>SUBTOTAL</th>
            <th style={thStyle("right",  "62px")}>CGST</th>
            <th style={thStyle("right",  "62px")}>SGST</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={cellStyle("center")}>{i + 1}</td>
              <td style={cellStyle("left")}>{item.item_name}</td>
              <td style={cellStyle("center")}>{item.hsn}</td>
              <td style={cellStyle("center")}>{item.uom}</td>
              <td style={cellStyle("right")}>{fmt(item.quantity)}</td>
              <td style={cellStyle("right")}>{fmt(item.price)}</td>
              <td style={cellStyle("right")}>{fmt(item.subtotal)}</td>
              <td style={cellStyle("right")}>{fmt(item.cgst)}</td>
              <td style={cellStyle("right")}>{fmt(item.sgst)}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`e${i}`} style={{ height: "22px" }}>
              {[...Array(9)].map((_, j) => (
                <td key={j} style={{ border: "1px solid #000", padding: "3px 5px" }}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── SUMMARY BAR ────────────────────────────────────────── */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #000", fontSize: "11px" }}>
        <tbody>
          <tr>
            <td style={{ padding: "4px 10px", width: "25%", borderRight: "1px solid #ddd" }}>
              <span style={{ fontWeight: "bold" }}>Subtotal:</span>
              <span style={{ marginLeft: "6px" }}>{fmt(totalSubtotal)}</span>
            </td>
            <td style={{ padding: "4px 10px", width: "20%", borderRight: "1px solid #ddd" }}>
              <span style={{ fontWeight: "bold" }}>CGST:</span>
              <span style={{ marginLeft: "6px" }}>{fmt(totalCgst)}</span>
            </td>
            <td style={{ padding: "4px 10px", width: "20%", borderRight: "1px solid #ddd" }}>
              <span style={{ fontWeight: "bold" }}>SGST:</span>
              <span style={{ marginLeft: "6px" }}>{fmt(totalSgst)}</span>
            </td>
            <td style={{ padding: "4px 10px", textAlign: "right" }}>
              <span style={{ fontWeight: "bold" }}>Grand Total:</span>
              <span style={{ marginLeft: "8px", fontWeight: "bold" }}>{fmt(grandTotal)}</span>
            </td>
          </tr>
          {(discount > 0 || otherChg > 0) && (
            <tr>
              <td colSpan={2} style={{ padding: "4px 10px", borderTop: "1px solid #ddd" }}>
                <span style={{ fontWeight: "bold" }}>Other Charges:</span>
                <span style={{ marginLeft: "6px" }}>{fmt(otherChg)}</span>
              </td>
              <td colSpan={2} style={{ padding: "4px 10px", textAlign: "right", borderTop: "1px solid #ddd" }}>
                <span style={{ fontWeight: "bold" }}>Discount:</span>
                <span style={{ marginLeft: "6px" }}>{fmt(discount)}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── AMOUNT IN WORDS ─────────────────────────────────────── */}
      <div style={{ padding: "5px 12px", borderTop: "1px solid #000", fontSize: "11px", display: "flex", gap: "16px", alignItems: "baseline" }}>
        <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>Rupees :</span>
        <span style={{ fontWeight: "bold", color: "#cc0000", letterSpacing: "0.3px" }}>
          {numberToWords(grandTotal)}
        </span>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #000" }}>
        <tbody>
          <tr>
            <td style={{ padding: "6px 12px", width: "50%", fontSize: "10px", verticalAlign: "top" }}>
              &nbsp;
            </td>
            <td style={{ padding: "6px 12px", textAlign: "right", fontSize: "11px", verticalAlign: "top" }}>
              <span style={{ fontWeight: "bold", color: "#008080" }}>For &nbsp; {COMPANY.name}</span>
            </td>
          </tr>
          <tr>
            <td style={{ height: "38px" }}></td>
            <td></td>
          </tr>
          <tr>
            <td style={{ padding: "4px 12px", fontSize: "10px", borderTop: "1px solid #ddd" }}>
              Receiver's Signature
            </td>
            <td style={{ padding: "4px 12px", textAlign: "right", fontSize: "10px", borderTop: "1px solid #ddd" }}>
              Authorised Signatory
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ─── Main Report Window ─────────────────────────────────────────────────── */
const PurchaseReport = ({ onMinimize, onClose, setIsMinimizedInternal, title = "Purchase Order" }) => {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const [rawData,      setRawData]      = useState([]);
  const [receiptlist,  setReceiptlist]  = useState([]);
  const [supplierlist, setsupplierlist] = useState([]);
  const [openbillno,   setopenbillno]   = useState(false);
  const [supplieropen, setsupplieropen] = useState(false);

  const TODAY = new Date().toISOString().split("T")[0];
  const [filters, setfilters] = useState({
    fromdate:      "",
    todate:        TODAY,
    bill_no:       "",
    supplier_name: "",
  });

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.fromdate && filters.todate) {
        params.append("fromdate", filters.fromdate);
        params.append("todate",   filters.todate);
      }
      if (filters.bill_no)       params.append("billno",       filters.bill_no);
      if (filters.supplier_name) params.append("suppliername", filters.supplier_name);
      const res  = await fetch(`${API}/report?${params.toString()}`);
      const json = await res.json();
      setRawData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSuppliers = async (value) => {
    try {
      const res  = await fetch(`${API}/supplier/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      const unique = [...new Set(data.map((i) => i.supplier_name))].map((name) => ({ supplier_name: name }));
      setsupplierlist(unique);
    } catch { setsupplierlist([]); }
  };

  const fetchBillNos = async (value) => {
    try {
      const res  = await fetch(`${API}/billno/search?q=${value}`);
      const data = await res.json();
      setReceiptlist(Array.isArray(data) ? data : []);
    } catch { setReceiptlist([]); }
  };

  useEffect(() => { generateReport(); }, []);

  const handleMinimize = () => {
    setIsMinimized(true);
    if (setIsMinimizedInternal) setIsMinimizedInternal(true);
    if (onMinimize) onMinimize();
  };

  const handleClose = () => { if (onClose) onClose(); else navigate(-1); };

  const handlePrint = () => {
    const win = window.open("", "", "width=900,height=700");
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 16px; font-family: Arial, sans-serif; font-size: 11px; background: #fff; }
        @page { size: A4 portrait; margin: 8mm; }
        .voucher-page { width: 720px; border: 1px solid #000; margin: 0 auto 20px; page-break-after: always; }
        table { width: 100%; border-collapse: collapse; }
        @media print { body { padding: 0; } .voucher-page { margin-bottom: 0; } }
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
      margin: [5, 10, 5, 10],
      filename: `PurchaseOrder_${filters.supplier_name || "All"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(contentRef.current).save();
  };

  const vouchers = groupByBill(rawData);

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999]">
        <button
          onClick={() => { setIsMinimized(false); if (setIsMinimizedInternal) setIsMinimizedInternal(false); }}
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

        {/* ── Filter Toolbar ── */}
        <div className="bg-black px-4 py-2 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">FROM DATE</label>
            <input
              type="date" value={filters.fromdate}
              onChange={(e) => setfilters((p) => ({ ...p, fromdate: e.target.value }))}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">TO DATE</label>
            <input
              type="date" value={filters.todate}
              onChange={(e) => setfilters((p) => ({ ...p, todate: e.target.value }))}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-0.5 relative">
            <label className="text-[10px] font-bold text-white tracking-widest">BILL NUMBER</label>
            <input
              type="text" placeholder="Bill Number" value={filters.bill_no}
              onFocus={() => { setopenbillno(true); fetchBillNos(""); }}
              onChange={(e) => { const v = e.target.value; setfilters((p) => ({ ...p, bill_no: v })); fetchBillNos(v); }}
              className="w-[150px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
            {openbillno && receiptlist.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                {receiptlist.map((item, i) => (
                  <div key={i}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                    onClick={() => { setfilters((p) => ({ ...p, bill_no: item.bill_no })); setopenbillno(false); }}
                  >
                    {item.bill_no}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5 relative">
            <label className="text-[10px] font-bold text-white tracking-widest">SUPPLIER NAME</label>
            <input
              type="text" placeholder="Supplier Name" value={filters.supplier_name}
              onFocus={() => { setsupplieropen(true); fetchSuppliers(""); }}
              onChange={(e) => { const v = e.target.value; setfilters((p) => ({ ...p, supplier_name: v })); fetchSuppliers(v); }}
              className="w-[180px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
            {supplieropen && supplierlist.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                {supplierlist.map((item, i) => (
                  <div key={i}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px] truncate"
                    onClick={() => { setfilters((p) => ({ ...p, supplier_name: item.supplier_name })); setsupplieropen(false); }}
                  >
                    {item.supplier_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-auto items-end">
            <button
              onClick={generateReport}
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
              onClick={exportPDF}
              className="bg-[#b22222] text-white text-[10px] px-3 py-1 font-bold border border-[#8b1a1a] hover:bg-[#8b1a1a]"
            >
              EXPORT PDF
            </button>
          </div>

          {/* Voucher Display Area */}
          <div className="bg-white mx-2 my-2 border border-gray-300 py-4">
            <div ref={contentRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {loading ? (
                <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "12px", color: "#555", fontStyle: "italic" }}>
                  Loading vouchers...
                </div>
              ) : vouchers.length === 0 ? (
                <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "12px", color: "#888", fontStyle: "italic" }}>
                  No purchase records found. Use filters above and click GENERATE REPORT.
                </div>
              ) : (
                vouchers.map((voucher, i) => (
                  <PurchaseVoucher key={voucher.bill_no ?? i} voucher={voucher} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e0e0; border: 2px solid #808080; box-shadow: inset 1px 1px 0 white; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
};

export default PurchaseReport;
