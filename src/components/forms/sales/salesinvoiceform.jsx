import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen,Trash2 } from "lucide-react";
import toast from "react-hot-toast";


const PerformanceInvoiceForm  = () => {
  const navigate = useNavigate();
  const [invoiceno , setInvoiceno]=useState("");
  const[tabledata , setTabledata] = useState([]);
  const [ordertype , setOrdertype] = useState("");
  const [customername , setCustomername] = useState([]);
  const [search , setsearch] = useState();
  const[items , setitems] = useState([]);
  const[itemsearch , setitemsearch] = useState();
  const [loadInvoice , setLoadInvoice] = useState("");
  const [cgstpercentage , setCgstpercentage] = useState(9);
  const [sgstpercentage , setSgstpercentage] = useState(9); 
  const [invoiceList, setInvoiceList] = useState([]); 



  const[clientopen , setclientopen] = useState(false);
  const [shouldAutoSelect, setShouldAutoSelect] = useState(false);
  const [itemopen , setitemopen] = useState(false);
  const [openUom , setopenUom] = useState(false);
  const [loadInvoiceOpen , setLoadInvoiceOpen] = useState(false);

   

  //API

  const Api_url = "http://localhost:3000/api/directinvoices"


  // States

  const [formData , setFormdata] = useState({
    customer_name:"",
    invoice_no:"",
    invoice_date:"",
    dc_no:"",
    dc_date:"",
    order_no:"",
    order_date:"",
    discount:"",
    payment_terms:"",
    dispatch_through:"",
    transport: ""
  });

  const [currentrow , setcurrentrow] = useState({
    item_name: "",
    quantity: "",
    price: "",
    uom:"",
    hsn_number:""
  });

  // Get All Clients And Search

  useEffect(() =>{
    const fetchclients = async () =>{
      try{
        const url = search
        ? `${Api_url}/clients/search?q=${encodeURIComponent(search)}`
        : `${Api_url}/clients`;

        const res = await fetch(url)
        const data = await res.json();
        setCustomername(data);
      }catch(error){
        console.log("Error fetching clients:", error)
      }
    }
    fetchclients();
  },[search]);

  // Get Invoice Number

  useEffect(() =>{
    const fetchinvoicenumber = async() =>{
      try{
        const res = await fetch(`${Api_url}/next-In-billno`);
        const data = await res.json();
        console.log("INVOCE",data);

        if(data && data.invoice_no){
          setInvoiceno(data.invoice_no);

        }else{
          console.log("Failed to get invoice number");
        }
      }catch(error){
        console.log("Error fetching invoice number:", error)
      }
    }
    fetchinvoicenumber();
  },[]);

  // get New Date

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormdata(prev => ({
      ...prev,
      invoice_date: today
    }));
  },[]);


  // Item Type

  const typechange = (type) => {
    setOrdertype(type);
    setitemsearch("");
    setShouldAutoSelect(true);

  };

  // Fetch Item Based category search

  useEffect(() =>{
    const fetchItems = async() =>{
      if(!ordertype) return;

      try{
        const url = itemsearch.trim()
        ? `${Api_url}/items/search?q=${encodeURIComponent(itemsearch)}&type=${encodeURIComponent(ordertype)}`
        : `${Api_url}/items/${ordertype}`;

        const res = await fetch(url);
        const data = await res.json();
        console.log(data);
       if (Array.isArray(data)) {
        setitems(data);
 
       if (shouldAutoSelect && data.length > 0) {
       setcurrentrow((prev) => ({
         ...prev,
         item_name: data[0].item_name || '',
         hsn_number: data[0].hsn_number || '',
       }));
        setShouldAutoSelect(false);
       } 
     }

      }catch(error){
        console.log("Error fetching items:", error);
        setitems([]); 
      }
    };
    fetchItems();

  },[ordertype,itemsearch,shouldAutoSelect]);


  // Select Items

  const selectitem = (selectedItems) =>{
    setcurrentrow({
      ...currentrow,
      item_name: selectedItems.item_name,
      hsn_number: selectedItems.hsn_number,
    });
    setitemopen(false);
  }


  // Add Rows
  const addrows = () =>{
    if(!currentrow.item_name || !currentrow.quantity || !currentrow.price){
      alert("Please fill all fields");
      return;
    }

    const amount = Number(currentrow.quantity * currentrow.price).toFixed(2); 
    const newrow = {
      ...currentrow,
      amount: amount,
    };
    setTabledata([...tabledata, newrow]);
    setcurrentrow({
      item_name: "",
      quantity: "",
      price: "",
      uom:"",
      hsn_number:"",
    });
  };

  // clear Rows

  const clearrows = () =>{
    setcurrentrow({
      item_name: "",
      quantity: "",
      price: "",
      uom:"",
      hsn_number:""
    });
  };


  // Save Invoice

  const SaveInvoice = async () =>{
    if(tabledata.length === 0){
      alert("Please Add Items");
      return;
    }

    const invoicedata = {
      ...formData,
      customer_name: formData.customer_name,
      ordertype: ordertype,
      invoice_no: invoiceno,
      invoice_date: formData.invoice_date,
      dc_no: formData.dc_no,
      dc_date: formData.dc_date,
      order_no: formData.order_no,
      order_date: formData.order_date,
      discount: formData.discount,
      payment_terms: formData.payment_terms,
      dispatch_through: formData.dispatch_through,
      items: tabledata.map(item => ({
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        uom: item.uom,
        hsn_number: item.hsn_number,
      })),

      subtotal: subtotal,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      round_off: round_off,
      grandtotal: grandtotal,

    }
    try{
      const method = loadInvoice ? "PUT" : "POST";
       const url = loadInvoice
       ? `${Api_url}/update/${encodeURIComponent(loadInvoice)}`
        : `${Api_url}/new`;

        const res = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoicedata),
        });
        
        const data = await res.json();
        if(!res.ok){
          throw new Error(data.message || "Failed");
        }

        toast.success(method === "PUT" ? "Invoice Updated" : "Invoice Created");
         await resetall(); 

    }catch(error){
       console.log("Error saving invoice:", error);
        toast.error("Failed to save invoice");
    }
  }

  // Calculation
 const subtotal = tabledata.reduce((sum, item) => {
  return sum + Number(item.amount || 0);
}, 0);  

  const discount = Number(formData.discount || 0)
 const transport = Number(formData.transport || 0)
 const cgst = subtotal * (cgstpercentage / 100);
 const sgst = subtotal * (sgstpercentage / 100);
 const igst = 0;
 const rawTotal = subtotal - discount + transport + cgst + sgst + igst;
 const round_off = Math.round(rawTotal) - rawTotal;
 const grandtotal = Math.round(rawTotal);


