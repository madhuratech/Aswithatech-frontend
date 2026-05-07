import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import{toast} from"react-hot-toast";
import { errorToast, successToast } from "../ui/nottifications";

const Supplieradvance = () => {

   const navigate = useNavigate();
   const[modeopen , setModeopen] = useState(false);
   const [receipt, setReceipt] = useState("");
   const[receiptlist , setReceiptlist] = useState([]);
   const [loadclients, setloadclients] = useState(false)
   const [clientname , setclientName] = useState([]);
   const [loadreceipt , setloadreceipt] = useState("");   

   const [clientOpen , setClientopen] = useState(false);
   const[receiptsearch, setreceiptsearch] = useState(false);
   const [banks, setBanks] = useState([]);
  const [bankOpen, setBankOpen] = useState(false);

  const [pototal , setTotal] = useState(0);

//Api
   const Api_urls = "http://localhost:3000/api/suppliers";

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
})

   //Load Recipt no;

   const loadReceipt = async(receiptNo) => {
  
     const receiptLoad = receiptNo || loadreceipt;

    try{
      if(!receiptNo.trim()){
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

//    Receipt Search

const recepitsearch = async (value) => {
  try {
    const res = await fetch(`${Api_urls}/receipt_no`);
    const data = await res.json();

    // convert to array if needed
    setReceiptlist(Array.isArray(data) ? data : []);
  } catch (error) {
    console.log("receipt Failed");
  }
};

//  Auto Gentrate receipt number next;
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
},[])

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
    fetch("http://localhost:3000/api/customers/all")
    .then(res => res.json())
    .then(data =>{setclientName(Array.isArray(data) ? data : []);      
    }) 
  })
    .finally(() => setloadclients(false));
},[]);

useEffect(() =>{
  if(!formData.supplier_name) return;
  const purchasetotal = async () =>{
    try{
      const res = await fetch(`${Api_urls}/purchase/${formData.supplier_name}`);
      const data =  await res.json();
      console.log("Data", data);
    setTotal(data.grandTotal || 0)
    }catch(error){
      console.log("ERROR",error);
    }
  };
    purchasetotal();

},[formData.supplier_name])



// Save Supplier Advance

const savesupplier = async () => {
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

    // SAFE JSON PARSE
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) throw new Error(data.message || "Request failed");

    successToast(isEdit ? "Updated successfully" : "Created successfully");

  } catch (error) {
    console.error(error);
    errorToast("Failed To Create");
  }
};


const balance =
    Number(pototal || 0) -
    Number(formData.paid_amount || 0) -
    Number(formData.tds || 0) -
    Number(formData.others || 0);

//  Today Date;

useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
}, []);

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
        setBanks([]); // fallback
      }
    })
    .catch((err) => {
      console.error("Error fetching banks:", err);
      setBanks([]); 
    });
}, []);


// Filter

const filteredBanks = (banks || []).filter((bank) =>
  (bank.name || bank.bank_name || "")
    .toLowerCase()
    .includes(formData.bank_name.toLowerCase())
);


