import React, { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { DcAddressBlock } from "../../../utils/AddressBlock";

const fmtQty = (val) => {
  const n = Number(val);
  if (isNaN(n)) return val || "";
  return n % 1 === 0 ? String(Math.round(n)) : String(n);
};

const StandbyDeliveryChallan = ({ dcNumber }) => {
  const [data, setData] = useState({ items: [], client: {} });

  useEffect(() => {
    if (!dcNumber || dcNumber === "") return;
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/standbydcentry/full/${encodeURIComponent(dcNumber)}`);
        const result = await res.json();
        setData({ ...result, items: result.items || [], client: result.client || {} });
      } catch (error) {
        console.log("Fetch Error", error);
      }
    };
    fetchData();
  }, [dcNumber]);

  const renderChallan = (copyLabel) => (
    <div className="w-[200mm] flex flex-col items-center">
      {/* Title row */}
      <div className="w-[200mm] relative flex justify-center items-center py-1 font-bold text-[15px]">
        <h1>STANDBY DELIVERY CHALLAN</h1>
        <h1 className="absolute right-0 font-bold uppercase">{copyLabel}</h1>
      </div>

      {/* Challan box */}
      <div
        className="w-[200mm] border-2 border-black bg-white relative flex flex-col"
        style={{ boxSizing: "border-box", overflow: "hidden" }}
      >
        {/* Company Section */}
        <div className="flex flex-col justify-center items-center text-center border-b-2 border-black px-2 py-2 min-h-[100px]">
          <h1 className="text-red-600 text-[21px] font-extrabold leading-tight uppercase tracking-tight">
            ASWITHA TECH
          </h1>
          <div className="text-[11px] font-bold">
            <p>17, Abirami Nagar, Avarampalayam Road,</p>
            <p>K.R. Puram, Ganapathi, Coimbatore - 641006</p>
            <p>Email : aswithatech2020@gmail.com</p>
            <div className="flex justify-center items-center gap-4 text-[11px] mt-0.5">
              <span>GSTIN : 33GYLPS7134C1Z9</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Phone size={10} className="text-green-600" fill="currentColor" />
                <span>80725 37036, 96551 48537</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & DC Details */}
        <div className="flex border-b-2 border-black">
          {/* Left - Customer */}
          <div className="w-[60%] px-3 py-3 min-h-[88px] border-r-2 border-black">
            <DcAddressBlock
              name={data?.customer_name}
              address={data?.client?.address}
              state={data?.client?.state}
              pincode={data?.client?.pincode}
              phone={data?.client?.phone}
              gst={data?.client?.gst_number}
              stateCode={data?.client?.state_code}
              email={data?.client?.email}
            />
          </div>

          {/* Right - DC Details */}
          <div className="w-[40%] px-3 py-2 flex flex-col space-y-0.5 leading-5">
            {[
              { label: "DC No",          value: data?.standby_dc_no },
              { label: "Date",           value: data?.dc_date ? new Date(data.dc_date).toLocaleDateString("en-GB") : "" },
              { label: "Your Dc No",       value: data?.order_no || "" },
              { label: "Your Dc Date",     value: data?.order_date ? new Date(data.order_date).toLocaleDateString("en-GB") : "" },
              { label: "Despatch",       value: data?.despatch_through || "By Hand" },
            ].map((row, i) => (
              <div key={i} className="flex text-[11px] font-bold">
                <div className="w-[90px] uppercase">{row.label}</div>
                <div className="w-[15px]">:</div>
                <div className="flex-1 uppercase">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Table — 6 columns: SNO, ITEM NAME, SERIAL NO, QTY, UOM, REMARKS */}
         <div className="flex-1">
            <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-r-2 border-b-2 border-black p-1 text-center text-[11px] font-bold uppercase">SNO</th>
                  <th className="border-r-2 border-b-2 border-black p-1 text-center text-[11px] font-bold uppercase">PARTICULARS</th>
                  <th className="border-r-2 border-b-2 border-black p-1 text-center text-[11px] font-bold uppercase">HSN</th>
                  <th className="border-r-2 border-b-2 border-black p-1 text-center text-[11px] font-bold uppercase">QTY</th>
                  <th className="border-b-2 border-black p-1 text-center text-[11px] font-bold uppercase">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="border-r-2 border-black p-1 text-center text-[11px] font-medium">{index + 1}</td>
                    <td className="border-r-2 border-black px-2 py-1 text-[11px] font-bold uppercase break-words">{item.item_name}{item.serial_no ? ` (${item.serial_no})` : (item.sl_no ? ` (${item.sl_no})` : "")}</td>
                    <td className="border-r-2 border-black p-1 text-center text-[11px]">{item.hsn}</td>
                    <td className="border-r-2 border-black p-1 text-center text-[11px]">{fmtQty(item.quantity)}</td>
                    <td className="border-black px-2 py-1 text-[11px] uppercase text-center break-words">{item.remarks || ""}</td>
                  </tr>
                ))}
                {/* Filler row */}
                <tr style={{ height: "2px" }}>
                  <td className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black"></td>
                  <td></td>
                </tr>
                {/* Total row */}
                <tr>
                  <td className=" border-t-2 border-b-2 border-black"></td>
                  <td className=" border-t-2 border-b-2 border-black"></td>
                  <td className=" border-t-2 border-b-2 border-black text-center font-bold text-[11px] py-1 uppercase">TOTAL QTY</td>
                  <td className=" border-t-2 border-b-2 border-black text-center font-bold text-[15px] py-1">
                    {data?.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0}
                  </td>
                  <td className="border-t-2 border-b-2 border-black"></td>
                </tr>
              </tbody>
            </table>
          </div>

        {/* Footer */}
        <div className="relative min-h-[68px] px-3 py-1">
          {data?.purpose && (
            <p className="text-[10px] font-bold text-gray-700 uppercase mb-1">
              Operations / Purpose: <span className="font-semibold normal-case text-black ml-1">{data.purpose}</span>
            </p>
          )}
          <div>
            <p className="text-[12px] font-bold">Received the goods in good condition</p>
            <p className="text-[12px] mt-3 font-bold uppercase relative top-3">Receiver's Signature</p>
          </div>
          <div className="absolute right-6 bottom-2 text-right">
            <h2 className="text-red-600 text-[17px] font-extrabold mb-2 uppercase">For ASWITHA TECH</h2>
            <h3 className="text-[12px] font-bold uppercase tracking-tight relative top-4">Authorised Signatory</h3>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white w-full py-2 flex flex-col justify-center items-center print:py-0 print:bg-white">
      {renderChallan("(ORIGINAL COPY)")}

      {/* Dashed divider between copies */}
      <div className="w-[200mm] mt-10 border-t border-dashed border-black print:mt-10"></div>
      <div className="html2pdf__page-break"></div>

      {renderChallan("(DUPLICATE COPY)")}

      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
          .bg-white { background-color: white !important; }
        }
      `}</style>
    </div>
  );
};

export default StandbyDeliveryChallan;
