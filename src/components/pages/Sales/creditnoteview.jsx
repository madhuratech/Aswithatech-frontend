import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import logo from "../../../asset/Logo.jpeg";
import { toWords } from "number-to-words";

const Creditnoteview = ({ cnNumber }) => {
    const { cnNumber: routeCnNumber } = useParams();
    const activeCnNumber = cnNumber || routeCnNumber;

    const [creditnote, setCreditnote] = useState({
        items: [],
        client: {},
    });

    useEffect(() => {
        if (!activeCnNumber || activeCnNumber === "") return;

        const fetchData = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3000/api/creditnotes/full/${encodeURIComponent(activeCnNumber)}`
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
    }, [activeCnNumber]);

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
    const minRows = 8;
    const items = creditnote.items || [];
    const emptyRowsCount = Math.max(0, minRows - items.length);

    return (
        <div className="w-full bg-gray-50 py-4 flex justify-center">
            {/* Dynamic print-only styles */}
            <style>{`
        @media print {
          /* Hide everything else on the page */
          body * {
            visibility: hidden;
          }
          /* Show only the print area */
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            border: none !important;
            margin: 0 !important;
            padding: 4px !important;
            box-shadow: none !important;
          }
          /* Enforce A4 size and margins */
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

            {/* Container simulating A4 size (approx 800px width) */}
            <div className="w-[800px] bg-white text-black font-sans shadow-xl relative select-none printable-area">

                {/* DOUBLE BORDER CONTAINER */}
                <div className="m-4 border-[6px] border-double border-black p-4 flex flex-col min-h-[980px]">

                    {/* Top Label */}
                    <div className="text-right text-[10px] font-bold tracking-wider mb-2 text-black pr-2">
                        [ORIGINAL FOR RECEIPIENT]
                    </div>

                    {/* HEADER SECTION */}
                    <div className="grid grid-cols-[1.2fr_1.8fr] gap-4 pb-4 border-b border-black">
                        {/* Logo Column */}
                        <div className="flex flex-col items-center justify-center border-r border-black pr-4">
                            <img src={logo} alt="Aswitha Tech" className="w-[180px] object-contain mb-2" />
                            <div className="text-xs font-bold text-gray-800 text-center">
                                GSTIN : 33GYLPS7134C1Z9
                            </div>
                        </div>

                        {/* Address & Contacts Column */}
                        <div className="pl-4 flex flex-col justify-center">
                            <h1 className="text-[#ea232a] font-serif font-black text-3xl tracking-wide leading-none mb-2 text-right md:text-left">
                                ASWITHA TECH
                            </h1>
                            <p className="text-[12px] font-semibold leading-snug text-gray-800">
                                231-D, Sri Balaji Nilayam,<br />
                                Venkataswamy Road New Siddhapudur,<br />
                                Coimbatore-641 044 TamilNadu.<br />
                                <span className="font-bold">Email : </span>aswithatech2020@gmail.com
                            </p>

                            {/* WhatsApp & Phone Row */}
                            <div className="flex gap-4 mt-2 text-[12px] font-bold text-gray-800">
                                <span className="flex items-center gap-1">
                                    <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-serif">w</span>
                                    80725 37036
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px]">📞</span>
                                    96551 48537
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* METADATA & CLIENT SECTION */}
                    <div className="grid grid-cols-[1.5fr_1fr] border-b border-black text-xs">
                        {/* Left - Customer Details */}
                        <div className="p-3 pr-4 border-r border-black flex flex-col justify-between">
                            <div>
                                <div className="flex gap-2">
                                    <span className="font-bold shrink-0">To :</span>
                                    <div>
                                        <h2 className="font-bold text-sm uppercase text-gray-900">
                                            {creditnote.client?.customer_name || creditnote.client_name}
                                        </h2>
                                        <p className="mt-1 leading-normal text-gray-800 whitespace-pre-line">
                                            {creditnote.client?.address}
                                            {creditnote.client?.state && `, ${creditnote.client.state}`}
                                            {creditnote.client?.pincode && ` - ${creditnote.client.pincode}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-2 border-t border-dashed border-gray-300">
                                <p className="font-bold">
                                    GSTINo : <span className="font-semibold">{creditnote.client?.gst_number || "N/A"}</span>
                                    {creditnote.client?.state && (
                                        <>
                                            {" , "}State Code: <span className="font-semibold">{creditnote.client.state_code || "33"}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Right - Credit Note info */}
                        <div className="flex flex-col">
                            {/* Boxed Header */}
                            <div className="border-b border-black bg-gray-50 py-2 text-center">
                                <h3 className="font-extrabold text-sm tracking-wider">CREDIT NOTE</h3>
                            </div>
                            {/* Row 1 - CN Number and Date */}
                            <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-[11px]">
                                <div className="p-2">
                                    <span className="text-[10px] font-bold block text-gray-600">NO</span>
                                    <span className="font-bold text-gray-900">{creditnote.cn_number || "N/A"}</span>
                                </div>
                                <div className="p-2">
                                    <span className="text-[10px] font-bold block text-gray-600">DATE</span>
                                    <span className="font-bold text-gray-900">{formatDate(creditnote.cn_date)}</span>
                                </div>
                            </div>
                            {/* Row 2 - Bill No */}
                            <div className="p-2 border-b border-black text-[11px]">
                                <span className="text-[10px] font-bold block text-gray-600">BILL NO</span>
                                <span className="font-bold text-gray-900">{creditnote.bill_no || "N/A"}</span>
                            </div>
                            {/* Row 3 - Bill Date */}
                            <div className="p-2 text-[11px]">
                                <span className="text-[10px] font-bold block text-gray-600">BILL DATE</span>
                                <span className="font-bold text-gray-900">{formatDate(creditnote.bill_date, "dd.mm.yyyy")}</span>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="flex-grow">
                        <table className="w-full border-collapse border-b border-black text-xs">
                            <thead>
                                <tr className="border-b border-black bg-gray-50 font-bold text-center">
                                    <th className="border-r border-black py-2 w-[8%]">S.No</th>
                                    <th className="border-r border-black py-2 text-left px-3 w-[52%]">Description</th>
                                    <th className="border-r border-black py-2 w-[12%]">HSN</th>
                                    <th className="border-r border-black py-2 w-[10%]">Qty</th>
                                    <th className="border-r border-black py-2 w-[10%]">Rate</th>
                                    <th className="py-2 w-[10%]">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Render actual items */}
                                {items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-b-0 text-center font-medium">
                                        <td className="border-r border-black py-2.5">{idx + 1}</td>
                                        <td className="border-r border-black py-2.5 text-left px-3 font-semibold uppercase">{item.item_name}</td>
                                        <td className="border-r border-black py-2.5 text-gray-800">{item.hsn_code || "-"}</td>
                                        <td className="border-r border-black py-2.5">{item.quantity} {item.unit || "Nos"}</td>
                                        <td className="border-r border-black py-2.5 text-right px-2">{(Number(item.price) || 0).toFixed(2)}</td>
                                        <td className="text-right px-2">{(Number(item.amount) || 0).toFixed(2)}</td>
                                    </tr>
                                ))}

                                {/* Render empty filler rows to keep vertical grid lines styling */}
                                {emptyRowsCount > 0 &&
                                    Array.from({ length: emptyRowsCount }).map((_, idx) => (
                                        <tr key={`empty-${idx}`} className="text-center h-[35px]">
                                            <td className="border-r border-black py-2.5"></td>
                                            <td className="border-r border-black py-2.5 text-left px-3"></td>
                                            <td className="border-r border-black py-2.5"></td>
                                            <td className="border-r border-black py-2.5"></td>
                                            <td className="border-r border-black py-2.5"></td>
                                            <td className="py-2.5"></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* TOTALS & SUMMARY FOOTER AREA */}
                    <div className="grid grid-cols-[1.3fr_1.2fr] border-t border-black text-xs font-semibold">
                        {/* Left Blank column inside border */}
                        <div className="border-r border-black"></div>

                        {/* Right Summary Table */}
                        <div className="flex flex-col text-[11px] divide-y divide-gray-200">
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">Sub Total</span>
                                <span className="text-right font-bold">{(Number(creditnote.subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">Forward & Packing Charges:</span>
                                <span className="text-right font-bold">0.00</span>
                            </div>
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">TAXABLE:</span>
                                <span className="text-right font-bold">{(Number(creditnote.subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">CGST @ {creditnote.igst > 0 ? "0.00" : "9.00"} %</span>
                                <span className="text-right font-bold">{(Number(creditnote.cgst) || 0).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">SGST @ {creditnote.igst > 0 ? "0.00" : "9.00"} %</span>
                                <span className="text-right font-bold">{(Number(creditnote.sgst) || 0).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">IGST @ {creditnote.igst > 0 ? "18.00" : "0.00"} %</span>
                                <span className="text-right font-bold">{(Number(creditnote.igst) || 0).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 p-2">
                                <span className="text-gray-700">Round Off</span>
                                <span className="text-right font-bold">{(Number(creditnote.roundOff) || 0).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 p-2.5 bg-gray-50 border-t border-black text-xs font-extrabold text-gray-900">
                                <span>NET TOTAL</span>
                                <span className="text-right text-[#ea232a] text-sm">{(Number(creditnote.grandTotal) || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RUPEES IN WORDS */}
                    <div className="border border-black p-2 mt-2 text-[11px] font-bold bg-gray-50">
                        Rupees : <span className="text-gray-800 ml-1">{amountInWords(creditnote.grandTotal)}</span>
                    </div>

                    {/* AUTHORISED SIGNATORY */}
                    <div className="border border-black p-3 mt-2 flex flex-col justify-between h-[75px]">
                        <div className="flex justify-end">
                            <span className="text-xs font-bold text-gray-700 mr-1">For</span>
                            <span className="text-xs font-extrabold text-[#ea232a]">ASWITHA TECH</span>
                        </div>
                        <div className="flex justify-end text-xs font-bold text-gray-900">
                            Authorised Signatory
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Creditnoteview;
