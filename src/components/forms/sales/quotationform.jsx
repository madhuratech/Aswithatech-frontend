import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { errorToast } from '../../ui/nottifications';
import { SquarePen, Trash2 } from 'lucide-react';

const Quotation = () => {
  const [tableItems, setTableItems] = useState([]);
  const [clients , setclients] = useState([]);
  const [search , setsearch] = useState();
  const [quotationNo, setQuotationNo] = useState("");
  const [ordertype , setordertype] = useState("");
  const [itemsearch , setitemsearch] = useState("");
  const [items , setitems] = useState([]);
  const [cgstpercentage , setCgstpercentage] = useState(9);
  const [sgstpercentage , setSgstpercentage] = useState(9); 
  const [loadquotation , setloadquotation] = useState("")
  const [qtlist , setLoadQt] = useState([]);

//   Dropdown state
  const [openUom , setopenUom] = useState(false);
  const[clientopen , setclientopen] = useState(false);
  const[itemopen , setitemopen] = useState(false);
  const [shouldAutoSelect, setShouldAutoSelect] = useState(false);
  const [loadqtopen , setloadqtopen] = useState(false);
  const navigate = useNavigate();


const Api_url = "http://localhost:3000/api/quotations"

// FormState
 const[formdata , setformdata] = useState({
   customer_name: "",
   quotation_date: "",
   reference: "",
   discount: "",
   transport: "0.00",
   tax_text: "GST 18 % extra. In case of any variation in statutory levies the same will be charged extra at the time of supply.",
   transport_terms: "For Destination.",
   delivery_period: "3-4 DAYS from the date of Firm order",
   validity: "30 days from the date of offer.",
   payment_terms: "50% against receipt of the materials.",
   guarantee_text : "",
   pack_frd: "100 % against receipt of the materials.",
   waranty: "",
   for_sign: "",
 });

//  Table State

const [currentrow , setcurrentrow] = useState({
    item_name: "",
    quantity: "",
    price: "",
    part_no:"",
    uom:"",
});

// Get All Clients And Search

useEffect(() =>{
    const fetchclients = async () =>{
        try{
            const url = search
            ? `${Api_url}/clients/search?q=${encodeURIComponent(search)}`
            : `${Api_url}/clients`;

            const res = await fetch(url);
            const data = await res.json();

           setclients(data); 
        }catch(error){
            console.log("Error fetching clients:", error);
        }
    }
    fetchclients();
},[search]);

// Get Quotation Number

 useEffect(() => {
  const fetcquotationnumber = async () => {
    try {
      const res = await fetch(`${Api_url}/next-Qt-billno`);
      const data = await res.json();

      console.log("Quotation API:", data);

      if (data && data.quotation_no) {
        setQuotationNo(data.quotation_no);
      } else {
        console.error("Invalid API response");
      }
    } catch (error) {
      console.log("Error fetching quotation number:", error);
    }
  };

  fetcquotationnumber();
}, []);

// New date
useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setformdata(prev => ({
        ...prev,
        quotation_date: today
    }));
},[]);


// Item Type

const typechange = (type) => {
  setordertype(type);
  setitemsearch(""); 
  setShouldAutoSelect(true);
};

// Fetch items based on category and search term
useEffect(() => {
  const fetchItems = async () => {
    if (!ordertype) return;

    try {
      let url = itemsearch.trim()
        ? `${Api_url}/items/search?q=${encodeURIComponent(itemsearch)}&type=${encodeURIComponent(ordertype)}`
        : `${Api_url}/items/${ordertype}`;

      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data)) {
        setitems(data);
        
        // Auto-select first item ONLY when the category changes
        if (shouldAutoSelect && data.length > 0) {
          setcurrentrow((prev) => ({
            ...prev,
            item_name: data[0].item_name || '',
            part_no: data[0].hsn_number || '',
          }));
          setShouldAutoSelect(false);
        }
      } else {
        setitems([]);
      }
    } catch (error) {
      console.error("Error Fetching items:", error);
      setitems([]);
    }
  };

  fetchItems();
},[ordertype, itemsearch, shouldAutoSelect]);

// Select items
const selectitem = (selectedItem) => {
  setcurrentrow({
    ...currentrow,
    item_name: selectedItem.item_name,
    part_no: selectedItem.hsn_number,
  });
  setitemopen(false); 
};


// ResetFrom

const resetall = async () =>{
  setformdata({
    customer_name: "",
    quotation_date: "",
    quotation_no: "",
    reference: "",
    discount: "",
    transport:"",
  });
  setTableItems([]);
  setcurrentrow({
    item_name: "",
    price: "",
    quantity: "",
    part_no:"",
    uom:"",
  })
 setQuotationNo('');
 setordertype('');
 setloadquotation('');

 try{
  const res = await fetch(`${Api_url}/next-Qt-billno`)
  const data = await res.json();
  if(data && data.quotation_no){
    setQuotationNo(data.quotation_no);
  }
 }catch(error){
  console.log(error);
 }
};

// Save and Edit

const SaveQuotation = async () =>{
  if(tableItems.length === 0){
    alert("Please Add Items");
    return;
  }

  const quotationDate = {
    ...formdata,
    customer_name: formdata.customer_name,
    order_type: ordertype,
    quotation_date: formdata.quotation_date,
    reference: formdata.reference,
    discount: formdata.discount,
    transport: formdata.transport,
    tax_text: formdata.tax_text,
    transport_terms: formdata.transport_terms,
    delivery_period: formdata.delivery_period,
    validity: formdata.validity,
    payment_terms: formdata.payment_terms,
    guarantee_text: formdata.guarantee_text,
    pack_frd: formdata.pack_frd,
    waranty: formdata.waranty,
    for_sign: formdata.for_sign,
    items: tableItems.map(item => ({
     item_name: item.item_name,
     price: item.price,
     quantity: item.quantity,
     part_no: item.part_no,
    uom: item.uom
})),
  subtotal: subtotal,
  cgst: cgst,
  sgst: sgst,
  igst: 0,
  round_off: roundOff,
  grandTotal: grandtotal,

  };
  try{
    const method = loadquotation ? "PUT" : "POST";
    const url = loadquotation
    ? `${Api_url}/update/${encodeURIComponent(loadquotation)}`
    : `${Api_url}/new`;
    const res = await fetch(url,{
      method: method,
      headers:{
        "Content-Type":"application/json",
      },
      body: JSON.stringify(quotationDate),
    });
    const data = await res.json()
    if(!res.ok){
      throw new Error(data.message || "Failed");
    }
    toast.success(method === "PUT" ? "Quotation Updated" : "Quotation Create Successfully");
    resetall();
  }catch(error){
  console.log("Error Failed",error);
  errorToast("Failed to save quotation");
  }
};

// Add Row

const additem = async() =>{
  if(!currentrow.item_name || !currentrow.quantity || !currentrow.price){
    alert("Please Fill The Fields");
    return;
  }

  const amount = currentrow.quantity * currentrow.price;
  setTableItems([...tableItems, {...currentrow, amount}]);
  setcurrentrow({
    item_name: "",
    quantity: "",
    price: "",
    part_no:"",
    uom:"",
  });
};

// clear
const clearrow = () =>{
    setcurrentrow({
        item_name: "",
        quantity: "",
        price: "",
        part_no:"",
        uom:"",
    });
};
    
 //Calculations

 const subtotal = tableItems.reduce((sum,items) =>{
  return sum + Number(items.amount || 0);

 },0)

 const discount = Number(formdata.discount || 0)
 const transport = Number(formdata.transport || 0)
 const cgst = subtotal * (cgstpercentage / 100);
 const sgst = subtotal * (sgstpercentage / 100);

 const rawTotal = subtotal - discount + transport + cgst + sgst;
 const roundedTotal = Math.round(rawTotal);
 const roundOff = roundedTotal - rawTotal;


 const grandtotal = roundedTotal;


//  Load quotation

