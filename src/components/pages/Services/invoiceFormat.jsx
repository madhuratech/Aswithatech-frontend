import React, { useState, useEffect } from "react";
import logo from "../../../asset/Logo.jpeg";
import { toWords } from "number-to-words";

const InvoiceFormat = ({ dcNumber }) => {
  const [invoice, setInvoice] = useState({
    items: [],
    client: {},
    header: {},
  });

  const amountInwords = (num) =>
    toWords(Math.round(num)).replace(/^\w/, (c) => c.toUpperCase()) +
    " Rupees Only";

  useEffect(() => {
    if (!dcNumber || dcNumber === "") return;

    const fetchData = async () => {
      try {
        console.log("Fetching service invoice data for:", dcNumber);
        const res = await fetch(
          `http://localhost:3000/api/serviceinvoice/invoice/${encodeURIComponent(
            dcNumber
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
          });
        }
      } catch (error) {
        console.error("Fetch error in InvoiceFormat:", error);
      }
    };

    fetchData();
  }, [dcNumber]);

  // Calculate Subtotal dynamically since it's not in the DB
  const subtotal = invoice.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const discount = Number(invoice.discount || 0);
  const transport = Number(invoice.transport || 0);
  const taxable = subtotal - discount + transport;

  return (
    <>
      <div className="print-area w-full flex justify-center items-start py-4 bg-white">

        {/* MAIN CONTAINER */}
        <div
          className="w-[190mm] border-2 border-black bg-white relative flex flex-col"
          style={{
            minHeight: "270mm",
            maxHeight: "270mm",
            boxSizing: "border-box",
          }}
        >

          {/* TOP LABEL */}
          <div className="text-right px-4 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              [ORIGINAL FOR RECIPIENT]
            </span>
          </div>

          {/* HEADER */}
          <div className="flex flex-col justify-center items-center text-center border-2 border-black m-2 h-[120px]">
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
           <div className="flex border-2 border-black mx-2" style={{ height: "217px", }}>
            {/* LEFT */}
            <div className="w-[55%] p-3 border-r-2 border-black flex flex-col">

              <div className="flex gap-2">
                <h2 className="text-[14px] font-bold uppercase">To :</h2>

                <div className="flex-1">
                  <h2 className="text-[14px] font-extrabold uppercase mb-1">
                    {invoice?.customer_name}
                  </h2>

                  <div className="text-[11px] leading-4 font-bold uppercase">
                    <p className="max-w-[280px]">
                      {invoice?.client_address}
                    </p>

                    <p>
                      {invoice?.client_state}
                      {invoice?.client_pincode ? ` - ${invoice.client_pincode}` : ""}
                    </p>

                    {invoice?.client_phone && (
                      <p className="mt-1">PH: {invoice.client_phone}</p>
                    )}

                    {invoice?.client_gst && (
                      <p className="mt-1">GSTIN : {invoice.client_gst}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
             <div className="w-[45%] flex flex-col overflow-visible">
              <div className="p-1 text-center border-b-2 border-black bg-gray-50">
                <h2 className="text-[18px] font-extrabold uppercase tracking-[5px]">
                  SERVICE INVOICE
                </h2>
              </div>

              <div className="p-3 space-y-1 flex flex-col justify-start">

                {[
                  {
                    label: "NO",
                    value: invoice?.invoice_no,
                  },
                  {
                    label: "DATE",
                    value: invoice?.invoice_date
                      ? new Date(invoice.invoice_date)
                          .toLocaleDateString("en-GB")
                      : "",
                  },
                  {
                    label: "OR NO",
                    value: invoice?.order_no || "",
                  },
                  {
                    label: "OR DATE",
                    value: invoice?.order_date ? new Date(invoice.order_date).toLocaleDateString("en-GB") : "",
                  },
                  {
                    label: "CLIENT DC",
                    value: invoice?.client_dc_no || "",
                  },
                  {
                    label: "DC NO",
                    value: invoice?.dc_no || "",
                  },
                  {
                    label: "DC DATE",
                    value: invoice?.dc_date ? new Date(invoice.dc_date).toLocaleDateString("en-GB") : "",
                  },
                ].map((row, i) => (
                  <div key={i} className="flex text-[12px] font-bold uppercase leading-[20px]">
                    <div className="w-[90px] shrink-0">{row.label}</div>

                    <div className="w-[15px] text-center">:</div>

                    <div className="flex-1 font-extrabold">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div
            className="mx-2 mt-2 border-2 border-black"
            style={{
              height: "118mm",
              overflow: "hidden",
            }}
          >

            <table className="w-full border-collapse">

              <thead>
                <tr className="border-b-2 border-black">

                  <th className="border-r-2 border-black p-2 w-[8%] text-left text-[12px] font-extrabold uppercase">
                    S.No
                  </th>

                  <th className="border-r-2 border-black p-2 w-[48%] text-left text-[12px] font-extrabold uppercase">
                    Description
                  </th>

                  <th className="border-r-2 border-black p-2 w-[12%] text-center text-[12px] font-extrabold uppercase">
                    HSN
                  </th>

                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px] font-extrabold uppercase">
                    Qty
                  </th>

                  <th className="border-r-2 border-black p-2 w-[10%] text-center text-[12px] font-extrabold uppercase">
                    Rate
                  </th>

                  <th className="p-2 w-[12%] text-center text-[12px] font-extrabold uppercase">
                    Total
                  </th>

                </tr>
              </thead>

              <tbody>

                {invoice.items.map((item, index) => (
                  <tr key={index} className="h-[30px]">

                    <td className="border-r-2 border-b border-black text-center text-[11px] font-bold">
                      {index + 1}
                    </td>

                    <td className="border-r-2 border-b border-black px-3 text-[11px] font-bold uppercase">
                      {item.item_name}
                    </td>

                    <td className="border-r-2 border-b border-black text-center text-[11px] font-bold">
                      {item.hsn_number || "998719"}
                    </td>

                    <td className="border-r-2 border-b border-black text-center text-[11px] font-bold">
                      {item.quantity}
                    </td>

                    <td className="border-r-2 border-b border-black text-right text-[11px] font-bold pr-3">
                      {Number(item.price).toFixed(2)}
                    </td>

                    <td className="border-b border-black text-right text-[11px] font-bold pr-3">
                      {Number(item.amount).toFixed(2)}
                    </td>

                  </tr>
                ))}

                {/* FILLER ROWS */}

                  {Array.from({ length: Math.max(0, 10 - invoice.items.length) }).map((_, i) => (
                <tr key={`filler-${i}`} className="h-[35px] print:hidden">
                  <td className="border-r border-black border-t-0 border-b-0"></td>
                  <td className="border-r border-black border-t-0 border-b-0"></td>
                  <td className="border-r border-black border-t-0 border-b-0"></td>
                  <td className="border-r border-black border-t-0 border-b-0"></td>
                  <td className="border-t-0 border-b-0"></td>
                </tr>
              ))}

              </tbody>
            </table>
          </div>

          {/* SUMMARY */}
          <div className="mx-2 border-2 border-black border-t-0 flex">

            {/* LEFT */}
            <div className="w-[55%] border-r-2 border-black p-3">

              <h3 className="underline mb-2 text-[11px] font-bold">
                OUR BANK DETAILS :
              </h3>

              <div className="text-[11px] font-bold">

                <div className="grid grid-cols-[60px_10px_1fr] gap-y-1">

                  <span>NAME</span>
                  <span>:</span>
                  <span>HDFC BANK</span>

                  <span>A/C NO</span>
                  <span>:</span>
                  <span>50200054775934</span>

                  <span>IFSC</span>
                  <span>:</span>
                  <span>HDFC0001588</span>

                  <span>BRANCH</span>
                  <span>:</span>
                  <span>GANDHIPURAM</span>

                </div>
              </div>
            </div>

            {/* RIGHT */}
<div className="w-[45%] border-l-2 border-black">

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      Sub Total
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {subtotal.toFixed(2)}
    </div>
  </div>

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      Forward & Packing Charges
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {transport.toFixed(2)}
    </div>
  </div>

  {discount > 0 && (
    <div className="flex border-b border-black px-3 py-1">
      <div className="flex-1 text-right text-[11px] font-bold pr-4">
        Discount
      </div>

      <div className="w-[110px] text-right text-[11px] font-bold text-red-600">
        -{discount.toFixed(2)}
      </div>
    </div>
  )}

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      TAXABLE
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {taxable.toFixed(2)}
    </div>
  </div>

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      CGST @{invoice.cgst > 0 ? "9" : "0"}%
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {Number(invoice.cgst || 0).toFixed(2)}
    </div>
  </div>

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      SGST @{invoice.sgst > 0 ? "9" : "0"}%
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {Number(invoice.sgst || 0).toFixed(2)}
    </div>
  </div>

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      IGST @{invoice.igst > 0 ? "18" : "0"}%
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {Number(invoice.igst || 0).toFixed(2)}
    </div>
  </div>

  <div className="flex border-b border-black px-3 py-1">
    <div className="flex-1 text-right text-[11px] font-bold pr-4">
      Round Off
    </div>

    <div className="w-[110px] text-right text-[11px] font-bold">
      {Number(invoice.round_off || 0).toFixed(2)}
    </div>
  </div>

  <div className="flex px-3 py-3 items-center">
    <div className="flex-1 text-right text-[16px] font-extrabold pr-4 uppercase">
      NET TOTAL
    </div>

    <div className="w-[110px] text-right text-[16px] font-extrabold">
      {Number(invoice.grand_total || 0).toFixed(2)}
    </div>
  </div>

</div>
          </div>

          {/* RUPEES */}
          <div className="mx-2 mt-2 border-2 border-black p-2">

            <p className="text-[11px] font-bold">

              Rupees :

              <span className="uppercase ml-6 font-extrabold">
                {amountInwords(invoice.grand_total || 0)}
              </span>

            </p>
          </div>

          {/* FOOTER */}
          <div
            className="mx-2 mt-2 border-2 border-black p-3 flex justify-between"
            style={{
              height: "38mm",
            }}
          >

            <div className="text-[10px] font-bold space-y-1">
              <p>
                1. All Disputes are subject to Coimbatore jurisdiction.
              </p>

              <p>2. Payment of this Bill mature is 30 Days.</p>

              <p>
                3. Our responsibility ceases as soon as goods have left our premises.
              </p>

              <p>
                4. Disputes if any should be notified within 15 days.
              </p>

              <p>5. Goods sold once cannot be taken back.</p>
            </div>

            <div className="text-right">
              <h2 className="text-red-600 text-[13px] font-bold mb-12">
                For ASWITHA TECH
              </h2>

              <h3 className="text-black text-[12px] font-bold">
                Authorised Signatory
              </h3>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @page{
          size:A4;
          margin:5mm;
        }

        @media print{

          html,
          body{
            margin:0 !important;
            padding:0 !important;
            background:white !important;
          }

          table,
          tr,
          td,
          th{
            page-break-inside:avoid !important;
          }

          .print-area{
            width:190mm !important;
          }
        }
      `}</style>
    </>
  );
};

export default InvoiceFormat;
