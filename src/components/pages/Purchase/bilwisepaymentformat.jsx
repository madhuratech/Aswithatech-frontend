import React, { useEffect, useState } from "react";
import logo from "../../../asset/Logo.jpeg";
import { toWords } from "number-to-words";


const Billwiseformat = ({ billNo, title }) => {

  const [purchase, setPurchase] = useState({
    items: [],
    client: {},
  });


  const Api_url = "http://localhost:3000/api/billpayment"

  // Amount To Word Convert
  const amountInwords = (num) =>
    toWords(num).replace(/^\w/, c => c.toUpperCase()) + " Rupees Only";

  // Fetch All;

  useEffect(() => {

    const fetchdata = async () => {
      try {
        let finalbillno = billNo;

        // 🔥 FIX HERE
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

        console.log("FINAL BILL:", finalbillno);

        const res = await fetch(`${Api_url}/getbillno/${finalbillno}`);
        const data = await res.json();

        console.log("DATA:", data);

        setPurchase({
          ...data,
          items: data.items || []
        });

      } catch (error) {
        console.log("Error fetching data", error);
      }
    };

    fetchdata();

  }, [billNo]);

  const gst = Number(purchase?.cgst || 0) + Number(purchase?.sgst || 0);


  return (
    <div className="flex-1 bg-white p-6 overflow-auto custom-scrollbar">
      <div className="w-full flex justify-center mt-6">
        <div className="w-[900px] bg-white shadow-lg relative">

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
              <div className="absolute left-[-36px] h-[70px] top-4 right-10 inset-0 bg-[#7a0000] skew-x-[-20deg]" />

              {/* Black overlay */}
              <div className="absolute top-2 right-6 w-full h-[100px] bg-black skew-x-[-1deg] flex items-center px-6 ">

                <p className="  text-white text-xs leading-relaxed skew-x-[1deg]">
                  231d, Sri Balaji Nilayam,<br />
                  Venkataswamy Road,<br />
                  Ravindranath Layout, Coimbatore-641044,<br />
                  Tamil Nadu.
                </p>

              </div>
            </div>

          </div>


          {/* 📄 CONTENT AREA */}
          <div className="relative z-10 px-10 ">
            <div className="flex justify-between ">
              <div>
                <h2 className="font-medium text-green-600">To:</h2>
                <h4 className="font-medium text-black">{purchase?.supplier_name}</h4>
                <p className="text-black">{purchase?.address},{purchase?.state}-{" "}{purchase?.pincode}<br />
                </p>

                <div className="mt-5">
                  <p className="text-black"><span className="text-medium">Phone :</span>{purchase?.phone}</p>
                  <p className="text-black"><span className="text-medium"> Email : {purchase?.email}</span></p>
                  <p className="text-black"><span className="text-medium"> GSTN : {purchase?.gst_number}</span></p>

                </div>
              </div>
              {/* Purchase Order Details */}
              <div>
                <h2 className="font-bold border-b pb-2 border-gray-800">BILLWISE PAYMENTS</h2>
                <h4 className="font-medium mt-6">Bill No : <span className="text-black text-sm">
                  {purchase?.items?.[0]?.bill_no}</span></h4>
                <h4 className="font-medium">Bill Date : <span className="text-black text-sm">{purchase?.entry_date}</span></h4>
              </div>
            </div>
            {/* Border */}

            <div className="border-b border-gray-300 w-[110%] relative right-10 top-6"></div>

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
                    <th className="border p-2 text-left">Bill Number</th>
                    <th className="border p-2 w-[120px]">Bill Date</th>
                    <th className="border p-2 w-[120px]">Bill Amount</th>
                    <th className="border p-2 w-[140px]">Paid Amount</th>
                    <th className="border p-2 w-[140px]">Balance Amount</th>
                    <th className="border p-2 w-[140px]">Mode Of Pay</th>


                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((items, i) => (
                      <tr key={i}>
                        <td className="border text-center">{i + 1}</td>
                        <td className="border p-2">{items.bill_no}</td>
                        <td className="border text-center">{items.bill_date}</td>
                        <td className="border text-center">{items.bill_amount}</td>
                        <td className="border text-center">{items.paid_amount}</td>
                        <td className="border text-center">{items.balance_amount}</td>
                        <td className="border text-center">{items.payment_mode}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center h-[100px]  p-4">No Items Found</td>
                    </tr>
                  )}
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

                  <div className="flex justify-between px-4 py-2 font-bold">
                    <span>NET TOTAL</span>
                    <span>{purchase.grand_total}</span>
                  </div>

                </div>
              </div>

              {/*  */}


              <div className="border p-2 border-t-0">
                <h2 className="font-bold text-black "><span className="text-medium text-gray-600"> Rupees </span> : {amountInwords(purchase.grand_total || 0).toUpperCase()}</h2>
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
          <div className="w-full bg-[#2b2b2b] text-white flex justify-between px-6 py-3 text-sm mt-10">
            <span>✉ aswithatech2020@gmail.com</span>

            <span>📞 +91 8072537036 | +91 9655148537</span>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Billwiseformat;