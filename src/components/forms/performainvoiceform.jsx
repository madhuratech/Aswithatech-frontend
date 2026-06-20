import API_BASE_URL from "../../config/api";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen,Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { isTamilNadu, calcGstAmounts } from "../../utils/gstUtils";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import SaleswindowModel from "../ui/saleswindowModal";
import InvoiceFormat from "../pages/Sales/invoiceformat";
const PerformanceInvoiceForm  = () => {
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();
  const navigate = useNavigate();
  const [invoiceno , setInvoiceno]=useState("");
  const[tabledata , setTabledata] = useState([]);
  const [ordertype , setOrdertype] = useState("");
  const [customername , setCustomername] = useState([]);
  const [search , setsearch] = useState();
  const[items , setitems] = useState([]);
  const[itemsearch , setitemsearch] = useState();
  const [dcNoDisplay, setDcNoDisplay]         = useState("");
  const [dcDateDisplay, setDcDateDisplay]     = useState("");
  const [orderNoDisplay, setOrderNoDisplay]   = useState("");
  const [orderDateDisplay, setOrderDateDisplay] = useState("");

  const [loadInvoice , setLoadInvoice] = useState("");
  const [gstPct, setGstPct] = useState(18);
  const [customerState, setCustomerState] = useState("");
  const [customerGst, setCustomerGst] = useState("");
  const [invoiceList, setInvoiceList] = useState([]); 



  const[clientopen , setclientopen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [shouldAutoSelect, setShouldAutoSelect] = useState(false);
  const [itemopen , setitemopen] = useState(false);
  const [openUom , setopenUom] = useState(false);
  const [loadInvoiceOpen , setLoadInvoiceOpen] = useState(false);
  const [showInvoiceWindow, setShowInvoiceWindow] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [savedNo, setSavedNo] = useState(null);

   

  //API

  const Api_url = `${API_BASE_URL}/directinvoices`

  const DESPATCH_OPTIONS = ["Courier", "Hand Delivery", "Transport", "By Bus", "By Train", "Parcel Service", "Customer Pickup"];

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
    transport: "",
  });

  const [currentrow , setcurrentrow] = useState({
    item_name: "",
    serial_no: "",
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // get New Date

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormdata(prev => ({
      ...prev,
      invoice_date: today
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const perfInvoiceDateRef = useRef(null);
  const perfInvoiceDateFp = useRef(null);

  const dcDateRef = useRef(null);
  const dcDateFp = useRef(null);

  const orderDateRef = useRef(null);
  const orderDateFp = useRef(null);
  const dispatchRef = useRef(null);
  const customerDropdownRef = useRef(null);
  const itemDropdownRef = useRef(null);
  const uomDropdownRef = useRef(null);
  const loadInvoiceDropdownRef = useRef(null);

  useOutsideClick([
    { ref: customerDropdownRef, onClose: () => setclientopen(false) },
    { ref: dispatchRef, onClose: () => setDispatchOpen(false) },
    { ref: itemDropdownRef, onClose: () => setitemopen(false) },
    { ref: uomDropdownRef, onClose: () => setopenUom(false) },
    { ref: loadInvoiceDropdownRef, onClose: () => setLoadInvoiceOpen(false) },
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setclientopen(false);
        setDispatchOpen(false);
        setitemopen(false);
        setopenUom(false);
        setLoadInvoiceOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    perfInvoiceDateFp.current = flatpickr(perfInvoiceDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: formData.invoice_date ? toDmy(formData.invoice_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setFormdata(p => ({ ...p, invoice_date: toYmd(dateStr) }));
      },
    });
    return () => perfInvoiceDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (perfInvoiceDateFp.current && formData.invoice_date) {
      perfInvoiceDateFp.current.setDate(toDmy(formData.invoice_date));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.invoice_date]);


  // Dc Dates

  useEffect(() => {
  dcDateFp.current = flatpickr(dcDateRef.current, {
    disableMobile: true,
    monthSelectorType: "static",
    dateFormat: "d-m-Y",
    defaultDate: formData.dc_date || new Date(),
    allowInput: false,
    onChange: (selectedDates, dateStr) => {
      setFormdata((prev) => ({
        ...prev,
        dc_date: dateStr,
      }));
    },
  });

  return () => dcDateFp.current?.destroy();
  // eslint-disable-next-line
}, []);

useEffect(() => {
  if (dcDateFp.current && formData.dc_date) {
    dcDateFp.current.setDate(formData.dc_date, false);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [formData.dc_date]);


// Order Dates

useEffect(() => {
  orderDateFp.current = flatpickr(orderDateRef.current, {
    disableMobile: true,
    monthSelectorType: "static",
    dateFormat: "d-m-Y",
    allowInput: false,
    onChange: (selectedDates, dateStr) => {
      setFormdata((prev) => ({
        ...prev,
        order_date: dateStr,
      }));
    },
  });

  return () => orderDateFp.current?.destroy();
  // eslint-disable-next-line
}, []);

useEffect(() => {
  if (orderDateFp.current && formData.order_date) {
    orderDateFp.current.setDate(
      formData.order_date.split(",").map((d) => d.trim()),
      false
    );
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [formData.order_date]);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ordertype,itemsearch]);


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
  const addrows = () => {
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
      serial_no: "",
      quantity: "",
      price: "",
      uom:"",
      hsn_number:"",
    });
  };

  // clear Rows

  const clearrows = () => {
    setcurrentrow({
      item_name: "",
      serial_no: "",
      quantity: "",
      price: "",
      uom:"",
      hsn_number:""
    });
  };


  // Save Invoice

  const handleSave = () => {
    SaveInvoice();
  };

  const handleDelete = () => {
    deletInvoice();
  };

  const handleShowClick = () => {
    const dcNo = formData.dc_no?.trim();
    const dcDate = formData.dc_date?.trim() || dcDateRef.current?.value;
    const orderNo = formData.order_no?.trim();
    const orderDate = formData.order_date?.trim() || orderDateRef.current?.value;
    if (!dcNo && !orderNo) { toast.error("Enter DC No or Order No first."); return; }

    // Append DC No
    if (dcNo) {
      const existingDcs = (dcNoDisplay || "").split(",").map(s => s.trim()).filter(Boolean);
      if (!existingDcs.includes(dcNo)) {
        setDcNoDisplay(prev => prev ? `${prev}, ${dcNo}` : dcNo);
        // Append DC Date
        if (dcDate) {
          const existingDates = (dcDateDisplay || "").split(",").map(s => s.trim()).filter(Boolean);
          if (!existingDates.includes(dcDate)) {
            setDcDateDisplay(prev => prev ? `${prev}, ${dcDate}` : dcDate);
          }
        }
      } else {
        toast.error(`DC No ${dcNo} already added.`);
      }
    }

    // Append Order No
    if (orderNo) {
      const existing = (orderNoDisplay || "").split(",").map(s => s.trim()).filter(Boolean);
      if (!existing.includes(orderNo)) {
        setOrderNoDisplay(prev => prev ? `${prev}, ${orderNo}` : orderNo);
        // Append Order Date
        if (orderDate) {
          const existingDates = (orderDateDisplay || "").split(",").map(s => s.trim()).filter(Boolean);
          if (!existingDates.includes(orderDate)) {
            setOrderDateDisplay(prev => prev ? `${prev}, ${orderDate}` : orderDate);
          }
        }
      }
    }

    dcDateFp.current?.clear(false);
    orderDateFp.current?.clear(false);
    setFormdata(prev => ({
      ...prev,
      dc_no: "",
      dc_date: "",
      order_no: "",
      order_date: "",
    }));
    toast.success("Values added to invoice.");
  };

  const SaveInvoice = async () =>{
    if (!formData.dispatch_through?.trim()) { toast.error("Despatch Through is required."); return; }
    if(tabledata.length === 0){
      alert("Please Add Items");
      return;
    }

    const finalDcNo = dcNoDisplay || formData.dc_no;
    const finalDcDate = dcDateDisplay || formData.dc_date || (finalDcNo ? dcDateRef.current?.value : "");
    const finalOrderNo = orderNoDisplay || formData.order_no;
    const finalOrderDate = orderDateDisplay || formData.order_date || (finalOrderNo ? orderDateRef.current?.value : "");

    const invoicedata = {
      ...formData,
      customer_name: formData.customer_name,
      ordertype: ordertype,
      invoice_no: invoiceno,
      invoice_date: formData.invoice_date,
      dc_no: finalDcNo,
      dc_date: finalDcDate,
      order_no: finalOrderNo,
      order_date: finalOrderDate,
      discount: formData.discount,
      payment_terms: formData.payment_terms,
      dispatch_through: formData.dispatch_through,
      items: tabledata.map(item => ({
        item_name: item.item_name,
        serial_no: item.serial_no || "",
        quantity: item.quantity,
        price: item.price,
        uom: item.uom,
        hsn_number: item.hsn_number,
      })),

      subtotal: subtotal,
      transport: transport,
      taxable_value: taxableValue,
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

        setSavedNo(invoiceno);

    }catch(error){
       console.log("Error saving invoice:", error);
        toast.error("Failed to save invoice");
    }
  }

  // Calculation
 const subtotal = tabledata.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const transport = Number(formData.transport || 0);
  const taxableValue = parseFloat((subtotal + transport).toFixed(2));
  const isIntrastate = isTamilNadu(customerState, customerGst);
  const { cgst, sgst, igst, cgstPct, sgstPct, igstPct } = calcGstAmounts(taxableValue, gstPct, isIntrastate);
  const rawTotal = taxableValue + cgst + sgst + igst;
  const round_off = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2));
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
      serial_no: item.serial_no || "",
      quantity: item.quantity,
      price: item.price,
      uom: item.uom,
      hsn_number: item.hsn_number,
      amount: Number(item.quantity) * Number(item.price),
    }));

    setLoadInvoice(invoiceNo);
    setInvoiceno(invoiceNo);
    setCustomerState(data.client?.state || "");
    setCustomerGst(data.client?.gst_number || "");

    setFormdata({
      customer_name: data.header.customer_name || "",
      invoice_no: data.header.invoice_no || "",
      invoice_date: formatDate(data.header.invoice_date),
      dc_no: "",
      dc_date: data.header.dc_date || "",
      order_no: "",
      order_date: "",
      payment_terms: data.header.payment_terms || "",
      dispatch_through: data.header.dispatch_through || "",
      transport: data.header.transport || 0,
    });
    setDcNoDisplay(data.header.dc_no || "");
    setDcDateDisplay(data.header.dc_date || "");
    setOrderNoDisplay(data.header.order_no || "");
    setOrderDateDisplay(data.header.order_date || "");

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
      serial_no: item.serial_no || "",
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
    setDcNoDisplay("");
    setDcDateDisplay("");
    setOrderNoDisplay("");
    setOrderDateDisplay("");
    setTabledata([]);
    setLoadInvoice("");
    setOrdertype("");
    setCustomerState("");
    setCustomerGst("");
    setclientopen(false);
    setitemopen(false);
    setopenUom(false);
    setcurrentrow({
      item_name: "",
      serial_no: "",
      quantity: "",
      price: "",
      uom:"",
      hsn_number:""
    });
 
    const res =  await fetch(`${Api_url}/next-In-billno`);
    const data = await res.json();
    setInvoiceno(data.invoice_no);
  };

  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">

      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm">
        ← Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">

        {/* Title + Buttons */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Direct Invoice</h2>
            <p className="text-[12px] text-gray-400 mt-1">Customer → Products → Save</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetall} className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
            <button onClick={handleSave} className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">SAVE</button>
            <button onClick={handleDelete} className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
          </div>
        </div>

        {/* Step 1 — Invoice Header */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Invoice Header</p>
          <div className="grid grid-cols-4 gap-5">
            {/* Customer */}
            <div className="relative col-span-2" ref={customerDropdownRef}>
              <label className={labelCls}>Customer / Company <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Type to search customers…"
                value={formData.customer_name}
                onFocus={() => setclientopen(true)}
                onChange={(e) => { const v = e.target.value; setFormdata({...formData, customer_name: v}); setsearch(v); }}
                className={inputCls} />
              {clientopen && (
                <div className={dropdownCls}>
                  {Array.isArray(customername) && customername.length > 0 ? customername.slice(0, 5).map((client) => (
                    <div key={client.id}
                      onClick={() => {
                        setCustomerState(client.state || "");
                        setCustomerGst(client.gst_number || "");
                        setFormdata({...formData, customer_name: client.customer_name});
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
            {/* Invoice No */}
            <div>
              <label className={labelCls}>Invoice No (Auto)</label>
              <input type="text" value={invoiceno} readOnly className={roInputCls} />
            </div>
            {/* Invoice Date */}
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input ref={perfInvoiceDateRef}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Step 2 — DC & Order Details */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2 — DC &amp; Order Details</p>
          <div className="grid grid-cols-7 gap-5">
            <div>
              <label className={labelCls}>DC No</label>
              <input type="text" placeholder="Enter DC No" value={formData.dc_no}
                onChange={(e) => setFormdata({...formData, dc_no: e.target.value})} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>DC Date</label>
              <input
               ref={dcDateRef}
               value={formData.dc_date}
               readOnly
               placeholder="Select DC Date"
               className={inputCls}
                />
            </div>
            <div>
              <label className={labelCls}>Order No</label>
              <input type="text" placeholder="Order number" value={formData.order_no}
                onChange={(e) => setFormdata({...formData, order_no: e.target.value})} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Order Date</label>
             <input
             ref={orderDateRef}
               value={formData.order_date}
               readOnly
               placeholder="Select Order Date(s)"
                 className={inputCls}
               />
            </div>
            <div className="relative" ref={dispatchRef}>
              <label className={labelCls}>Despatch Through <span className="text-red-500">*</span></label>
              <div
                onClick={() => setDispatchOpen(!dispatchOpen)}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px]`}
              >
                <span className={formData.dispatch_through ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {formData.dispatch_through || "Select mode…"}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {dispatchOpen && (
                <div className={dropdownCls}>
                  {DESPATCH_OPTIONS.map((opt) => (
                    <div key={opt}
                      onClick={() => { setFormdata({...formData, dispatch_through: opt}); setDispatchOpen(false); }}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-end">
              <button type="button" onClick={handleShowClick}
                disabled={!formData.dc_no && !formData.order_no}
                className={`w-full px-4 py-2.5 rounded-lg text-[13px] font-black uppercase tracking-wider transition-all duration-150 ${
                  formData.dc_no || formData.order_no
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}>
                SHOW
              </button>
            </div>
          </div>

          {/* Display fields (accumulated values) */}
          <div className="grid grid-cols-4 gap-5 mt-4">
            <div>
              <label className={labelCls}>DC No (Added)</label>
              <input type="text" value={dcNoDisplay} readOnly className={roInputCls} placeholder="Click SHOW to add" />
            </div>
            <div>
              <label className={labelCls}>DC Date (Added)</label>
              <input type="text" value={dcDateDisplay} readOnly className={roInputCls} placeholder="Click SHOW to add" />
            </div>
            <div>
              <label className={labelCls}>Order No (Added)</label>
              <input type="text" value={orderNoDisplay} readOnly className={roInputCls} placeholder="Click SHOW to add" />
            </div>
            <div>
              <label className={labelCls}>Order Date (Added)</label>
              <input type="text" value={orderDateDisplay} readOnly className={roInputCls} placeholder="Click SHOW to add" />
            </div>
          </div>
        </div>

        {/* Step 3 — Description + Add Products */}
        <div className="mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 3 — Add Products</p>

          {/* Description type */}
          <div className="flex items-center gap-6 mb-4">
            {[["service","Service"],["spare","Spares"],["purchase_item","Purchase Items"]].map(([val, lbl]) => (
              <label key={val} className="flex items-center gap-2 text-[12px] font-bold text-gray-700 cursor-pointer">
                <input type="radio" name="ordertype" checked={ordertype === val} onChange={() => typechange(val)} className="w-4 h-4 accent-black" /> {lbl}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-9 gap-3 items-end">
            {/* Item Name */}
            <div className="col-span-2 relative" ref={itemDropdownRef}>
              <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Search item…"
                value={currentrow.item_name}
                onFocus={() => setitemopen(true)}
                onChange={(e) => { const v = e.target.value; setcurrentrow({...currentrow, item_name: v}); setitemsearch(v); }}
                className={`${inputCls} bg-gray-50/60`} />
              {itemopen && (
                <div className={dropdownCls}>
                  {Array.isArray(items) && items.length > 0 ? items.map((item, i) => (
                    <div key={`${item.item_name}-${i}`}
                      onClick={(e) => { e.stopPropagation(); setitemopen(false); selectitem(item); }}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {item.item_name}
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400">No items found</div>
                  )}
                </div>
              )}
            </div>
            {/* Serial Number */}
            <div>
              <label className={labelCls}>Serial Number</label>
              <input type="text" placeholder="Serial Number" value={currentrow.serial_no || ""}
                onChange={(e) => setcurrentrow({...currentrow, serial_no: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Qty */}
            <div>
              <label className={labelCls}>Qty <span className="text-red-500">*</span></label>
              <input type="number" placeholder="0" value={currentrow.quantity}
                onChange={(e) => setcurrentrow({...currentrow, quantity: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Price */}
            <div>
              <label className={labelCls}>Rate <span className="text-red-500">*</span></label>
              <input type="number" placeholder="0.00" value={currentrow.price}
                onChange={(e) => setcurrentrow({...currentrow, price: Number(e.target.value) || ''})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Amount */}
            <div>
              <label className={labelCls}>Amount</label>
              <input type="text" placeholder="Auto"
                value={currentrow.quantity && currentrow.price ? (Number(currentrow.quantity) * Number(currentrow.price)).toFixed(2) : ''}
                readOnly className={roInputCls} />
            </div>
            {/* UOM */}
            <div className="relative" ref={uomDropdownRef}>
              <label className={labelCls}>UOM</label>
              <input type="text" placeholder="Select" value={currentrow.uom}
                onFocus={() => setopenUom(true)}
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
            {/* HSN */}
            <div>
              <label className={labelCls}>HSN</label>
              <input type="text" placeholder="HSN code" value={currentrow.hsn_number}
                onChange={(e) => setcurrentrow({...currentrow, hsn_number: e.target.value})}
                className={`${inputCls} bg-gray-50/60`} />
            </div>
            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={addrows} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[13px] font-bold transition-colors">Add</button>
              <button onClick={clearrows} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors">Clear</button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-3">
          <div className="h-[250px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Item Name", "Serial Number", "Quantity", "Price", "Amount", "UOM", "HSN No", "Actions"].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${i === 0 ? "w-10 text-center" : i === 1 || i === 2 ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabledata.length > 0 ? tabledata.map((item, index) => (
                <tr key={`${item.item_name}-${index}`} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">{index + 1}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">{item.item_name}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 text-left">{item.serial_no || "—"}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 text-center">₹{item.price}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-gray-900 text-center">₹{Number(item.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{item.uom}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{item.hsn_number || "—"}</td>
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
                    <div className="text-gray-300 text-4xl mb-3">🧾</div>
                    <p className="text-[13px] text-gray-400 font-medium">No products added yet.</p>
                    <p className="text-[12px] text-gray-300 mt-1">Select customer → products to begin.</p>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-10 ">
              <tr>
                <td colSpan="9" className="px-4 py-3">
                  <div className="flex items-center ml-[25%] gap-2">
                    <span className="text-[13px] font-black text-gray-600 uppercase tracking-wide">TOTAL QTY</span>
                    <span className="text-[13px] font-black text-gray-500">:</span>
                    <span className="text-[18px] font-black text-blue-700">{tabledata.reduce((s, r) => s + Number(r.quantity || 0), 0)}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>

        {/* Bottom: Load Invoice + Grand Total */}
        <div className="grid grid-cols-2 gap-10 mt-8">

          {/* Left: Load Invoice */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Load / Edit Existing Invoice</p>
            <div className="relative w-64" ref={loadInvoiceDropdownRef}>
              <label className={labelCls}>Invoice No</label>
              <input type="text" value={loadInvoice}
                onFocus={() => { setLoadInvoiceOpen(true); searchINV(loadInvoice); }}
                onChange={(e) => { const v = e.target.value; setLoadInvoice(v); searchINV(v); }}
                className={`${inputCls} w-64`} placeholder="DI/INV-001" />
              {loadInvoiceOpen && (
                <div className={`${dropdownCls} w-64`}>
                  {Array.isArray(invoiceList) && invoiceList.length > 0 ? invoiceList.map((inv) => (
                    <div key={inv.id}
                      onClick={(e) => { e.stopPropagation(); setLoadInvoice(inv.invoice_no); setLoadInvoiceOpen(false); requirePassword(() => LoadInvoice(inv.invoice_no)); }}
                      className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {inv.invoice_no}
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400">No invoices found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Grand Total */}
          <div className="pt-6 border-t border-gray-100">
            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3 max-w-sm ml-auto">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Sub Total</span>
                <span className="text-[13px] font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Transport Charges (+)</span>
                <input type="number" min="0" value={formData.transport || 0}
                  onChange={(e) => setFormdata({...formData, transport: e.target.value})}
                  className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
              </div>
              <div className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded">
                <span className="text-[12px] font-black text-blue-700 uppercase">Taxable Value</span>
                <span className="text-[13px] font-black text-blue-900">₹{taxableValue.toFixed(2)}</span>
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
                <span className="text-[12px] font-black text-gray-500 uppercase">Round Off</span>
                <span className="text-[13px] font-bold text-gray-700">{round_off.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                <span className="text-[15px] font-black text-black uppercase">NET TOTAL</span>
                <span className="text-[24px] font-black text-indigo-700">₹{grandtotal || 0}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Success Modal */}
      {savedNo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[22px] font-black text-gray-900 mb-1">
              Invoice Created Successfully!
            </h2>
            <p className="text-[13px] text-gray-400 mb-6">
              Invoice No: <span className="font-bold text-gray-700">{savedNo}</span>
            </p>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => { setShowInvoiceWindow(true); }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-colors"
              >
                View Invoice
              </button>
              <button
                onClick={() => { setShowInvoiceWindow(true); }}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[14px] font-bold hover:bg-black transition-colors"
              >
                Print Invoice
              </button>
            </div>
            <button
              onClick={() => { setSavedNo(null); resetall(); }}
              className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Close &amp; start new invoice
            </button>
          </div>
        </div>
      )}

      <SaleswindowModel
        title="Direct Invoice Format"
        isOpen={showInvoiceWindow}
        type="Direct Invoice Format"
        onClose={() => setShowInvoiceWindow(false)}
        isMinimized={isMinimized}
        onMinimize={() => { setIsMinimized(true); setShowInvoiceWindow(false); }}
        initialView="qt"
        filters={{ QtNumber: savedNo }}
      >
        <InvoiceFormat InvNumber={savedNo} />
      </SaleswindowModel>

      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};
export default PerformanceInvoiceForm ;