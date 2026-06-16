import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { errorToast } from '../ui/nottifications';
import { SquarePen, Trash2, UserPlus, PackagePlus,Eye,CheckCircle} from 'lucide-react';
import { isTamilNadu, calcGstAmounts } from '../../utils/gstUtils';
import CustomerQuickAddModal from '../ui/CustomerQuickAddModal';
import ProductQuickAddModal from '../ui/ProductQuickAddModal';
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import SaleswindowModel from '../ui/saleswindowModal';
import QuotationFormat from '../pages/Sales/quotationoverview'

const Quotation = () => {
  const [tableItems, setTableItems] = useState([]);
  const [clients , setclients] = useState([]);
  const [search , setsearch] = useState();
  const [quotationNo, setQuotationNo] = useState("");
  const [ordertype , setordertype] = useState("");
  const [itemsearch , setitemsearch] = useState("");
  const [items , setitems] = useState([]);
  const [gstPct, setGstPct] = useState(18);
  const [customerState, setCustomerState] = useState("");
  const [customerGst, setCustomerGst] = useState("");
  const [loadquotation , setloadquotation] = useState("")
  const [qtlist , setLoadQt] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [clientRefreshKey, setClientRefreshKey] = useState(0);
  const [itemRefreshKey, setItemRefreshKey] = useState(0);

//   Dropdown state
  const [openUom , setopenUom] = useState(false);
  const[clientopen , setclientopen] = useState(false);
  const[itemopen , setitemopen] = useState(false);
  const [shouldAutoSelect, setShouldAutoSelect] = useState(false);
  const [loadqtopen , setloadqtopen] = useState(false);
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // Success Model
     const [showSuccessModal, setShowSuccessModal] = useState(false);
      const [savedDcNo, setSavedDcNo] = useState("");
      const [showDcFormat, setShowDcFormat] = useState(false);
      const [dcModalMinimized, setDcModalMinimized] = useState(false);
      const [viewDcNo, setViewDcNo] = useState("");

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
    serial_no: "",
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
},[search, clientRefreshKey]);

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
},[ordertype, itemsearch, shouldAutoSelect, itemRefreshKey]);

// Select items
const selectitem = (selectedItem) => {
  setcurrentrow({
    ...currentrow,
    item_name: selectedItem.item_name,
    part_no: selectedItem.hsn_number,
  });
  setitemopen(false); 
};


// Quick Add handlers

const handleCustomerCreated = (newCustomer) => {
  setClientRefreshKey(k => k + 1);
  setformdata(p => ({ ...p, customer_name: newCustomer.customer_name }));
  setCustomerState(newCustomer.state || "");
  setCustomerGst(newCustomer.gst_number || "");
  setsearch(newCustomer.customer_name);
  setclientopen(false);
  setShowCustomerModal(false);
};

const handleProductCreated = (newItem) => {
  const type = newItem.type;
  setordertype(type);
  setItemRefreshKey(k => k + 1);
  setcurrentrow(prev => ({
    ...prev,
    item_name: newItem.item_name,
    part_no: newItem.hsn_number || "",
  }));
  setitemsearch("");
  setitemopen(false);
  setShowProductModal(false);
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
    serial_no: "",
    price: "",
    quantity: "",
    part_no:"",
    uom:"",
  });
 setEditIndex(-1);
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

const handleSaveQuotation = () => {
    SaveQuotation();
};

const handleDeleteQuotation = () => {
    deleteQuotation();
};

