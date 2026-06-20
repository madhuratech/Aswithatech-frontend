import React, { useEffect, useState } from "react";
import { toWords } from "number-to-words";
import { QuotationAddressBlock } from "../../../utils/AddressBlock";

const QuotationLayout = ({ QtNumber }) => {
  const [purchase, setPurchase] = useState({
    items: [],
    client: {},
  });

  const amountInwords = (num) =>
    toWords(Math.round(num)).replace(/^\w/, (c) => c.toUpperCase()) + " Rupees Only";

  useEffect(() => {
    if (!QtNumber || QtNumber === "") return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/quotations/full/${encodeURIComponent(QtNumber)}`
        );
        const data = await res.json();
        setPurchase({
          ...data.header,
          items: data.items || [],
          client: data.client || {},
        });
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    fetchData();
  }, [QtNumber]);

  const renderQuotationPage = (copyLabel) => {
    return (
      <div className="quotation-copy-wrapper py-4 print:py-0 flex flex-col items-center animate-in fade-in duration-200">
        {/* TOP BAR / LABEL */}
        {copyLabel && copyLabel.trim() !== "" && (
          <div className="quotation-label w-[190mm] text-right px-4 pt-1 flex-shrink-0">
            <span className="text-[13px] mb-2 font-bold uppercase tracking-wider">
              {copyLabel}
            </span>
          </div>
        )}
        <div className="quotation-page-inner w-[190mm] h-[270mm] border-2 border-black bg-white relative shadow-lg print:shadow-none overflow-hidden flex flex-col"
          style={{ boxSizing: "border-box" }}>
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
          <div className="flex border-b-2 border-black h-[170px]">
            {/* Left - To Section */}
            <div className="w-[60%] p-4  border-black flex flex-col justify-center">
              <QuotationAddressBlock
                name={purchase?.client?.customer_name}
                address={purchase?.client?.address}
                state={purchase?.client?.state}
                pincode={purchase?.client?.pincode}
                phone={purchase?.client?.phone}
                gst={purchase?.client?.gst_number}
                stateCode={purchase?.client?.state_code || ""}
              />
            </div>

            {/* Right - Document Details */}
            <div className="w-[40%] flex flex-col">
              <div className="p-2 text-right pr-6  border-black">
                <h2 className="text-[18px] mr-[70px] font-extrabold text-blue-800 uppercase underline underline-offset-4 decoration-2 tracking-widest">QUOTATION</h2>
              </div>
              <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-center">
                <div className="flex text-[13px] font-bold uppercase">
                  <div className="w-[80px]">NO</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1 font-extrabold">{purchase?.quotation_no}</div>
                </div>
                <div className="flex text-[13px] font-bold uppercase">
                  <div className="w-[80px]">DATE</div>
                  <div className="w-[20px] text-center">:</div>
                  <div className="flex-1">
                    {purchase?.quotation_date ? new Date(purchase.quotation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: '2-digit' }).replace(/ /g, '/') : ""}
                  </div>
                </div>
                <div className="flex text-[13px] font-bold uppercase">
                  <div className="w-[80px]">Reff :</div>
                  <div className="w-[20px] text-center"></div>
                  <div className="flex-1">{purchase?.reff || ""}</div>
                </div>
              </div>
            </div>
          </div>

          {/* MESSAGE SECTION */}
          <div className="px-5 py-3 border-b-2 border-black text-[13px]">
            <p className="font-bold mb-1">Dear Sir / Madam,</p>
            <div className="text-center -mt-5">
              <p className="leading-5 inline-block">
                we are pleased to submit our best offer for your requirments.
              </p>
            </div>
            <p className="mt-1">Expecting your favourable reply.</p>
          </div>

          {/* TABLE SECTION */}
          <div className="flex-grow overflow-visible">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className=" border-r-2 border-black p-2 w-[5%] text-left text-[12px] font-extrabold text-blue-800 uppercase">SNO</th>
                  <th className="border-r-2 border-black p-2 w-[55%] text-left text-[12px] font-extrabold text-blue-800 uppercase">Description of Goods</th>
                  <th className="border-r-2 border-black p-2 w-[12%] text-center text-[12px] font-extrabold text-blue-800 uppercase">Qty</th>
                  <th className="border-r-2 border-black p-2 w-[13%] text-center text-[12px] font-extrabold text-blue-800 uppercase">Price</th>
                  <th className="p-2 w-[15%] border-black text-center text-[12px] font-extrabold text-blue-800 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr key={index} className=" border-gray-100 min-h-[35px] print:border-b-0">
                    <td className=" border-r-2 border-black p-2 text-center text-[12px]">{index + 1}</td>
                    <td className="border-r-2 border-black px-3 py-2 text-[12px] font-medium">{item.item_name}{item.serial_no ? ` (${item.serial_no})` : ""}</td>
                    <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.quantity} {item.uom || "Nos"}</td>
                    <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.price).toFixed(2)}</td>
                    <td className="p-2  border-black  text-right text-[12px] font-bold pr-4">{Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 10 - purchase.items.length) }).map((_, i) => (
                  <tr key={`filler-${i}`} className="h-[35px]">
                    <td className="border-r-2 border-black border-t-0 border-b-0"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0"></td>
                    <td className="border-r-2 border-black border-t-0 border-b-0"></td>
                    <td className="border-t-0 border-b-0"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TERMS & SUMMARY SECTION */}
          <div className="border-t-2 border-black flex">
            {/* Left - Terms */}
            <div className="w-[65%] border-r-2 border-black p-3 bg-white flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[12px] mb-2 text-blue-800">We request you to send your valuable purchase order immediately.</h3>
                <div className="text-[11px] font-bold space-y-1">
                  <div className="grid grid-cols-[130px_10px_1fr] gap-y-1">
                    <span>1.Payment</span><span>:</span><span className="truncate">{purchase.payment_terms || "50% against receipt of the materials."}</span>
                    <span>2.Delivery Period</span><span>:</span><span className="truncate">{purchase.delivery_period || "3-4 DAYS from the date of Firm order"}</span>
                    <span>3.Packing</span><span>:</span><span className="truncate">{purchase.pack_frd || "100 % against receipt of the materials."}</span>
                    <span>4.Transport</span><span>:</span><span className="truncate">{purchase.transport_terms || "For Destination."}</span>
                    <span>5.Validity</span><span>:</span><span className="truncate">{purchase.validity || "30 days from the date of offer."}</span>
                    <span>6.Warranty</span><span>:</span><span className="truncate">{purchase.waranty || "Standard"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[12px] font-bold text-blue-800">
                  Rupees : <span className="uppercase text-black ml-4 font-extrabold">{amountInwords(purchase.grandTotal || 0)}</span>
                </p>
              </div>
            </div>

            {/* Right - Summary */}
            <div className="w-[35%] border-black flex flex-col">
              {(() => {
                const sub = Number(purchase.subtotal || 0);
                const disc = Number(purchase.discount || 0);
                const trans = Number(purchase.transport || 0);
                const taxable = sub - disc + trans;
                const cgstAmt = Number(purchase.cgst || 0);
                const sgstAmt = Number(purchase.sgst || 0);
                const igstAmt = Number(purchase.igst || 0);
                const cgstPct = taxable > 0 ? Math.round((cgstAmt / taxable) * 100) : 0;
                const sgstPct = taxable > 0 ? Math.round((sgstAmt / taxable) * 100) : 0;
                const igstPct = taxable > 0 ? Math.round((igstAmt / taxable) * 100) : 0;
                const rows = [
                  { label: "Subtotal", value: sub },
                  { label: "Discount (−)", value: disc > 0 ? disc : null },
                  { label: "TAXABLE", value: taxable },
                  { label: `CGST @${cgstPct}%`, value: cgstAmt > 0 ? cgstAmt : null },
                  { label: `SGST @${sgstPct}%`, value: sgstAmt > 0 ? sgstAmt : null },
                  { label: `IGST @${igstPct}%`, value: igstAmt > 0 ? igstAmt : null },
                  { label: "Roundoff", value: Number(purchase.round_off || 0) !== 0 ? purchase.round_off : null },
                ];
                return rows.filter(r => r.value != null).map((row, idx) => (
                  <div key={idx} className="flex  border-gray-100 py-1.5 px-3 items-center print:border-b-0">
                    <div className="flex-1 text-[12px] font-bold text-left uppercase">{row.label}</div>
                    <div className="w-[10px] text-[12px] font-bold">:</div>
                    <div className="w-[80px] text-[12px] font-bold text-right">{typeof row.value === 'number' ? row.value.toFixed(2) : row.value}</div>
                  </div>
                ));
              })()}
              <div className="flex bg-blue-50 py-2 px-3 items-center">
                <div className="flex-1 text-[14px] font-extrabold text-left text-blue-800 uppercase">Net total</div>
                <div className="w-[10px] text-[14px] font-extrabold text-blue-800">:</div>
                <div className="w-[80px] text-[14px] font-extrabold text-right text-blue-800">{Number(purchase.grandTotal || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* FOOTER SECTION */}
          <div className="border-t-2 border-black p-4 relative min-h-[120px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[12px] font-bold mb-8">Received the goods in good condition</p>
                <p className="text-[12px] font-bold">Receiver's Signature</p>
              </div>
              <div className="text-right">
                <h2 className="text-red-600 text-[14px] font-bold mb-5">For ASWITHA TECH</h2>
                <h3 className="text-blue-800 text-[13px] font-bold  border-black pt-1 px-1 inline-block">Authorised Signatory</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .quotation-page-inner {
          box-sizing: border-box;
        }
        @page { size: A4; margin: 5mm; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          table { border-collapse: collapse !important; }
          tr, td, th { page-break-inside: avoid !important; }
          .quotation-print-root { padding: 0 !important; display: block !important; overflow: visible !important; }
          .quotation-copy-wrapper {
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .quotation-copy-wrapper:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .quotation-label {
            width: 190mm !important;
            margin: 0 auto !important;
            padding-top: 5mm !important;
          }
          .quotation-page-inner {
            width: 190mm !important;
            height: 270mm !important;
            margin: 13mm auto 0 auto !important;
            overflow: hidden !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="quotation-print-root w-full flex flex-col items-center py-4 overflow-auto">
        {renderQuotationPage("")}
        {renderQuotationPage("")}
      </div>
    </>
  );
};

export default QuotationLayout;
