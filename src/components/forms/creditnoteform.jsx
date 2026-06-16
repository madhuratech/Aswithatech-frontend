import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { errorToast } from "../ui/nottifications";
import { SquarePen, Trash2, CheckCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import SaleswindowModel from "../ui/saleswindowModal";
import Creditnoteview from "../pages/Sales/creditnote";

// Debounse function;
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const Creditnote = () => {

  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();
  const [loadCnnumber , setloadCnnumber] = useState("");
  const [ordertype , setordertype] = useState("");
  const [cnNumber , setcnNumber] = useState("");
  const [tabledata , settabledata] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);
  const [Cnlist , setCnlist] = useState([]); 
  const [loadingclients , setloadingclients] = useState(false);
  const [clientname , setclientName] = useState([]);
  const [items , setItems] = useState([]);

  // Success popup modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCnNo, setSavedCnNo] = useState("");
  const [showCnModal, setShowCnModal] = useState(false);
  const [cnModalMin, setCnModalMin] = useState(false);
  const [viewCnNo, setViewCnNo] = useState("");


  // Dropdown state;

  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showunitDropdown, setShowunitDropdown] = useState(false)
  const [showcnNumber , setshowcnNumber] = useState(false); 

   const clientRef = useRef(null);
    const itemRef = useRef(null);
    const unitRef = useRef(null);
    const cnRef = useRef(null);
  

  const Api_urls = "http://localhost:3000/api/creditnotes";

//  Form state;

 const [Formdata , setFormData] = useState({
  client_name:'',
  cn_date:'',
  bill_no:'',
  bill_date:'',
  remarks:''
 });

//  Row Items State;
const [currentrow , setcurrentrow] = useState({
  item_name:'',
  quantity:'',
  price:'',
  hsn_number:'',
  discount:'',
  partno:'',
  unit:'',
});

   
  //Load Next Cn Number;

  const loadCn = async (cnNum) =>{
    const cnToLoad = cnNum || loadCnnumber;
    try{
      if(!cnToLoad.trim()){
        return alert("Enter CN Number");
      }
      const res = await fetch(`${Api_urls}/${cnToLoad}`);
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
  
       setFormData({
        client_name: data.client_name || "",
        cn_date: data.cn_date?.split('T')[0] || "",
        bill_no: data.bill_no || "",
        bill_date: data.bill_date,
        remarks: data.remarks || ""
       });
       setordertype(data.order_type || "");
       setcnNumber(data.cn_number || "");
       setloadCnnumber(data.cn_number || "");
       setDeliveryCharge(data.delivery_charge || 0);

       settabledata(
        data.items.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.price,
          hsn_number: item.hsn_code,
          discount: item.discount || 0,
          partno: item.part_no,
          unit: item.unit,
          amount: item.amount
        }))
      );
  
       alert("Loaded SuccessFully");

    }catch(error){
      alert("Credit Note Not found");
    }
  }


// Cn Search;

