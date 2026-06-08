import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";

const DeliveryChallan = ({ dcNumber }) => {

  const [data, setData] = useState({
    items: [],
    client: {},
  });

  // Fetch All

  useEffect(() => {
    if (!dcNumber || dcNumber === "") return;

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/servicedcentry/full/${encodeURIComponent(dcNumber)}`
        );

        const data = await res.json();

        setData({
          ...data,
          items: data.items || [],
          client: data.client || {}
        });
      } catch (error) {
        console.log("Fetch Error", error);
      }
    }
    fetchData();
  }, [dcNumber]);


  return (
    <div className="bg-white w-full py-4">
      <div className="w-full min-h-[190mm] max-w-[200mm]   mx-auto bg-white border-2 border-black shadow-sm"
        style={{ boxSizing: "border-box", overflow: "hidden" }}
      >
        <div className="flex justify-between items-center px-8 py-3 font-bold text-[18px]">
          <h1>DELIVERY CHALLAN</h1>
          <h1>(ORIGINAL COPY)</h1>
        </div>

        {/* Company */}
        <div className="flex flex-col justify-center items-center text-center border-y-2 border-black p-2 h-[120px]">
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

        {/* Customer Details */}
        <div className="flex border-b-2 border-black">

          {/* Left */}
          <div className="w-[60%] p-4 min-h-[140px] border-r-2 border-black">

            <h2 className="text-[15px] font-bold mb-2 uppercase">
              TO: M/S.{data?.supplier_name}
            </h2>

            <div className="text-[13px] leading-6 font-medium">
              <p>{data?.client?.address || ""}</p>
              <p>{data?.client?.state || ""}</p>
              <p>PH : {data?.client?.phone || ""}</p>
              <p>Email : {data?.client?.email || ""}</p>
            </div>

            <div className="flex gap-10 mt-4">
              <h3 className="text-[13px] font-bold">
                GSTIN : {data?.client?.gst_number || ""}
              </h3>
              <h3 className="text-[13px] font-bold">
                ST CODE :
              </h3>
            </div>

          </div>

          {/* Right */}
          <div className="w-[40%] p-4">

            <div className="flex text-[13px] mb-2 font-bold">
              <div className="w-[100px]">DC No</div>
              <div className="w-[20px]">:</div>
              <div className="flex-1">{data?.inward_dc_no}</div>
            </div>

            <div className="flex text-[13px] mb-2 font-bold">
              <div className="w-[100px]">Date</div>
              <div className="w-[20px]">:</div>
              <div className="flex-1">
                {data?.dc_date ? new Date(data?.dc_date).toLocaleDateString('en-GB') : ""}
              </div>
            </div>

            <div className="flex text-[13px] mb-2 font-bold">
              <div className="w-[100px]">Your Dc No</div>
              <div className="w-[20px]">:</div>
              <div className="flex-1">{data?.party_dc_no}</div>
            </div>

            <div className="flex text-[13px] mb-2 font-bold">
              <div className="w-[100px]">Your Dc Date</div>
              <div className="w-[20px]">:</div>
              <div className="flex-1">
                {data?.party_dc_date
                  ? new Date(data?.party_dc_date).toLocaleDateString('en-GB')
                  : ""}
              </div>
            </div>

            <div className="flex text-[13px] font-bold">
              <div className="w-[100px]">Despatch</div>
              <div className="w-[20px]">:</div>
              <div className="flex-1">{data?.despatch_through}</div>
            </div>

          </div>

        </div>

        {/* Table */}
        <table className="w-full border-collapse">

          <thead>
            <tr className="bg-gray-50">
              <th className="border-r-2 border-b-2 border-black p-2 w-[8%] text-center text-[13px]">
                SNO
              </th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[47%] text-center text-[13px]">
                PARTICULARS
              </th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[15%] text-center text-[13px]">
                HSN
              </th>
              <th className="border-r-2 border-b-2 border-black p-2 w-[10%] text-center text-[13px]">
                QTY
              </th>
              <th className="border-b-2 border-black p-2 w-[20%] text-center text-[13px]">
                REMARKS
              </th>
            </tr>
          </thead>

          <tbody>
            {data?.items?.length > 0 ? (
              data.items.map((item, index) => (
                <tr key={index} className="min-h-[40px]">
                  <td className="border-r-2 border-b-2 border-black p-2 text-center text-[13px]">
                    {index + 1}
                  </td>
                  <td className="border-r-2 border-b-2 border-black px-3 py-2 text-[13px] font-medium">
                    {item.item_name}
                  </td>
                  <td className="border-r-2 border-b-2 border-black p-2 text-center text-[13px]">
                    {item.hsn}
                  </td>
                  <td className="border-r-2 border-b-2 border-black p-2 text-center text-[13px]">
                    {item.quantity}
                  </td>
                  <td className="border-b-2 border-black px-3 py-2 text-[13px]">
                    {item.remarks}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border-b-2 border-black p-8 text-center text-gray-400">
                  No items found
                </td>
              </tr>
            )}

            <tr>
              <td
                colSpan={5}
                className="border-b-2 border-black text-center font-bold text-[18px] py-2"
              >
                {data?.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="relative min-h-[120px] mt-4 px-4 py-2">
          <div className="mt-4">
            <p className="text-[14px] font-medium">
              Received the goods in good condition
            </p>
            <p className="text-[14px] mt-8 font-bold">
              Receiver's Signature
            </p>
          </div>

          <div className="absolute right-8 bottom-4 text-right">
            <h2 className="text-red-600 text-[18px] font-bold mb-6">
              For ASWITHA TECH
            </h2>
            <h3 className="text-[15px] font-bold">
              Authorised Signatory
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChallan;