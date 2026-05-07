import React, { useEffect, useState } from "react";
import {useNavigate } from "react-router-dom";
import { errorToast } from "../ui/nottifications";
import toast from "react-hot-toast";
import {SquarePen, Trash2 } from "lucide-react";

// Debounce Function

function debounce(func, delay){
  let timeoutId;
  return function(...args){
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}



const PurchaseEntry = () =>{

    const navigate = useNavigate();
    const [clientopen , setclientopen] = useState(false); 
    const [billno , setbillno] = useState("");
    const [orderType , setOrdeType] = useState("");
    const [supplierlist , setsupplierlist] = useState([]);
    const [loadbillno , setbillloadno] = useState("");
    const [tabledata, setTabledata] = useState([]);
    const [billlist , setbilllist] = useState([]);
    const [loadingclients , setLoadingclients] = useState(false);
    const [items , setitems] = useState([]);




    const [itemopen , setitemopen] = useState(false);
    const [unitopen , setunitopen] = useState(false);
    const [otheritemopen , setotheritemopen] = useState(false);
    const [billistopen , setbilistopen] = useState(false);

    const Api_url = "http://localhost:3000/api/taxpurchases"

   
    const [formData , setformData] = useState({
      supplier_name:"",
      bill_no:"",
      bill_date:"",
      order_no:"",
      order_date:"",
      despatch:"",
      due_date:"",
      order_type:"",
      discount:"",
      other_name:"", 
      other_charges:"",
    });

    const [currentRow , setcuurentRow] = useState({
      item_name:"",
      quantity:"",
      price:"",
      hsn:"",
      uom:"", 
    });




    // Load next bill No

   const loadbill = async (billnum) => {
  const billLoad = billnum || loadbillno;
  try {
    if (!billLoad.trim()) {
      return alert("Bill Number is required");
    }

    const res = await fetch(`${Api_url}/${billLoad}`);

    if (!res.ok) {
      throw new Error("Bill not found");
    }

    const data = await res.json();
    setformData({
      supplier_name: data.supplier_name || "",
      bill_no: data.bill_no || "",
      bill_date: data.bill_date || "",
      order_no: data.order_no || "",
      order_date: data.order_date || "",
      despatch: data.despatch || "",
      due_date: data.due_date || "",
      order_type: data.order_type || "",
      discount: data.discount || "",
      other_name: data.other_name || "",
      other_charges: data.other_charges || "",
    });

    setbillno(data.bill_no || '');
    setbillloadno(data.bill_no || '');
    setOrdeType(data.order_type || '');

    setTabledata(
      Array.isArray(data.items)
        ? data.items.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            hsn: item.hsn,
            uom: item.uom,
          }))
        : []
    );

    console.log("Edit data loaded:", data);

  } catch (error) {
    console.log("Load Failed:", error);
    alert("Bill not found or server error");
  }
};

  // next bill
  useEffect(() =>{
    fetch(`${Api_url}/nextbillno`)
    .then(res => res.json())
    .then(data => {
      setbillno(data.bill_no || '');
    });
  },[]);


  // search Bill no

  const searchbill = async(value) =>{
    try{
      if(!value.trim()){
        setbilllist([]);
        alert("Please enter a bill number to search.");
        return;
      } 
      const res = await fetch(`${Api_url}/billno/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();  
      setbilllist(Array.isArray(data) ? data : []);
    }catch(err){
      console.log("Failed",err);
    }
  }

  // Load Clients

  useEffect(() =>{
    setLoadingclients(true);
    fetch(`${Api_url}/clients`)
    .then((res) => res.json())
    .then((data) =>{
      console.log("clients Fetch Succefully:",data);
      setsupplierlist(Array.isArray(data) ? data : []);
    })
    .catch((error) => {
      console.warn("Retrying With Backup client url...",error);
      fetch("http://localhost:3000/api/customers/all")
      .then((res) => res.json())
      .then((data) =>{
        setsupplierlist(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.log("Backup fetch failed too:",error);
        errorToast("Failed to fetch clients");
      })
    })
    .finally(() => setLoadingclients(false));
  },[]);
 
// Client Search 

const clientsearch = async(value) => {
  try{
    const res = await fetch(`${Api_url}/clients/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setsupplierlist(Array.isArray(data) ? data : []);
  }catch(error){
    console.log("Client search error:", error);
    errorToast("Client search failed");
  }
}



  // Load Order Type
  
  const Loadordertype = async (type) =>{
    setOrdeType(type);
    try{
      const res = await fetch(`${Api_url}/items/${type}`);
      const data = await res.json();
      if(Array.isArray(data)){
        setitems(data);
    

      if(data.length > 0){
        setcuurentRow(prev => ({
        ...prev,
        item_name: data[0].item_name || '',
        hsn: data[0].hsn_number || '', 
        }));
      }else{
        setcuurentRow(prev => ({
          ...prev,
          item_name: '',
          hsn_number: '',
        }));
      }
    } else{
      setitems([]);
    }
    }catch(error){
      console.log("Error loading order type:", error)
      setitems([]);
    }
  };


  // Item Select 
  const selectItem = (selectedItem) => {
    setcuurentRow({
      ...currentRow,
      item_name: selectedItem.item_name,
      hsn: selectedItem.hsn_number,
    });
    setitemopen(false);
  };

// item Search

const itemsearch = async (value , currentOrderType) => {
  if(!currentOrderType) return;

  try{
    let url = "";
    if(!value.trim()){
      url = `${Api_url}/items/${currentOrderType}`;
    }else{
      url = `${Api_url}/items/search?q=${encodeURIComponent(value)}&type=${encodeURIComponent(currentOrderType)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    setitems(Array.isArray(data) ? data : []);
  }catch(error){
    console.log("Item search error:", error);
  }
};



  // add item to table 

  const additem = () => {
    if(!currentRow.item_name.trim() || !currentRow.quantity || !currentRow.price){
      alert("Please fill all fields");
      return;
    }

    const amount = currentRow.quantity * currentRow.price;
    setTabledata([...tabledata, {...currentRow, amount}]);
    setcuurentRow({
      item_name:"",
      quantity:"",
      price:"",
      hsn:"",
      uom:"",
    });
  }

  // Clear Item

  const clear = () => {
    setcuurentRow({
      item_name: "",
      quantity:"",
      price:"",
      hsn:"",
      uom:"",
    });
  };


// subtotal calculations

const [totals , settotals] = useState({
  subtotal: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  other_charges: 0,
  discount: 0,
  roundOff: 0,
  grandTotal: 0,
})

useEffect(  () => {
    const subtotal = tabledata.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const igst = 0;
    const other_charges = parseFloat(formData.other_charges) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const grandTotal = subtotal + cgst + sgst + igst + other_charges - discount;

    settotals({
      subtotal: parseFloat(subtotal.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: parseFloat(igst.toFixed(2)),
      other_charges,
      discount,
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      roundOff: parseFloat((grandTotal - Math.floor(grandTotal)).toFixed(2)),
    });
  }, [tabledata, formData])

  // Save Purchase Entry 

  const Savetaxentry = async () => {
    if(tabledata.length === 0){
      alert("Please add at least one item to the table.")
      return;
    }
    const purchaseData = {
      ...formData,
      bill_no: billno,
      order_type: orderType,
      bill_date: formData.bill_date,
      order_no: formData.order_no,
      order_date:formData.order_date,
      despatch: formData.despatch,
      due_date: formData.due_date,
      other_name:formData.other_name,
      discount: Number(formData.discount || 0),
      subtotal: Number(totals.subtotal || 0),
      cgst: Number(totals.cgst || 0),
      sgst: Number(totals.sgst || 0),
      igst: Number(totals.igst || 0),
      grand_total: totals.grandTotal,
      other_charges: Number(formData.other_charges || 0),
      round_off: totals.roundOff,
      items: tabledata.map(item => ({

        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
        hsn: item.hsn,
        uom: item.uom,   
      })),
    };

    const toastId = toast.loading("Saving Purchase Entry...");
    try{
      const method = loadbillno ? "PUT" : "POST"
      const url = loadbillno
       ? `${Api_url}/update/${loadbillno}`
       : `${Api_url}/new`;
       const res = await fetch(url,{
        method,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(purchaseData)
       })
       const result = await res.json();

       if(!res.ok){
        throw new Error(result.message || "Failed to save purchase entry"); 
       }
       toast.success(method === "PUT" ? "Purchase Entry Updated Successfully!" : "Purchase Entry Saved Successfully!", {id: toastId});  
       resetForm();
      }catch(error){
      toast.error(error.message,{id:toastId});
      errorToast("Failed to save purchase entry");
    }
  }

  // Delete 

 const deletebill = async () => {
  if (!billno) return alert("Select a bill to delete");

  if (!window.confirm("Are you sure want to delete?")) return;

  try {
    const res = await fetch(`${Api_url}/${billno}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("Deleted Successfully");
      resetForm();
    } else {
      alert("Failed to delete");
    }
  } catch (error) {
    console.log("Error deleting bill:", error);
  }
};
 

// Edit Items

const edititem = (index) => {
    const itemToEdit = tabledata[index];
    setcuurentRow({
      item_name: itemToEdit.item_name,
      quantity: itemToEdit.quantity,
      price: itemToEdit.price,
      hsn: itemToEdit.hsn,
      uom: itemToEdit.uom,
    });
    setTabledata(tabledata.filter((_, i) => i !== index));
  };

  const deleteitem = (index) => {
    setTabledata(tabledata.filter((_, i) => i !== index));
  };


  // Reset Form;
  
 const resetForm = async () => {
  setformData({
    supplier_name:"",
    bill_no:"",
    bill_date:"",
    order_no:"",
    order_date:"",
    despatch:"",
    due_date:"",
    order_type:"",
    discount:"",
    other_name:"",
    other_charges:"",
  });

  setTabledata([]);
  setcuurentRow({
    item_name:"",
    quantity:"",
    price:"",
    hsn:"",
    uom:"",
  });

  setbillno('');
  setOrdeType('');
  setbillloadno('');

  try {
    const res = await fetch(`${Api_url}/nextbillno`);
    const data = await res.json();
    setbillno(data.bill_no || '');
  } catch (err) {
    console.log(err);
  }
};


  // Debounse search

   const [debounceclientsearch] = useState(() => debounce(clientsearch, 300));
   const [debounceItemsearch] = useState(() => debounce(itemsearch, 300));

// today date auto fetch

useEffect(() =>{
   const today = new Date().toISOString().split('T')[0];
   setformData(prev =>({...prev,bill_date:today}));
},[]);


    return(
         <div className="p-4 flex flex-col min-h-screen">
                <button 
                className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
                 onClick={() => navigate(-1)}>
                  Go Back
                </button>
 {/* Main Container */}

                <div className="flex-grow border border-gray-gray-300 rounded-lg p-6 mt-4 bg-white w-full
                  ">
                     <div className="flex justify-between items-center mb-6">
                        <p className="text-xl font-semibold">Tax Purchase Entry</p>
                        
                         <div className="flex gap-2">
                           <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">NEW</button>
                            <button onClick={() => loadbill(loadbillno)}  className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">EDIT</button>
                            <button onClick={Savetaxentry} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white">SAVE</button>
                             <button onClick={deletebill} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white">DELETE</button>
                             <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white">ClOSE</button>
                         </div>
                </div>


                         {/* Inputs*/}

                           <div className="">
                          
                              <div className="grid grid-cols-3">
                                   <div className="relative">
                                       <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                                      
                                       {loadingclients && (
                                          <p className="px-3 py-2 text-gray-400 text-sm italic">Loading clients...</p>
                                        )}
                                        <input type="text"
                                        value={formData.supplier_name}
                                         onFocus={() => setclientopen(true)}
                                         onChange={(e) => {
                                          const value = e.target.value
                                           setformData({...formData, supplier_name: value})
                                           debounceclientsearch(value)
                                         }}
                                         className="outline-none border mt-1 rounded-lg px-3 py-2 w-full max-w-[318px]"
                                         placeholder="Enter Supplier Name.." />

                                        {/*Drop Down  */}
                                       
                                        {clientopen && (
                                         <div className="absolute top-[70px] left-0 bg-white shadow-lg z-50  w-[86%] border border-gray-200 rounded-[2px] ">
                                              {supplierlist.length > 0 ? (
                                                 supplierlist.map((item) => (
                                                   <div key={item.id} 
                                                     onClick={(e) => {e.stopPropagation();
                                                      setformData({...formData, supplier_name: item.customer_name});
                                                      setclientopen(false);
                                                     }}
                                                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                                                     {item.customer_name}
                                                   </div>
                                                 ))
                                               ) : (
                                                 <p>No suppliers found</p>
                                               )}
                                         </div>
                                         )}

                                   </div>

                                   {/*Bill No */}

                                   <div> 
                                       <label className="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
                                       <input type="text" 
                                        placeholder="Bill No"
                                        value={billno}
                                        readOnly
                                       className="outline-none border mt-1 rounded-lg px-3 py-2 w-full max-w-[318px]"></input>
                                   </div>

                                   {/* Date */}

                                   <div>
                                       <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                       <input type="date" 
                                        value={formData.bill_date || ""}
                                         onChange={(e) => setformData({...formData,bill_date:e.target.value})}
                                       className="outline-none border mt-1 rounded-lg px-3 py-2 w-full max-w-[318px]"/>
                                  </div>                                  

                             </div>

                             {/*  */}
                              <div className="grid grid-cols-4 mt-3 gap-6">

                                    {/* Order No */}
                                    <div>
                                     <label htmlFor="" className="text-sm">Order No</label>
                                      <input type="text" 
                                       value={formData.order_no}
                                       onChange={(e) => setformData({...formData,order_no:e.target.value})}
                                       placeholder="Enter Order Number"
                                       className="outline-none border mt-2 rounded-lg px-3 py-2 w-full max-w-[318px]"/>
                                     </div>

                                     {/* Date */}

                                     <div>
                                      <label htmlFor="" className="text-sm">Date</label>
                                       <input type="Date"
                                        value={formData.order_date}
                                         onChange={(e) => setformData({...formData,order_date:e.target.value})}
                                        placeholder="Date" 
                                       className="outline-none border mt-2 rounded-lg px-3 py-2 w-full max-w-[318px]"/>
                                     </div> 

                                     {/* Despatch */}

                                      <div>
                                         <label htmlFor="" className="text-sm">Despatch</label>
                                          <input type="text"
                                           value={formData.despatch}
                                           onChange={(e) => setformData({...formData,despatch:e.target.value})}
                                          className="outline-none border mt-2 rounded-lg px-3 py-2 w-full max-w-[318px]" placeholder="Despatch" />
                                      </div>

                                      {/* Due Date */}

                                      <div>
                                        <label htmlFor="" className="text-sm">Due Date</label>
                                         <input type="date"
                                          value={formData.due_date}
                                          onChange={(e) => setformData({...formData,due_date:e.target.value})}
                                         className="outline-none border mt-2 rounded-lg px-3 py-2 w-full max-w-[318px]"/>
                                      </div>

                              </div>
                              {/*  */}
                              <div className="mt-4">
                                  <p className="text-sm font-medium ">Order Type</p>
                                    <div className="flex gap-6 mt-2">
                                       <label htmlFor="" className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="ordertype" checked={orderType === "service"} onChange={() => Loadordertype("service")} className="mr-1"/> Service
                                       </label>
                                       <label htmlFor="" className="flex item-center gap-2 cursor-pointer">
                                        <input type="radio" name="ordertype" checked={orderType === "spare"} onChange={() => Loadordertype("spare")} className="mr-1"/> Spare
                                       </label>
                                       <label htmlFor="" className="flex item-center gap-2 cursor-pointer">
                                        <input type="radio" name="ordertype" checked={orderType === "purchase_item"} onChange={() => Loadordertype("purchase_item")} className="mr-1"/> Purchase Items
                                       </label>
                                    </div>
                              </div>

                              {/* description Items */}

                                <div className="mt-4">                                                                 
                                 <div className="grid grid-cols-7 gap-4 items-end">

                                <div className="mt-2 flex flex-col col-span-2 relative">
                                <label htmlFor="" className="text-sm font-medium">Description</label>
                                  <input type="text"
                                   value={currentRow.item_name}
                                    onFocus={() => setitemopen(true)}
                                    onChange={(e) =>{
                                      const value = e.target.value;
                                      setcuurentRow({...currentRow,item_name:value});
                                      debounceItemsearch(value ,orderType);

                                    }} 
                                  className="outline-none cursor-pointer border mt-2 rounded-lg px-3 py-2 w-full max-w-[800px]"
                                  placeholder="Items" />
                       
                                  {/* Item Open */}
                                  {itemopen && (
                                    <div className="absolute top-[70px] leading-8 left-0 w-full rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                       {Array.isArray(items) && items.length > 0 ? (
                                        items.map((item) => (
                                         <div key={item.id}
                                           onClick={(e) => {e.stopPropagation();
                                             selectItem(item);
                                           }} 
                                           className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                            {item.item_name}
                                         </div>        

                                        ))

                                      ) : (
                                       <div className="px-3 py-2 text-gray-400 text-sm">No items found</div>
                                       )}
                                    </div>
                                  )}

                               </div> 
                               
                            
                               {/* Ptice */}
                                <div className="flex flex-col mt-3">
                                  <label htmlFor="" className="text-sm font-medium">Price</label>
                                   <input type="number"
                                    placeholder="Price"
                                     value={currentRow.price}
                                     onChange={(e) => setcuurentRow({...currentRow,price:e.target.value})}
                                   className="outline-none border mt-2 rounded-lg px-3 py-2 w-full"/>
                                </div>

                                {/* Quantity */}

                                  <div className="flex-col flex mt-3">
                                  <label htmlFor="" className="text-sm font-medium">Quantity</label>
                                    <input type="number"
                                     placeholder="Quantity"
                                      value={currentRow.quantity}
                                      onChange={(e) => setcuurentRow({...currentRow,quantity:e.target.value})}
                                     className="outline-none border mt-2 rounded-lg px-3 py-2 w-full"/>
                                  </div>

                                  {/* UOM */}
                                   <div className="flex-col flex mt-3 relative">
                                    <label htmlFor="text-sm">UOM</label>
                                     <input type="text" 
                                      value={currentRow.uom}
                                       onFocus={() => setunitopen(true)}
                                       onChange={(e) => setcuurentRow({...currentRow,uom:e.target.value})}
                                      placeholder="Select"
                                      className="outline-none border mt-2 rounded-lg px-3 py-2 w-full"/>
                                   
                                    {/* Drop Down */}
                                    {unitopen && (
                                        <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50">
                                         {["Nos","Kg","Ltr","Mtr"].map((uom) => (
                                           <div key={uom}
                                            onClick={(e) => {e.stopPropagation();
                                              setcuurentRow(prev => ({...prev, uom}));
                                              setunitopen(false);
                                            }}                   
                                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                            {uom}
                                           </div>
                                         ))}
                                        </div>
                                        )}
                                   </div>

                                   {/* HSN */}

                                   <div className="flex flex-col">
                                    <label htmlFor="" className="text-sm font-medium">HSN</label>
                                     <input type="text"
                                      placeholder="HSN"
                                      value={currentRow.hsn}
                                      onChange={(e) => setcuurentRow({...currentRow,hsn:e.target.value})}
                                      className="outline-none border mt-2 rounded-lg px-3 py-2 w-full"/>
                                   </div>
                              
                                   {/* Button */}
                                    <div className="flex gap-2 mt-6">
                                    <button onClick={additem} className="border px-3 py-2 rounded-lg bg-black text-white">
                                      ADD
                                     </button>
                                      <button onClick={clear} className="border px-3 py-2 rounded-lg ">
                                       REMOVE
                                      </button>
                                       </div>
                                   
                                   </div>   
                                                                                      
                              </div>

                              {/* Description Items */}

                               <div className="border rounded-lg mt-5">
                                     {/*Table  */}
                                     <table className="w-full text-sm border-collapse">
                                       <thead>
                                         <tr className="text-left text-black border-b border-gray-300">
                                           <th className="border-r border-gray-300 px-5 py-3">S.NO</th>
                                           <th className="border-r border-gray-300 px-5 py-3">ITEM NAME</th>
                                           <th className="border-r border-gray-300 px-5 py-3">QUANTITY</th>
                                           <th className="border-r border-gray-300 px-5 py-3">PRICE</th>
                                           <th className="border-r border-gray-300 px-5 py-3">UOM</th>
                                           <th className="border-r border-gray-300 px-5 py-3">HSN</th>
                                          <th className="border-r border-gray-300 px-5 py-3">ACTIONS</th>

                                         </tr>
                                       </thead>

                                       {/* tbody */}
                                        <tbody>
                                           {tabledata.length === 0 ? (
                                            <tr>
                                              <td colSpan="8" className="text-center py-6 text-gray-400">
                                               No items added yet 
                                               </td>  
                                            </tr>
                                           ) : (
                                            tabledata.map((item, index) => (
                                           <tr key={index} className="border-b border-gray-200">
                                             <td className="px-5 py-3 border-r border-gray-200">{index + 1}</td>
                                             <td className="px-5 py-3 border-r border-gray-200">{item.item_name}</td>
                                             <td className="px-5 py-3 border-r border-gray-200">{item.quantity}</td>
                                             <td className="px-5 py-3 border-r border-gray-200">{item.price}</td>
                                             <td className="px-5 py-3 border-r border-gray-200">{item.uom}</td>
                                             <td className="px-5 py-3 border-r border-gray-200">{item.hsn}</td>
                                              <td className="px-5 py-3">
                                                  <div className="flex gap-3 ml-2">
                                                    <SquarePen onClick={() => edititem(index)} className="text-blue-600 hover:text-blue-800 font-medium" size={18}/>
                                                     <Trash2 onClick={() => deleteitem(index)} className="text-red-600 hover:text-red-800 font-medium" size={18}/>
                                                  </div>
                                              </td>
                                           </tr>
                                           ))
                                        )}
                                        </tbody>

                                     </table>
   
                               </div>

                               {/* calculations */}

                               <div className="grid grid-cols-2 mt-5">
                                  <div>
                                  <div className="flex gap-3">
                                    {/* Other Charges Name */}
                                        <div className=" cols-span-2 relative">
                                          <label htmlFor="" className="text-sm">Other Charges Name</label>
                                           <input type="text" name="other_name"
                                             placeholder="Select"
                                             value={formData.other_name}
                                             onFocus={() => setotheritemopen(true)}
                                             onChange={(e) => setformData({...formData,other_name:e.target.value})}
                                           className="outline-none border mt-2 rounded-lg px-3 py-2 w-full"/>
                                         
                                          {otheritemopen && (
                                            <div className="absolute top-15 left-0 border shadow-lg bg-white rounded-lg z-50 w-full">
                                               {["Transportation Charges","Delivery Charges","Courier Charges"]
                                               .map((other_name) =>(
                                                <div key={other_name} 
                                                 onClick={(e) => {e.stopPropagation();
                                                  setformData(prev => ({...prev,other_name}));
                                                  setotheritemopen(false);
                                                 }}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                {other_name}
                                                </div>
                                               ))}
                                            </div>

                                          )}
                                         
                                    </div>

                                        {/* Charges */}

                                        <div>
                                          <label htmlFor="" className="text-sm">Charges</label>
                                           <input type="number" 
                                            value={formData.other_charges}
                                            onChange={(e) => setformData({...formData,other_charges:e.target.value})}
                                           className="outline-none border mt-2 rounded-lg px-3 py-2 w-full" placeholder="Charges"/>
                                        </div>

                                        {/* Discount */}
                                        <div>
                                          <label htmlFor="" className="text-sm">Discount %</label>
                                          <input type="number" 
                                          value={formData.discount}
                                           onChange={(e) => setformData({...formData,discount:e.target.value})}
                                          className="outline-none border mt-2 rounded-lg px-3 py-2 w-full" placeholder="%"/>
                                        </div>
                                  </div>
                                    {/* Select Bill No */}
 
                                     <div className="flex flex-col mt-4 relative">
                                         <label htmlFor="">Select Bill No</label>
                                          <input type="text" 
                                           placeholder="Select Bill No"
                                            value={loadbillno}
                                            onFocus={() => setbilistopen(true)}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setbillloadno(value);
                                              searchbill(value)
                                              if(value) setbilistopen(true);
                                            }}
                                           className="outline-none border mt-2 rounded-lg px-3 py-2 w-full max-w-[300px]"/>
                                      
                                       {/* Drop down*/}

                                       { billistopen && (
                                          <div className="absolute top-[73px] left-0 w-full max-w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                            {billlist.length > 0 ? (
                                              billlist.map((bill) => (
                                              <div key={bill.bill_no}
                                               onClick={() => {
                                                setbillloadno(bill.bill_no);
                                                setbilistopen(false);
                                                loadbill(bill.bill_no)
                                               }}       
                                               className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">

                                                {bill.bill_no}
                                              </div>
                                        
                                             ))

                                            ) : (
                                             <div className="px-3 py-2 text-gray-400 text-sm">No PO found</div>
                                            )}
                                          </div>
                                       )}
                                         
                                        

                                      </div>
                                  </div>


                                <div className="flex justify-end">
                                   <div className="w-full max-w-md text-sm space-y-2">

                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Subtotal:</span>
                                       <span className="font-medium">{totals.subtotal}</span>
                                     </div>

                                     <div className="flex justify-between">
                                       <span className="text-gray-600">CGST (9%):</span>
                                       <span className="font-medium">{totals.cgst}</span>
                                     </div>

                                     <div className="flex justify-between">
                                       <span className="text-gray-600">SGST (9%):</span>
                                       <span className="font-medium">{totals.sgst}</span>
                                     </div>

                                      <div className="flex justify-between">
                                       <span className="text-gray-600">IGST (18%):</span>
                                       <span className="font-medium">{totals.igst}</span>
                                     </div>

                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Discount (%):</span>
                                       <span className="font-medium">{totals.discount}</span>
                                     </div>

                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Othe Charges:</span>
                                       <span className="font-medium">{totals.other_charges}</span>
                                     </div>
                                     
                                     <div className="flex justify-between">
                                       <span className="text-gray-600">Round Off:</span>
                                       <span className="font-medium">{totals.roundOff}</span>
                                     </div>

                                     <div className="border-t pt-3 flex justify-between items-center">
                                       <span className="font-semibold text-base">Grand Total:</span>
                                       <span className="font-bold text-blue-600 text-lg">{totals.grandTotal}</span>
                                     </div>

                                   </div>
                                 </div>
                               </div>

                         </div>
                          


                </div>

         </div>
    );
};

export default PurchaseEntry;