const SearchCn = async (value) =>{
  try{
   let url = "";

    if(!value.trim()){
      url = `${Api_urls}/cn/all`;
    } else{
        url = `${Api_urls}/cn/search?q=${encodeURIComponent(value)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setCnlist(Array.isArray(data) ? data : []);
  } catch(error){
     console.log("Cn Seacrh failed");
  }
}

// Auto Gentrate Cn number next
useEffect(() =>{
  fetch(`${Api_urls}/getcnnumber`)
    .then(res => res.json())
    .then(data => {
      setcnNumber(data.cnNumber)   
    });
},[]);



// Load Clients;
useEffect(() =>{
  setloadingclients(true);
  fetch(`${Api_urls}/clients`)
  .then((res) =>{
    if(!res.ok) throw new Error("Failed To Load");
    return res.json();
  })
  .then((data) => {
    console.log("clients Fetched Succesfully:", data);
    setclientName(Array.isArray(data) ? data : []);
  })
  .catch((error) => {
    console.warn("Retrying with backup client URL...");
    fetch("http://localhost:3000/api/customers/all")
    .then(res => res.json())
    .then(data =>{setclientName(Array.isArray(data) ? data : []);      
    })
    .catch(error => {
      console.log("Backup Fetch Failed:",error);
      errorToast("Could Not load Clients");
    });

  })
  .finally(() => setloadingclients(false));
},[]);


// Load Order Type;

const typechange = async (type) =>{
  setordertype(type);
  try{
  const res = await fetch(`${Api_urls}/items/type?type=${type}`);  
  const data = await res.json();
   
    if(Array.isArray(data)){
      setItems(data);

      //Auto Select items by order type change;
      
      if(data.length > 0){
        setcurrentrow(prev =>({
          ...prev,
          item_name: data[0].item_name || '',
          hsn_number: data[0].hsn_number || '',
        }));
      } else{
        setcurrentrow(prev => ({
          ...prev,
          item_name: '',
          hsn_number: '',
        }));
      }
    }else{
      setItems([]);
    }
   
  } catch(error){
  console.log("Error Fetching Items:",error);
  setItems([]);
  }
}

//item Select;

const selectItem = (selectedItem) =>{
  setcurrentrow({
    ...currentrow,
    item_name: selectedItem.item_name,
    hsn_number: selectedItem.hsn_number,
  });
}

// add item to Table

const addItem = () => {
  if (
    !currentrow.item_name ||
    !currentrow.hsn_number ||
    !currentrow.quantity ||
    !currentrow.partno ||
    !currentrow.unit ||
    !currentrow.price
  ) {
    alert("Please Fill all Fields");
    return;
  }

  const quantity = Number(currentrow.quantity);
  const price = Number(currentrow.price);
  const discount = Number(currentrow.discount || 0);

  const amount = quantity * price;
  const net_amount = amount - discount;
  const newRow = { ...currentrow, quantity, price, discount, amount, net_amount };

  if (editIndex >= 0) {
    settabledata(prev => { const u = [...prev]; u[editIndex] = newRow; return u; });
    setEditIndex(-1);
  } else {
    settabledata([...tabledata, newRow]);
  }

  setcurrentrow({
    item_name: "",
    quantity: 0,
    price: 0,
    hsn_number: "",
    discount: 0,
    partno: "",
    unit: "",
  });
};


// Clear Row
const clearRow = () => {
  setcurrentrow({
    item_name: "",
    quantity: 0,
    price: 0,
    hsn_number: "",
    discount: 0,
    partno: "",
    unit: "",
  });
};


// Subtotal and Tax calculation;

const [totals, setTotals] = useState({
  subtotal: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  roundOff: 0,
  grandTotal: 0
});

const [deliveryCharge, setDeliveryCharge] = useState(0);


useEffect(() => {
  const subtotal = tabledata.reduce((sum, item) => sum + item.net_amount, 0);

  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const igst = 0;
 
  const total = subtotal + cgst + sgst + Number(deliveryCharge || 0);
  const rounded = Math.round(total);
  const roundOff = rounded - total

  setTotals({
    subtotal,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal: rounded,
  });

}, [tabledata, deliveryCharge]);


// Clear reset Form;

const resetForm = async() =>{
    setFormData({
      client_name: '',
      cn_date: new Date().toISOString().split('T')[0],
      bill_no: '',
      bill_date: '',
      remarks: '',
      });

    settabledata([]);
    setcurrentrow({
      item_name: "",
      quantity: 0,
      price: 0,
      hsn_number: "",
      discount: 0,
      partno: "",
      unit: "",
    });

    setDeliveryCharge(0);
    setordertype("");
    setloadCnnumber("");

    const res = await fetch(`${Api_urls}/getcnnumber`);
    const data = await res.json();
    setcnNumber(data.cnNumber);
}



const handleSaveCreditNote = () => {
  submitcreditNote();
};

const handleDeleteCreditNote = () => {
  deleteCn();
};

//  Save Credit Notes;

const submitcreditNote = async () => {
  if(tabledata.length === 0){
   alert("Please add at least one item to the order.");  
   return;
  }

const payload = {
  client_name: Formdata.client_name,
  order_type: ordertype,
  cn_date: Formdata.cn_date,
   bill_no: Formdata.bill_no,    
  bill_date: Formdata.bill_date,
  items: tabledata.map(items => ({
    item_name: items.item_name,
    price: items.price,
    quantity: items.quantity,
    hsn_code: items.hsn_number,
    discount: items.discount,
    part_no: items.partno,
    unit: items.unit,
    amount: items.amount
  })),

  subtotal: totals.subtotal,
  cgst: totals.cgst,
  sgst: totals.sgst,
  igst: totals.igst,
  delivery_charge: Number(deliveryCharge || 0),
  grandTotal: totals.grandTotal,
  narration: Formdata.remarks || "",
  cn_number: cnNumber,
};

      const toastId = toast.loading("Saving credit note...");

  try{
    const method = loadCnnumber ? "PUT" : "POST"
    const url = loadCnnumber
    ? `${Api_urls}/${loadCnnumber}`
    : `${Api_urls}/new`;
    const res = await fetch(url,{
      method,
      headers: {"Content-type" :"application/json"},
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if(!res.ok){
      throw new Error(data.message || "Failed To Create");

    }
    toast.success(method === "PUT" ? "Credit Note updated successfully!" : "Credit Note created successfully!",{id: toastId});
   
    setSavedCnNo(cnNumber);
    setShowSuccessModal(true);
   
  } catch(error){
    toast.error(error.message, { id: toastId })
    errorToast("Failed To Create Credit Note");
  }
}

const handleViewCn = () => {
  setViewCnNo(savedCnNo);
  setShowSuccessModal(false);
  setShowCnModal(true);
};

const handleCloseSuccessModal = () => {
  setShowSuccessModal(false);
  resetForm();
};


// Client Search 

const clientsearch = async (value) => {
  try{
    const res = await fetch(`${Api_urls}/clients/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setclientName(Array.isArray(data) ? data : []);
  }catch(error){
    console.log("Error Searching Clients:", error);
    errorToast("Failed To Search");
  }
};

// Items Search;

const ItemSearch = async (value, currentOrderType) => {
  if (!currentOrderType) return;

  try {
    let url = "";

    if (!value.trim()) {
      url = `${Api_urls}/items/type?type=${currentOrderType}`;
    } else {
      url = `${Api_urls}/items/search?q=${encodeURIComponent(value)}&type=${currentOrderType}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    setItems(Array.isArray(data) ? data : []);
  } catch (error) {
    console.log("Error Searching items", error);
  }
};


// Debounce;
 const[debounceSearch] = useState(() => debounce(clientsearch,300));
const debouncedItemSearch = useRef(debounce(ItemSearch, 300)).current;

// handleclick function;
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (clientRef.current && !clientRef.current.contains(event.target)) {
      setShowClientDropdown(false);
    }
    if (itemRef.current && !itemRef.current.contains(event.target)) {
      setShowItemDropdown(false);
    }
    if (unitRef.current && !unitRef.current.contains(event.target)) {
      setShowunitDropdown(false);
    }
    if(cnRef.current && !cnRef.current.contains(event.target)){
      setshowcnNumber(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Auto fetch today Date;

useEffect(() =>{
  const today = new Date().toISOString().split('T')[0];
  setFormData(prev => ({...prev,cn_date:today}));
},[]);



// Delete Cn;

const deleteCn = async () => {
  if(!cnNumber) return alert("Select a CN to delete");
  if(!window.confirm("Are you sure you want to delete this Credit Note?")) return;

  try{
    const res = await fetch(`${Api_urls}/${cnNumber}`, {method:"DELETE"});
    if(res.ok){
      alert("Deleted Successfully");
      window.location.reload();
    }else{
      alert("Failed to delete");
    }
  }catch(error){
    console.log("Error Deleting Cn:", error);
    alert("Failed to delete");
  }
}

// Edit Item;

const editItem = (index) => {
const item = tabledata[index];
 setcurrentrow({
    item_name: item.item_name,
    quantity: item.quantity,
    price: item.price,
    hsn_number: item.hsn_number,
    discount: item.discount,
    partno: item.partno,
    unit: item.unit,
  });
  setEditIndex(index);
}
const deleteItem = (index) =>{
      settabledata(tabledata.filter((_, i) => i !== index));

}

  // ── Shared styling classes from Sales Invoice ─────────────────────────
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const disInputCls = "w-full p-2.5 border border-gray-100 rounded-lg text-[13px] font-semibold text-gray-300 bg-gray-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">
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
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Credit Note</h2>
            <p className="text-[12px] text-gray-400 mt-1">Client → Reference Details → Items → Save</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors"
            >
              NEW
            </button>
            <button
              onClick={handleSaveCreditNote}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors"
            >
              SAVE
            </button>
            <button
              onClick={handleDeleteCreditNote}
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

        {/* STEP 1 — Client + CN Header */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 1 — Credit Note Header
          </p>
          <div className="grid grid-cols-3 gap-5">
            {/* Customer Name */}
            <div className="relative text-black" ref={clientRef}>
              <label className={labelCls}>
                Customer Name / Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={Formdata.client_name}
                onFocus={() => setShowClientDropdown(true)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...Formdata, client_name: value });
                  debounceSearch(value);
                  setShowClientDropdown(true);
                }}
                placeholder="Enter Customer Name"
                className={inputCls}
              />
              {showClientDropdown && (
                <div className={dropdownCls}>
                  {loadingclients ? (
                    <div className="px-4 py-3 text-[13px] text-gray-400 italic">Loading clients...</div>
                  ) : Array.isArray(clientname) && clientname.length > 0 ? (
                    clientname.map((client) => (
                      <div
                        key={client.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...Formdata, client_name: client.customer_name });
                          setShowClientDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                      >
                        {client.customer_name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400">
                      No clients found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CN Number */}
            <div>
              <label className={labelCls}>CN No</label>
              <input
                type="text"
                value={cnNumber}
                readOnly
                className={roInputCls}
              />
            </div>

            {/* CN Date */}
            <div>
              <label className={labelCls}>CN Date</label>
              <input
                type="date"
                value={Formdata.cn_date}
                onChange={(e) => setFormData({ ...Formdata, cn_date: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* STEP 2 — Reference Details */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 2 — Reference &amp; Remarks
          </p>
          <div className="grid grid-cols-4 gap-5">
            {/* Bill No */}
            <div>
              <label className={labelCls}>Bill No</label>
              <input
                type="text"
                value={Formdata.bill_no}
                onChange={(e) => setFormData({ ...Formdata, bill_no: e.target.value })}
                placeholder="Bill Number"
                className={inputCls}
              />
            </div>

            {/* Bill Date */}
            <div>
              <label className={labelCls}>Bill Date</label>
              <input
                type="date"
                value={Formdata.bill_date}
                onChange={(e) => setFormData({ ...Formdata, bill_date: e.target.value })}
                className={inputCls}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className={labelCls}>Remarks</label>
              <input
                type="text"
                value={Formdata.remarks}
                onChange={(e) => setFormData({ ...Formdata, remarks: e.target.value })}
                placeholder="Enter Remarks"
                className={inputCls}
              />
            </div>

            {/* Order Type */}
            <div>
              <label className={labelCls}>Order Type</label>
              <div className="flex gap-4 items-center min-h-[43px]">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold text-gray-700">
                  <input
                    type="radio"
                    name="orderType"
                    checked={ordertype === "service"}
                    onChange={() => typechange("service")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  Service
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold text-gray-700">
                  <input
                    type="radio"
                    name="orderType"
                    checked={ordertype === "spare"}
                    onChange={() => typechange("spare")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  Spare
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold text-gray-700">
                  <input
                    type="radio"
                    name="orderType"
                    checked={ordertype === "purchase_item"}
                    onChange={() => typechange("purchase_item")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  Purchase Item
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 — Add Products & Price */}
        <div className={`transition-all duration-200 mb-5 ${!ordertype ? "opacity-40 pointer-events-none" : ""}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Step 3 — Add Products &amp; Prices
          </p>

          <div className="grid grid-cols-9 gap-3 items-end">
            {/* Product/Item Search */}
            <div className="col-span-2 relative text-black" ref={itemRef}>
              <label className={labelCls}>Item <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={currentrow.item_name}
                onFocus={() => ordertype && setShowItemDropdown(true)}
                onChange={(e) => {
                  const value = e.target.value;
                  setcurrentrow({ ...currentrow, item_name: value });
                  debouncedItemSearch(value, ordertype);
                  setShowItemDropdown(true);
                }}
                placeholder="Search or enter item…"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
              {showItemDropdown && (
                <div className={dropdownCls}>
                  {Array.isArray(items) && items.length > 0 ? (
                    items.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem(item);
                          setShowItemDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                      >
                        {item.item_name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400">No items found</div>
                  )}
                </div>
              )}
            </div>

            {/* HSN */}
            <div className="col-span-1">
              <label className={labelCls}>HSN <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={currentrow.hsn_number}
                onChange={(e) => setcurrentrow({ ...currentrow, hsn_number: e.target.value })}
                placeholder="Hsn"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
            </div>

            {/* Qty */}
            <div className="col-span-1">
              <label className={labelCls}>Qty <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={currentrow.quantity || ""}
                onChange={(e) => setcurrentrow({ ...currentrow, quantity: e.target.value })}
                placeholder="0"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
            </div>

            {/* Price */}
            <div className="col-span-1">
              <label className={labelCls}>Price <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={currentrow.price || ""}
                onChange={(e) => setcurrentrow({ ...currentrow, price: e.target.value })}
                placeholder="0"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
            </div>

            {/* Discount */}
            <div className="col-span-1">
              <label className={labelCls}>Disc</label>
              <input
                type="number"
                value={currentrow.discount || ""}
                onChange={(e) => setcurrentrow({ ...currentrow, discount: e.target.value })}
                placeholder="0"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
            </div>

            {/* UOM */}
            <div className="col-span-1 relative text-black" ref={unitRef}>
              <label className={labelCls}>UOM <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={currentrow.unit}
                onFocus={() => ordertype && setShowunitDropdown(true)}
                onChange={(e) => setcurrentrow({ ...currentrow, unit: e.target.value })}
                placeholder="Unit"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
              {showunitDropdown && (
                <div className={dropdownCls}>
                  {["Nos", "Kg", "Ltr", "Mtr"].map((unit) => (
                    <div
                      key={unit}
                      onClick={(e) => {
                        e.stopPropagation();
                        setcurrentrow(prev => ({ ...prev, unit }));
                        setShowunitDropdown(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                    >
                      {unit}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Part No */}
            <div className="col-span-1">
              <label className={labelCls}>Part No <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={currentrow.partno || ""}
                onChange={(e) => setcurrentrow({ ...currentrow, partno: e.target.value })}
                placeholder="Part No"
                disabled={!ordertype}
                className={ordertype ? `${inputCls} bg-gray-50/60` : disInputCls}
              />
            </div>

            {/* Add & Clear Buttons */}
            <div className="col-span-1 flex gap-2">
              <button
                onClick={addItem}
                disabled={!ordertype}
                className={`flex-1 py-2.5 text-white rounded-lg text-[13px] font-bold transition-colors disabled:opacity-40 ${editIndex >= 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {editIndex >= 0 ? "Update" : "Add"}
              </button>
              <button
                onClick={() => { clearRow(); setEditIndex(-1); }}
                disabled={!ordertype}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-3">
          <div className="h-[250px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Product", "Qty", "Price", "Amount", "Disc", "Part No", "UOM", "Net Amount", "Actions"].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${
                      i === 0 ? "w-10 text-center" : i === 1 ? "text-left" : "text-center"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabledata.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center">
                    <div className="text-gray-300 text-4xl mb-3">🧾</div>
                    <p className="text-[13px] text-gray-400 font-medium">No items added yet.</p>
                  </td>
                </tr>
              ) : (
                tabledata.map((item, index) => (
                  <tr key={index} className={`border-b border-gray-100 transition-colors ${editIndex === index ? "bg-blue-50" : "hover:bg-gray-50/70"}`}>
                    <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">{index + 1}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">{item.item_name}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-800 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-800 text-center">₹{item.price}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-800 text-center">₹{item.amount}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-800 text-center">{item.discount}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-800 text-center">{item.partno}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-800 text-center uppercase">{item.unit}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-gray-900 text-center">₹{item.net_amount}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => editItem(index)} title="Edit">
                          <SquarePen size={16} className="text-blue-500 hover:text-blue-700 transition-colors" />
                        </button>
                        <button onClick={() => deleteItem(index)} title="Delete">
                          <Trash2 size={16} className="text-red-400 hover:text-red-600 transition-colors" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-10">
              <tr>
                <td colSpan={10} className="px-4 py-3">
                  <div className="flex items-center ml-[14%] gap-2">
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

        {/* BOTTOM: Load & Totals */}
        <div className="grid grid-cols-2 gap-10 mt-8">
          
          {/* Load Existing Credit Note */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Load / Edit Existing Credit Note
            </p>
            <div className="relative w-64 text-black" ref={cnRef}>
              <label className={labelCls}>Select CN NO</label>
              <input
                type="text"
                value={loadCnnumber}
                onFocus={() => setshowcnNumber(true)}
                onChange={(e) => {
                  const value = e.target.value;
                  setloadCnnumber(value);
                  SearchCn(value);
                  if (value) setshowcnNumber(true);
                }}
                className={`${inputCls} w-64`}
                placeholder="Enter / Search CN No"
              />
              {showcnNumber && (
                <div className={`${dropdownCls} w-64`}>
                  {Cnlist.length > 0 ? (
                    Cnlist.map((cn, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setloadCnnumber(cn.cn_number);
                          setshowcnNumber(false);
                          requirePassword(() => loadCn(cn.cn_number));
                        }}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                      >
                        {cn.cn_number}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400">No CN found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="pt-6 border-t border-gray-100">
            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3 max-w-sm ml-auto">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Subtotal</span>
                <span className="text-[13px] font-bold text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">CGST (9%)</span>
                <span className="text-[13px] font-bold text-gray-700">₹{totals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">SGST (9%)</span>
                <span className="text-[13px] font-bold text-gray-700">₹{totals.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">IGST (18%)</span>
                <span className="text-[13px] font-bold text-gray-700">₹{totals.igst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Delivery Charge (+)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-28 p-1.5 border border-gray-200 rounded-lg text-[13px] font-bold text-right bg-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Round Off</span>
                <span className="text-[13px] font-bold text-gray-700">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                <span className="text-[15px] font-black text-black uppercase">Grand Total</span>
                <span className="text-[24px] font-black text-indigo-700">₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-1">Credit Note Saved Successfully!</h2>
            <p className="text-sm text-gray-500 mb-1">Credit Note has been created.</p>
            <p className="text-sm font-black text-blue-600 mb-6">Credit Note No : {savedCnNo}</p>
            <div className="flex gap-3">
              <button
                onClick={handleViewCn}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credit Note View Modal ── */}
      <SaleswindowModel
        title="Credit Note"
        isOpen={showCnModal}
        type="Credit Note Format"
        isMinimized={cnModalMin}
        onMinimize={() => setCnModalMin(true)}
        onClose={() => {
          setShowCnModal(false);
          setCnModalMin(false);
          resetForm();
        }}
        filters={{ QtNumber: viewCnNo }}
        onFilterChange={(f) => setViewCnNo(f.QtNumber || viewCnNo)}
      >
        <Creditnoteview key={viewCnNo} cnNumber={viewCnNo} />
      </SaleswindowModel>

      {/* ── Minimized bar ── */}
      {showCnModal && cnModalMin && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setCnModalMin(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
          >
            <div className="w-3 h-3 border border-white/50"></div>
            Credit Note
          </button>
        </div>
      )}

      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}

    </div>
  );
};

export default Creditnote;