import React, { useEffect, useState } from "react";
import { toWords } from "number-to-words";
import { splitAddress } from "../../../utils/AddressBlock";
import API_BASE_URL from "../../../config/api";

const Billwiseformat = ({ billNo, title }) => {
  const [purchase, setPurchase] = useState({
    items: [],
    client: {},
  });

  const Api_url = `${API_BASE_URL}/billpayment`;

  const amountInwords = (num) =>
    toWords(Math.round(num)).replace(/^\w/, (c) => c.toUpperCase()) + " Rupees Only";

  useEffect(() => {
    const fetchdata = async () => {
      try {
        let finalbillno = billNo;

        if (!finalbillno || finalbillno === "null") {
          const res = await fetch(`${Api_url}/allbills`);
          const allbills = await res.json();

          if (allbills.length > 0) {
            finalbillno = allbills[0].bill_no;
          } else {
            console.log("No bills found");
            return;
          }
        }

        const res = await fetch(`${Api_url}/getbillno/${finalbillno}`);
        const data = await res.json();

        setPurchase({
          ...data,
          items: data.items || [],
        });
      } catch (error) {
        console.log("Error fetching data", error);
      }
    };

    fetchdata();
  }, [billNo]);

  const gst = Number(purchase?.cgst || 0) + Number(purchase?.sgst || 0);

  const renderBillwisePage = (copyLabel) => {
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
        <div className="print-container w-[190mm] h-[270mm] border-2 border-black bg-white relative shadow-lg overflow-hidden">

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

          {/* DETAILS SECTION */}
          <div className="flex border-b-2 border-black">
            {/* Left - To Section */}
            <div className="w-[60%] p-4 min-h-[140px] border-r-2 border-black">
              <h2 className="text-[15px] font-bold mb-1">To:</h2>
              <h2 className="text-[14px] font-bold uppercase mb-1">
                {purchase?.supplier_name}
              </h2>
              <div className="text-[12px] leading-5 font-medium max-w-[350px]">
                {splitAddress(purchase?.address, purchase?.state, purchase?.pincode).map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
                <p className="mt-2 font-bold">Ph: {purchase?.phone}</p>
                <p className="font-bold">GSTIN : {purchase?.gst_number}</p>
              </div>
            </div>

            {/* Right - Document Details */}
            <div className="w-[40%] flex flex-col">
              <div className="border-b-2 border-black p-2 text-center">
                <h2 className="text-[16px] font-bold tracking-widest uppercase">Billwise Payments</h2>
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-center">
                <div className="flex text-[13px] font-bold">
                  <div className="w-[80px]">Receipt No</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">{purchase?.receipt_no || "-"}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[80px]">Bill No</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">{purchase?.items?.[0]?.bill_no || "-"}</div>
                </div>
                <div className="flex text-[13px] font-bold">
                  <div className="w-[80px]">Date</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">{purchase?.entry_date}</div>
                </div>
              </div>
            </div>
          </div>

          {/* MESSAGE SECTION */}
          <div className="p-4 border-b-2 border-black">
            <p className="text-[13px] font-bold mb-1">Dear Sir / Madam,</p>
            <p className="text-[12px] leading-5 indent-16 text-justify">
              Kindly arrange to dispatch the under mentioned quality items at the earliest possible in accordance with our instructions. Please mention our PO No & Date in your Bill or Correspondence. Kindly acknowledge this order immediately.
            </p>
          </div>

          {/* TABLE SECTION — no flex/flex-col; fixed mm height for print stability */}
          <div style={{ height: "65mm", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr className="bg-gray-50 border-b-2 border-black">
                  <th className="border-r-2 border-black p-2 w-[7%] text-center text-[12px]">S.No</th>
                  <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Bill No</th>
                  <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Bill Date</th>
                  <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Bill Amount</th>
                  <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Paid Amount</th>
                  <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Balance</th>
                  <th className="p-2 w-[20%] text-center text-[12px]">Net Paid</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{index + 1}</td>
                    <td className="border-r-2 border-black px-3 py-2 text-[12px] text-center font-medium">{item.bill_no}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.bill_date}</td>
                    <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.bill_amount).toFixed(2)}</td>
                    <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.paid_amount).toFixed(2)}</td>
                    <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.balance_amount).toFixed(2)}</td>
                    <td className="p-2 text-center text-[12px] font-bold">{Number(item.bill_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Filler rows — &nbsp; prevents cell height collapse during print */}
                {Array.from({ length: Math.max(0, 10 - (purchase.items?.length || 0)) }).map((_, i) => (
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

          {/* SUMMARY SECTION */}
          <div className="border-t-2 border-black flex">
            <div className="w-[70%] border-r-2 border-black p-4 space-y-2">
              <div className="flex text-[13px] font-bold">
                <div className="w-[120px]">Payment Mode</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1 font-medium">{purchase?.payment_mode || purchase?.items?.[0]?.payment_mode || "-"}</div>
              </div>
              <div className="flex text-[13px] font-bold">
                <div className="w-[120px]">Bank Name</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1 font-medium">{purchase?.bank_name || "-"}</div>
              </div>
              <div className="flex text-[13px] font-bold">
                <div className="w-[120px]">Reference No</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1 font-medium">{purchase?.reference_no || "-"}</div>
              </div>
            </div>
            <div className="w-[30%] ">
              <div className="flex h-[99%] ">
                <div className="w-[50%] p-2 text-[13px] font-extrabold border-r-2 border-black">NET TOTAL</div>
                <div className="w-[50%] p-2 text-[13px] font-extrabold text-right pr-4">{Number(purchase.grand_total || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* RUPEES SECTION */}
          <div className="border-t-2 border-black p-2 bg-white">
            <p className="text-[12px] font-bold italic">
              Rupees : <span className="uppercase">{amountInwords(purchase.grand_total || 0)}</span>
            </p>
          </div>

          {/* FOOTER SECTION */}
          <div className="border-t-2 border-black px-4 pt-2 pb-1 absolute bottom-0 left-0 right-0">
            <div className="right-8 text-right">
              <h2 className="text-[14px] font-bold text-red-500 mb-4">For ASWITHA TECH</h2>
              <h3 className="text-[13px] font-bold  border-black pt-1 inline-block">Authorized Signatory</h3>
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
        {renderBillwisePage("")}
        {renderBillwisePage("")}
      </div>
    </>
  );
};

export default Billwiseformat;
