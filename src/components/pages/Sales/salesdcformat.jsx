import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";

const SalesDCFormat = ({ dcNumber }) => {
  const [data, setData] = useState({
    items: [],
    client: {},
  });

  useEffect(() => {
    if (!dcNumber || dcNumber === "") return;

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/salesdc/full/${encodeURIComponent(dcNumber)}`);
        const data = await res.json();
        setData(data);
      } catch (error) {
        console.error("Fetch Error in SalesDCFormat", error);
      }
    };
    fetchData();
  }, [dcNumber]);

  return (
    <div className="bg-white w-full py-4 flex justify-center items-start">
      <div className="w-[200mm] border-2 border-black bg-white relative flex flex-col"
        style={{ minHeight: "190mm", boxSizing: "border-box", overflow: "hidden" }}
      >
        <div className="flex justify-between items-center px-8 py-3 font-bold text-[18px]">
          <h1>DELIVERY CHALLAN</h1>
          <h1>(ORIGINAL COPY)</h1>
        </div>

        {/* Company Section */}
        <div className="border-y-2 border-black flex">
          {/* Left */}
          <div className="w-[50%] p-3 border-r-2 border-black flex flex-col justify-center">
            <img
              src={logo}
              alt="logo"
              className="w-[200px] mb-2"
            />
            <h2 className="text-[14px] font-bold mt-4 uppercase">
              GSTIN : 33GYLPS7134C1Z9
            </h2>
          </div>

          {/* Right */}
          <div className="w-[50%] p-3 flex flex-col justify-center">
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

        {/* Customer & DC Details */}
        <div className="flex border-b-2 border-black">
          {/* Left - Customer */}
          <div className="w-[60%] p-4 min-h-[140px] border-r-2 border-black">
            <h2 className="text-[15px] font-bold mb-2 uppercase">
              TO: M/S.{data?.customer_name}
            </h2>
            <div className="text-[13px] leading-6 font-medium uppercase">
              <p>{data?.client?.address || ""}</p>
              <p>{data?.client?.state || ""} {data?.client?.pincode || ""}</p>
              <p>PH : {data?.client?.phone || ""}</p>
              <p>Email : {data?.client?.email || ""}</p>
            </div>
            <div className="flex gap-10 mt-4">
              <h3 className="text-[13px] font-bold">
                GSTIN : {data?.client?.gst_number || ""}
              </h3>
              <h3 className="text-[13px] font-bold uppercase">
                ST CODE : {data?.client?.state_code || ""}
              </h3>
            </div>
          </div>

          {/* Right - DC Details */}
          <div className="w-[40%] p-4 flex flex-col space-y-2">
            {[
              { label: "DC No", value: data?.dc_no },
              { label: "Date", value: data?.dc_date ? new Date(data.dc_date).toLocaleDateString('en-GB') : "" },
              { label: "Your Dc No", value: data?.order_no || "" },
              { label: "Your Dc Date", value: data?.order_date ? new Date(data.order_date).toLocaleDateString('en-GB') : "" },
              { label: "Despatch", value: data?.despatch_through || "" }
            ].map((row, i) => (
              <div key={i} className="flex text-[13px] font-bold">
                <div className="w-[100px] uppercase">{row.label}</div>
                <div className="w-[20px]">:</div>
                <div className="flex-1 uppercase">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-r-2 border-b-2 border-black p-2 w-[8%] text-center text-[13px] font-bold uppercase">SNO</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[47%] text-center text-[13px] font-bold uppercase">PARTICULARS</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[15%] text-center text-[13px] font-bold uppercase">HSN</th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[10%] text-center text-[13px] font-bold uppercase">QTY</th>
              <th className="border-b-2 border-black p-2 w-[20%] text-center text-[13px] font-bold uppercase">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((item, index) => (
              <tr key={index} className="min-h-[40px]">
                <td className="border-r-2 border-b-2 border-black p-2 text-center text-[13px] font-medium">
                  {index + 1}
                </td>
                <td className="border-r-2 border-b-2 border-black px-3 py-2 text-[13px] font-bold uppercase">
                  {item.item_name}
                </td>
                <td className="border-r-2 border-b-2 border-black p-2 text-center text-[13px]">
                  {item.hsn}
                </td>
                <td className="border-r-2 border-b-2 border-black p-2 text-center text-[13px]">
                  {item.quantity}
                </td>
                <td className="border-b-2 border-black px-3 py-2 text-[13px] uppercase">
                   {item.remarks || data.status}
                </td>
              </tr>
            ))}
            {/* Filler rows to maintain height */}
            {/* {Array.from({ length: Math.max(0, 10 - (data?.items?.length || 0)) }).map((_, i) => (
              <tr key={`filler-${i}`} className="h-[35px]">
                <td className="border-r-2 border-b-2 border-black"></td>
                <td className="border-r-2 border-b-2 border-black"></td>
                <td className="border-r-2 border-b-2 border-black"></td>
                <td className="border-r-2 border-b-2 border-black"></td>
                <td className="border-b-2 border-black"></td>
              </tr>
            ))} */}
            <tr>
              <td colSpan={5} className="border-b-2 border-black text-center font-bold text-[18px] py-2">
                {data?.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="relative min-h-[150px] mt-4 px-4 py-2">
          <div>
            <p className="text-[14px] font-bold">Received the goods in good condition</p>
            <p className="text-[14px] mt-10 font-bold uppercase">Receiver's Signature</p>
          </div>

          <div className="absolute right-8 bottom-4 text-right">
            <h2 className="text-red-600 text-[20px] font-extrabold mb-8 uppercase">For ASWITHA TECH</h2>
            <h3 className="text-[15px] font-bold uppercase tracking-tight">Authorised Signatory</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDCFormat;
