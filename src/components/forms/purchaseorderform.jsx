import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { errorToast} from "../ui/nottifications";
import toast from "react-hot-toast";
import { SquarePen, Trash2 } from "lucide-react";

// Debounce helper outside the component

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export default function Purchaseorder() {
  const navigate = useNavigate();
  const[clientName,setClientName] = useState([]);
  const[orderType,setOrderType] = useState("");
  const[items ,setItems] = useState([]);
  const [tabledata, setTabledata] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [loadPoNumber, setLoadPoNumber] = useState("");
  const[polist , setpolist] = useState("");
  const [showpodropdown , setshowpodropdown] = useState(false);

  
  const Api_Urls = "http://localhost:3000/api/purchaseorders"; 
  
  // Load next PO number on component mount

   const loadPo = async (poNum) => {
   const poToLoad = poNum || loadPoNumber;
  try {
    if (!poToLoad.trim()) {
      return alert("Enter PO Number");
    }

    const res = await fetch(`${Api_Urls}/${poToLoad}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    setFormData({
      client_name: data.client_name || "",
      po_date: data.po_date?.split('T')[0] || "",
      narration: data.narration || "",
    });

    setOrderType(data.order_type || "");
    setPoNumber(data.po_number || "");
    setLoadPoNumber(data.po_number || "");

    setTabledata(
      data.items.map(item => ({
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        hsn_number: item.hsn_code,
        unit: item.unit,
        amount: item.amount
      }))
    );

    alert("Loaded Successfully");

  } catch (err) {
    alert("PO not found");
  }
};

// PO Search 

const searchPo = async (value) => {
 try{
   if(!value.trim()){
    setpolist([]);
    return;
   }
  const res = await fetch(`${Api_Urls}/po/search?q=${encodeURIComponent(value)}`);
  const data =  await res.json();
  setpolist(Array.isArray(data) ? data : []);
 }catch(err){
    console.log("po Search failed",err);
 }
}

const deletePO = async () => {
    if (!poNumber) return alert("Select a PO to delete");
    if (!window.confirm("Are you sure you want to delete this PO?")) return;

    try {
      const res = await fetch(`${Api_Urls}/${poNumber}`, { method: "DELETE" });
      if (res.ok) {
        alert("Deleted Successfully");
        window.location.reload();
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
}

const editItem = (index) => {
    const item = tabledata[index];
    setCurrentRow({
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        hsn_number: item.hsn_number,
        unit: item.unit
    });
    setTabledata(tabledata.filter((_, i) => i !== index));
}

const deleteItem = (index) => {
    setTabledata(tabledata.filter((_, i) => i !== index));
}




  const [formData, setFormData] = useState({
    client_name:'',
    po_date:'',
  });

  const [currentRow, setCurrentRow] = useState({
    item_name: '',
    quantity: '',
    price: '',
    hsn_number: '',
    unit: '',
  });

  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
   const [showUnitDropdown, setShowUnitDropdown] = useState(false);


  const clientRef = useRef(null);
  const itemRef = useRef(null);
  const poRef = useRef(null);

// Load Clients

useEffect(() => {
    setLoadingClients(true);
    fetch(`${Api_Urls}/clients`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch clients from purchaseorders");
        return res.json();
      })
      .then((data) => {
        console.log("Clients fetched successfully:", data);
        setClientName(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.warn("Retrying with backup client URL...");
        fetch("http://localhost:3000/api/customers/all")
          .then(res => res.json())
          .then(data => {
             setClientName(Array.isArray(data) ? data : []);
          })
          .catch(err => {
            console.error("Backup fetch failed too:", err);
            errorToast("Could not load clients. Please check server.");
          });
      })
      .finally(() => setLoadingClients(false));
  }, []);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientRef.current && !clientRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
      if (poRef.current && !poRef.current.contains(event.target)) {
        setshowpodropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

// Load Order Types

const typechannge = async (type) => {
    setOrderType(type);
    try {
      const res = await fetch(`${Api_Urls}/items/${type}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setItems(data);

        // Auto select first item on order type change if data exists
        if (data.length > 0) {
          setCurrentRow(prev => ({
            ...prev,
            item_name: data[0].item_name || '',
            hsn_number: data[0].hsn_number || '',
          }));
        } else {
          setCurrentRow(prev => ({
            ...prev,
            item_name: '',
            hsn_number: '',
          }));
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  };  

// item select
  const selectItem = (selectedItem) => {
    setCurrentRow({
      ...currentRow,
      item_name: selectedItem.item_name,
      hsn_number: selectedItem.hsn_number,
    });
    setShowItemDropdown(false);
  };

  // add item to table

  const addItem = () => {
    if(!currentRow.item_name || !currentRow.quantity || !currentRow.price || !currentRow.hsn_number || !currentRow.unit){
      alert("Please fill all fields");
      return;
    }
    const amount = currentRow.quantity * currentRow.price;
    setTabledata([...tabledata, {...currentRow, amount }]);
    setCurrentRow({ 
      item_name: '', 
      quantity: '',
      price: '',
      hsn_number: '',
      unit: '' ,
    });
  };

// clear item entry box
const clearRow = () => {
  setCurrentRow({
    item_name: "",
    quantity: 0,
    price: 0,
    hsn_number: "",
    unit: "",
  });
};

// subtoytal, tax, grand total calculations can be added here based on tabledata changes

const [totals, setTotals] = useState({
  subtotal: 0,
  cgst: 0,
  sgst: 0,
  roundOff: 0,
  grandTotal: 0,
});

  // submit purchase order

  const submitPurchaseOrder = async () => {
    if (!formData.client_name?.trim()) {
      toast.error("Client Name is required");
      return;
    }
    if (!formData.po_date) {
      toast.error("PO Date is required");
      return;
    }
    if (tabledata.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const payload = {
      client_name: formData.client_name,
      order_type: orderType,
      po_date: formData.po_date,
      items: tabledata.map(item => ({
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
        hsn_code: item.hsn_number,
        unit: item.unit
      })),

     subtotal: totals.subtotal,
     cgst: totals.cgst,
     sgst: totals.sgst,
     roundOff: totals.roundOff,
     grandTotal: totals.grandTotal,
     narration: formData.narration || "",
     po_number: poNumber,
    };

    const toastId = toast.loading("Saving purchase order...");

    try {
    const method = loadPoNumber ? "PUT" : "POST";
        const url = loadPoNumber
          ? `${Api_Urls}/${loadPoNumber}`
          : `${Api_Urls}/new`;
        const res = await fetch(url,{
          method,
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payload)
        })
  
         const data = await res.json()
        
      if (!res.ok) {
        throw new Error(data.message || "Failed to create purchase order");
      }

       toast.success(method === "PUT" ? "Purchase order updated successfully!"
        : "Purchase order created successfully!",
      { id: toastId } );  

      navigate(`/purchase/po-format/${data.po_number || poNumber}`);

    } catch (error) {
      toast.error(error.message, { id: toastId });
      errorToast("Failed to create purchase order");
    }
  };

  // Client search
const clientSearch = async (value) => {
  try {
    const res = await fetch(`${Api_Urls}/clients/search?q=${encodeURIComponent(value)}`);
   const data = await res.json();
   setClientName(Array.isArray(data) ? data : []);
  }catch (error) {
    console.error("Error searching clients:", error);
    errorToast("Failed to search clients");
  }
};

// Item search
const itemSearch = async (value, currentOrderType) => {
  if (!currentOrderType) return;

  try {
    let url = "";
    if (!value.trim()) {
      url = `${Api_Urls}/items/${currentOrderType}`;
    } else {
      url = `${Api_Urls}/items/search?q=${encodeURIComponent(value)}&type=${currentOrderType}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    setItems(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Error searching items:", error);
  }
};

const [debounceSearch] = useState(() => debounce(clientSearch, 300));
const [debouncedItemSearch] = useState(() => debounce(itemSearch, 300));


// Po number
 useEffect(() => {
  fetch(`${Api_Urls}/next-po-number`)
    .then(res => res.json())
    .then(data => {
      setPoNumber(data.po_number);
    });
 }, []);


//  Date todate auto fill

 useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  setFormData(prev => ({ ...prev, po_date: today }));
 }, []);


 //calculations
 useEffect(() => {
  const subtotal = tabledata.reduce((sum, item)=> sum + Number(item.amount || 0), 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + cgst + sgst;
  const roundedtotal = Math.round(total);
  const roundOff = roundedtotal - total;

  setTotals({
    subtotal,
    cgst,
    sgst,
    roundOff,
    grandTotal: roundedtotal,
  });

 },[tabledata]);


  return (
    <div className="p-4 flex flex-col min-h-screen">
      {/* Back Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
        onClick={() => navigate(-1)}
      >
        Go Back
      </button>

      {/* Main Container */}
      <div className="flex-grow border border-gray-300 rounded-lg p-6 mt-4 bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-xl font-semibold">Purchase Order</p>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="border px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white ">NEW</button>
            <button onClick={submitPurchaseOrder} className="border px-3 py-1.5 rounded-lg text-black hover:bg-green-500 hover:text-white">SAVE</button>
            <button onClick={deletePO} className="border px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5  text-black rounded-lg hover:bg-red-500 hover:text-white">CLOSE</button>
          </div>
        </div>

        {/* Load PO */}
        <div className="mb-4 relative" ref={poRef}>
          <p className="text-sm font-medium mb-1">Load Purchase Order</p>
          <div className="flex gap-2">
            <input 
               type="text" 
               placeholder="Enter PO Number"
               value={loadPoNumber}
               onFocus={() => setshowpodropdown(true)}
               onChange={(e) => {
                 const value = e.target.value; 
                 setLoadPoNumber(value); 
                 searchPo(value);
                 if (value) setshowpodropdown(true);
               }}
               className="outline-none border rounded-lg px-3 py-2 w-full max-w-[200px]" 
            />

              {/* Show Drop Down */}
              {showpodropdown && polist && (
                <div className="absolute top-[65px] left-0 w-full max-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                      {polist.length > 0 ? (
                    polist.map((po) => (
                      <div
                        key={po.po_number}
                        onClick={() => {
                          setLoadPoNumber(po.po_number);
                          setshowpodropdown(false);
                          loadPo(po.po_number);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                      >
                        {po.po_number}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">No PO found</div>
                  )}
                </div>
           )}
          </div>
        </div>

        {/* Top Form */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="relative" ref={clientRef}>
            <label className="text-sm">Supplier Name *</label>
              <input 
               value={formData.client_name}
               onFocus={() => setShowClientDropdown(true)}
               onChange={(e) => {
                 const value = e.target.value; 
                 setFormData({...formData, client_name: value}); 
                 debounceSearch(value);
               }}
               className="w-full outline-none border rounded-lg px-3 py-2 mt-1" type="text" />
     
               {/* client Drop down */}
                
              {showClientDropdown && (
                <div className="absolute top-5 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                   {loadingClients ? (
                    <div className="px-3 py-2 text-gray-400 text-sm italic">Loading clients...</div>
                   ) : Array.isArray(clientName) && clientName.length > 0 ? (
                     clientName.filter(client => 
                       (client.customer_name || "").toLowerCase().includes((formData.client_name || "").toLowerCase())
                     ).map((client) => (
                        <div key={client.id}
                        onClick={(e) =>{
                          e.stopPropagation(); 
                          setFormData({...formData, client_name: client.customer_name});
                          setShowClientDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                        {client.customer_name}
                      </div>
                    ))
                   ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No clients found. <br/>
                      <span className="text-[10px]">Ensure clients are added in the Client section.</span>
                    </div>
                   )}
                </div>
              )}
          </div>

          <div>
            <label className="text-sm">PO Number</label>
            <input
              type="text"
              value={poNumber}
              disabled
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100"
            />
          </div>

          <div>
            <label className="text-sm">Date</label>
            <input type="date"
            value={formData.po_date || ""}
             onChange={(e) => setFormData({...formData, po_date: e.target.value})}
             className=" outline-none w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
        </div>

        {/* Order Type */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Order Type</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="orderType" checked={orderType === "service"} onChange={() => typechannge("service")} /> Service
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="orderType" checked={orderType === "spare"} onChange={() => typechannge("spare")} /> Spare
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="orderType" checked={orderType === "purchase_item"} onChange={() => typechannge("purchase_item")} /> Purchase Item
            </label>
          </div>
      {/* Item Entry Box */}
       
       <div className="grid grid-cols-6 gap-4 mb-4 mt-5">
             <div className="relative" ref={itemRef}>
              <input type="text" placeholder="Item Name"
                value={currentRow.item_name}
                onFocus={() => setShowItemDropdown(true)}
                onChange={(e) => { 
                  const value = e.target.value; 
                  setCurrentRow({...currentRow, item_name: value}); 
                  debouncedItemSearch(value, orderType);
                }}
               className="outline-none border rounded-lg px-2 py-2 w-full" />
                {/* item dropdown */} 
                {showItemDropdown && (
                  <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                      {Array.isArray(items) && items.length > 0 ? (
                        items.map((item) => (
                          <div key={item.id}
                          onClick={(e) =>{e.stopPropagation(); selectItem(item);}}
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

     {/*  */}

             <div>
            <input type="number" placeholder="Price" 
              value={currentRow.price}
              onChange={(e) =>setCurrentRow({...currentRow, price: Number(e.target.value)})}
            className="outline-none border rounded-lg px-2 py-2 w-full" />
            </div>
             
             <div>
            <input type="number" placeholder="Quantity" 
             value={currentRow.quantity}
             onChange={(e) => setCurrentRow ({...currentRow, quantity: Number(e.target.value)})}
             className="outline-none border rounded-lg px-2 py-2 w-full" />
            </div>
 
             <div>
            <input type="text" placeholder="HSN Code" 
             value={currentRow.hsn_number}
             onChange={(e) => setCurrentRow ({...currentRow, hsn_number: e.target.value})}
             className="outline-none border rounded-lg px-2 py-2 w-full" />
            </div>
 
            <div className="relative">
              <input type="text" placeholder="Unit" 
               value={currentRow.unit}
               onChange={(e) => setCurrentRow ({...currentRow, unit: e.target.value})}
               onFocus={() => setShowUnitDropdown(true)}
               className="outline-none border rounded-lg px-2 py-2 w-full" />
               {/* Unit Dropdown */}
               {showUnitDropdown && (
                 <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                    {["Nos", "kg", "Ltr", "Mtr"].map((unit) => (
                      <div key={unit}
                      onClick={(e) => {
                        e.stopPropagation();  
                        setCurrentRow(prev => ({...prev, unit}));
                        setShowUnitDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                        {unit}
                      </div>
                    ))}           
               </div>
                )}
            </div>

            <div className="flex gap-2">
              <button onClick={addItem} className="bg-black text-white px-3 rounded-lg">Add</button>
              <button onClick={clearRow} className="border px-3 rounded-lg">Clear</button>
            </div>
          </div>

        </div>

        {/* Item Entry Box */}
        <div className="border rounded-lg ">
          {/* Table */}
          <table className="w-full text-sm border-collapse">
            <thead className="">
              <tr className="text-left text-gray-500 border-b border-gray-300">
                <th className="border-r border-gray-300 px-5 py-3">S.NO</th>
                <th className="border-r border-gray-300 px-5 py-3">ITEM NAME</th>
                <th className="border-r border-gray-300 px-5 py-3">QUANTITY</th>
                <th className="border-r border-gray-300 px-5 py-3">PRICE</th>
                <th className="border-r border-gray-300 px-5 py-3">AMOUNT</th>
                <th className="border-r border-gray-300 px-5 py-3">HSN</th>
                <th className="border-r border-gray-300 px-5 py-3">UNIT</th>
                <th className="px-5 py-3">ACTIONS</th>
              </tr>
            </thead>
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
                    <td className="px-5 py-3 border-r border-gray-200">₹{item.price}</td>
                    <td className="px-5 py-3 border-r border-gray-200">₹{item.amount}</td>
                    <td className="px-5 py-3 border-r border-gray-200">{item.hsn_number}</td>
                    <td className="px-5 py-3 border-r border-gray-200">{item.unit}</td>
                    <td className="px-5 py-3">
                        <div className="flex gap-3 ml-2">
                              <SquarePen onClick={() => editItem(index)} className="text-blue-600 hover:text-blue-800 font-medium" size={18}/>
                             <Trash2 onClick={() => deleteItem(index)} className="text-red-600 hover:text-red-800 font-medium" size={18}/>
                        </div>
                    </td>
                  </tr>
                ))
               )}
            </tbody>
          </table>
        </div>

        {/* Narration (OUTSIDE item box) */}
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Narration</p>
          <textarea
            placeholder="Additional notes..."
              value={formData.narration || ""}
              onChange={(e) => {setFormData ({ ...formData, narration: e.target.value})}}
            className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-sm"
            rows={2}
          />
        </div>

        {/* Calculation Box (separate like image) */}
        <div className="mt-4 border border-gray-200 rounded-xl bg-gray-50 p-6">
          <div className="flex justify-end">
            <div className="w-full max-w-md text-sm space-y-2">

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2) || "₹0.00"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">CGST (9%):</span>
                <span className="font-medium">{totals.cgst.toFixed(2) || "₹0.00"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">SGST (9%):</span>
                <span className="font-medium">{totals.sgst.toFixed(2) || "₹0.00"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-medium">{totals.roundOff.toFixed(2) || "₹0.00"}</span>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold text-base">Grand Total:</span>
                <span className="font-bold text-blue-600 text-lg">{totals.grandTotal.toFixed(2) || "₹0.00"}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
