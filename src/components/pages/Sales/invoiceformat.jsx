import React, { useState, useEffect } from "react";
import { toWords } from "number-to-words";
import { InvoiceAddressBlock } from "../../../utils/AddressBlock";

const InvoiceLayout = ({ InvNumber }) => {
  const [invoice, setInvoice] = useState({
    items: [],
    client: {},
    header: {},
  });

  const amountInwords = (num) =>
    toWords(Math.round(num)).replace(/^\w/, (c) => c.toUpperCase()) +
    " Rupees Only";

  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return "";
    if (String(dateStr).includes(",")) {
      return String(dateStr)
        .split(",")
        .map((d) => formatOrderDate(d.trim()))
        .filter(Boolean)
        .join(", ");
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  useEffect(() => {
    if (!InvNumber || InvNumber === "") return;

    const fetchData = async () => {
      try {
        console.log("Fetching invoice data for:", InvNumber);
        const res = await fetch(
          `http://localhost:3000/api/salesinvoices/full/${encodeURIComponent(
            InvNumber
          )}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Received invoice data:", data);

        if (data && data.header) {
          setInvoice({
            ...data.header,
            items: data.items || [],
            client: data.client || {},
          });
        }
      } catch (error) {
        console.error("Fetch error in InvoiceLayout:", error);
      }
    };

    fetchData();
  }, [InvNumber]);

  const InvoicePage = ({ copyLabel }) => {
    const items = invoice?.items || [];
    const allOrderNos = [...new Set(items.map((i) => i.order_no).filter(Boolean))];
    const allOrderDates = [...new Set(items.map((i) => i.order_date).filter(Boolean))];
    const orNo = allOrderNos.length ? allOrderNos.join(", ") : (invoice?.order_no || "");
    const orDate = allOrderDates.length
      ? allOrderDates.map((d) => formatOrderDate(d)).join(", ")
      : formatOrderDate(invoice?.order_date);

    const allDcNos = [...new Set(items.map((i) => i.dc_no).filter(Boolean))];
    const allDcDates = [...new Set(items.map((i) => i.dc_date).filter(Boolean))];
    const dcNoVal = allDcNos.length ? allDcNos.join(", ") : (invoice?.dc_no || "");
    const dcDateVal = allDcDates.length
      ? allDcDates.map((d) => formatOrderDate(d)).join(", ")
      : formatOrderDate(invoice?.dc_date);

    return (
      <div className="invoice-page">
        {/* TOP BAR / LABEL */}
        <div className="text-right px-4 pt-1 flex-shrink-0">
          <span className="text-[13px] font-bold uppercase tracking-wider">
            {copyLabel}
          </span>
        </div>

        <div className="invoice-page-inner w-[200mm] h-[270mm] border-2 border-black bg-white relative flex flex-col"
          style={{ boxSizing: "border-box", overflow: "hidden" }}
        >
          {/* HEADER */}
          <div className="flex flex-col justify-center items-center text-center border-2 border-black m-2 h-[120px] flex-shrink-0">
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

          {/* DETAILS */}
          <div className="flex border-2 border-black mx-2 flex-shrink-0" style={{ height: "217px" }}>
            {/* LEFT */}
            <div className="w-[55%] p-3 border-r-2 border-black flex flex-col justify-center">
              <InvoiceAddressBlock
                name={invoice?.client?.customer_name || invoice?.customer_name}
                address={invoice?.client?.address || invoice?.client_address}
                state={invoice?.client?.state || invoice?.client_state}
                pincode={invoice?.client?.pincode || invoice?.client_pincode}
                phone={invoice?.client?.phone || invoice?.client_phone}
                gst={invoice?.client?.gst_number || invoice?.client_gst}
                stateCode={invoice?.client?.state_code || ""}
              />
            </div>

            {/* RIGHT */}
            <div className="w-[45%] flex flex-col overflow-visible">
              <div className="p-1 text-center border-b-2 border-black bg-gray-50">
                <h2 className="text-[18px] font-extrabold uppercase tracking-[5px]">
                  INVOICE
                </h2>
              </div>
              <div className="p-3 space-y-1.5 flex flex-col justify-center">
                {/* NO and DATE on same line */}
                <div className="flex text-[11px] font-bold uppercase leading-[20px]">
                  <div className="flex flex-1 items-center">
                    <div className="w-[30px] shrink-0">NO</div>
                    <div className="w-[12px] text-center">:</div>
                    <div className="font-extrabold">{invoice?.invoice_no}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="shrink-0 font-bold">DATE</div>
                    <div className="text-center">:</div>
                    <div className="font-extrabold">{formatInvoiceDate(invoice?.invoice_date)}</div>
                  </div>
                </div>

                {[
                  { label: "OR NO", value: orNo },
                  { label: "OR DATE", value: orDate },
                  { label: "DC NO", value: dcNoVal },
                  { label: "DC DATE", value: dcDateVal },
                  { label: "DESPATCH", value: invoice?.dispatch_through },
                ].map((row, i) => (
                  <div key={i} className="flex text-[11px] font-bold uppercase leading-[20px]">
                    <div className="w-[70px] shrink-0">{row.label}</div>
                    <div className="w-[12px] text-center">:</div>
                    <div className="flex-1 font-extrabold">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="mx-2 mt-2 border-2 border-black flex-1 flex flex-col overflow-hidden">
            <table className="w-full border-collapse flex-1" style={{ display: "flex", flexDirection: "column" }}>
              <thead style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="border-r-2 border-black p-2 w-[8%] text-left text-[12px] font-extrabold uppercase">S.No</th>
                  <th className="border-r-2 border-black p-2 w-[45.5%] text-left text-[12px] font-extrabold uppercase">Description</th>
                  <th className="border-r-2 border-black p-2 w-[12%] text-center text-[12px] font-extrabold uppercase">HSN</th>
                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px] font-extrabold uppercase">Qty</th>
                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px] font-extrabold uppercase">Rate</th>
                  <th className="p-2 w-[12%] text-center text-[12px] font-extrabold uppercase">Total</th>
                </tr>
              </thead>
              <tbody style={{ display: "table", width: "100%", tableLayout: "fixed", flex: 1 }}>
                {items.map((item, index) => (
                  <tr key={index} className="min-h-[30px]">
                    <td className="border-r-2 border-black text-center text-[11px] font-bold w-[8%]">{index + 1}</td>
                    <td className="border-r-2 border-black px-3 text-[11px] font-bold uppercase w-[45.5%]">{item.item_name}{item.serial_no ? ` (${item.serial_no})` : (item.sl_no ? ` (${item.sl_no})` : "")}</td>
                    <td className="border-r-2 border-black text-center text-[11px] font-bold w-[12%]">{item.hsn_code || item.hsn_number || "998719"}</td>
                    <td className="border-r-2 border-black text-center text-[11px] font-bold w-[10%]">{item.quantity}</td>
                    <td className="border-r-2 border-black text-right text-[11px] font-bold pr-3 w-[10%]">{Number(item.price).toFixed(2)}</td>
                    <td className="border-black text-right text-[11px] font-bold pr-3 w-[12%]">{Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ height: "100%" }}>
                  <td className="border-r-2 border-black w-[8%]"></td>
                  <td className="border-r-2 border-black w-[48%]"></td>
                  <td className="border-r-2 border-black w-[12%]"></td>
                  <td className="border-r-2 border-black w-[10%]"></td>
                  <td className="border-r-2 border-black w-[10%]"></td>
                  <td className="w-[12%]"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SUMMARY */}
          <div className="mx-2 border-2 border-black border-t-0 flex flex-shrink-0 h-[210px]">
            {/* LEFT */}
            <div className="w-[55%] p-3 border-r-2 border-black flex flex-col justify-between">
              <div>
                <h3 className="underline mb-2 text-[11px] font-bold">OUR BANK DETAILS :</h3>
                <div className="text-[11px] font-bold">
                  <div className="grid grid-cols-[60px_10px_1fr] gap-y-1">
                    <span>NAME</span><span>:</span><span>HDFC BANK</span>
                    <span>A/C NO</span><span>:</span><span>50200054775934</span>
                    <span>IFSC</span><span>:</span><span>HDFC0001588</span>
                    <span>BRANCH</span><span>:</span><span>GANDHIPURAM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="w-[45%] flex flex-col leading-5 relative justify-between">
              <div className="absolute top-0 bottom-0 left-[238.2px] border-l-2 border-black"></div>
              <div className="flex-1 flex flex-col justify-start">
                <div className="flex px-3 py-0.5">
                  <span className="flex-1 text-right text-[13px] font-bold pr-4">Sub Total</span>
                  <span className="w-[110px] text-right text-[14px] font-bold">{Number(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex px-3 py-0.5">
                  <span className="flex-1 text-right text-[13px] font-bold pr-4">Forward & Packing Charges</span>
                  <span className="w-[110px] text-right text-[14px] font-bold">{Number(invoice.transport || 0).toFixed(2)}</span>
                </div>
                {Number(invoice.discount || 0) > 0 && (
                  <div className="flex px-3 py-0.5">
                    <span className="flex-1 text-right text-[12px] font-bold pr-4">Discount</span>
                    <span className="w-[110px] text-right text-[14px] font-bold text-red-600">-{Number(invoice.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex px-3 py-0.5">
                  <span className="flex-1 text-right text-[13px] font-bold pr-4">TAXABLE</span>
                  <span className="w-[110px] text-right text-[14px] font-bold">
                    {(Number(invoice.subtotal || 0) - Number(invoice.discount || 0) + Number(invoice.transport || 0)).toFixed(2)}
                  </span>
                </div>
                {(() => {
                  const taxable = Number(invoice.subtotal || 0) - Number(invoice.discount || 0) + Number(invoice.transport || 0);
                  const cgstAmt = Number(invoice.cgst || 0);
                  const sgstAmt = Number(invoice.sgst || 0);
                  const igstAmt = Number(invoice.igst || 0);
                  const cgstPct = taxable > 0 ? Math.round((cgstAmt / taxable) * 100) : 0;
                  const sgstPct = taxable > 0 ? Math.round((sgstAmt / taxable) * 100) : 0;
                  const igstPct = taxable > 0 ? Math.round((igstAmt / taxable) * 100) : 0;
                  return (
                    <>
                      <div className="flex px-3 ">
                        <span className="flex-1 text-right text-[13px] font-bold pr-4">CGST @{cgstPct}%</span>
                        <span className="w-[110px] text-right text-[14px] font-bold">{cgstAmt.toFixed(2)}</span>
                      </div>
                      <div className="flex px-3 py-0.5">
                        <span className="flex-1 text-right text-[13px] font-bold pr-4">SGST @{sgstPct}%</span>
                        <span className="w-[110px] text-right text-[14px] font-bold">{sgstAmt.toFixed(2)}</span>
                      </div>
                      <div className="flex px-3 py-0.5">
                        <span className="flex-1 text-right text-[13px] font-bold pr-4">IGST @{igstPct}%</span>
                        <span className="w-[110px] text-right text-[14px] font-bold">{igstAmt.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex px-3 py-0.5">
                  <span className="flex-1 text-right text-[13px] font-bold pr-4">Round Off</span>
                  <span className="w-[110px] text-right text-[14px] font-bold">{Number(invoice.round_off || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex mb-2 items-center border-black">
                <div className="flex-1 text-right text-[14px] font-extrabold pr-4 uppercase">NET TOTAL</div>
                <div className="w-[110px] text-right mr-[10px] text-[14px] font-extrabold">{Number(invoice.grandtotal || invoice.grand_total || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          {/* RUPEES BOX */}
          <div className="mx-2 mt-3 border-2 border-black border-t-2 h-[50px] flex items-center px-4 flex-shrink-0">
            <span className="font-bold text-[14px]">Rupees :</span>
            <span className="ml-6 font-extrabold uppercase text-[14px]">
              {amountInwords(invoice.grandtotal || invoice.grand_total || 0)}
            </span>
          </div>

          <div className="mx-2 mb-1 mt-2 border-2 border-black border-t-2 h-[160px] flex justify-between p-4 flex-shrink-0">
            {/* LEFT SIDE TERMS */}
            <div className="text-[10px] leading-7">
              <p>1. All Disputes are subject to Coimbatore jurisdiction.</p>
              <p>2. Payment of this Bill mature is 30 Days.</p>
              <p>3. Our responsibility ceases as soon as goods have left our premises.</p>
              <p>4. Disputes if any should be notified to us in writing within 15 days from receipt of Bill.</p>
              <p>5. Goods Sold Once cannot be taken back.</p>
            </div>

            {/* RIGHT SIDE SIGNATURE */}
            <div className="flex flex-col justify-between text-right">
              <h2 className="text-red-600 text-[16px] font-extrabold uppercase">
                For ASWITHA TECH
              </h2>

              <h3 className="text-[14px] font-extrabold">
                Authorised Signatory
              </h3>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          .invoice-print-root {
            display: block !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .invoice-copy-wrapper {
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .invoice-copy-wrapper:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .invoice-page-inner {
            width: 200mm !important;
            height: 270mm !important;
            margin: 13mm auto 0 auto !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <div className="invoice-print-root bg-white w-full flex flex-col items-center print:bg-white">
        {/* PAGE 1 — ORIGINAL COPY */}
        <div className="invoice-copy-wrapper py-4 print:py-0">
          <InvoicePage copyLabel="[ORIGINAL FOR RECIPIENT]" />
        </div>

        {/* DEBUG MARKER: Confirm Duplicate Copy exists in DOM */}
        <div id="debug-duplicate-copy-marker" style={{ display: "none" }} data-desc="Duplicate Copy DOM verification marker"></div>

        {/* PAGE 2 — DUPLICATE COPY */}
        <div className="invoice-copy-wrapper py-4 print:py-0">
          <InvoicePage copyLabel="[DUPLICATE COPY]" />
        </div>
      </div>
    </>
  );
};

export default InvoiceLayout;