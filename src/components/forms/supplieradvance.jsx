import API_BASE_URL from "../../config/api";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { errorToast, successToast } from "../ui/nottifications";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const Supplieradvance = () => {

   const navigate = useNavigate();
   const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();
   const [modeopen , setModeopen] = useState(false);
   const [receipt, setReceipt] = useState("");
   const [receiptlist , setReceiptlist] = useState([]);
   const [loadclients, setloadclients] = useState(false);
   const [clientname , setclientName] = useState([]);
   const [loadreceipt , setloadreceipt] = useState("");   

   const [clientOpen , setClientopen] = useState(false);
   const [receiptsearch, setreceiptsearch] = useState(false);
   const [banks, setBanks] = useState([]);
   const [bankOpen, setBankOpen] = useState(false);

   const [pototal , setTotal] = useState(0);

   // Refs for click outside
   const clientRef = useRef(null);
   const modeRef = useRef(null);
   const bankRef = useRef(null);
   const receiptRef = useRef(null);
   const suppAdvDateRef = useRef(null);
   const suppAdvDateFp = useRef(null);

   //Api
   const Api_urls = `${API_BASE_URL}/suppliers`;

   const [formData, setFormData] = useState({
       receipt_no:'',
       date:'',
       supplier_name:'',
       mode_of_payment:'',
       bank_name:'',
       ref_no:'',
       remarks:'',
       received_by:'',
       paid_amount:'',
       tds:'',
       others:''
   });

   //Load Recipt no;
   const loadReceipt = async(receiptNo) => {
     const receiptLoad = receiptNo || loadreceipt;
     try{
       if(!receiptLoad.trim()){
         return alert("Enter Receipt Number");
       }
       const res = await fetch(`${Api_urls}/search/${receiptLoad}`);
       const data = await res.json();
       if(!res.ok) throw new Error(data.message);

       setFormData({
         receipt_no:data.receipt_no || "",
         date:data.date || "",
         supplier_name:data.supplier_name || "",
         mode_of_payment:data.mode_of_payment || "",
         bank_name:data.bank_name || "",
         ref_no:data.ref_no || "",
         remarks:data.remarks || "",
         received_by:data.received_by || "",
         paid_amount:data.paid_amount || "",
         tds:data.tds || "",
         others:data.others || ""
       });

       setReceipt(receiptLoad);

     }catch(error){
          console.log("Error loading receipt",error);
     }
   };

   // Receipt Search
   const recepitsearch = async (value) => {
     try {
       const res = await fetch(`${Api_urls}/receipt_no`);
       const data = await res.json();
       setReceiptlist(Array.isArray(data) ? data : []);
     } catch (error) {
       console.log("receipt Failed");
     }
   };

   // Auto Gentrate receipt number next;
   useEffect(() =>{
       fetch(`${Api_urls}/getrecipt`)
       .then(res => res.json())
       .then(data => {
           if(data.receiptNo){
               setFormData(prevData => ({
                   ...prevData,
                   receipt_no:data.receiptNo
               }));
           }
       })
   // eslint-disable-next-line react-hooks/exhaustive-deps
   },[]);

   // loadclients
   useEffect(() =>{
       setloadclients(true);
       fetch(`${Api_urls}/clients`)
       .then(res => res.json())
       .then(data => {
           setclientName(Array.isArray(data) ? data : []);
       })
       .catch((error) => {
       console.warn("Retrying with backup client URL...");
       fetch(`${API_BASE_URL}/customers/all`)
       .then(res => res.json())
       .then(data =>{setclientName(Array.isArray(data) ? data : []);      
       }) 
     })
       .finally(() => setloadclients(false));
   // eslint-disable-next-line react-hooks/exhaustive-deps
   },[]);


   const filteredSuppliers = (clientname || [])
  .filter((client) =>
    (client.customer_name || "")
      .toLowerCase()
      .includes((formData.supplier_name || "").toLowerCase())
  )
  .sort((a, b) =>
    (a.customer_name || "").localeCompare(b.customer_name || "")
  );

    useEffect(() =>{
      if(!formData.supplier_name) return;
      const purchasetotal = async () =>{
        try{
          const res = await fetch(`${Api_urls}/purchase/${formData.supplier_name}`);
          const data =  await res.json();
          console.log("Data", data);
          setTotal(Number(data.grandTotal) || 0);
        }catch(error){
          console.log("ERROR",error);
        }
      };
      purchasetotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[formData.supplier_name]);

   // Save Supplier Advance
   const savesupplier = async () => {
     if (!formData.supplier_name?.trim()) {
       toast.error("Supplier Name is required");
       return;
     }
     if (!formData.date) {
       toast.error("Date is required");
       return;
     }
     if (!formData.paid_amount) {
       toast.error("Paid Amount is required");
       return;
     }
     const payload = {
       supplier_name: formData.supplier_name,
       receipt_no: formData.receipt_no,
       date: formData.date,
       payment_mode: formData.mode_of_payment,
       bank_name: formData.bank_name,
       ref_no: formData.ref_no,
       remarks: formData.remarks,
       received_by: formData.received_by,
       paid_amount: formData.paid_amount,
       tds: formData.tds,
       others: formData.others,
     };

     try {
       const isEdit = receipt && receipt !== "";
       const url = isEdit
         ? `${Api_urls}/update/${receipt}`
         : `${Api_urls}/create`;
       const method = isEdit ? "PUT" : "POST";

       const res = await fetch(url, {
         method,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload)
       });

       const text = await res.text();
       const data = text ? JSON.parse(text) : {};

       if (!res.ok) throw new Error(data.message || "Request failed");

       successToast(isEdit ? "Updated successfully" : "Created successfully");
     } catch (error) {
       console.error(error);
       errorToast("Failed To Create");
     }
   };

   const handleSave = () => {
     savesupplier();
   };

   const handleDelete = () => {
     deleteReceipt();
   };

   const balance =
       Number(pototal || 0) -
       Number(formData.paid_amount || 0) -
       Number(formData.tds || 0) -
       Number(formData.others || 0);

   // Today Date;
   useEffect(() => {
       const today = new Date().toISOString().split('T')[0];
       setFormData(prev => ({ ...prev, date: today }));
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
    suppAdvDateFp.current = flatpickr(suppAdvDateRef.current, {
        disableMobile: true,
        monthSelectorType: "static",
        dateFormat: "d-m-Y",
        defaultDate: formData.date ? toDmy(formData.date) : new Date(),
        onChange: (selectedDates, dateStr) => {
            setFormData(prev => ({ ...prev, date: toYmd(dateStr) }));
        },
    });
    return () => suppAdvDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

   useEffect(() => {
        if (suppAdvDateFp.current && formData.date) {
            suppAdvDateFp.current.setDate(toDmy(formData.date));
        }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [formData.date]);

   // delete recipt number;
   const deleteReceipt = async () => {
     if (!receipt) {
       alert("Select receipt first");
       return;
     }
     try {
       const res = await fetch(`${Api_urls}/delete/${receipt}`, {
         method: "DELETE"
       });
       const data = await res.json();
       if (!res.ok) throw new Error(data.message);
       toast.success("Deleted successfully");
       // reset form
       setReceipt("");
       setFormData({
         receipt_no: "",
         date: "",
         supplier_name: "",
         mode_of_payment: "",
         bank_name: "",
         ref_no: "",
         remarks: "",
         received_by: "",
         paid_amount: "",
         tds: "",
         others: ""
       });
     } catch (error) {
       toast.error(error.message);
     }
   };

   //Bank List:
   useEffect(() => {
     fetch("https://findmebank.com/api/v1/banks")
       .then((res) => res.json())
       .then((data) => {
         console.log("BANK API:", data);
         if (Array.isArray(data)) {
           setBanks(data);
         } else if (Array.isArray(data.data)) {
           setBanks(data.data);
         } else if (Array.isArray(data.banks)) {
           setBanks(data.banks);
         } else {
           setBanks([]); 
         }
       })
       .catch((err) => {
         console.error("Error fetching banks:", err);
         setBanks([]); 
       });
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Filter
   const filteredBanks = (banks || []).filter((bank) =>
     (bank.name || bank.bank_name || "")
       .toLowerCase()
       .includes(formData.bank_name.toLowerCase())
   );

   //resetform
   const resestForm = async () => {
     setReceipt("");
     setloadreceipt("");
     setFormData({
       receipt_no: "",
       date: new Date().toISOString().split('T')[0],
       supplier_name: "",
       mode_of_payment: "",
       bank_name: "",
       ref_no: "",
       remarks: "",
       received_by: "",
       paid_amount: "",
       tds: "",
       others: ""
     });

     const res = await fetch(`${Api_urls}/getrecipt`);
     const data = await res.json();
     if (data.receiptNo) {
       setFormData(prev => ({
         ...prev,
         receipt_no: data.receiptNo
       }));
     }
   };

   useOutsideClick([
     { ref: clientRef,  onClose: () => setClientopen(false) },
     { ref: modeRef,    onClose: () => setModeopen(false) },
     { ref: bankRef,    onClose: () => setBankOpen(false) },
     { ref: receiptRef, onClose: () => setreceiptsearch(false) },
   ]);

   // ── Shared styling classes from Sales Invoice ─────────────────────────
   const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
   const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
   const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
   const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

   return (
     <><div className="min-h-screen bg-gray-50/70 p-6 font-sans">
       {/* Back Button */}
       <button
         onClick={() => navigate(-1)}
         className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm"
       >
         ← Go Back
       </button>

       {/* Main Container Card */}
       <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
         
         {/* Title + Buttons */}
         <div className="flex justify-between items-start mb-8">
           <div>
             <h2 className="text-xl font-black text-gray-900 tracking-tight">Supplier Advance</h2>
             <p className="text-[12px] text-gray-400 mt-1">Supplier → Payment Info → Save</p>
           </div>
           <div className="flex gap-2">
             <button
               onClick={resestForm}
               className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors"
             >
               NEW
             </button>
             <button
               onClick={() => loadReceipt(loadreceipt)}
               className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors"
             >
               EDIT
             </button>
              <button
                onClick={handleSave}
                className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors"
              >
                SAVE
              </button>
              <button
                onClick={handleDelete}
                className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors"
              >
                DELETE
              </button>
             <button
               onClick={() => navigate(-1)}
               className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors"
             >
               CLOSE
             </button>
           </div>
         </div>

         {/* STEP 1 — Advance Info */}
         <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
             Step 1 — Advance Info
           </p>

           <div className="grid grid-cols-3 gap-5">
             {/* Supplier Name (Autocomplete) */}
             <div className="relative text-black" ref={clientRef}>
               <label className={labelCls}>Supplier Name <span className="text-red-500">*</span></label>
               <input
                 type="text"
                 value={formData.supplier_name}
                 onFocus={() => setClientopen(true)}
                 onChange={(e) => {
                   const value = e.target.value;
                   setFormData({ ...formData, supplier_name: value });
                   setClientopen(true);
                 }}
                 placeholder="Type to search supplier…"
                 className={inputCls}
               />
               {clientOpen && (
                 <div className={dropdownCls}>
                   {loadclients ? (
                     <div className="px-4 py-3 text-[13px] text-gray-400 italic">Loading suppliers...</div>
                   ) : Array.isArray(clientname) && clientname.length > 0 ? (
                     filteredSuppliers.map((client) => (
                       <div
                         key={client.id}
                         onClick={() => {
                           setFormData(prev => ({ ...prev, supplier_name: client.customer_name }));
                           setClientopen(false);
                         }}
                         className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                       >
                         {client.customer_name}
                       </div>
                     ))
                   ) : (
                     <div className="px-4 py-3 text-[13px] text-gray-400">No suppliers found</div>
                   )}
                 </div>
               )}
             </div>
             {/* Receipt No */}
             <div>
               <label className={labelCls}>Receipt No</label>
               <input
                 type="text"
                 value={formData.receipt_no}
                 readOnly
                 className={roInputCls}
               />
             </div>

             {/* Date */}
              <div>
                <label className={labelCls}>Date</label>
                <input
                  ref={suppAdvDateRef}
                  type="text"
                  placeholder="Select Date"
                  className={inputCls}
                  readOnly
                />
              </div>
           </div>
         </div>

         {/* STEP 2 — Payment Details */}
         <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
             Step 2 — Payment Details
           </p>
           <div className="grid grid-cols-3 gap-5">
             {/* Mode of Payment */}
             <div className="relative text-black" ref={modeRef}>
               <label className={labelCls}>Mode Of Payment</label>
               <input
                 type="text"
                 value={formData.mode_of_payment}
                 onFocus={() => setModeopen(true)}
                 onChange={(e) => setFormData({ ...formData, mode_of_payment: e.target.value })}
                 placeholder="Select or enter payment mode…"
                 className={inputCls}
               />
               {modeopen && (
                 <div className={dropdownCls}>
                   {["Cash", "Bank", "By Hand"].map((mode) => (
                     <div
                       key={mode}
                       onClick={() => {
                         setFormData({ ...formData, mode_of_payment: mode });
                         setModeopen(false);
                       }}
                       className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                     >
                       {mode}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Bank Name */}
             <div className="relative text-black" ref={bankRef}>
               <label className={labelCls}>Bank Name</label>
               <input
                 type="text"
                 value={formData.bank_name}
                 onFocus={() => setBankOpen(true)}
                 onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                 placeholder="Type to search bank…"
                 className={inputCls}
               />
               {bankOpen && (
                 <div className={dropdownCls}>
                   {filteredBanks.length > 0 ? (
                     filteredBanks.map((bank, index) => (
                       <div
                         key={index}
                         onClick={() => {
                           setFormData({ ...formData, bank_name: bank.name || bank.bank_name || "" });
                           setBankOpen(false);
                         }}
                         className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                       >
                         {bank.name || bank.bank_name || ""}
                       </div>
                     ))
                   ) : (
                     <div className="px-4 py-3 text-[13px] text-gray-400">No banks found</div>
                   )}
                 </div>
               )}
             </div>

             {/* Ref No */}
             <div>
               <label className={labelCls}>Ref No</label>
               <input
                 type="text"
                 value={formData.ref_no}
                 onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
                 placeholder="Reference Number"
                 className={inputCls}
               />
             </div>

             {/* Remarks */}
             <div>
               <label className={labelCls}>Remarks</label>
               <input
                 type="text"
                 value={formData.remarks}
                 onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                 placeholder="Enter Remarks"
                 className={inputCls}
               />
             </div>

             {/* Received By */}
             <div>
               <label className={labelCls}>Received By</label>
               <input
                 type="text"
                 value={formData.received_by}
                 onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                 placeholder="Received By"
                 className={inputCls}
               />
             </div>
           </div>
         </div>

         {/* STEP 3 — Calculations & Amount Details */}
         <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
             Step 3 — Calculations &amp; Amount Details
           </p>
           <div className="grid grid-cols-2 gap-10">
             
             {/* Left Inputs */}
             <div className="grid grid-cols-3 gap-5 items-start">
               {/* Paid Amount */}
               <div>
                 <label className={labelCls}>Paid Amount <span className="text-red-500">*</span></label>
                 <input
                   type="number"
                   value={formData.paid_amount || ""}
                   onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                   placeholder="0"
                   className={inputCls}
                 />
               </div>

               {/* TDS */}
               <div>
                 <label className={labelCls}>TDS</label>
                 <input
                   type="number"
                   value={formData.tds || ""}
                   onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                   placeholder="0"
                   className={inputCls}
                 />
               </div>

               {/* Others */}
               <div>
                 <label className={labelCls}>Others</label>
                 <input
                   type="number"
                   value={formData.others || ""}
                   onChange={(e) => setFormData({ ...formData, others: e.target.value })}
                   placeholder="0"
                   className={inputCls}
                 />
               </div>
             </div>

             {/* Right Summary Panel */}
             <div>
               <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3 max-w-sm ml-auto">
                 <div className="flex justify-between items-center">
                   <span className="text-[12px] font-black text-gray-500 uppercase">Grand Total (PO)</span>
                   <span className="text-[13px] font-bold text-gray-900">₹{Number(pototal || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[12px] font-black text-gray-500 uppercase">Paid Amount (−)</span>
                   <span className="text-[13px] font-semibold text-gray-700">₹{Number(formData.paid_amount || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[12px] font-black text-gray-500 uppercase">TDS (−)</span>
                   <span className="text-[13px] font-semibold text-gray-700">₹{Number(formData.tds || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[12px] font-black text-gray-500 uppercase">Others (−)</span>
                   <span className="text-[13px] font-semibold text-gray-700">₹{Number(formData.others || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                   <span className="text-[15px] font-black text-black uppercase">Balance</span>
                   <span className="text-[20px] font-black text-indigo-700">₹{balance.toFixed(2)}</span>
                 </div>
               </div>
             </div>

           </div>
         </div>

         {/* BOTTOM: Search / Load Section */}
         <div className="grid grid-cols-2 gap-10 mt-8">
           
           {/* Load Existing Receipt */}
           <div className="pt-6 border-t border-gray-100">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
               Load / Edit Existing Receipt
             </p>
             <div className="relative w-64 text-black" ref={receiptRef}>
               <label className={labelCls}>Select Receipt No</label>
               <input
                 type="text"
                 value={loadreceipt}
                 onFocus={() => setreceiptsearch(true)}
                 onChange={(e) => {
                   const value = e.target.value;
                   setloadreceipt(value);
                   recepitsearch(value);
                 }}
                 className={`${inputCls} w-64`}
                 placeholder="Enter / Search Receipt No"
               />
               {receiptsearch && (
                 <div className={`${dropdownCls} w-64`}>
                   {receiptlist.length > 0 ? (
                     receiptlist.map((item, i) => (
                       <div
                         key={i}
                          onClick={() => {
                            setloadreceipt(item.receipt_no);
                            setreceiptsearch(false);
                            requirePassword(() => loadReceipt(item.receipt_no));
                          }}
                         className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                       >
                         {item.receipt_no}
                       </div>
                     ))
                   ) : (
                     <div className="px-4 py-3 text-[13px] text-gray-400">No receipts found</div>
                   )}
                 </div>
               )}
             </div>
           </div>

         </div>

        </div>
      </div>
      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </>);
};

export default Supplieradvance;
