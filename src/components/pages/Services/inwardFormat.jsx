import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";

const InwardFormat = ({ dcNumber }) => {
  const [data, setData] = useState({ header: {}, items: [] });

  useEffect(() => {
    if (!dcNumber) return;
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/Inwardentries/edit/${encodeURIComponent(dcNumber)}`
        );
        const result = await res.json();
        setData({ header: result.header || {}, items: result.items || [] });
      } catch (error) {
        console.error("Inward fetch error:", error);
      }
    };
    fetchData();
  }, [dcNumber]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "";

  return (
    <div className="bg-white w-full py-4">
      <div
        className="w-full min-h-[190mm] max-w-[200mm] mx-auto bg-white border-2 border-black shadow-sm"
        style={{ boxSizing: "border-box", overflow: "hidden" }}
      >
        {/* Title */}
        <div className="flex justify-between items-center px-8 py-3 font-bold text-[18px] border-b-2 border-black">
          <h1>INWARD ENTRY</h1>
          <h1>(ORIGINAL COPY)</h1>
        </div>

        {/* Company Header */}
        <div className="border-b-2 border-black flex">
          <div className="w-[50%] p-3 border-r-2 border-black">
            <img src={logo} alt="logo" className="w-[200px] mb-2" />
            <h2 className="text-[14px] font-bold mt-4">GSTIN : 33GYLPS7134C1Z9</h2>
          </div>
          <div className="w-[50%] p-3">
            <h1 className="text-red-600 text-[26px] font-extrabold mb-1 leading-tight">
              ASWITHA TECH
            </h1>
            <div className="text-[13px] font-bold space-y-1">
              <p>231-D, Sri Balaji Nilayam,</p>
              <p>Venkataswamy Road New Siddhapudur,</p>
              <p>Coimbatore-641 044 TamilNadu.</p>
              <p>Email : aswithatech2020@gmail.com</p>
              <p>PH : 80725 37036, 96551 48537</p>
            </div>
          </div>
        </div>

        {/* Supplier & Entry Details */}
        <div className="flex border-b-2 border-black">
          {/* Left — Supplier */}
          <div className="w-[60%] p-4 min-h-[120px] border-r-2 border-black">
            <h2 className="text-[15px] font-bold mb-3 uppercase">
              FROM: M/S. {data.header?.supplier_name}
            </h2>
            <div className="text-[13px] font-medium space-y-1">
              <p>Transport : {data.header?.transport || "—"}</p>
              <p>Description : {data.header?.description_type || "—"}</p>
              {data.header?.remarks && <p>Remarks : {data.header.remarks}</p>}
            </div>
          </div>

          {/* Right — Numbers & Dates */}
          <div className="w-[40%] p-4">
            {[
              { label: "SL No", value: data.header?.sl_no },
              { label: "Entry Date", value: formatDate(data.header?.entry_date) },
              { label: "DC No", value: data.header?.dc_number },
              { label: "DC Date", value: formatDate(data.header?.dc_date) },
            ].map((row, i) => (
              <div key={i} className="flex text-[13px] mb-2 font-bold">
                <div className="w-[100px]">{row.label}</div>
                <div className="w-[20px]">:</div>
                <div className="flex-1">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-r-2 border-b-2 border-black p-2 w-[6%] text-center text-[13px]">SNO</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[30%] text-center text-[13px]">PARTICULARS</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[12%] text-center text-[13px]">HSN</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[8%] text-center text-[13px]">QTY</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[8%] text-center text-[13px]">UNIT</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[12%] text-center text-[13px]">PCB SL NO</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[12%] text-center text-[13px]">PROBLEMS</th>
              <th className="border-b-2 border-black p-2 w-[12%] text-center text-[13px]">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length > 0 ? (
              data.items.map((item, index) => (
                <tr key={index} className="min-h-[40px]">
                  <td className="border-r-2 border-b border-black p-2 text-center text-[13px]">{index + 1}</td>
                  <td className="border-r-2 border-b border-black px-3 py-2 text-[13px] font-medium">{item.item_name}</td>
                  <td className="border-r-2 border-b border-black p-2 text-center text-[13px]">{item.hsn}</td>
                  <td className="border-r-2 border-b border-black p-2 text-center text-[13px]">{item.quantity}</td>
                  <td className="border-r-2 border-b border-black p-2 text-center text-[13px]">{item.unit}</td>
                  <td className="border-r-2 border-b border-black p-2 text-center text-[13px]">{item.pcb_sl_no}</td>
                  <td className="border-r-2 border-b border-black px-3 py-2 text-[13px]">{item.problems}</td>
                  <td className="border-b border-black px-3 py-2 text-[13px]">{item.remarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border-b-2 border-black p-8 text-center text-gray-400">
                  No items found
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="border-r-2 border-b-2 border-black p-2 text-right font-bold text-[13px]">
                TOTAL
              </td>
              <td className="border-r-2 border-b-2 border-black p-2 text-center font-bold text-[15px]">
                {data.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)}
              </td>
              <td colSpan={4} className="border-b-2 border-black"></td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="relative min-h-[100px] mt-4 px-4 py-2">
          <div className="mt-4">
            <p className="text-[14px] font-medium">Received the goods in good condition</p>
            <p className="text-[14px] mt-8 font-bold">Receiver's Signature</p>
          </div>
          <div className="absolute right-8 bottom-4 text-right">
            <h2 className="text-red-600 text-[18px] font-bold mb-6">For ASWITHA TECH</h2>
            <h3 className="text-[15px] font-bold">Authorised Signatory</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InwardFormat;