const loadQuotation = async (qtNo) => {
  try {
    const res = await fetch(
      `${Api_url}/edit/${encodeURIComponent(qtNo)}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load");
    }

    console.log("Loaded Data:", data);

     setQuotationNo(qtNo);

    // Set form data
    setformdata({
      customer_name: data.header.customer_name || "",
      quotation_date: data.header.quotation_date || "",
      reference: data.header.reference || "",
      discount: data.header.discount || 0,
      transport: data.header.transport || 0,
      tax_text: data.header.tax_text || "",
      transport_terms: data.header.transport_terms || "",
      delivery_period: data.header.delivery_period || "",
      validity: data.header.validity || "",
      payment_terms: data.header.payment_terms || "",
      guarantee_text: data.header.guarantee_text || "",
      pack_frd: data.header.pack_frd || "",
      waranty: data.header.waranty || "",
      for_sign: data.header.for_sign || "",
    });

    // Set table items
    setTableItems(data.items || []);
    setloadquotation(qtNo);

  } catch (error) {
    console.error("Load error:", error);
    errorToast("Failed to load quotation");
  }
};


// Quotation Search

const searchQt = async (value) => {
  try {
    const res = await fetch(
      `${Api_url}/QT/search?q=${encodeURIComponent(value || "")}`
    );
    const data = await res.json();
    setLoadQt(Array.isArray(data) ? data : []);
  } catch (err) {
    console.log("Search error:", err);
  }
};

// Edit 

const edititem = (index) => {
  const item = tableItems[index];
  setcurrentrow({
    item_name: item.item_name || "",
    quantity: item.quantity || "",
    price: item.price || "",
    part_no: item.part_no || "",
    uom: item.uom || "",
  });
  // Remove the item from the table
  const updatedItems = tableItems.filter((_, i) => i !== index);
  setTableItems(updatedItems);
}

const deleteitem = (index) => {
  const updatedItems = tableItems.filter((_, i) => i !== index);
  setTableItems(updatedItems);
};

 //delete

 const deleteQuotation = async () => {
  if (!loadquotation) {
    alert("Please select a quotation first.");
    return;
  }

  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${loadquotation}?`
  );

  if (!confirmDelete) return;

  try {
    const res = await fetch(
      `${Api_url}/delete/${encodeURIComponent(loadquotation)}`,
      {
        method: "DELETE",
      }
    );

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete quotation");
    }

    toast.success("Quotation deleted successfully");

    resetall();

  } catch (error) {
    console.error("Delete error:", error.message);
    errorToast(error.message || "Failed to delete quotation");
  }
};
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">

         <div>
            <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
             >
                Go Back
            </button>
         </div>
   

      <div className="max-w-[1500px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200">
        
        {/* SECTION 1: Heading & Buttons */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-black tracking-tight">Quotation</h2>
          <div className="flex gap-1.5">
             <button onClick={resetall} className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>NEW</button>
              <button onClick={SaveQuotation} className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>SAVE</button>
              <button className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>EDIT</button>
              <button onClick={deleteQuotation} className='border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white'>DELETE</button>
          </div>
        </div>

        {/* SECTION 2: Corrected Order & Alignment */}
        {/* SECTION 2 & 3: Vertical Label & Input Layout */}
<div className="flex flex-row items-end gap-20 border-b border-gray-100 pb-8 mb-6">
  
  {/* 1. Name Dropdown Section */}
  <div className="flex gap-2 w-full w-full max-w-md">
     <div className='flex flex-col gap-2 flex-1 relative'>
     <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      Name 
    </label>
     <input type="text" 
      value={formdata.customer_name}
      onFocus={() => setclientopen(true)}
      onChange={(e) => {
        const value = e.target.value;
        setformdata({...formdata,customer_name:value});
        setsearch(value);
      }}
      placeholder='Enter Customer'
      className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
    
    {/* Dropdown */}
    {clientopen && (
        <div className='absolute top-[65px] left-0 bg-white shadow-lg z-50 w-[385px] border border-gray-200 rounded-[2px] overflow-y-auto'>
            {clients.length > 0 ? (
                clients.map((client) => (
                    <div key={client.id}
                    onClick={() => {
                        setformdata({...formdata, customer_name: client.customer_name});
                        setclientopen(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                        {client.customer_name}
                    </div>
                ))
            ):(
                <p>No clients found</p>
            )}
        </div>
    )}
    </div>

      {/* Small Menu Button */}
      <button className="flex flex-col ml-2 mt-[25px] gap-[3px] p-2.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition items-center justify-center h-10 w-11 shrink-0 bg-white">
        <div className="w-5 h-[2px] bg-gray-600"></div>
        <div className="w-5 h-[2px] bg-gray-600"></div>
      </button>
  </div>

  {/* 2. QTNO Section */}
  <div className="flex flex-col gap-2">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      QTNO
    </label>
    <input 
      type="text" 
       value={quotationNo} 
       onChange={(e) => setQuotationNo(e.target.value)}     
       className="w-48 p-2.5 border border-gray-200 rounded-lg text-[13px] font-bold text-gray-500 bg-gray-50 outline-none"
    />
  </div>

  {/* 3. Date Section */}
  <div className="flex flex-col gap-2 ">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight text-right sm:text-left">
      Date
    </label>
    <input 
      type="date" 
      value={formdata.quotation_date || ""}
      onChange={(e) => setformdata({...formdata,quotation_date:e.target.value})}
      className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-bold text-black outline-none focus:border-black bg-white w-48 shadow-sm"
    />
  </div>

</div>       

       {/* SECTION 4: Description & Quick Input Section */}
<div className="flex flex-row items-end gap-6 border-b border-gray-100 pb-8 mb-6">
  
  {/* 1. Description & Radio Buttons Group */}
  <div className="flex flex-col gap-2 shrink-0">
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

  {/* 2. Menu Button (Vertical alignment maintain panna kela push pannirukkaen) */}
  <div className="flex flex-col gap-2">
    <label className="text-[12px] font-bold text-transparent select-none uppercase">.</label> {/* Empty label for alignment */}
    <button className="flex flex-col gap-[3px] p-2.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition items-center justify-center h-[42px] w-11 shrink-0 bg-white">
      <div className="w-5 h-[2px] bg-gray-600"></div>
      <div className="w-5 h-[2px] bg-gray-600"></div>
    </button>
  </div>

  
</div>
        {/* SECTION 5: Item Input with Dropdown */}
        {/* MODERN INPUT ROW: 1st image fields in 2nd image structure */}
<div className="grid grid-cols-8 gap-3 mt-6 mb-4 bg-white">
  
  {/* 1. Item Name Dropdown (Flex-grow to take space) */}
  <div className="flex flex-col col-span-2 relative">
     <input type="text" placeholder='Item Name'
     value={currentrow.item_name}
      onFocus={() => setitemopen(true)}
      onChange={(e) => {
        const value = e.target.value;
        setcurrentrow({...currentrow,item_name:value});
          setitemsearch(value)
        }} 
      className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
  
   {/* Item Open */}

   {itemopen && (
    <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
            {Array.isArray(items) && items.length > 0 ? (
             items.map((item, index) =>(
            <div key={`${item.item_name}-${index}`}
             onClick={(e) => {e.stopPropagation(); 
              selectitem(item)
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

  {/* 2. Map other inputs (QTY, PRICE, etc.) in a row structure */}
  <div>
    <input type="number" 
    value={currentrow.quantity || ""}
    onChange={(e) => setcurrentrow({...currentrow, quantity:e.target.value})}
    placeholder='Quantity'
    className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
  </div>

  {/* Price */}

  <div>
    <input type="number" placeholder='Price' 
    value={currentrow.price || ""}
    onChange={(e) => setcurrentrow({...currentrow, price: parseFloat(e.target.value) || ''})}
    className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black 
     outline-none bg-gray-50/50 transition"/>

  </div>
{/* Total */}

  <div>
     <input type="number" placeholder='Total'
     value={currentrow.quantity && currentrow.price ? (currentrow.quantity * currentrow.price).toFixed(2) : ''}
     className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black 
     outline-none bg-gray-50/50 transition" />
  </div>

  {/* HSN */}

   <div>
    <input type="text" placeholder='HSN'
    value={currentrow.part_no || ""}
    onChange={(e) => setcurrentrow({...currentrow, part_no: e.target.value})}
    className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black 
     outline-none bg-gray-50/50 transition"/>
   </div>

 <div className='relative'>
        <input type="text" placeholder='Uom' 
         onFocus={() => setopenUom(true)}
         value={currentrow.uom || ""}
         onChange={(e) => setcurrentrow({...currentrow, uom:e.target.value})}
         className='w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition' />
 
      {openUom && (
          <div className='absolute top-30 left-0
          w-full  border border-gray-200 rounded-[4px] bg-white text-[13px] 
          font-medium text-black outline-none  transition'>
            {['NOS', 'KG', 'MTR', 'NO'].map((uom) => (
                <div key={uom} 
                 onClick={(e) =>{ e.stopPropagation(); setcurrentrow(prev => ({...prev, uom: uom}));
                   setopenUom(false);}}
                className="px-3 py-2 hover:bg-gray-200 cursor-pointer">
                  {uom}
                </div>
              ))}
              <div>

              </div>

          </div>

      )}
 </div>


  {/* 3. Add & Clear Buttons (Right next to inputs as in image 2) */}
  <div className="flex gap-2 shrink-0">
    <button 
       onClick={additem}
      className="px-4 h-[37px] bg-black text-white text-[13px] font-semibold rounded-lg flex items-center justify-center"    >
       Add
    </button>
    <button 
      onClick={clearrow}
     className="px-4 h-[37px] border  text-black text-[13px] font-semibold rounded-lg flex items-center justify-center"    >
      Clear
    </button>
  </div>
</div>
{/* SECTION 6: Table with Side Buttons (Image-la irukura mariye) */}
{/* TABLE SECTION: Modern Header with Dynamic Body */}
<div className="mt-6 flex gap-2 items-start">
  
  {/* Main Table Structure */}
  <div className="flex-grow border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white min-h-[200px]">
    <table className="w-full border-collapse">
      <thead>
        {/* Modern Header (Image 2 style) */}
        <tr className="bg-gray-50 border-b border-gray-200 text-left">
          <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">S.No</th>
          <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 uppercase">Item Name</th>
          <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-28 uppercase text-center">Quantity</th>
          <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-28 uppercase text-center">Price</th>
          <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-32 uppercase text-center">Amount</th>
          <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-24 uppercase text-center">UOM</th>
          <th className="p-3 text-[11px] font-black text-gray-500 w-28 uppercase text-center">Part No</th>
          <th className="p-3 text-[11px] font-black text-gray-500 w-28 uppercase text-center">Actions</th>
        </tr>
      </thead>
      
      {/* Table Body - Data inga dhaan add aagum */}
      <tbody>
        {tableItems.length > 0 ? (
          tableItems.map((item, index) => (
            <tr key={`${item.item_name}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="p-3 text-[12px] font-bold text-gray-600 border-r border-gray-50 text-center">{index + 1}</td>
              <td className="p-3 text-[12px] font-bold text-black border-r border-gray-50">{item.item_name}</td>
              <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.quantity}</td>
              <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.price}</td>
              <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.amount}</td>
              <td className="p-3 text-[12px] font-bold text-gray-700 border-r border-gray-50 text-center">{item.uom}</td>
              <td className="p-3 text-[12px] font-bold text-gray-700 text-center">{item.part_no}</td>
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
            <td colSpan="7" className="p-12 text-center text-gray-400 italic font-medium tracking-wide">
              No Data Added To Table
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  
</div>
        {/* SECTION 7: Reference, DIS, and Percentage Row */}
<div className="flex flex-row items-end gap-6 mt-4 border-t border-gray-100 pt-8">
  
  {/* 1. Reference Part */}
  <div className="flex flex-col gap-2 flex-grow">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      Reference
    </label>
    <input 
      type="text" 
      placeholder="Enter reference number..."
      value={formdata.reference}
      onChange={(e) => setformdata({...formdata,reference:e.target.value})}
      className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm transition-all"
    />
  </div>

  {/* 2. DIS (-) Part */}
  <div className="flex flex-col gap-2 shrink-0">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      DIS (-)
    </label>
    <input 
      type="text" 
      value={formdata.discount}
      onChange={(e) => setformdata({...formdata,discount:e.target.value})}
      className="w-24 p-2.5 border border-gray-200 rounded-lg text-[13px] font-bold text-right text-black bg-gray-50 outline-none"
    />
  </div>

</div>
        
       {/* SECTION 9: Grouped Terms & Grand Total Row */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6 pt-3">
  
  {/* Left Side: Paired Labels & Inputs (Label Top / Input Bottom) */}
  <div className="space-y-6">
    
    {/* Row 1: Taxes & Transport */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Taxes :</label>
        <input type="text" value={formdata.tax_text}
        onChange={(e) => setformdata({...formdata, tax_text:e.target.value})}  className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Transport :</label>
        <input type="text" value={formdata.transport_terms}
        onChange={(e) => setformdata({...formdata, transport_terms:e.target.value})}
        className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
    </div>

    {/* Row 2: Delivery Period & Validity */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Delivery Period :</label>
        <input type="text"
        value={formdata.delivery_period}
        onChange={(e) => setformdata({...formdata, delivery_period:e.target.value})}
        defaultValue="3-4 DAYS from the date of Firm order" className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Validity :</label>
        <input type="text"
        value={formdata.validity}
        onChange={(e) => setformdata({...formdata,validity:e.target.value})} defaultValue="30 days from the date of offer." className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
    </div>

    {/* Row 3: Payment & Guarantee */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment :</label>
        <input type="text" 
        value={formdata.payment_terms}
        onChange={(e) => setformdata({...formdata, payment_terms:e.target.value})}
        className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Guarantee :</label>
        <input type="text" value={formdata.guarantee_text}
         onChange={(e) => setformdata({...formdata, guarantee_text:e.target.value})}
         className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
    </div>

    {/* Row 4: Pack Frd & Warranty */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Pack Frd :</label>
        <input type="text"
        value={formdata.pack_frd}
        onChange={(e) => setformdata({...formdata, pack_frd:e.target.value})}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Warranty :</label>
        <input type="text" value={formdata.waranty}
        onChange={(e) => setformdata({...formdata, waranty:e.target.value})}
        className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
      </div>
    </div>

    {/* Row 5: For Sign (Full width in left column) */}
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">For Sign :</label>
      <input type="text"
      value={formdata.for_sign}
      onChange={(e) => setformdata({...formdata, for_sign:e.target.value})}
       className="w-full p-2.5 border border-gray-300 rounded-lg text-[13px] font-semibold text-black outline-none focus:border-black bg-white shadow-sm" />
    </div>

  </div>

  {/* Right Side: Totals & Sign Details  */}
  <div className="space-y-3">
    <div className="flex justify-end">
      <div className="w-full max-w-sm bg-gray-50/50 p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">Subtotal :</label>
            <input type="text" value={subtotal.toFixed(2)} readOnly className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none focus:border-black" />
          </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">CGST (9%) :</label>
            <div className="flex gap-2">
              <input type="text"  value={cgstpercentage}
               onChange={(e) => setCgstpercentage(e.target.value)}
               className="w-10 p-1 border border-gray-300 rounded text-center text-[11px] font-bold outline-none" />
              <input type="text" value={cgst.toFixed(2)} readOnly className="w-24 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">SGST (9%) :</label>
            <div className="flex gap-2">
              <input type="text"  value={sgstpercentage}
              onChange={(e) => setSgstpercentage(e.target.value)} className="w-10 p-1 border border-gray-300 rounded text-center text-[11px] font-bold outline-none" />
              <input type="text" value={sgst.toFixed(2)} readOnly className="w-24 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">IGST :</label>
            <input type="text" readOnly className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
          </div>

            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black text-gray-500 uppercase">Transport :</label>
              <input type="text"
              value={formdata.transport}
              onChange={(e) => setformdata({...formdata, transport:e.target.value })}
              className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
            </div>

          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black text-gray-500 uppercase">Round Off :</label>
            <input type="text" value={roundOff.toFixed(2) || 0} readOnly className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
          </div>

          <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-300">
            <label className="text-[14px] font-black text-black uppercase tracking-tighter">Grand Total :</label>
            <span className="text-[22px] font-black text-[#311B92] italic tracking-tighter">{grandtotal || 0 }</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        {/* SECTION 10: Selection Dropdown - Flexible & Clean */}
        <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6">
          <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
            Select Quotation No To View / Modify Details :
          </label>
             <div className="relative">
  <input
    type="text"
    value={loadquotation}
    onFocus={() => {setloadqtopen(true); searchQt(loadquotation || "")}}
    onChange={(e) =>
    {const value = e.target.value
      setloadquotation(value);
      searchQt(value);
    }
    }
    className="w-full p-2.5 border rounded-lg outline-0"
  />

  {loadqtopen && (
    <div className="absolute top-12 left-0 w-full bg-white border rounded-lg shadow-lg z-50">

      {Array.isArray(qtlist) && qtlist.length > 0 ? (
        qtlist.map((qt, index) => (
          <div
            key={qt.quotation_no || index}
            onClick={() => {
              setloadquotation(qt.quotation_no);
              loadQuotation(qt.quotation_no);
              setloadqtopen(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {qt.quotation_no}
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-gray-400">
          No Quotations found
        </div>
      )}

    </div>
  )}
</div>
        </div>
      </div>
    </div>
  );
};

export default Quotation; 