//  LoadInvoice

const LoadInvoice = async (invoiceNo) => {
  try {
    const res = await fetch(
      `${Api_url}/edit/${encodeURIComponent(invoiceNo)}`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed To Load");
    }

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    };

    const formattedItems = (data.items || []).map(item => ({
      item_name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      uom: item.uom,
      hsn_number: item.hsn_number,
      amount: Number(item.quantity) * Number(item.price),
    }));

    setLoadInvoice(invoiceNo);
    setInvoiceno(invoiceNo);

    setFormdata({
      customer_name: data.header.customer_name || "",
      invoice_no: data.header.invoice_no || "",
      invoice_date: formatDate(data.header.invoice_date),
      dc_no: data.header.dc_no || "",
      dc_date: formatDate(data.header.dc_date),
      order_no: data.header.order_no || "",
      order_date: formatDate(data.header.order_date),
      discount: data.header.discount || 0,
      payment_terms: data.header.payment_terms || "",
      dispatch_through: data.header.dispatch_through || "",
      transport: data.header.transport || 0,
    });

    setTabledata(formattedItems);
    setOrdertype(data.header.ordertype || "");

  } catch (error) {
    console.error("Load Error:", error);
    toast.error("Failed to load invoice");
  }
};

// Search invoice

const searchINV = async (value) => {
  try{
    const res = await fetch(
      `${Api_url}/INV/search?q=${encodeURIComponent(value || "")}`
    );
    const data = await res.json();
  setInvoiceList(Array.isArray(data) ? data : []);}catch(error){

    console.log("Search Error:", error);
  }
}