const SaveQuotation = async () =>{
  if (!formdata.customer_name?.trim()) {
    toast.error("Customer Name is required");
    return;
  }
  if (!formdata.quotation_date) {
    toast.error("Quotation Date is required");
    return;
  }
  if (tableItems.length === 0) {
    toast.error("Please add at least one item");
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
     serial_no: item.serial_no || "",
     price: item.price,
     quantity: item.quantity,
     part_no: item.part_no,
    uom: item.uom
})),
  subtotal: subtotal,
  cgst: cgst,
  sgst: sgst,
  igst: igst,
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
    if (method === "PUT") {
      toast.success("Quotation Updated Successfully");
      resetall();
    } else {
      setSavedDcNo(data.quotation_no || quotationNo);
      setShowSuccessModal(true);
    }
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
  const newRow = { ...currentrow, amount };
  if (editIndex >= 0) {
    setTableItems(prev => { const u = [...prev]; u[editIndex] = newRow; return u; });
    setEditIndex(-1);
  } else {
    setTableItems([...tableItems, newRow]);
  }
  setcurrentrow({
    item_name: "",
    serial_no: "",
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
        serial_no: "",
        quantity: "",
        price: "",
        part_no:"",
        uom:"",
    });
};
    
 //Calculations

 const subtotal = tableItems.reduce((sum,items) =>{
  return sum + Number(items.amount || 0);
 },0);

 const discount = Number(formdata.discount || 0);
 const transport = Number(formdata.transport || 0);
 const isIntrastate = isTamilNadu(customerState, customerGst);
 const { cgst, sgst, igst, cgstPct, sgstPct, igstPct } = calcGstAmounts(subtotal, gstPct, isIntrastate);

 const rawTotal = subtotal - discount + transport + cgst + sgst + igst;
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
    serial_no: item.serial_no || "",
    quantity: item.quantity || "",
    price: item.price || "",
    part_no: item.part_no || "",
    uom: item.uom || "",
  });
  setEditIndex(index);
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
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";


  // Close Successmodel
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setShowDcFormat(false);
        resetall();
    };

    // HandleView Dc
    const handleViewDc = () => {
        setViewDcNo(savedDcNo);
        setShowSuccessModal(false);
        setDcModalMinimized(false);
        setShowDcFormat(true);
    }

  return (
    <>
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">

       {/* Successmodel */}
      
      {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-1">Quotation Saved Successfully!</h2>
                        <p className="text-sm text-gray-500 mb-1">Quotation has been created.</p>
                        <p className="text-sm font-black text-blue-600 mb-6">{savedDcNo}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleViewDc}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> View Quotation
                            </button>
                            <button
                                onClick={handleCloseSuccessModal}
                                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Saleswindow Model */}

             <SaleswindowModel
              title = "Quotation"
              isOpen={showDcFormat}
              type="Quotation"
              isMinimized={dcModalMinimized}
              onMinimize={() => setDcModalMinimized(true)}
              onClose={() => { setShowDcFormat(false); setDcModalMinimized(false); resetall(); }}
              filters={{ QtNumber: viewDcNo, dcNumber: viewDcNo }}
              onFilterChange={(f) => setViewDcNo(f.QtNumber || f.dcNumber || viewDcNo)}
              children={<Quotation qtNumber={viewDcNo} />}
             >
              <QuotationFormat key={viewDcNo} QtNumber={viewDcNo}/>
             </SaleswindowModel>

             {/* minimised */}

             {showDcFormat && dcModalMinimized && (
                <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setDcModalMinimized(false)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
                    >
                        <div className="w-3 h-3 border border-white/50"></div>
                        QT Format
                    </button>
                </div>
            )}

      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm">
        ← Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">

        {/* Title + Buttons */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Quotation</h2>
            <p className="text-[12px] text-gray-400 mt-1">Customer → Products → Save</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetall} className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
            <button onClick={handleSaveQuotation} className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">SAVE</button>
            <button onClick={handleDeleteQuotation} className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
          </div>
        </div>

        {/* Step 1 — Header */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Quotation Header</p>
          <div className="grid grid-cols-4 gap-5">
            {/* Customer */}
            <div className="col-span-2">
              <label className={labelCls}>Customer / Company <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input type="text"
                    value={formdata.customer_name}
                    onFocus={() => setclientopen(true)}
                    onChange={(e) => { const v = e.target.value; setformdata({...formdata, customer_name: v}); setsearch(v); }}
                    placeholder="Type to search customers…"
                    className={inputCls} />
                  {clientopen && (
                    <div className={dropdownCls}>
                      {clients.length > 0 ? clients.map((client) => (
                        <div key={client.id}
                          onClick={() => {
                            setCustomerState(client.state || "");
                            setCustomerGst(client.gst_number || "");
                            setformdata({...formdata, customer_name: client.customer_name});
                            setclientopen(false);
                          }}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                          {client.customer_name}
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-[13px] text-gray-400">No clients found</div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  title="Quick Add Customer"
                  className="shrink-0 p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-colors"
                >
                  <UserPlus size={15} className="text-gray-500" />
                </button>
              </div>
            </div>
            {/* QT No */}
            <div>
              <label className={labelCls}>Quotation No (Auto)</label>
              <input type="text" value={quotationNo} readOnly className={roInputCls} />
            </div>
            {/* Date */}
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={formdata.quotation_date || ""}
                onChange={(e) => setformdata({...formdata, quotation_date: e.target.value})}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Step 2 — Description Type */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2 — Description Type</p>
          <div className="flex items-center gap-6">
            {[["service","Service"],["spare","Spares"],["purchase_item","Purchase Items"]].map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-[12px] font-bold text-gray-700 cursor-pointer">
                <input type="radio" name="ordertype" checked={ordertype === val} onChange={() => typechange(val)} className="w-4 h-4 accent-black" /> {label}
              </label>
            ))}
            <div>
            <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  title="Quick Add Product / Service"
                  className="shrink-0 p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-colors"
                >
                  <PackagePlus size={15} className="text-gray-500" />
                </button>
           </div>
          </div>
        </div>

        {/* Step 3 — Add Products */}
        <div className="mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 3 — Add Products</p>
           <div className="grid grid-cols-10 gap-3 items-end">
            {/* Item Name */}
            <div className="col-span-3">
              <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1.5">
                
                <div className="relative flex-1">
                  <input type="text" placeholder="Search item…"
                    value={currentrow.item_name}
                    onFocus={() => setitemopen(true)}
                    onChange={(e) => { const v = e.target.value; setcurrentrow({...currentrow, item_name: v}); setitemsearch(v); }}
                    className={`${inputCls} bg-gray-50/60`} />
                  {itemopen && (
                    <div className={dropdownCls}>
                      {Array.isArray(items) && items.length > 0 ? items.map((item, i) => (
                        <div key={`${item.item_name}-${i}`}
                          onClick={(e) => { e.stopPropagation(); selectitem(item); }}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                          {item.item_name}
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-[13px] text-gray-400">No items found</div>
                      )}
                    </div>
                  )}
                </div>
            </div>
            </div>
            {/* Serial Number */}
            <div>
              <label className={labelCls}>Serial Number</label>
              <input type="text" placeholder="Serial Number"
                value={currentrow.serial_no || ""}
                onChange={(e) => setcurrentrow({...currentrow, serial_no: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Qty */}
            <div>
              <label className={labelCls}>Qty <span className="text-red-500">*</span></label>
              <input type="number" placeholder="0"
                value={currentrow.quantity || ""}
                onChange={(e) => setcurrentrow({...currentrow, quantity: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Price */}
            <div>
              <label className={labelCls}>Rate <span className="text-red-500">*</span></label>
              <input type="number" placeholder="0.00"
                value={currentrow.price || ""}
                onChange={(e) => setcurrentrow({...currentrow, price: parseFloat(e.target.value) || ''})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Amount */}
            <div>
              <label className={labelCls}>Amount</label>
              <input type="text" placeholder="Auto"
                value={currentrow.quantity && currentrow.price ? (currentrow.quantity * currentrow.price).toFixed(2) : ''}
                readOnly className={roInputCls} />
            </div>
            {/* HSN */}
            <div>
              <label className={labelCls}>HSN</label>
              <input type="text" placeholder="HSN code"
                value={currentrow.part_no || ""}
                onChange={(e) => setcurrentrow({...currentrow, part_no: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* UOM */}
            <div className="relative">
              <label className={labelCls}>UOM</label>
              <input type="text" placeholder="UOM"
                onFocus={() => setopenUom(true)}
                value={currentrow.uom || ""}
                onChange={(e) => setcurrentrow({...currentrow, uom: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
              {openUom && (
                <div className={dropdownCls}>
                  {['NOS', 'KG', 'MTR', 'NO'].map((uom) => (
                    <div key={uom}
                      onClick={(e) => { e.stopPropagation(); setcurrentrow(prev => ({...prev, uom})); setopenUom(false); }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] font-medium border-b border-gray-50 last:border-0">
                      {uom}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={additem} className={`flex-1 py-2.5 text-white rounded-lg text-[13px] font-bold transition-colors ${editIndex >= 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}>{editIndex >= 0 ? "Update" : "Add"}</button>
              <button onClick={() => { clearrow(); setEditIndex(-1); }} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors">Clear</button>
            </div>
          </div>
          </div>

        {/* Items Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-3">
          <div className="h-[250px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Item Name", "Serial Number", "Quantity", "Price", "Amount", "UOM", "Part No", "Actions"].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${i === 0 ? "w-10 text-center" : i === 1 || i === 2 ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableItems.length > 0 ? tableItems.map((item, index) => (
                <tr key={`${item.item_name}-${index}`} className={`border-b border-gray-100 transition-colors ${editIndex === index ? "bg-blue-50" : "hover:bg-gray-50/70"}`}>
                  <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">{index + 1}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">{item.item_name}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 text-left">{item.serial_no || "—"}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 text-center">₹{item.price}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-gray-900 text-center">₹{Number(item.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{item.uom}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{item.part_no || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => edititem(index)} title="Edit"><SquarePen size={16} className="text-blue-500 hover:text-blue-700 transition-colors" /></button>
                      <button onClick={() => deleteitem(index)} title="Delete"><Trash2 size={16} className="text-red-400 hover:text-red-600 transition-colors" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="py-14 text-center">
                    <div className="text-gray-300 text-4xl mb-3">📋</div>
                    <p className="text-[13px] text-gray-400 font-medium">No products added yet.</p>
                    <p className="text-[12px] text-gray-300 mt-1">Select customer → products to begin.</p>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-10 bg-gray-100">
              <tr>
                <td colSpan="9" className="px-4 py-3">
                  <div className="flex items-center ml-[22%] gap-2">
                    <span className="text-[13px] font-black text-gray-600 uppercase tracking-wide">TOTAL QTY</span>
                    <span className="text-[13px] font-black text-gray-500">:</span>
                    <span className="text-[18px] font-black text-blue-700">{tableItems.reduce((s, r) => s + Number(r.quantity || 0), 0)}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>

        {/* Bottom: Load Quotation + Grand Total */}
        <div className="grid grid-cols-2 gap-10 mt-8">

          {/* Left: Load + Reference */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Load / Edit Existing Quotation</p>
            <div className="relative w-64">
              <label className={labelCls}>Quotation No</label>
              <input type="text" value={loadquotation}
                onFocus={() => { setloadqtopen(true); searchQt(loadquotation || ""); }}
                onChange={(e) => { const v = e.target.value; setloadquotation(v); searchQt(v); }}
                className={`${inputCls} w-64`} />
              {loadqtopen && (
                <div className={`${dropdownCls} w-64`}>
                  {Array.isArray(qtlist) && qtlist.length > 0 ? qtlist.map((qt, i) => (
                    <div key={qt.quotation_no || i}
                      onClick={() => { setloadquotation(qt.quotation_no); setloadqtopen(false); requirePassword(() => loadQuotation(qt.quotation_no)); }}
                      className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {qt.quotation_no}
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400">No Quotations found</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Reference</label>
              <input type="text" placeholder="Enter reference number…"
                value={formdata.reference}
                onChange={(e) => setformdata({...formdata, reference: e.target.value})}
                className={inputCls} />
            </div>
          </div>

          {/* Right: Grand Total */}
          <div className="pt-6 border-t border-gray-100">
            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3 max-w-sm ml-auto">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Subtotal</span>
                <span className="text-[13px] font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Discount (−)</span>
                <input type="number" min="0" value={formdata.discount}
                  onChange={(e) => setformdata({...formdata, discount: e.target.value})}
                  className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-black text-gray-500 uppercase">GST %</span>
                  <input type="number" value={gstPct} onChange={(e) => setGstPct(Number(e.target.value))}
                    className="w-12 p-1 border border-gray-200 rounded text-center text-[11px] font-bold outline-none" />
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isIntrastate ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {isIntrastate ? "TN — CGST+SGST" : "IGST"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">CGST @{cgstPct}%</span>
                <span className="text-[13px] font-bold text-gray-700">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">SGST @{sgstPct}%</span>
                <span className="text-[13px] font-bold text-gray-700">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">IGST @{igstPct}%</span>
                <span className="text-[13px] font-bold text-gray-700">₹{igst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Transport (+)</span>
                <input type="number" min="0" value={formdata.transport}
                  onChange={(e) => setformdata({...formdata, transport: e.target.value})}
                  className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Round Off</span>
                <span className="text-[13px] font-bold text-gray-700">{roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                <span className="text-[15px] font-black text-black uppercase">Grand Total</span>
                <span className="text-[24px] font-black text-indigo-700">₹{grandtotal || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Terms &amp; Conditions</p>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {[
                ["Taxes", "tax_text"], ["Transport", "transport_terms"],
                ["Delivery Period", "delivery_period"], ["Validity", "validity"],
              ].map(([lbl, key]) => (
                <div key={key}>
                  <label className={labelCls}>{lbl}</label>
                  <input type="text" value={formdata[key]}
                    onChange={(e) => setformdata({...formdata, [key]: e.target.value})}
                    className={inputCls} />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[
                ["Payment Terms", "payment_terms"], ["Guarantee", "guarantee_text"],
                ["Pack Frd", "pack_frd"], ["Warranty", "waranty"], ["For Sign", "for_sign"],
              ].map(([lbl, key]) => (
                <div key={key}>
                  <label className={labelCls}>{lbl}</label>
                  <input type="text" value={formdata[key]}
                    onChange={(e) => setformdata({...formdata, [key]: e.target.value})}
                    className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
   </div>
    {/* Customer Quick Add Modal */}
    {showCustomerModal && (
      <CustomerQuickAddModal
        onClose={() => setShowCustomerModal(false)}
        onSuccess={handleCustomerCreated}
      />
    )}

    {/* Product Quick Add Modal */}
    {showProductModal && (
      <ProductQuickAddModal
        onClose={() => setShowProductModal(false)}
        onSuccess={handleProductCreated}
        defaultType={ordertype === "spare" || ordertype === "service" ? ordertype : "spare"}
      />
    )}
    {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
    )}
    </>
  );
};

export default Quotation;