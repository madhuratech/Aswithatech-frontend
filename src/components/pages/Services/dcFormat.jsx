import React, { useEffect, useState } from "react";
import { DcAddressBlock } from "../../../utils/AddressBlock";

// Formats qty: 5.00 → 5, 5.50 → 5.5, 10.25 → 10.25
const fmtQty = (val) => {
  const n = Number(val);
  if (isNaN(n)) return val || "";
  return n % 1 === 0 ? String(Math.round(n)) : String(n);
};

const DeliveryChallan = ({ dcNumber }) => {
  const [data, setData] = useState({ items: [], client: {} });

  useEffect(() => {
    if (!dcNumber || dcNumber === "") return;
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/servicedcentry/full/${encodeURIComponent(dcNumber)}`);
        const result = await res.json();
        setData({ ...result, items: result.items || [], client: result.client || {} });
      } catch (error) {
        console.log("Fetch Error", error);
      }
    };
    fetchData();
  }, [dcNumber]);

  const partyDcNos = data?.party_dc_no
    ? [...new Set(data.party_dc_no.split(",").map(s => s.trim()).filter(Boolean))].join(", ")
    : "";

  const partyDcDates = data?.party_dc_date
    ? [...new Set(
        data.party_dc_date
          .split(",")
          .map(date => date.trim())
          .filter(Boolean)
      )].join(", ")
    : "";

  const renderChallan = (copyLabel) => {
    return (
      <div className="w-[200mm]  flex flex-col items-center">
        {/* Title row — reduced py-2→py-1, text-[18px]→text-[15px] */}
        <div className="w-[200mm] relative flex justify-center items-center py-2 font-bold text-[15px]">
          <h1>DELIVERY CHALLAN</h1>
          <h1 className="absolute right-0 font-bold uppercase">{copyLabel}</h1>
        </div>

        {/* Challan box */}
        <div
          className="w-[200mm]  border-2 border-black bg-white relative flex flex-col"
          style={{ boxSizing: "border-box",  overflow: "hidden" }}
        >
          {/* Company Section — h-[120px]→h-[82px], text sizes reduced */}
          <div className="flex flex-col justify-center items-center text-center border-b-2 border-black px-2 py-3 h-[100px]">
            <h1 className="text-red-600 text-[19px] font-extrabold leading-tight uppercase tracking-tight">
              ASWITHA TECH
            </h1>
            <div className="text-[11px] font-bold">
              <p>17, Abirami Nagar, Avarampalayam Road,</p>
              <p>K.R. Puram, Ganapathi, Coimbatore - 641006</p>
              <p>Email : aswithatech2020@gmail.com</p>
              <div className="flex justify-center items-center gap-4 text-[11px] mt-0.7">
                <span>GSTIN : 33GYLPS7134C1Z9</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">📞</span>
                  <span>80725 37036, 96551 48537</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & DC Details — p-4→p-2, min-h-[110px]→min-h-[88px], text reduced */}
          <div className="flex border-b-2 border-black">
            {/* Left - Customer */}
            <div className="w-[60%] px-3 py-2 min-h-[88px] border-r-2 border-black">
              <DcAddressBlock
                name={data?.supplier_name}
                address={data?.client?.address}
                state={data?.client?.state}
                pincode={data?.client?.pincode}
                phone={data?.client?.phone}
                gst={data?.client?.gst_number}
                stateCode={data?.client?.state_code}
              />
            </div>

            {/* Right - DC Details — p-4→px-3 py-2, space-y-2→space-y-0.5, text-[13px]→text-[11px] */}
            <div className="w-[40%] px-3 py-2 flex flex-col space-y-0.6 leading-6">
              {[
                { label: "DC No", value: data?.inward_dc_no },
                { label: "Date", value: data?.dc_date ? new Date(data.dc_date).toLocaleDateString("en-GB") : "" },
                { label: "Your Dc No", value: partyDcNos },
                { label: "Your Dc Date", value: partyDcDates },
                { label: "Despatch", value: data?.despatch_through || "" },
              ].map((row, i) => (
                <div key={i} className="flex text-[11px] font-bold">
                  <div className="w-[90px] uppercase">{row.label}</div>
                  <div className="w-[15px]">:</div>
                  <div className="flex-1 uppercase">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Table — p-2→p-1, text-[13px]→text-[11px], removed flex tricks */}
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
                    <td className="border-r-2 border-black px-2 py-1 text-[11px] font-bold uppercase">{item.item_name} {item.sl_no}</td>
                    <td className="border-r-2 border-black p-1 text-center text-[11px]">{item.hsn}</td>
                    <td className="border-r-2 border-black p-1 text-center text-[11px]">{fmtQty(item.quantity)}</td>
                    <td className="border-black px-2 py-1 text-[11px] uppercase text-center">{item.remarks || ""}</td>
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

          {/* Footer — min-h-[90px]→min-h-[68px], text-[14px]→text-[12px], mt-5→mt-3 */}
          <div className="relative min-h-[68px] px-3 py-1">
            <div>
              <p className="text-[12px] font-bold">Received the goods in good condition</p>
              <p className="text-[12px] mt-3 font-bold uppercase relative top-3">Receiver's Signature</p>
            </div>
            <div className="absolute right-6 bottom-5 text-right">
              <h2 className="text-red-600 text-[13px] font-extrabold mb-2 uppercase">For ASWITHA TECH</h2>
              <h3 className="text-[11px] font-bold uppercase tracking-tight relative top-4">Authorised Signatory</h3>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white w-full py-2 flex flex-col justify-center items-center print:py-0 print:bg-white">
      {renderChallan("(ORIGINAL COPY)")}

      {/* Dashed divider between copies */}
      <div className="w-[200mm] mt-10 border-t py-2  border-dashed border-black print:mt-10"></div>

      {renderChallan("(DUPLICATE COPY)")}

      <style>{`
        @page {
          size: A4 portrait;
          margin: 5mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
          .bg-white {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryChallan;
