import React, { useEffect, useState } from "react";
import { toWords } from "number-to-words";

const TaxPurchaseFormat = ({ billNo }) => {
  const [entry, setEntry] = useState({ items: [] });

  const amountInWords = (num) =>
    num > 0
      ? toWords(Math.round(num)).replace(/^\w/, (c) => c.toUpperCase()) + " Rupees Only"
      : "Zero Rupees Only";

  useEffect(() => {
    if (!billNo) return;
    const fetchData = async () => {
      try {
        const res  = await fetch(`http://localhost:3000/api/taxpurchases/${billNo}`);
        const data = await res.json();
        setEntry({ ...data, items: data.items || [] });
      } catch (err) {
        console.error("TaxPurchaseFormat fetch error:", err);
      }
    };
    fetchData();
  }, [billNo]);

  const fmt = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date) ? d : date.toLocaleDateString("en-IN");
  };

  const renderTaxPurchasePage = (copyLabel) => {
    return (
      <div className="print-copy-wrapper py-4 print:py-0 flex flex-col items-center animate-in fade-in duration-200">
        {/* TOP BAR / LABEL */}
        {copyLabel && copyLabel.trim() !== "" && (
          <div className="w-[190mm] text-right px-4 pt-1 flex-shrink-0">
            <span className="text-[13px] font-bold uppercase tracking-wider">
              {copyLabel}
            </span>
          </div>
        )}
        <div className="print-container w-[190mm] border-2 border-black bg-white relative shadow-lg overflow-hidden">

          {/* HEADER */}
          <div className="flex flex-col justify-center items-center text-center border-b-2 border-black p-2 h-[120px]">
            <h1 className="text-red-600 text-[26px] font-extrabold mb-0.5 leading-tight uppercase tracking-tight">
              ASWITHA TECH
            </h1>
            <div className="text-[11px] font-bold space-y-0.5">
              <p>17, Abirami Nagar, Avarampalayam Road,</p>
              <p>K.R. Puram, Ganapathi, Coimbatore - 641006</p>
              <p>Email : aswithatech2020@gmail.com</p>
              <div className="flex justify-center items-center gap-4 mt-0.5 text-[10px]">
                <span>GSTIN : 33GYLPS7134C1Z9</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">📞</span>
                  <span>80725 37036, 96551 48537</span>
                </div>
              </div>
            </div>
          </div>

          {/* SUPPLIER + BILL DETAILS */}
          <div className="flex border-b border-black">
            <div className="w-[60%] p-4 min-h-[120px] border-r-2 border-black">
              <h2 className="text-[15px] font-bold mb-1">From:</h2>
              <h2 className="text-[14px] font-bold uppercase mb-1">{entry.supplier_name || "—"}</h2>
              <div className="text-[12px] leading-5 font-medium max-w-[350px] mt-2 space-y-1">
                {entry.order_no  && <p>Order No : <strong>{entry.order_no}</strong></p>}
                {entry.order_date && <p>Order Date : <strong>{fmt(entry.order_date)}</strong></p>}
                {entry.despatch  && <p>Despatch : <strong>{entry.despatch}</strong></p>}
                {entry.due_date  && <p>Due Date : <strong>{fmt(entry.due_date)}</strong></p>}
              </div>
            </div>

            <div className="w-[40%] flex flex-col">
              <div className="border-b-2 border-black p-2 text-center">
                <h2 className="text-[16px] font-bold tracking-widest uppercase">Tax Purchase Entry</h2>
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px]">Bill No</div>
                  <div className="w-[16px] text-center">:</div>
                  <div className="flex-1">{entry.bill_no || "—"}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px]">Bill Date</div>
                  <div className="w-[16px] text-center">:</div>
                  <div className="flex-1">{fmt(entry.bill_date)}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px]">Order Type</div>
                  <div className="w-[16px] text-center">:</div>
                  <div className="flex-1 capitalize">{entry.order_type || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE SECTION — no flex/flex-col; fixed mm height for print stability */}
          <div style={{ height: "90mm", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr className="bg-gray-50 border-b border-black">
                  <th className="border-r-2 border-black p-2 w-[5%]  text-center text-[12px]">S.No</th>
                  <th className="border-r-2 border-black p-2 w-[40%] text-center text-[12px]">Description</th>
                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px]">HSN</th>
                  <th className="border-r-2 border-black p-2 w-[8%]  text-center text-[12px]">UOM</th>
                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px]">Qty</th>
                  <th className="border-r-2 border-black p-2 w-[12%] text-center text-[12px]">Rate</th>
                  <th className="p-2 w-[15%] text-center text-[12px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {entry.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{idx + 1}</td>
                    <td className="border-r-2 border-black px-3 py-2 text-[12px] font-medium">{item.item_name}{item.serial_no ? ` (${item.serial_no})` : ""}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.hsn || "—"}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.uom || "—"}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.quantity}</td>
                    <td className="border-r-2 border-black p-2 text-right text-[12px] pr-3">{Number(item.price).toFixed(2)}</td>
                    <td className="p-2 text-right text-[12px] font-bold pr-3">
                      {(Number(item.quantity) * Number(item.price)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Filler rows — &nbsp; prevents cell height collapse during print */}
                {Array.from({ length: Math.max(0, 8 - (entry.items?.length || 0)) }).map((_, i) => (
                  <tr key={`filler-${i}`} style={{ height: "28px" }}>
                    <td className="border-r-2 border-black" style={{ height: "28px" }}>&nbsp;</td>
                    <td className="border-r-2 border-black"></td>
                    <td className="border-r-2 border-black"></td>
                    <td className="border-r-2 border-black"></td>
                    <td className="border-r-2 border-black"></td>
                    <td className="border-r-2 border-black"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAL QTY */}
          <div className="border-t-2 border-black flex">
            <div className="w-[65%] border-r-2 border-black p-2">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold uppercase">TOTAL QTY</span>
                <span className="text-[12px] font-bold">:</span>
                <span className="text-[13px] font-extrabold">{entry.items.reduce((s, it) => s + Number(it.quantity || 0), 0)}</span>
              </div>
            </div>
            <div className="w-[35%]"></div>
          </div>

          {/* SUMMARY */}
          <div className="border-t-2 border-black flex">
            <div className="w-[65%] border-r-2 border-black p-4 space-y-1">
              {entry.other_name && (
                <p className="text-[12px] font-bold">{entry.other_name}: ₹{Number(entry.other_charges || 0).toFixed(2)}</p>
              )}
            </div>
            <div className="w-[35%]">
              {(() => {
                const sub = Number(entry.subtotal || 0);
                const disc = Number(entry.discount || 0);
                const other = Number(entry.other_charges || 0);
                const taxable = sub - disc + other;
                const cgstAmt = Number(entry.cgst || 0);
                const sgstAmt = Number(entry.sgst || 0);
                const igstAmt = Number(entry.igst || 0);
                const cgstPct = taxable > 0 ? Math.round((cgstAmt / taxable) * 100) : 0;
                const sgstPct = taxable > 0 ? Math.round((sgstAmt / taxable) * 100) : 0;
                const igstPct = taxable > 0 ? Math.round((igstAmt / taxable) * 100) : 0;
                const rows = [
                  { label: "Sub Total",              val: entry.subtotal },
                  { label: "Discount (−)",            val: entry.discount, minus: true },
                  { label: "Other Charges",           val: entry.other_charges },
                  { label: "TAXABLE",                 val: taxable },
                  { label: `CGST @${cgstPct}%`,       val: cgstAmt },
                  { label: `SGST @${sgstPct}%`,       val: sgstAmt },
                  { label: `IGST @${igstPct}%`,       val: igstAmt },
                  { label: "Round Off",               val: entry.round_off },
                ];
                return rows.map(({ label, val, minus }) =>
                  val != null && Number(val) !== 0 ? (
                    <div key={label} className="flex border-b border-black">
                      <div className="w-[55%] p-2 text-[12px] font-bold border-r border-black">{label}</div>
                      <div className="w-[45%] p-2 text-[12px] font-bold text-right pr-3">
                        {minus ? "-" : ""}₹{Number(val).toFixed(2)}
                      </div>
                    </div>
                  ) : null
                );
              })()}
              <div className="flex bg-gray-50">
                <div className="w-[55%] p-2 text-[13px] font-extrabold border-r border-black">NET TOTAL</div>
                <div className="w-[45%] p-2 text-[13px] font-extrabold text-right pr-3">
                  ₹{Number(entry.grand_total || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* RUPEES */}
          <div className="border-t-2 border-black p-2 bg-white">
            <p className="text-[12px] font-bold italic">
              Rupees : <span className="uppercase">{amountInWords(entry.grand_total || 0)}</span>
            </p>
          </div>

          {/* FOOTER */}
          <div className="border-t-2 border-black px-4 pt-2 pb-1">
            <div className="text-right">
              <h2 className="text-[14px] font-bold mb-4">For ASWITHA TECH</h2>
              <h3 className="text-[13px] font-bold border-t border-black pt-1 inline-block">Authorized Signatory</h3>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @page { size: A4; margin: 5mm; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          table { border-collapse: collapse !important; }
          tr, td, th { page-break-inside: avoid !important; }
          .print-wrapper { padding: 0 !important; display: block !important; overflow: visible !important; }
          .print-copy-wrapper {
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-copy-wrapper:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print-container { width: 190mm !important; min-height: 270mm !important; max-height: 270mm !important; overflow: hidden !important; box-shadow: none !important; }
        }
      `}</style>
      <div className="print-wrapper w-full flex flex-col items-center py-6 overflow-auto">
        {renderTaxPurchasePage("")}
        {renderTaxPurchasePage("")}
      </div>
    </>
  );
};

export default TaxPurchaseFormat;
