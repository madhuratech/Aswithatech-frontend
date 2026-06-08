import React, { useState, useRef, useEffect } from "react";
import { X, Square, Minus, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Logo from "../../asset/Logo.jpeg";

const API = "http://localhost:3000/api/receipts";

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
  const b100 = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
  const b1000 = (x) => x < 100 ? b100(x) : ones[Math.floor(x / 100)] + " HUNDRED" + (x % 100 ? " " + b100(x % 100) : "");
  const parts = [];
  if (n >= 10000000) { parts.push(b1000(Math.floor(n / 10000000)) + " CRORE"); n %= 10000000; }
  if (n >= 100000) { parts.push(b100(Math.floor(n / 100000)) + " LAKH"); n %= 100000; }
  if (n >= 1000) { parts.push(b1000(Math.floor(n / 1000)) + " THOUSAND"); n %= 1000; }
  if (n > 0) { parts.push(b1000(n)); }
  return parts.join(" ") + " ONLY";
}

const fmt = (val) => Number(val || 0).toFixed(2);

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(dt.getDate()).padStart(2, "0")}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
};

/* ─── Single Receipt Voucher ─────────────────────────────────────────────── */
const ReceiptVoucher = ({ receipt }) => {
  const items = receipt.items || [];
  const netTotal = Number(receipt.grand_total || 0);
  const otherDed = Number(receipt.other_deductions || 0);
  const emptyRows = Math.max(0, 7 - items.length);

  const paymentType = [receipt.payment_mode, receipt.bank_name, receipt.remarks]
    .filter(Boolean).join(" ");

  return (
    <div
      className="voucher-page w-[190mm] border-2 border-black bg-white relative shadow-lg overflow-hidden mb-6"
      style={{
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <div className="flex flex-col justify-center items-center text-center border-b-2 border-black p-2 h-[120px]">
        <h1 className="text-red-600 text-[26px] font-extrabold mb-0.5 leading-tight uppercase tracking-tight">
          {COMPANY.name}
        </h1>
        <div className="text-[11px] font-bold space-y-0.5">
          <p>{COMPANY.addr1}</p>
          <p>{COMPANY.addr2} {COMPANY.addr3}</p>
          <p>{COMPANY.email}</p>
          <div className="flex justify-center items-center gap-4 mt-0.5 text-[10px]">
            <span>GSTIN : {COMPANY.gstin}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>PH : {COMPANY.ph1}, {COMPANY.ph2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS SECTION */}
      <div className="flex border-b border-black">
        {/* Left - To Section */}
        <div className="w-[60%] p-4 min-h-[140px] border-r-2 border-black">
          <h2 className="text-[15px] font-bold mb-1">To:</h2>
          <h2 className="text-[14px] font-bold uppercase mb-1">
            {receipt?.customer_name}
          </h2>
          <div className="text-[12px] leading-5 font-medium max-w-[350px]">
            {receipt?.address && <p>{receipt?.address}</p>}
            {receipt?.phone && <p className="mt-2 font-bold">Ph: {receipt?.phone}</p>}
            {receipt?.gst_number && <p className="font-bold">GSTIN : {receipt?.gst_number}</p>}
          </div>
        </div>

        {/* Right - Receipt Details */}
        <div className="w-[40%] flex flex-col">
          <div className="border-b-2 border-black p-2 text-center">
            <h2 className="text-[16px] font-bold tracking-widest uppercase">Receipt</h2>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex text-[13px] font-bold">
              <div className="w-[80px]">Receipt No</div>
              <div className="w-[20px] text-center">:</div>
              <div className="flex-1">{receipt?.receipt_no}</div>
            </div>
            <div className="flex text-[13px] font-bold">
              <div className="w-[80px]">Date</div>
              <div className="w-[20px] text-center">:</div>
              <div className="flex-1">{fmtDate(receipt?.receipt_date)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex flex-col overflow-hidden min-h-[245px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-black">
              <th className="border-r border-black p-2 w-[5%] text-center text-[12px] font-bold">S.No</th>
              <th className="border-r border-black p-2 w-[15%] text-center text-[12px] font-bold">Bill No</th>
              <th className="border-r border-black p-2 w-[15%] text-center text-[12px] font-bold">Date</th>
              <th className="border-r border-black p-2 w-[15%] text-center text-[12px] font-bold">Bill Amount</th>
              <th className="border-r border-black p-2 w-[10%] text-center text-[12px] font-bold">Advans</th>
              <th className="border-r border-black p-2 w-[10%] text-center text-[12px] font-bold">Tds Amt</th>
              <th className="border-r border-black p-2 w-[15%] text-center text-[12px] font-bold">Paid Amt</th>
              <th className="p-2 w-[15%] border-black text-center text-[12px] font-bold">Net Paid</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const tdsAmt = Math.max(0, Number(item.bill_amount || 0) - Number(item.paid_amount || 0));
              const netPaid = Number(item.bill_amount || 0);
              return (
                <tr key={index} className="border-b border-black min-h-[35px]">
                  <td className="border-r border-black p-2 text-center text-[12px]">{index + 1}</td>
                  <td className="border-r border-black px-3 py-2 text-[12px] font-medium">{item.bill_no}</td>
                  <td className="border-r border-black p-2 text-center text-[12px]">{fmtDate(item.bill_date)}</td>
                  <td className="border-r border-black p-2 text-right text-[12px] pr-4">{fmt(item.bill_amount)}</td>
                  <td className="border-r border-black p-2 text-right text-[12px] pr-4">0.00</td>
                  <td className="border-r border-black p-2 text-right text-[12px] pr-4">{fmt(tdsAmt)}</td>
                  <td className="border-r border-black p-2 text-right text-[12px] pr-4">{fmt(item.paid_amount)}</td>
                  <td className="p-2 text-right text-[12px] border-black font-bold pr-4">{fmt(netPaid)}</td>
                </tr>
              );
            })}
            {/* Filler rows */}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`filler-${i}`} className=" border-black h-[35px]">
                <td className="border-r border-black">&nbsp;</td>
                <td className="border-r border-black">&nbsp;</td>
                <td className="border-r  border-black">&nbsp;</td>
                <td className="border-r border-black">&nbsp;</td>
                <td className="border-r border-black">&nbsp;</td>
                <td className="border-r border-black">&nbsp;</td>
                <td className="border-r border-black">&nbsp;</td>
                <td className="border-black">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUMMARY SECTION - Fixed alignment with columns */}
      <div className="border-t border-black flex">
        <div className="w-[70%] border-r-2 border-black flex items-center px-4 py-2">
          <span className="text-[12px] font-bold mr-2">PAYMENT TYPE :</span>
          <span className="text-[12px] font-medium">{paymentType}</span>
        </div>
        <div className="w-[30%] border-black">
          <div className="flex border-b border-black">
            <div className="w-[50%] p-2 text-[12px] font-bold border-r border-black">Other Ded </div>
            <div className="w-[50%] p-2 text-[12px] font-bold text-right pr-4">{fmt(otherDed)}</div>
          </div>
          <div className="flex bg-gray-50">
            <div className="w-[50%] p-2 text-[13px] font-extrabold border-r border-black">NET TOTAL </div>
            <div className="w-[50%] p-2 text-[13px] font-extrabold text-right pr-4">{fmt(netTotal)}</div>
          </div>
        </div>
      </div>

      {/* RUPEES SECTION */}
      <div className="border-t-2 border-black p-2 bg-white">
        <p className="text-[12px] font-bold italic">
          Rupees : <span className="uppercase">{numberToWords(netTotal)}</span>
        </p>
      </div>

      {/* FOOTER SECTION */}
      <div className="border-t-2 border-black p-4 flex justify-between items-end min-h-[100px]">
        <div className="text-left">
          <span className="text-[12px] font-bold border-t border-black pt-1">Receiver's Signature</span>
        </div>
        <div className="text-right">
          <h2 className="text-[13px] font-bold mb-8">For {COMPANY.name}</h2>
          <span className="text-[12px] font-bold border-t border-black pt-1 inline-block">Authorised Signatory</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Report Window ─────────────────────────────────────────────────── */
const ReceiptReport = ({ onClose, onMinimize, title = "Receipt Voucher" }) => {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ fromDate: "", toDate: "", customerName: "" });
  const [clientList, setClientList] = useState([]);
  const [data, setData] = useState([]);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API}/report/customers`);
      const json = await res.json();
      setClientList(Array.isArray(json) ? json : []);
    } catch { setClientList([]); }
  };

  const loadReport = async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.fromDate) params.set("fromDate", f.fromDate);
      if (f.toDate) params.set("toDate", f.toDate);
      if (f.customerName) params.set("customerName", f.customerName);
      const res = await fetch(`${API}/report/vouchers?${params}`);
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
    loadReport({ fromDate: "", toDate: "", customerName: "" });
  }, []);

  const handleClose = () => { if (onClose) onClose(); else navigate(-1); };
  const handleMinimize = () => { setIsMinimized(true); if (onMinimize) onMinimize(); };

  const handlePrint = () => {
    const win = window.open("", "", "width=900,height=700");
    win.document.write(`
      <html><head><title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 16px; font-family: Arial, sans-serif; font-size: 11px; background: #fff; }
        @page { size: A4 portrait; margin: 8mm; }
        .voucher-page { width: 190mm; margin: 0 auto 20px; page-break-after: always; }
        @media print { body { padding: 0; } .voucher-page { margin-bottom: 0; } }
      </style>
      </head><body>
        <div class="flex flex-col items-center">
          ${contentRef.current.innerHTML}
        </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 1000);
  };

  const exportPDF = () => {
    if (!contentRef.current) return;
    html2pdf().set({
      margin: [5, 10, 5, 10],
      filename: `ReceiptVoucher_${filters.customerName || "All"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(contentRef.current).save();
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

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-4 bg-black/30"}`}>
      <div className={`bg-[#f0f0f0] border-2 border-white flex flex-col transition-all duration-200 ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* ── Title Bar ── */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold tracking-wide">{title}</span>
          <div className="flex shrink-0">
            <button onClick={handleMinimize} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center"><Minus size={12} strokeWidth={3} /></button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center"><Square size={10} strokeWidth={3} /></button>
            <button onClick={handleClose} className="w-8 h-5 hover:bg-red-500  flex justify-center items-center ml-0.5"><X size={14} strokeWidth={3} /></button>
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-black px-4 py-2 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">FROM DATE</label>
            <input
              type="date" value={filters.fromDate}
              onChange={(e) => setFilters(p => ({ ...p, fromDate: e.target.value }))}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">TO DATE</label>
            <input
              type="date" value={filters.toDate}
              onChange={(e) => setFilters(p => ({ ...p, toDate: e.target.value }))}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">CUSTOMER NAME</label>
            <select
              value={filters.customerName}
              onChange={(e) => {
                const updated = { ...filters, customerName: e.target.value };
                setFilters(updated);
                loadReport(updated);
              }}
              className="w-[210px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-semibold"
              style={{ height: "26px" }}
            >
              <option value="">-- ALL CUSTOMERS --</option>
              {clientList.map((c, i) => (
                <option key={i} value={c.customer_name}>{c.customer_name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 ml-auto items-end">
            <button
              onClick={() => loadReport(filters)}
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

        {/* ── Action Strip ── */}
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

        {/* ── Voucher Display Area ── */}
        <div className="flex-1 overflow-auto bg-white py-6 custom-scrollbar">
          <div ref={contentRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {loading ? (
              <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "12px", color: "#555", fontStyle: "italic" }}>
                Loading vouchers...
              </div>
            ) : data.length === 0 ? (
              <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "12px", color: "#888", fontStyle: "italic" }}>
                No receipt records found. Use filters above and click GENERATE REPORT.
              </div>
            ) : (
              data.map((receipt, i) => (
                <ReceiptVoucher key={receipt.id ?? i} receipt={receipt} />
              ))
            )}
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

export default ReceiptReport;
