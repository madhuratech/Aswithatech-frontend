import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";
import { toWords } from "number-to-words";


const Billwiseformat = ({ billNo, title }) => {
  const [purchase, setPurchase] = useState({
    items: [],
    client: {},
  });

  const Api_url = "http://localhost:3000/api/billpayment";

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

  return (
    <div className="w-full flex justify-center items-start py-6 overflow-auto ">
      <div className="w-[190mm] border-2 border-black bg-white relative shadow-lg overflow-hidden">
        {/* HEADER */}
        <div className="flex border-b-2 border-black">
          {/* Left - Logo */}
          <div className="w-[50%] p-3 border-r-2 border-black">
            <img src={logo} alt="logo" className="w-[200px] mb-2" />
            <h2 className="text-[13px] font-bold mt-4">GSTIN : 33GYLPS7134C1Z9</h2>
          </div>

          {/* Right - Company Details */}
          <div className="w-[50%] p-3">
            <h1 className="text-red-600 text-[26px] font-extrabold mb-1 leading-tight">
              ASWITHA TECH
            </h1>
            <div className="text-[12px] font-bold space-y-1">
              <p>231-D, Sri Balaji Nilayam,</p>
              <p>Venkataswamy Road New Siddhapudur,</p>
              <p>Coimbatore-641 044 TamilNadu.</p>
              <p>Email : aswithatech2020@gmail.com</p>
              <p>PH : 80725 37036, 96551 48537</p>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="flex border-b border-black">
          {/* Left - To Section */}
          <div className="w-[60%] p-4 min-h-[140px] border-r-2 border-black">
            <h2 className="text-[15px] font-bold mb-1">To:</h2>
            <h2 className="text-[14px] font-bold uppercase mb-1">
              {purchase?.supplier_name}
            </h2>
            <div className="text-[12px] leading-5 font-medium max-w-[350px]">
              <p>{purchase?.address}</p>
              <p>{purchase?.state} - {purchase?.pincode}</p>
              <p className="mt-2 font-bold">Ph: {purchase?.phone}</p>
              <p className="font-bold">GSTIN : {purchase?.gst_number}</p>
            </div>
          </div>

          {/* Right - Document Details */}
          <div className="w-[40%] flex flex-col">
            <div className="border-b-2 border-black p-2 text-center">
              <h2 className="text-[16px] font-bold tracking-widest uppercase">Billwise Payments</h2>
            </div>
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
              <div className="flex text-[13px] font-bold">
                <div className="w-[80px]">Bill No</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1">{purchase?.items?.[0]?.bill_no}</div>
              </div>
              <div className="flex text-[13px] font-bold">
                <div className="w-[80px]">Bill Date</div>
                <div className="w-[20px] text-center">:</div>
                <div className="flex-1">{purchase?.entry_date}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGE SECTION */}
        <div className="p-4 border-b border-black">
          <p className="text-[13px] font-bold mb-1">Dear Sir / Madam,</p>
          <p className="text-[12px] leading-5 indent-16 text-justify">
            Kindly arrange to dispatch the under mentioned quality items at the earliest possible in accordance with our instructions. Please mention our PO No & Date in your Bill or Correspondence. Kindly acknowledge this order immediately.
          </p>
        </div>

        {/* TABLE SECTION */}
        <div className="min-h-[245px] flex flex-col overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-black">
                <th className=" border-r-2 border-black p-2 w-[5%] text-center text-[12px]">S.No</th>
                <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Bill No</th>
                <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Bill Date</th>
                <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Bill Amount</th>
                <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Paid Amount</th>
                <th className="border-r-2 border-black p-2 w-[15%] text-center text-[12px]">Balance</th>
                <th className="p-2 w-[20%] border-black text-center text-[12px]">Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, index) => (
                <tr key={index} className="border-b-2 border-black min-h-[35px]">
                  <td className=" border-r-2 border-black p-2 text-center text-[12px]">{index + 1}</td>
                  <td className="border-r-2 border-black px-3 py-2 text-[12px] text-center font-medium">{item.bill_no}</td>
                  <td className="border-r-2 border-black p-2 text-center text-[12px]">{item.bill_date}</td>
                  <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.bill_amount).toFixed(2)}</td>
                  <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.paid_amount).toFixed(2)}</td>
                  <td className="border-r-2 border-black p-2 text-right text-[12px] pr-4">{Number(item.balance_amount).toFixed(2)}</td>
                  <td className="p-2 text-center text-[12px] border-black font-bold">{item.payment_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SUMMARY SECTION */}
        <div className="border-t-2 border-black flex">
          <div className="w-[70%] border-r-2 border-black p-4 space-y-2 flex flex-col justify-center">
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
          <div className="w-[30%] border-black">
            <div className="flex border-b border-black">
              <div className="w-[50%] p-2 text-[12px] font-bold border-r border-black">SUB Total </div>
              <div className="w-[50%] p-2 text-[12px] font-bold text-right pr-4">{Number(purchase.subtotal || 0).toFixed(2)}</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-[50%] p-2 text-[12px] font-bold border-r border-black">GST @18.00% </div>
              <div className="w-[50%] p-2 text-[12px] font-bold text-right pr-4">{Number(gst).toFixed(2)}</div>
            </div>
            <div className="flex bg-gray-50">
              <div className="w-[50%] p-2 text-[13px] font-extrabold border-r border-black">NET TOTAL </div>
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
        <div className="border-t-2 border-black px-4 pt-2 pb-1 relative">
          <div className="right-8 text-right">
            <h2 className="text-[14px] font-bold mb-4">For ASWITHA TECH</h2>
            <h3 className="text-[13px] font-bold border-t border-black pt-1 inline-block">Authorized Signatory</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billwiseformat;