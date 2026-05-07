import React,{useEffect, useState} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { errorToast } from "../ui/nottifications";
import { Trash2,SquarePen } from "lucide-react";

const BillwisePayment = () => {
    const navigate = useNavigate();
     const [clientlist, setclientlist] = useState([]);  
     const [supplierName, setSupplierName] = useState("");
     const [tabledata , settabledata] = useState([]);
     const [loadbillno, setloadbillno] = useState("");
     const[allbills , setallbills] = useState([]);
     const [selectedBill, setSelectedBill] = useState("");
      const [banks, setBanks] = useState([]);
     
    
     const [openclient, setopenclient] = useState(false);
     const[paymentmode,setpaymentmode] = useState(false);
     const [billopen , setbillopen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    


    const Api_url = "http://localhost:3000/api/billpayment" 


    const [formdata , setformdata] = useState({
        
        entry_date: "",
        supplier_id: "",
        bank_name: "",
        remarks: "",
        reference_no: "",
        grand_total: "",
        bank_date: "",

    });

    const [currentrow , setcurrentrow] = useState({
        bill_no:"",
        bill_date:"",
        bill_amount:"",
        paid_amount:"",
        balance_amount:"",
        payment_mode:""
    });

    
    //  Fetch all Clients

     const fetchclients = async(value) =>{
      try{
        let url = "";

         if(!value ||  value.trim() === ""){
            url = `${Api_url}/clients`;
         }else{
            url = `${Api_url}/clients/search?q=${encodeURIComponent(value)}`;
         }

         const res = await fetch(url);
         const data = await res.json();

         setclientlist(data);
  
      }catch(error){
          console.log("Error fetching clients:", error);
      }
}

const Savebill = async () =>{
   if(tabledata.length === 0){
    alert("Please Add Items");
    return;
   }

   const billwisepayment  = {
    ...formdata,
    supplier_id: formdata.supplier_id,
    entry_date: formdata.entry_date,
    bank_name: formdata.bank_name,
    remarks: formdata.remarks,
    reference_no: formdata.reference_no,
    grand_total: formdata.grand_total,
    bank_date: formdata.bank_date,

     items: tabledata.map(item => ({
        bill_no: item.bill_no,
        bill_date: item.bill_date,
        bill_amount: item.bill_amount,
        paid_amount: item.paid_amount,
        balance_amount: item.balance_amount,
        payment_mode: item.payment_mode,
    })),

   }

   try{
    const method = loadbillno ? "PUT" : "POST";
    const url = loadbillno
    ? `${Api_url}/update/${loadbillno}`
    : `${Api_url}/new`;
    const res = await fetch(url,{
        method: method,
        headers:{
            "Content-Type":"application/json",
        },
        body: JSON.stringify(billwisepayment),
    })

    if(!res.ok){
        throw new Error("Failed to save billwise payment");
    }
    toast.success(method === "PUT" ? "BILLWISE PAYMENT UPDATED SUCCESSFULLY" : "Bill wise Saved" )
    reset();
   }catch(error){
    toast.error("Error saving billwise payment", error.message);
    errorToast("failed");
   }
    
}


// Add Row

const addrow = async() => {

    if(!currentrow.bill_no || !currentrow.bill_date || !currentrow.bill_amount || !currentrow.paid_amount || !currentrow.balance_amount || !currentrow.payment_mode ){
        alert("please fill all fields");
        return;
    }

    const balance = Number(currentrow.bill_amount || 0) - Number(currentrow.paid_amount || 0);

    const newRow = {
        ...currentrow,
        balance_amount: balance
}

    settabledata((prev) =>[...prev, newRow]);
    setcurrentrow({
        bill_no:"",
        bill_date:"",
        bill_amount:"",
        paid_amount:"",
        balance_amount:"",
        payment_mode:""
    });
}

// Clear row

const clearrow = async() =>{
    setcurrentrow({
        bill_no:"",
        bill_date:"",
        bill_amount:"",
        paid_amount:"",
        balance_amount:"",
        payment_mode:""
    })
};


// load Bill number
const loadbill = async (value) => {
  try {
    const res = await fetch(`${Api_url}/getbillno/${value}`);
    const data = await res.json();

    const payment = data[0] || data; 

    setformdata({
      entry_date: payment.entry_date || "",
      supplier_id: payment.supplier_id || "",
      bank_name: payment.bank_name || "",
      remarks: payment.remarks || "",
      reference_no: payment.reference_no || "",
      grand_total: payment.grand_total || "",
      bank_date: payment.bank_date || "",
    });

    setSupplierName(payment.supplier_name || "");
    settabledata(data.items || []);

    setloadbillno(payment.id);
  } catch (error) {
    console.error("Error loading bill:", error);
    alert("Failed to load bill details");
  }
};

// ALL bills

const loadAllBills = async() => {
    try{
        const res = await fetch(`${Api_url}/allbills`);
        const data = await res.json();
        setallbills(data);
        setbillopen(true);
    }catch(error){
        console.error("Error loading all bills:", error);
    }
}



// Grand Totals
 
useEffect(() => {
  const total = tabledata.reduce((sum, item) => {
    return sum + Number(item.paid_amount || 0);
  }, 0);

  setformdata((prev) => ({
    ...prev,
    grand_total: total.toFixed(2),
  }));
}, [tabledata]);


//  Bank list

useEffect(() => {
  fetch("https://findmebank.com/api/v1/banks")
    .then((res) => res.json())
    .then((data) => {
      console.log("BANK API:", data);

      // ✅ SAFE HANDLING
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


// Fillter Banks

const filteredBanks = (banks || []).filter((bank) =>
  (bank.name || bank.bank_name || "")
    .toLowerCase()
    .includes((formdata.bank_name || "").toLowerCase())
);


// Reset Forms
const reset = async () => {
    setformdata({
        entry_date: "",
        supplier_id: "",
        bank_name: "",
        remarks: "",
        reference_no: "",
        grand_total: "",
    });
    settabledata([]);
    setSupplierName("");
    setloadbillno(false);
}


// Edit items

const edititem = (index) =>{
    const itemToEdit = tabledata[index];
    setcurrentrow({
        bill_no: itemToEdit.bill_no,
        bill_date: itemToEdit.bill_date,
        bill_amount: itemToEdit.bill_amount,
        paid_amount: itemToEdit.paid_amount,
        balance_amount: itemToEdit.balance_amount,
        payment_mode: itemToEdit.payment_mode
    })
    settabledata((prev) => prev.filter((_, i) => i !== index));
}

// Delete index
const deleteRow = (index) => {
    settabledata((prev) => prev.filter((_, i) => i !== index));
}

// Delete bill
const deleteBill = async () =>{
    if(!loadbillno){
        alert("Please Select a Bill to Delete");
        return;
    }
  
   const confirm = window.confirm("Are you sure you want to delete this bill?");
   if(!confirm) return;

    try{
        const res = await fetch(`${Api_url}/delete/${loadbillno}`,{
        method: "DELETE"
        });
        if(!res.ok){
            throw new Error("Failed to delete bill");
        }
        toast.success("Bill Deleted Successfully");
        reset();  
        
    }catch(error){
        console.log("Error deleting bill:", error)
    }
}


// Today Date

 useEffect(() =>{
    const today = new Date().toISOString().split('T')[0];
    setformdata(prev =>({...prev,entry_date:today}));
},[]);

 


  return (
     <div className="p-4 flex flex-col min-h-screen ">
         
        <button className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 
         text-[15px] font-medium w-fit"
         onClick={() => navigate(-1)}>
            Go Back
         </button>

      {/* Models */}
         <div className="flex-grow border justify-center  border-gray-gray-300 rounded-lg p-6 mt-4 bg-white w-full ">

            <div className="flex justify-between items-center mb-6">
                <p className="text-xl font-semibold">BillWise Payment</p>

                <div className="flex gap-2">
                    <button onClick={reset} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">NEW</button>
                    <button onClick={loadAllBills} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">EDIT</button>
                     <button onClick={Savebill} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">SAVE</button>
                     <button onClick={deleteBill} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white">DELETE</button>
                     <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white">CLOSE</button>

                </div>
            </div>

            {/* Inputs */}
            <div className="pl-6">
                
                <div className="grid grid-cols-2"> 
                      
                      {/* Date */}
                       
                      <div className="relative">
                          <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                     
                         <input type="date" 
                           value={formdata.entry_date}
                           onChange={(e) => setformdata({...formdata, entry_date:e.target.value})}
                          className="outline-none border mt-1 rounded-lg px-3 py-2 w-full max-w-[300px]" />
                      </div>

                     {/* Supplier Name */}

                      <div className="relative">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>

                         <input type="text" placeholder="Enter Supplier Name"
                           value={supplierName}
                           onChange={(e) => {
                            setSupplierName(e.target.value);fetchclients(e.target.value)}}
                            onFocus={() => {setopenclient(true); fetchclients(""); }}
                          className="outline-none border mt-1 rounded-lg px-3 py-2 max-w-[318px] w-full" />
                      
                        {/* Client Drop down */}

                         {openclient && (
                            <div className="absolute top-[70px] left-0 bg-white shadow-lg z-50  w-[317px]  border border-gray-200 rounded-[2px]  ">
                                {clientlist.map((c) =>{
                                    return <div key={c.id} 
                                    onClick={() => {setformdata({...formdata,supplier_id:c.id});
                                    setSupplierName(c.supplier_name);
                                     setopenclient(false);}}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                  {c.supplier_name}</div>
                                 })}        

                            </div>
                         )}
                      
                      </div>

                </div>
 
                  <div className="grid grid-cols-7 mt-10 gap-3 ">
                     {/* Bill No */}

                     <div className="relative">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
                        <input type="text" placeholder="Enter Bill"
                        value={currentrow.bill_no}
                         onChange={(e) => setcurrentrow({...currentrow, bill_no:e.target.value})}
                         className="outline-none border mt-1 rounded-lg px-3 py-2 w-full text-[14px]"/>
                     </div>

                     {/* Bill Date */}

                     <div className="relative ">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                        <input type="date" placeholder="Bill Date"
                        value={currentrow.bill_date}
                        onChange={(e) => setcurrentrow({...currentrow, bill_date:e.target.value})}
                        className="outline-none border mt-1 rounded-lg px-3 py-2 w-full text-[14px]"/>
                     </div>

                     {/* Bill Amount */}

                     <div className="relative ">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Bill Amount</label>
                        <input type="number" placeholder="Bill Amount"
                        value={currentrow.bill_amount}
                         onChange={(e) =>{
                            const bill = e.target.value;
                            const balance = Number(bill || 0) - Number(currentrow.paid_amount || 0);
                            setcurrentrow({
                                ...currentrow,
                                bill_amount: bill,
                                balance_amount: balance
                            });
                         }}
                        className="outline-none border mt-1 rounded-lg px-3 py-2 w-full text-[14px]"/>
                     </div>

                     {/* Paid Amount */}

                        <div className="relative">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                        <input type="number" placeholder="Paid Amount"
                        value={currentrow.paid_amount}
                        onChange={(e) => {
                            const paid = e.target.value;
                            const balance = Number(currentrow.bill_amount || 0) - Number(paid || 0);
                            setcurrentrow({
                                ...currentrow,
                                paid_amount: paid,
                                balance_amount: balance
                            });
                        }}
                        className="outline-none border mt-1 rounded-lg px-3 py-2 w-full text-[14px]"/>
                     </div>

                   {/* Balance Amount */}

                     <div className="relative">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                        <input type="number" placeholder="Balance"
                        value={currentrow.balance_amount}
                        readOnly
                        className="outline-none border mt-1 rounded-lg px-3 py-2 w-full"/>
                     </div>

                     {/* Payment Mode */}
                      <div className="relative">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Mode Of Payment</label>
                        <input type="text" placeholder="Payment Mode"
                        value={currentrow.payment_mode}
                        onFocus={() => setpaymentmode(true)}
                         onChange={(e) => setcurrentrow({...currentrow, payment_mode:e.target.value})}
                        className="outline-none border mt-1 rounded-lg px-3 py-2 w-full"/>
                       
                       {/* Drop Down */}

                        {paymentmode && (
                           <div className="absolute top-[71px] left-0 w-full border rounded shadow z-50 bg-white">
                              {["Cash","Bank","By Hand"].map((mode) =>(
                                <div key={mode} onClick={() => {
                                    setcurrentrow({...currentrow, payment_mode:mode});
                                    setpaymentmode(false);
                                }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    {mode}
                                </div>
                              ))}
                           </div>
                        
                        )}

                     </div>
 
                      {/* buttons */}
                      <div className="flex gap-2 mt-7 ml-3">
                          <button onClick={addrow} className=" w-[55px] h-[40px] border px-3 py-1.5 text-[13px] rounded-lg hover:bg-green-600 hover:text-white">ADD</button>
                          <button onClick={clearrow} className="border w-[59px] h-[40px] px-3 py-1.5 text-[13px] rounded-lg text-[13px] hover:bg-red-600 hover:text-white">CLEAR</button>
                      </div>

                  </div>

            </div>

            {/* Table Data */}

              <div className=" mt-5 ">
                 <table className="min-w-full border divide-y divide-gray-200 mt-10 border-collapse">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-black border-b border-gray-300">
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Sl No</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Bill No</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Bill Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Bill Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Paid Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Balance</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-l">Payment Mode</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Actions</th>

                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200]">
                         {tabledata.length === 0 ? (
                        <tr>
                   <td colSpan="7" className="text-center py-4">
                   No Data Available
                  </td>
                 </tr>
                         ) : (

                        tabledata.map((data, index) => (
                            <tr key={index} className="border-b border-gray-200" >
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] border border-l">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] border border-l">{data.bill_no}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] border border-l">{data.bill_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] text-blue-600 font-semibold border border-l">{data.bill_amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] text-green-600 font-semibold border border-l">{data.paid_amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] text-red-600 font-semibold border border-l">{data.balance_amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[14px] border border-l">{data.payment_mode}</td>
                                  <td className="flex gap-3 ml-4 mt-3">
                                    <div className="flex gap-3 ml-2">
                                        <SquarePen onClick={() => edititem(index)} className="text-blue-600 hover:text-blue-800 font-medium" size={18}/>
                                        <Trash2 onClick={() => deleteRow(index)} className="text-red-600 hover:text-red-800 font-medium" size={18}/>
                                    </div>
                                  </td>
                            </tr>
                            
                        ))
                    )}

                    </tbody>
                </table>
        </div>

        {/* Bank Referencess */}

            <div className="grid grid-cols-2 gap-4 mt-5">

             <div className="grid grid-cols-4 gap-5">

                    <div className="col-span-2 relative">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input type="text" placeholder="Enter Bank"
                        value={formdata.bank_name}
                        onFocus={() => setBankOpen(true)}
                        onChange={(e) => setformdata({...formdata,bank_name:e.target.value})}
                         className="outline-none border mt-1 w-full rounded-lg px-3 py-2"/>

                         {/*bank open  */}

                            {bankOpen && (
                            <div className="absolute bg-white border w-full shadow max-h-60 overflow-auto">
                            {filteredBanks.length > 0 ? (
                             filteredBanks.map((bank, index) => (
                             <div
                              key={index}
                              onClick={() => {
                              setformdata({
                              ...formdata,
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

                {/* Refference */}

                    <div className="col-span-2">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Bank Reference No</label>
                        <input type="text" placeholder="Enter Bank Reference"
                         value={formdata.reference_no}
                          onChange={(e) => setformdata({...formdata,reference_no:e.target.value})}
                         className="outline-none border mt-1 w-full rounded-lg px-3 py-2"/>
                </div>

                {/* Remarks */}

                  <div className=" col-span-2">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <input type="text" placeholder="Remarks"
                          value={formdata.remarks}
                          onChange={(e) => setformdata({...formdata,remarks:e.target.value})}
                         className="outline-none border mt-1 w-full rounded-lg px-3 py-2"/>
                </div>

                {/* Date */}
                 
                   <div className=" col-span-2">
                        <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" placeholder="Date"
                         value={formdata.bank_date}
                         onChange={(e) => setformdata({...formdata, bank_date:e.target.value})}
                         className="outline-none border mt-1 w-full rounded-lg px-3 py-2"/>
                </div>
                </div>

                {/* Grand Total */}

                   <div className="mt-5">
                     <div className="flex gap-3 justify-end mt-5">
                        <p className="text-right text-lg font-semibold mt-4">Grand Total : </p>
                         <p className="text-right text-lg font-semibold mt-4 text-blue-600">{formdata.grand_total}</p>
                     </div>
                   </div>
              </div>

              {/* Select Bill */}

               <div className="flex flex-col mt-3 relative">
                   <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Select Bill</label>
                    <input type="text" 
                    value={selectedBill}
                    onFocus={() => {setbillopen(true); loadAllBills()}}
                     onChange={(e) => setSelectedBill(e.target.value)}
                    placeholder="Select" 
                    className="outline-none border px-3 py-2 w-full rounded-lg max-w-[270px] mt-1"/>

                    {/* Down */}

                    {billopen && (
                      <div className="absolute bg-white top-[68px] left-0 border w-[270px] mt-1 rounded shadow max-h-40 overflow-y-auto z-10">
                         {allbills.map((b) =>(
                          
                           <div key={b.id}
                            onClick={() => {setSelectedBill(b.bill_no);
                             loadbill(b.bill_no);
                              setbillopen(false)
                             navigate("/purchase/bill-format",{
                              state: {billo : b.bill_no}
                             })
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                            {b.bill_no}
                           </div>


                         ))}

                     </div>

                    )}
               </div>
               
        </div>
    </div>
  )
};

export default BillwisePayment;