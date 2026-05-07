import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";
import { toWords } from "number-to-words";


const POLayout = ({QtNumber}) => {

  const [purchase, setPurchase] = useState({
  items: [],
  client: {},
});

// Amount To Word Convert

const amountInwords = (num) =>
  toWords(num).replace(/^\w/, c => c.toUpperCase()) + " Rupees Only";
 


  // Fetch All;
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
     client: data.client || {}
   });

    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  fetchData();
}, [QtNumber]);


   return (

    <div className="min-h-screen">
      <div className="flex justify-center  min-h-screen ">

        {/* Page Container (A4 Ratio) */}
        <div className="w-full max-w-[1000px] min-h-[1300px] bg-white relative shadow-lg flex flex-col">

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

            <div className="relative w-[310px] h-[80px] left-12">
              <div className="mt-[-35px] ml-[16px]">
                <h2 className="text-red-600 font-bold text-[24px]">ASHWITHA TECH</h2>
              </div>
              {/* Red background shape */}
              <div className="absolute left-[-35px] h-[70px] top-4 right-20 inset-0 bg-[#7a0000] skew-x-[-20deg]" />

              {/* Black overlay */}
              <div className="absolute top-2 right-6 w-full h-[90px] bg-black skew-x-[-1deg] flex items-center px-6 ">

                <p className="  text-white text-xs leading-relaxed skew-x-[deg]">
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
                <h2 className="font-bold border-b pb-1 border-gray-800 text-blue-800">QUOTATION</h2>
                <h4 className="font-medium mt-6">QT No : <span className="text-black text-sm">
                  {purchase?.quotation_no}</span></h4>
                <h4 className="font-medium">QT Date : <span className="text-black text-sm">{purchase?.quotation_date}</span></h4>
              </div>
            </div>
            {/* Border */}

            <div className="border-b border-gray-300 w-[111%] relative right-10 top-6"></div>

            {/* Dear Sir Madam */}

            <div className="mt-10">
              <h2 className="font-medium">Dear Sir / Madam ,</h2>
              <p className="text-sm text-black leading-6  indent-36">  we are pleased to submit our best offer for your requirments. 
                Expecting your favourable reply.</p>
            </div>

            {/* Table */}
            <div className="mt-5 w-full">
              <table className="w-full border text-sm border-collapse">

                {/* HEADER */}
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 w-[60px] text-blue-800">S.No</th>
                    <th className="border p-2 text-left text-blue-800">Description of Goods</th>
                    <th className="border p-2 w-[120px] text-blue-800">Quantity</th>
                    <th className="border p-2 w-[120px] text-blue-800">Rate</th>
                    <th className="border p-2 w-[140px] text-blue-800">Amount</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((items, i) => (
                      <tr key={i}>
                        <td className="border text-center">{i + 1}</td>
                        <td className="border p-2">{items.item_name}</td>
                        <td className="border text-center">{items.quantity} { items.uom}</td>
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
              <div className="w-full p-2 border-t-0 flex justify-between item-start border">
                <div className="w-[55%] leading-7 text-sm">

                  <h3 className="font-semibold text-blue-800 mb-2">
                  We request you to send your valuable purchase order immediately
                 </h3>

                  <div className="grid grid-cols-[160px_10px_1fr] gap-y-1">
                   <span>1. Payment</span> <span>:</span> <span>{purchase.payment_terms}</span>
                    <span>2. Delivery Period</span> <span>:</span> <span>{purchase.delivery_period}</span>
                   <span>3. Packing</span> <span>:</span> <span>{purchase.pack_frd}</span>
                  <span>4. Transport</span> <span>:</span> <span>{purchase.transport_terms}</span>
                    <span>5. Validity</span> <span>:</span> <span>{purchase.validity}</span>
                      <span>6. Warranty</span> <span>:</span> <span>{purchase.waranty}</span>
                     </div>
                     </div>



                <div className="w-[260px] text-sm">

              <div className="flex justify-between py-1">
                <span>SUB Total</span>
                 <span>{Number(purchase.subtotal || 0).toFixed(2)}</span>
                   </div>

                  <div className="flex justify-between py-1">
                 <span>CGST @9%</span>
                <span>{Number(purchase.cgst || 0).toFixed(2)}</span>
                 </div>

                <div className="flex justify-between py-1">
                   <span>SGST @9%</span>
                 <span>{Number(purchase.sgst || 0).toFixed(2)}</span>
               </div>

                <div className="flex justify-between py-1">
                 <span>IGST</span>
                <span>{Number(purchase.igst || 0).toFixed(2)}</span>
                </div>

               <div className="flex justify-between py-2 font-bold border-t mt-2">
                <span>NET TOTAL</span>
                <span>{Number(purchase.grandTotal || 0).toFixed(2)}</span>
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
                   <p>{purchase.for_sign}</p> 
                  <p className="">Authorized Signature</p>
                </div>
              </div>

            </div>

          </div>

          {/* ⚫ BOTTOM BAR */}
          <div className="mt-auto w-full bg-[#2b2b2b] text-white flex justify-between px-6 py-3 text-sm">

            <span>✉ aswithatech2020@gmail.com</span>

            <span>📞 +91 8072537036 | +91 9655148537</span>

          </div>
        </div>
      </div>
    </div>
  );
};

export default POLayout;