// Edit 

const edititem = (index) => {
    const item = tabledata[index];
    setcurrentrow({
      item_name: item.item_name || "",
      quantity: item.quantity || "",
      price: item.price || "",
      hsn_number: item.hsn_number || "",
      uom: item.uom || "",
    });

    // Remove the item from the table
    const updatedData = tabledata.filter((_, i) => i !== index);
    setTabledata(updatedData);
  };

  const deleteitem = (index) => {
    const updatedData = tabledata.filter((_, i) => i !== index);
    setTabledata(updatedData);
  };  

  // Delete Invoice number
  
  const deletInvoice = async () => {
    if(!loadInvoice){
      alert("Please Select Invoice First")
      return;
    }
  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${loadInvoice}?`
  );
   if(!confirmDelete) return;
    try{
      const res = await fetch(`${Api_url}/delete/${encodeURIComponent(loadInvoice)}`,{
        method:"DELETE",
      });
      const data = await res.json();
      if(!res.ok){
        throw new Error(data.message || "Failed");
      }
      toast.success("Invoice Deleted Successfully");
      resetall();
    }catch(error){
      console.log("Delete Error:", error);
      toast.error("Failed to Delete");
    }
  };


  // Restet all
  const resetall = async () => {
    setFormdata({
      customer_name:"",
      invoice_no:"",
      invoice_date:"",
      dc_no:"",
      dc_date:"",
      order_no:"",
      order_date:"",
      discount:"",
      payment_terms:"",
      dispatch_through:"",
      transport: ""
    });
    setTabledata([]);
    setLoadInvoice("");
    setOrdertype("");
    setclientopen(false);
    setitemopen(false);
    setopenUom(false);
    setcurrentrow({
      item_name: "",
      quantity: "",
      price: "",
      uom:"",
      hsn_number:""
    });
 
    const res =  await fetch(`${Api_url}/next-In-billno`);
    const data = await res.json();
    setInvoiceno(data.invoice_no);
  };

  return (
     <div className="p-6 min-h-screen bg-gray-50 p-6 font-sans">
        <div>
            <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
             >
                Go Back
            </button>
         </div>

        <div className="max-w-[1500px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-black tracking-tight">Sales Invoice</h2>
          <div className="flex gap-1.5">
             <button onClick={resetall}  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>NEW</button>
              <button onClick={SaveInvoice} className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>SAVE</button>
              <button className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>EDIT</button>
              <button onClick={deletInvoice} className='border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white'>DELETE</button>
          </div>
        </div>

        {/* Inputs */}
             
             <div className="flex flex-row items-end gap-20 border-b border-gray-100 pb-8 mb-6">
                <div className='flex flex-col gap-2 flex-1 relative'>
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                      Name 
                    </label>
                      <input type="text"
                       placeholder="Enter Customer" 
                       value={formData.customer_name}
                       onFocus={() => setclientopen(true)}
                       onChange={(e) => {
                        const value = e.target.value;
                        setFormdata({...formData,customer_name:value});
                        setsearch(value);
                       }}
                      className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                     
                     {/* Drop down */}
                    
                    {clientopen && (
                    <div className='absolute top-[65px] left-0 bg-white shadow-lg z-50 w-full border border-gray-200 rounded-[2px] overflow-y-auto'>
                       {Array.isArray(customername) && customername.length > 0 ? (
                         <div className="border border-gray-200  shadow-lg z-50 max-h-40 overflow-y-auto">
                            {customername.slice(0, 5).map((client) => (
                              <div key={client.id}
                               onClick={() => {
                                setFormdata({...formData, customer_name:client.customer_name});
                                setclientopen(false);
                               }}
                               className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                {client.customer_name}
                              </div>
                            ))}
                         </div>
                        ) : (
                          <div className="px-3 py-2 text-gray-400 text-sm">No clients found</div>
                        )}
                    </div>
                    )}
               </div>

               {/* Invoice Number */}

                 <div className='flex flex-col gap-2 flex-1 relative'>
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                      Invoice Number 
                    </label>
                      <input type="text"
                       value={invoiceno}
                       onChange={(e) => setFormdata({...formData,invoice_no:e.target.value})}
                       placeholder="Enter Customer" 
                      className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
               </div>
               
                {/* Invoice Date */}

                  <div className='flex flex-col gap-2 flex-1'>
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                      Date
                    </label>
                    <input type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormdata({...formData,invoice_date:e.target.value})}
                  className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                </div>
          </div>

          {/* next Row  */}

             <div className=" flex border-gray-100 pb-8 ">
               <div className='flex flex-col gap-2 flex-1 '>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                  DC No
                </label>
                 <input type="text"
                  value={formData.dc_no}
                  onChange={(e) => setFormdata({...formData, dc_no:e.target.value})}
                  placeholder="Enter Dc No"
                  className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
               </div>

               {/*  */}

                <div className='flex flex-col gap-2 flex-1 '>
                 <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                    DC DATE
                  </label>
                  <input type="Date" 
                  value={formData.dc_date}
                   onChange={(e) => setFormdata({...formData, dc_date:e.target.value})}
                  className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                </div>

                {/*  */}

                <div className='flex flex-col gap-2 flex-1 '>
                 <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                    ORDER NO
                  </label>
                  <input type="text" 
                   value={formData.order_no}
                   onChange={(e) => setFormdata({...formData, order_no:e.target.value})}
                  placeholder="Enter Order No"
                  className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                </div>

                {/*  */}

                <div className='flex flex-col gap-2 flex-1 '>
                 <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                    ORDER DATE
                  </label>
                  <input type="Date" 
                  value={formData.order_date}
                  onChange={(e) => setFormdata({...formData, order_date:e.target.value})}
                  className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                </div>
           </div>

           {/* Next Row */}

             <div className="flex">

                {/*  */}

                 <div className='flex flex-col gap-2 flex-1'>
                     <label htmlFor=""
                     className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                      DESPATCH THROUGH
                    </label>
                    <input type="text"
                    value={formData.dispatch_through}
                     onChange={(e) => setFormdata({...formData, dispatch_through:e.target.value})}
                    placeholder="Enter Dispatch Through"
                    className="w-full max-w-[300px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"/>
                 </div>
            </div>
{/*  */}

    <div className="flex flex-col gap-2  mt-5 shrink-0">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      Description
    </label>
    <div className="flex items-center gap-4 h-[42px]">
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
        <input type="radio" name="ordertype" checked={ordertype === "service"} onChange={() => typechange("service")} className="w-4 h-4 accent-black" /> Service
      </label>
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
        <input type="radio" name="ordertype" checked={ordertype === "spare"} onChange={() => typechange("spare")} className="w-4 h-4 accent-black" /> Spares
      </label>
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
        <input type="radio" name="ordertype" checked={ordertype === "purchase_item"} onChange={() => typechange("purchase_item")} className="w-4 h-4 accent-black" /> Purchase Items
      </label>
    </div>
  </div>

   {/* Inside Items */}
        <div className="grid grid-cols-8 gap-3 mt-6 mb-4 bg-white">
             
             <div className="flex flex-col col-span-2 relative">
              <input type="text"
                placeholder="Search Item"
                value={currentrow.item_name}
                onFocus={() => setitemopen(true)}
                onChange={(e) =>{
                  const value = e.target.value;
                  setcurrentrow({...currentrow,item_name:value})
                  setitemsearch(value);
                }}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"/>
               
               {/* Item Open */}

               {itemopen && (
               <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {Array.isArray(items) && items.length > 0 ? (
                    items.map((item, index) => (
                      <div
                        key={`${item.item_name}-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setitemopen(false);
                          selectitem(item);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {item.item_name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">No items found</div>
                  )}
                </div>
               )}
            
            </div>

            {/*  */}
             <div className="">
              <input type="number"
                placeholder="Quantity"
                value={currentrow.quantity}
                onChange={(e) => setcurrentrow({...currentrow, quantity:e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"/>
            </div>
            {/*  */}
             <div className="">
              <input type="number"
                 placeholder="Price"
                 value={currentrow.price}
                  onChange={(e) => setcurrentrow({...currentrow, price: Number(e.target.value) || ''})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"/>
            </div>
            {/*  */}
            <div className="relative">
              <input type="number"
                 placeholder="Discount"
                 value={currentrow.discount}
                 onChange={(e) => setcurrentrow({...currentrow, discount: Number(e.target.value) || ''})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"/>
            </div>
            {/*  */}
            <div className="relative">
              <input type="text"
                 placeholder="Select"
                 value={currentrow.uom}
                 onFocus={() => setopenUom(true)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"/>
              
              {openUom && (
                <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {['NOS', 'KG', 'MTR', 'NO'].map((uom) => (
                    <div
                      key={uom}
                      onClick={(e) => {
                        e.stopPropagation();
                        setcurrentrow(prev => ({ ...prev, uom: uom }));
                        setopenUom(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {uom}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/*  */}
            <div className="">
              <input type="text"
                 placeholder="HSN"
                 value={currentrow.hsn_number}
                 onChange={(e) => setcurrentrow({...currentrow,hsn_number:e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"/>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0">
           <button 
            onClick={addrows}
            className="px-4 h-[37px] bg-black text-white text-[13px] font-semibold rounded-lg flex items-center justify-center"    >
            Add
           </button>
           <button 
           onClick={clearrows}
           className="px-4 h-[37px] border  text-black text-[13px] font-semibold rounded-lg flex items-center justify-center"    >
           Clear
         </button>
         </div>
        </div>

        {/* Table */}
          <div className="mt-6 flex gap-2 items-start">
          <div className="flex-grow border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white min-h-[200px]">
          <table className="w-full border-collapse">
            <thead>
             <tr className="bg-gray-50 border-b border-gray-200 text-left">
             <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">S.No</th>
             <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 uppercase">Item Name</th>
             <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-28 uppercase text-center">Quantity</th>
             <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-28 uppercase text-center">Price</th>
             <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-32 uppercase text-center">Amount</th>
            <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-24 uppercase text-center">UOM</th>
            <th className="p-3 text-[11px] font-black text-gray-500 w-28 uppercase text-center">HSN No</th>
             <th className="p-3 text-[11px] font-black text-gray-500 w-28 uppercase text-center">Actions</th>
           </tr>
            </thead>

            <tbody>

              {tabledata.length > 0 ? (
                tabledata.map((item, index) => (
              <tr key={`${item.item_name}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3 text-[12px] font-bold text-gray-600 border-r border-gray-50 text-center">{index + 1}</td>
                <td className="p-3 text-[12px] font-bold text-black border-r border-gray-50">{item.item_name} </td>
                <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.quantity}</td>
                <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.price}</td>
                <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.amount}</td>
                <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.uom}</td>
                <td className="p-3 text-[12px] font-bold text-gray-700 text-center">{item.hsn_number}</td>
                <td className="p-3 text-[12px]">
                  <div className='flex gap-4'>
                    <SquarePen onClick={() => edititem(index)} className="text-blue-600 hover:text-blue-800 font-medium mx-auto" size={18} />
                    <Trash2 onClick={() => deleteitem(index)} className="text-red-600 hover:text-red-800 font-medium mx-auto" size={18} />
                  </div>
                </td>
              </tr>
                ))
                
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    No Items Added
                  </td>
              </tr>
              )}
            </tbody>
            </table>
            
         </div>

        </div>
        {/* Grand Totals */}
    <div className="space-y-3 mt-10 grid grid-cols-2">

       {/* select and modify */}
    <div className="mt-[120px] p-5 bg-gray-100 border-2 h-[70px] border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6">
        <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
            Select Invoice No To View / Modify Details :
        </label>

       <div className="relative">
          <input type="text"
           value={loadInvoice}
           onFocus={() => {setLoadInvoiceOpen(true); 
            searchINV(loadInvoice);
            }}
            onChange={(e) => {
              const value = e.target.value;
              setLoadInvoice(value);
              searchINV(value);
            }}
           className="w-full p-2.5 border rounded-lg outline-0"/>
        
        {/* Dropdown */}

        {loadInvoiceOpen && (
          <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
            {Array.isArray(invoiceList) && invoiceList.length > 0 ? (
              invoiceList.map((inv) => (
                <div
                  key={inv.id}
                 onClick={(e) => {
                 e.stopPropagation();
                 setLoadInvoice(inv.invoice_no);
                 setLoadInvoiceOpen(false);
                  LoadInvoice(inv.invoice_no); 
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {inv.invoice_no}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400 text-sm">No invoices found</div>
            )}
          </div>
        )}
      </div>
    </div>

    <div className="flex justify-end">
      <div className="w-full max-w-sm bg-gray-50/50 p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">Subtotal :</label>
            <input type="text" value={subtotal.toFixed(2)} readOnly className="w-32 p-1.5  border-b mt-[-10px] border-gray-300 bg-transparent text-right font-black text-black outline-none focus:border-black" />
          </div>

           <div className="flex justify-between items-center">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      DIS (-)
    </label>
    <input 
      type="text"
      value={formData.discount}
      onChange={(e) => setFormdata({...formData, discount: e.target.value})}
      className="w-32 p-1.5 border-b mt-[-10px] border-gray-300 bg-transparent text-right font-black text-black outline-none focus:border-black"      />
  </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">CGST (9%) :</label>
            <div className="flex gap-2">
              <input type="text"  
               value={cgstpercentage}
              onChange={(e) => setCgstpercentage(e.target.value)}
               className="w-10 p-1 border border-gray-300 rounded text-center text-[11px] font-bold outline-none" />
              <input type="text" value={cgst.toFixed(2) || 0}  readOnly className="w-24 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">SGST (9%) :</label>
            <div className="flex gap-2">
              <input type="text" 
               value={sgstpercentage}
               onChange={(e) => setSgstpercentage(e.target.value)} 
               className="w-10 p-1 border border-gray-300 rounded text-center text-[11px] font-bold outline-none" />
              <input type="text" value={sgst.toFixed(2) || 0}  readOnly className="w-24 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">IGST :</label>
            <input type="text" value={igst.toFixed(2) || 0} readOnly className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
          </div>

            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black text-gray-500 uppercase">Transport :</label>
              <input type="text"
              value={formData.transport || 0}
               onChange={(e) => setFormdata({...formData, transport: e.target.value})}
              className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
            </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">Round Off :</label>
            <input type="text" value={round_off.toFixed(2) || 0}  readOnly className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
          </div>

          <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-300">
            <label className="text-[14px] font-black text-black uppercase tracking-tighter">Grand Total :</label>
            <span className="text-[22px] font-black text-[#311B92] italic tracking-tighter">{grandtotal || 0}</span>
          </div>
        </div>
      </div>
    </div>
  </div>


      </div>
    </div>
  );
};
export default PerformanceInvoiceForm ;