import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";
import { toWords } from "number-to-words";


const POLayout = ({poNumber}) => {

  const [purchase, setPurchase] = useState({
  items: [],
  client: {},
});

// Amount To Word Convert

const amountInwords = (num) =>
  toWords(num).replace(/^\w/, c => c.toUpperCase()) + " Rupees Only";
 


  // Fetch All;
useEffect(() => {
  if (!poNumber || poNumber === "") return;

  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/purchaseorders/full/${poNumber}`
      );

      const data = await res.json();

      setPurchase({
        ...data,
        items: data.items || [],
        client: data.client || {},
      });

    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  fetchData();
}, [poNumber]);


 

const gst = Number(purchase?.cgst || 0) + Number(purchase?.sgst || 0);
  return (

    <div className="min-h-screen">
      <div className="flex justify-center  min-h-screen ">

        {/* Page Container (A4 Ratio) */}
        <div className="w-[800px] h-[1300px] bg-white relative shadow-lg overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-[25px] bg-[#7a0000]" />

          {/* HEADER */}
          <div className="flex justify-between items-center px-6 pt-12 border-b pb-6 mb-4">

            {/* LEFT LOGO */}
            <div className="">
              <img src={logo} alt="logo" className="w-[250px]  object-contain" />
              <div className="mt-5 ml-14">
                <h2 className="text-[12px] font-semibold mt-2">GSTIN: 33EJPPS7633D1Z1</h2>
              </div>
            </div>

            {/* RIGHT ANGLED ADDRESS */}

            <div className="relative w-[320px] h-[80px] left-12">
              <div className="mt-[-35px] ml-[16px]">
                <h2 className="text-red-600 font-bold text-[24px]">ASHWITHA TECH</h2>
              </div>
              {/* Red background shape */}
              <div className="absolute left-[-40px] h-[70px] top-4 right-20 inset-0 bg-[#7a0000] skew-x-[-20deg]" />

              {/* Black overlay */}
              <div className="absolute top-2 right-2 w-full h-[90px] bg-black skew-x-[-20deg] flex items-center px-6 ">

                <p className="  text-white text-xs leading-relaxed skew-x-[20deg]">
                  231d, Sri Balaji Nilayam,<br />
                  Venkataswamy Road,<br />
                  Ravindranath Layout, Coimbatore-641044,<br />
                  Tamil Nadu.
                </p>

              </div>
            </div>

          </div>

          {/* 💧 WATERMARK CENTER */}
          <div className="absolute top-80 inset-0 flex items-center justify-center opacity-10">
            <img src={logo} alt="watermark" className="w-[450px]" />
          </div>

          {/* 📄 CONTENT AREA */}
          <div className="relative z-10 px-10 ">
            <div className="flex justify-between ">
              <div>
                <h2 className="font-medium text-green-600">To:</h2>
                <h4 className="font-medium text-black">{purchase?.client?.customer_name}</h4>
                <p className="text-black">{purchase?.client?.address},{purchase?.client?.state}-{" "}{purchase?.client?.pincode}<br />
                </p>

                <div className="mt-5">
                  <p className="text-black"><span className="text-medium">Phone :</span>{purchase?.client?.phone}</p>
                  <p className="text-black"><span className="text-medium"> Email : {purchase?.client?.email}</span></p>
                  <p className="text-black"><span className="text-medium"> GSTN : {purchase?.client?.gst_number}</span></p>

                </div>
              </div>
              {/* Purchase Order Details */}
              <div>
                <h2 className="font-bold border-b pb-2 border-gray-800">PURCHASE ORDER</h2>
                <h4 className="font-medium mt-6">Po No : <span className="text-black text-sm">
                  {purchase?.po_number}</span></h4>
                <h4 className="font-medium">Po Date : <span className="text-black text-sm">{purchase?.po_date}</span></h4>
              </div>
            </div>
            {/* Border */}

            <div className="border-b border-gray-300 w-[120%] relative right-10 top-6"></div>

            {/* Dear Sir Madam */}

            <div className="mt-10">
              <h2 className="font-medium">Dear Sir / Madam ,</h2>
              <p className="text-sm text-black leading-6  indent-36">Kindly arrange to dispatch the under mentioned quality items at the earlised
                possible in accordance with our instructions. Please mention our PO No & Date in your Bill or
                Correspondence. Kindly acknowledge this order immedialtely.</p>
            </div>

            {/* Table */}
            <div className="mt-5 w-full">
              <table className="w-full border text-sm border-collapse">

                {/* HEADER */}
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 w-[60px]">S.No</th>
                    <th className="border p-2 text-left">Description of Goods</th>
                    <th className="border p-2 w-[120px]">Quantity</th>
                    <th className="border p-2 w-[120px]">Rate</th>
                    <th className="border p-2 w-[140px]">Amount</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((items, i) => (
                      <tr key={i}>
                        <td className="border text-center">{i + 1}</td>
                        <td className="border p-2">{items.item_name}</td>
                        <td className="border text-center">{items.quantity}</td>
                        <td className="border text-center">{items.price}</td>
                        <td className="border text-center">{items.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center p-4">No Items Found</td>
                    </tr>
                  )}


                  {/* EMPTY SPACE ROW (to maintain height like your design) */}
                  <tr>
                    <td className="border h-[350px]"></td>
                    <td className="border"></td>
                    <td className="border"></td>
                    <td className="border"></td>
                    <td className="border"></td>
                  </tr>
                </tbody>
              </table>

              {/*  */}
              <div className="w-full p-2 border-t-0 flex justify-end border">
                <div className="w-[300px] text-sm ">

                  <div className="flex justify-between px-4 py-2 ">
                    <span className="font-medium">SUB Total</span>
                    <span className="font-medium">{purchase.subtotal}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 ">
                    <span>GST @18.00%</span>
                    <span>{Number(gst).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 ">
                    <span>TDS</span>
                    <span>{purchase.tds || 0}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-bold">
                    <span>NET TOTAL</span>
                    <span>{purchase.grandTotal}</span>
                  </div>

                </div>
              </div>

              {/*  */}


              <div className="border p-2 border-t-0">
                <h2 className="font-bold text-black "><span className="text-medium text-gray-600"> Rupees </span> : {amountInwords(purchase.grandTotal || 0).toUpperCase()}</h2>
              </div>

              <div className="border border-t-0 p-2">
                <div className="flex gap-5 justify-end">
                  <span className="font-medium text-black">For : </span>
                  <h3 className="font-medium text-black">ASHWITHA TECH</h3>
                </div>
                <div className="flex justify-end mt-5">
                  <p className="">Authorized Signature</p>
                </div>
              </div>

            </div>

          </div>

          {/* ⚫ BOTTOM BAR */}
          <div className="absolute bottom-0 left-0 w-full bg-[#2b2b2b] text-white flex justify-between px-6 py-3 text-sm">

            <span>✉ aswithatech2020@gmail.com</span>

            <span>📞 +91 8072537036 | +91 9655148537</span>

          </div>
        </div>
      </div>
    </div>
  );
};

export default POLayout;