//resetform
const resestForm = async () => {
  // reset form
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

  // generate new receipt number
  const res = await fetch(`${Api_urls}/getrecipt`);
  const data = await res.json();

  if (data.receiptNo) {
    setFormData(prev => ({
      ...prev,
      receipt_no: data.receiptNo
    }));
  }
};




    return(
        <div className="p-4 flex flex-col min-h-screen">
            
            {/* Back Button */}
        <button
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
        onClick={() => navigate(-1)}>
        Go Back
        </button>

        {/* Main Container */}
            <div  className="flex-grow border border-gray-300 rounded-lg p-6 mt-4 bg-white w-[90%] ml-20">
              <div className="flex justify-between items-center mb-6">
                 <p className="text-xl font-semibold">Supplier Advance</p>
 
                 <div className="flex gap-2">
                    <button onClick={resestForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">NEW</button>
                     <button   onClick={() => loadReceipt(loadreceipt)} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white" >EDIT</button>
                     <button onClick={savesupplier} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">SAVE</button>
                     <button onClick={deleteReceipt} className="border px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white">ClOSE</button>  
                 </div>
             </div>   

   {/* Inputs Fields */}
                   <div className="grid grid-cols-3 gap-4 p-5"> 
                       
                       <div className="flex flex-col">
                            <label className="text-sm" htmlFor="">Receipt No</label>
                             <input type="text"
                              value={formData.receipt_no}
                              readOnly
                              className="w-full max-w-[200px] outline-none border rounded-lg px-3 py-2 mt-2"/>
                       </div>

                       {/*  */}

                        <div className="flex flex-col">
                            <label className="text-sm" htmlFor="">Date</label>
                             <input type="date" 
                              value={formData.date}
                              onChange={(e) => setFormData({...formData,date:e.target.value})}
                            className="w-full max-w-[200px] outline-none border rounded-lg px-3 py-2 mt-2"/>
                        </div>

                        {/*  */}

                        <div className="flex flex-col relative">
                            <label className="text-sm"  htmlFor="">Name</label>
                            <input type="text"
                             value={formData.supplier_name}
                              onFocus={() => setClientopen(true)}
                              onChange={(e) => {
                              const value = e.target.value;
                              setFormData({...formData, supplier_name: value});
                              setClientopen(true);}}
                             className="w-full outline-none border rounded-lg px-3 py-2 mt-2"  />
                        
                               {/* client dropdown */}
                               {clientOpen && (
                                <div>
                                    {loadclients ? (
                                        <p>Loading...</p>
                                    ) : (
                                        <div className="absolute top-22 left-0 w-full max-w-[500px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                            {clientname.length > 0 ? (
                                                clientname.map((client) => (
                                                    <div
                                                     key={client.id}
                                                     onClick={() => {
                                                      setFormData(prev => ({...prev, supplier_name: client.customer_name}))
                                                        setClientopen(false);
                                                     }}
                                                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                        {client.customer_name}
                                                    </div>
                                                ))
                                            ) : (
                                                <p>No clients found</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                               )}

                        </div>
    
                  </div>

                  {/* Mode Of Payment */}

                  <div className="grid grid-cols-3 gap-6 p-5">
                     
                      <div className="relative">
                        <label htmlFor="">Mode Of Payment</label>
                         <input type="text" 
                          
                          value={formData.mode_of_payment}
                          onFocus={() => setModeopen(true)}
                          onChange={(e) => setFormData({...formData,mode_of_payment:e.target.value})}
                          className="w-full outline-none border rounded-lg px-3 py-2 mt-2" />

                          {/* Options */}
                           {modeopen && (
                            <div className="absolute top-22 left-0 w-full max-w-[500px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                               {["Cash","Bank","By Hand"].map((mode) => {
                                return (
                                <div
                                 key={mode}
                                 onClick={() =>  { setFormData({...formData, mode_of_payment:mode});  setModeopen(false);}}
                                 className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                 {mode}
                                 </div>
                                 );
                                })}
                            </div>
                          )}
                      </div>

                      {/* Bank Name */}
                        <div className="relative">
                            <label htmlFor="">Bank Name</label>
                            <input 
                            value={formData.bank_name}
                            onFocus={() => setBankOpen(true)}
                            onChange={(e) => setFormData({...formData, bank_name:e.target.value})}
                            type="text" className="w-full outline-none border rounded-lg px-3 py-2 mt-2">
                            </input>

                            {/* bank list */}

                            {bankOpen && (
                            <div className="absolute bg-white border w-full shadow max-h-60 overflow-auto">
                            {filteredBanks.length > 0 ? (
                             filteredBanks.map((bank, index) => (
                             <div
                              key={index}
                              onClick={() => {
                              setFormData({
                              ...formData,
                               bank_name: bank.name });
                              setBankOpen(false);
                                 }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                             {bank.name}
                              </div>
                              ))
                         ) : (
                      <p className="p-2 text-gray-500">No banks found</p>
                   )}
              </div>
              )}
                        </div>
                        {/* ref No */}
                        <div>
                            <label htmlFor="">Ref No</label>
                            <input type="text" 
                              value={formData.ref_no}
                              onChange={(e) => setFormData({...formData,ref_no:e.target.value})}
                             className="w-full outline-none border rounded-lg px-3 py-2 mt-2">
                            </input>
                        </div>

                  </div>

  {/* Next Row  */}

                  <div className="grid grid-cols-2 gap-6 p-5">
                     <div>
                        <label htmlFor="">Remarks</label>
                         <input type="text"
                           value={formData.remarks}
                           onChange={(e) => setFormData({...formData, remarks:e.target.value})}
                          className="w-full outline-none border rounded-lg px-3 py-2 mt-2"/>
                     </div>
                     {/*  */}
                     <div>
                        <label htmlFor="">Received By</label>
                         <input type="text"
                          value={formData.received_by}
                          onChange={(e) => setFormData({...formData,received_by:e.target.value})}
                          className="w-full outline-none border rounded-lg px-3 py-2 mt-2"/>
                     </div>                    

                  </div>

                  {/* 3rd Row */}
          
                  <div className="grid grid-cols-3 gap-6 p-5">
                         
                       <div>
                        <label className="text-sm" htmlFor="">Paid Amount</label>
                         <input type="number"  
                          value={formData.paid_amount}
                           onChange={(e) => setFormData({...formData,paid_amount:e.target.value})}
                         className="w-full outline-none border rounded-lg px-3 py-2 mt-2"/>
                       </div>

                            <div>
                                <label className="text-sm" htmlFor="">TDS</label>
                                 <input type="number" 
                                 value={formData.tds}
                                 onChange={(e) => setFormData({...formData, tds:e.target.value})}
                                 className="w-full outline-none border rounded-lg px-3 py-2 mt-2" />
                            </div>

                            <div>
                                <label htmlFor="">Others</label>
                                 <input type="number" 
                                 value={formData.others}
                                 onChange={(e) => setFormData({...formData, others:e.target.value})} 
                                 className="w-full outline-none border rounded-lg px-3 py-2 mt-2" />
                            </div>

                            <div>
                                <p>Grand Total</p>
                                <p className="font-semibold">{pototal}</p>
                                <h3>Balance (Preview): {balance}</h3>

                            </div>
                        </div>

                  {/*  */}

                   <div className="flex flex-col p-5 relative">
                      <label htmlFor="">Select Receipt No</label>
                       <input type="text" 
                        value={loadreceipt}
                         onFocus={() => setreceiptsearch(true)}
                        onChange={(e) => {
                        const value = e.target.value;
                        setloadreceipt(value);
                        recepitsearch(value);
                         }}

                       className="w-[200px] outline-none border rounded-lg px-3 py-2 mt-2"/>
                   
                     {/* dropdown */}

                      {receiptsearch && (
                   <div className="absolute px-3 top-[93px] left-30 w-full max-w-[200px] bg-white border border-gray-200 rounded-[2px] shadow-lg z-50">
                     {receiptlist.length > 0 ? (
                     receiptlist.map((item) => (
                    <div
                     key={item.id}
                     onClick={() => {
                     setloadreceipt(item.receipt_no);
                     setreceiptsearch(false);
                     loadReceipt(item.receipt_no); }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                      {item.receipt_no}
                     </div>
      ))
    ) : (
      <p>No receipts found</p>
    )}
  </div>
)}
                   
 </div>
                      
 </div>

       </div>
    );
};

export default Supplieradvance;
