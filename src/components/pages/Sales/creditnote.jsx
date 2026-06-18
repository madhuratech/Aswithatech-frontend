import React, { useEffect, useState } from "react";
import { toWords } from "number-to-words";

const Creditnoteview = ({ cnNumber }) => {
  const [creditnote, setCreditnote] = useState({
    items: [],
    client: {},
  });

  useEffect(() => {
    if (!cnNumber || cnNumber === "") return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/creditnotes/full/${encodeURIComponent(cnNumber)}`
        );
        const data = await res.json();
        setCreditnote({
          ...data,
          items: data.items || [],
          client: data.client || {},
        });
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [cnNumber]);

  // Format amount to words in uppercase
  const amountInWords = (num) => {
    if (!num) return "";
    try {
      const words = toWords(num);
      return (words.replace(/-/g, " ") + " only").toUpperCase();
    } catch (e) {
      return "";
    }
  };

  // Helper to format dates
  const formatDate = (dateStr, formatStyle = "dd-mmm-yy") => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (formatStyle === "dd.mm.yyyy") {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } else {
      const day = String(date.getDate()).padStart(2, "0");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    }
  };

  // Calculate table empty rows
  const items = creditnote.items || [];
  const targetTotalRows = 5;
  const emptyRowsCount = Math.max(0, targetTotalRows - items.length);

  const renderCreditNotePage = (copyLabel) => {
    return (
      <div className="print-copy-wrapper py-4 print:py-0 flex flex-col items-center animate-in fade-in duration-200">
        {/* TOP BAR / LABEL */}
        <div className="w-[190mm] text-right px-4 pt-1 flex-shrink-0">
          <span className="text-[13px] font-bold uppercase tracking-wider">
            {copyLabel}
          </span>
        </div>
        <div className="w-[190mm] border-2 border-black bg-white text-black font-sans shadow-lg print:shadow-none relative select-none flex flex-col credit-note-print" style={{ minHeight: "260mm", boxSizing: "border-box" }}>
          {/* HEADER */}
          <div className="flex flex-col justify-center items-center text-center border-b-2 border-black p-2 h-[120px]" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h1 className="text-[#ea232a] text-[26px] font-extrabold mb-0.5 leading-tight uppercase tracking-tight">
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

          {/* DETAILS SECTION */}
          <div className="flex border-b border-black" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            {/* Left - To Section */}
            <div className="w-[60%] p-4 min-h-[140px] border-r-2 border-black">
              <h2 className="text-[15px] font-bold mb-1">To:</h2>
              <h2 className="text-[14px] font-bold uppercase mb-1">
                {creditnote.client?.customer_name || creditnote.client_name}
              </h2>
              <div className="text-[12px] leading-5 font-medium max-w-[350px]">
                <p>{creditnote.client?.address}</p>
                <p>{creditnote.client?.state} - {creditnote.client?.pincode}</p>
                <p className="mt-2 font-bold">Ph: {creditnote.client?.phone || "N/A"}</p>
                <p className="font-bold">GSTIN : {creditnote.client?.gst_number || "N/A"}</p>
              </div>
            </div>

            {/* Right - Document Details */}
            <div className="w-[40%] flex flex-col">
              <div className="border-b-2 border-black p-2 text-center bg-gray-50">
                <h2 className="text-[16px] font-bold tracking-widest uppercase">Credit Note</h2>
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-center">
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px] uppercase">CN No</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1 font-extrabold">{creditnote.cn_number || "N/A"}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px] uppercase">CN Date</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">{formatDate(creditnote.cn_date)}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px] uppercase">Bill No</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">{creditnote.bill_no || "N/A"}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[90px] uppercase">Bill Date</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">{formatDate(creditnote.bill_date, "dd.mm.yyyy")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="flex flex-col overflow-hidden" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <table className="w-full border-collapse border-b-2 border-black table-fixed" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
              <thead>
                <tr className="bg-gray-50 border-t-2 border-b-2 border-black">
                  <th className="border-r-2 border-black p-2 w-[8%] text-center text-[12px] font-bold uppercase">S.No</th>
                  <th className="border-r-2 border-black p-2 w-[50%] text-center text-[12px] font-bold uppercase">Description</th>
                  <th className="border-r-2 border-black p-2 w-[12%] text-center text-[12px] font-bold uppercase">HSN</th>
                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px] font-bold uppercase">Qty</th>
                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px] font-bold uppercase">Rate</th>
                  <th className="p-2 w-[10%] border-black text-center text-[12px] font-bold uppercase">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className=" border-black min-h-[35px]" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{index + 1}</td>
                    <td className="border-r-2 border-black px-3 py-2 text-[12px] font-semibold uppercase">{item.item_name}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.hsn_code || "-"}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.quantity} {item.unit || "Nos"}</td>
                    <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{(Number(item.price) || 0).toFixed(2)}</td>
                    <td className="p-2 text-right text-[12px] pr-4 font-bold">{(Number(item.amount) || 0).toFixed(2)}</td>
                  </tr>
                ))}
                
                {/* Filler rows to maintain height */}
                {emptyRowsCount > 0 &&
                  Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr key={`filler-${idx}`} className="h-[42px]" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
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

          {/* SUMMARY SECTION */}
          <div className="border-t-2 border-black flex" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div className="w-[60%] p-4">
              {/* Left side empty space to match UI */}
            </div>
            <div className="w-[40%] border-black">
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">Sub Total</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.subtotal) || 0).toFixed(2)}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">Transport Charges</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.delivery_charge) || 0).toFixed(2)}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">TAXABLE</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.subtotal) || 0).toFixed(2)}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">CGST @ {creditnote.igst > 0 ? "0.00" : "9.00"} %</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.cgst) || 0).toFixed(2)}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">SGST @ {creditnote.igst > 0 ? "0.00" : "9.00"} %</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.sgst) || 0).toFixed(2)}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">IGST @ {creditnote.igst > 0 ? "18.00" : "0.00"} %</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.igst) || 0).toFixed(2)}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[60%] p-2 text-[12px] font-bold border-r border-black">Round Off</div>
                <div className="w-[40%] p-2 text-[12px] font-bold text-right pr-4">{(Number(creditnote.roundOff) || 0).toFixed(2)}</div>
              </div>
              <div className="flex bg-gray-50">
                <div className="w-[60%] p-2 text-[13px] font-extrabold border-r border-black">NET TOTAL</div>
                <div className="w-[40%] p-2 text-[13px] font-extrabold text-right pr-4 text-[#ea232a]">{(Number(creditnote.grandTotal) || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* RUPEES SECTION */}
          <div className="border-t-2 border-black p-2 bg-white" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <p className="text-[12px] font-bold italic">
              Rupees : <span className="uppercase">{amountInWords(creditnote.grandTotal)}</span>
            </p>
          </div>

          {/* FOOTER SECTION */}
          <div className="border-t-2 border-black px-4 pt-2 pb-1 relative" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div className="right-8 text-right">
              <h2 className="text-[14px] font-bold mb-4 text-[#ea232a]">For ASWITHA TECH</h2>
              <h3 className="text-[13px] font-bold border-t border-black pt-1 inline-block">Authorized Signatory</h3>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center py-6 overflow-auto bg-gray-50 print:py-0 print:bg-white">
      {/* Dynamic print-only styles */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        .print-copy-wrapper {
          page-break-after: always;
          break-after: page;
        }
        .print-copy-wrapper:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
          .print-container {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
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
          .credit-note-print {
            width: 190mm !important;
            height: 281mm !important;
            min-height: 281mm !important;
            max-height: 281mm !important;
            margin: 8mm 10mm !important;
            box-sizing: border-box !important;
            border: 2px solid black !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Prevent page breaks inside key sections */
          .credit-note-print > div,
          .credit-note-print table,
          .credit-note-print tr,
          .credit-note-print tbody {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {renderCreditNotePage("[ORIGINAL COPY]")}
      {renderCreditNotePage("[DUPLICATE COPY]")}
    </div>
  );
};

export default Creditnoteview;