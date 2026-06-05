import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { errorToast } from "../../ui/nottifications";
import { SquarePen, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// Debounse function;
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const Debitnote = () => {

  const navigate = useNavigate();
  const [loadDnnumber , setloadDnnumber] = useState("");
  const [ordertype , setordertype] = useState("");
  const [dnNumber , setdnNumber] = useState("");
  const [tabledata , settabledata] = useState([]);
  const [Dnlist , setDnlist] = useState([]); 
  const [loadingclients , setloadingclients] = useState(false);
  const [clientname , setclientName] = useState([]);
  const [items , setItems] = useState([]);


  // Dropdown state;

  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showunitDropdown, setShowunitDropdown] = useState(false)
  const [showdnNumber , setshowdnNumber] = useState(false); 

   const clientRef = useRef(null);
    const itemRef = useRef(null);
    const unitRef = useRef(null);
    const dnRef = useRef(null);
 

  const Api_urls = "http://localhost:3000/api/debitnotes";

//  Form state;

 const [Formdata , setFormData] = useState({
  client_name:'',
  dn_date:'',
  bill_no:'',
  bill_date:'',
  remarks:'',
  delivery_charges: 0,
  tds: 0
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

  
  //Load Next Dn Number;

  const loadDn = async (dnNum) =>{
    const dnToLoad = dnNum || loadDnnumber;
    try{
      if(!dnToLoad.trim()){
        return alert("Enter DN Number");
      }
      const res = await fetch(`${Api_urls}/${dnToLoad}`);
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
  
       setFormData({
        client_name: data.client_name || "",
        dn_date: data.dn_date?.split('T')[0] || "",
        bill_no: data.bill_no || "",
        bill_date: data.bill_date,
        remarks: data.remarks || "",
        delivery_charges: data.delivery_charges || 0,
        tds: data.tds || 0
       });
       setordertype(data.order_type || "");
       setdnNumber(data.dn_number || "");
       setloadDnnumber(data.dn_number || "");

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
      alert("Debit Note Not found");
    }
  }


// Dn Search;

const SearchDn = async (value) =>{
  try{
   let url = "";

    if(!value.trim()){
      url = `${Api_urls}/dn/all`;
    } else{
        url = `${Api_urls}/dn/search?q=${encodeURIComponent(value)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setDnlist(Array.isArray(data) ? data : []);
  } catch(error){
     console.log("Dn Seacrh failed");
  }
}

// Auto Gentrate Dn number next
useEffect(() =>{
  fetch(`${Api_urls}/getdnnumber`)
    .then(res => res.json())
    .then(data => {
      setdnNumber(data.dnNumber)   
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
};

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

  settabledata([
    ...tabledata,
    {
      ...currentrow,
      quantity,
      price,
      discount,
      amount,        
      net_amount,
    },
  ]);

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


useEffect(() => {
  const subtotal = tabledata.reduce((sum, item) => sum + item.net_amount, 0);

  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const igst = 0;
  const delivery_charges = parseFloat(Formdata.delivery_charges) || 0;
  const tds = parseFloat(Formdata.tds) || 0;
 
  const total = subtotal + cgst + sgst + delivery_charges - tds;
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

}, [tabledata, Formdata.delivery_charges, Formdata.tds]);


// Clear reset Form;

const resetForm = async() =>{
  setFormData({
    client_name: '',
    dn_date: new Date().toISOString().split('T')[0],
    bill_no: '',
    bill_date: '',
    remarks: '',
    delivery_charges: 0,
    tds: 0,
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

  setordertype("");
  setloadDnnumber("");

  const res = await fetch(`${Api_urls}/getdnnumber`);
  const data = await res.json();
  setdnNumber(data.dnNumber);
}



//  Save Debit Notes;

const submitdebitNote = async () => {
  if(tabledata.length === 0){
 alert("Please add at least one item to the order.");  
 return;
  }

const payload = {
  client_name: Formdata.client_name,
  order_type: ordertype,
  dn_date: Formdata.dn_date,
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
  roundOff: totals.roundOff,
  grandTotal: totals.grandTotal,
  remarks: Formdata.remarks || "",
  delivery_charges: parseFloat(Formdata.delivery_charges) || 0,
  tds: parseFloat(Formdata.tds) || 0,
  dn_number: dnNumber,
};
      const toastId = toast.loading("Saving purchase order...");

  try{
    const method = loadDnnumber ? "PUT" : "POST"
    const url = loadDnnumber
    ? `${Api_urls}/${loadDnnumber}`
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
    toast.success(method === "PUT" ? "Debit Note updated successfully!" : "Debit Note created successfully!",{id: toastId});
   
    resetForm();
   
  } catch(error){
    toast.error(error.message, { id: toastId })
    errorToast("Failed To Create Debit Note");
  }
}


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
    if(dnRef.current && !dnRef.current.contains(event.target)){
      setshowdnNumber(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Auto fetch today Date;

useEffect(() =>{
  const today = new Date().toISOString().split('T')[0];
  setFormData(prev => ({...prev,dn_date:today}));
},[]);



// Delete Dn;

const deleteDn = async () =>{
  if(!dnNumber) return alert("Select a PO to delete");
  if(!window.confirm("Are you sure you want to delete this Debit Note?")) return;

  try{
    const res = await fetch(`${Api_urls}/${dnNumber}`, {method:"DELETE"});
    if(res.ok){
      alert("Deleted Successfully");
      window.location.reload();
    }else{
      alert("Failed to delete");
    }
  }catch(error){
    console.log("Error Deleting Dn:", error);
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
  settabledata(tabledata.filter((_, i) => i !==index));
}
const deleteItem = (index) =>{
      settabledata(tabledata.filter((_, i) => i !== index));

}




  return (
    <div className="w-full min-h-screen text-sm md:text-base flex flex-col overflow-x-hidden">
       
    <button
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
        onClick={() => navigate(-1)}
      >
        Go Back
      </button> 

      {/* MAIN CONTAINER */}
      <div className="flex-1 bg-white border mt-10 p-4 flex flex-col">
        <div className="flex justify-end">
            
    
        {/* TOP MENU */}
        <div className="flex flex-wrap gap-2 justify-end pb-6 mb-5">
          <div className="flex gap-2">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white ">NEW</button>
            <button onClick={submitdebitNote} className="border px-3 py-1.5 rounded-lg text-black hover:bg-green-500 hover:text-white">SAVE</button>
            <button onClick={deleteDn} className="border px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5  text-black rounded-lg hover:bg-red-500 hover:text-white">CLOSE</button>
          </div>
        </div>
        </div>

        {/* FORM AREA */}
        <div className="flex-1  space-y-5 min-w-0 ">

          {/* ROW 1 */}
          <div className="flex  justify-between mt-7 items-center  min-w-0 ">
           
            <div className="relative text-black" ref={clientRef}>
            <label className="text-sm">NAME:</label>
            <input
             value={Formdata.client_name}
              onFocus={() => setShowClientDropdown(true)}
              onChange={(e) => {const value = e.target.value;
                setFormData({...Formdata,client_name:value});
                 debounceSearch(value);
                }}
                placeholder="Enter Customer Name"
              className="w-full outline-none border rounded-lg px-3 py-2 mt-1" text-black type="text"/>
              
            {/* Client Drop down */}
             {showClientDropdown && (
            <div className="absolute top-5 left-0 text-black w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {loadingclients ? (
                <div className="px-3 py-2 text-black text-sm italic">Loading clients...</div>

                ) : Array.isArray(clientname) && clientname.length > 0 ? (
                    clientname.map((client) => (
                      <div key={client.id} 
                       onClick={(e) =>{e.stopPropagation(); setFormData({...Formdata,client_name: client.customer_name});
                        setShowClientDropdown(false); 
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm z-40">
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
            <label className="text-sm" >DN NO:</label>
            <input 
             value={dnNumber}
             readOnly
             className="w-full outline-none border rounded-lg px-3 py-2 mt-1" type="text"/>
            </div>
              
            <div>
            <label className="text-sm" >DATE:</label>
            <input 
             value={Formdata.dn_date}
             onChange={(e) => setFormData({...Formdata,dn_date: e.target.value})}
             className="w-full outline-none border rounded-lg px-3 py-2 mt-1" type="date" />
           </div>
          </div>

          {/* ROW 2 */}
          <div className="flex flex-wrap gap-5 items-center  min-w-0  ">

            <div>
            <label className="text-sm">BILL NO:</label>
            <input 
             value={Formdata.bill_no}
             onChange={(e) => setFormData({...Formdata,bill_no: e.target.value})}
             placeholder="Bill Number"
             className="w-full outline-none border rounded-lg px-3 py-2 mt-1" type="text"/>
            </div>

             <div>
            <label className="text-sm">REMARKS:</label>
            <input
             value={Formdata.remarks}
              onChange={(e) => setFormData({...Formdata,remarks:e.target.value})}
              placeholder="Enter Fault"
             className="w-full outline-none border rounded-lg px-3 py-2 mt-1" type="text" />
            </div>

             <div>
            <label className="text-sm">BILL DATE:</label>
            <input 
             value={Formdata.bill_date}
              onChange={(e) => setFormData({...Formdata,bill_date:e.target.value})}
              placeholder="Enter Bill Date"
            className="w-full outline-none border rounded-lg px-3 py-2 mt-1" type="date" />
            </div>
          </div>

          {/* TYPE */}
          <div>
          <p className="text-sm font-medium mb-2">Order Type</p>
          <div className="flex gap-6">
            <label htmlFor="dn-order-type-service" className="flex items-center gap-2 cursor-pointer">
              <input id="dn-order-type-service" type="radio" name="orderType" checked ={ordertype === "service"} onChange={() => typechange("service")} /> Service
            </label>
            <label htmlFor="dn-order-type-spare" className="flex items-center gap-2 cursor-pointer">
              <input id="dn-order-type-spare" type="radio" name="orderType" checked ={ordertype === "spare"} onChange={() => typechange("spare")} /> Spare
            </label>
            <label htmlFor="dn-order-type-purchase" className="flex items-center gap-2 cursor-pointer">
              <input id="dn-order-type-purchase" type="radio" name="orderType" checked={ordertype === "purchase_item"} onChange={() => typechange("purchase_item")} /> Purchase Item
            </label>
          </div>
          </div>

          {/* ITEM ENTRY */}
          <div className="flex items-center gap-3 p-3 rounded min-w-0 relative" ref={itemRef}>
              <div>
             <label  className="text-sm">ITEM</label>
             <input 
              value={currentrow.item_name}
              onFocus={() => setShowItemDropdown(true)}
              onChange={(e) => {const value = e.target.value;
                setcurrentrow({...currentrow,item_name: value});
                debouncedItemSearch(value, ordertype)
              }}
              placeholder="Enter Item "
              className="w-[200px] outline-none border rounded-lg px-3 py-2 mt-1" type="text" />
             
              {/* Dropdown */}
                {showItemDropdown && (
                <div className="absolute top-8 left-3 w-[200px] mt-12 rounded-[2px] bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                   {Array.isArray(items) && items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.id}
                       onClick={(e) =>{e.stopPropagation(); selectItem(item); setShowItemDropdown(false)}}
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

             <div>
            <label  className="text-sm">HSN</label>
            <input 
             value={currentrow.hsn_number}
              onChange={(e) => setcurrentrow({...currentrow,hsn_number:e.target.value})}
              placeholder="Hsn"
            className="w-[110px] outline-none border rounded-lg px-3 py-2 mt-1" type="text" />
            </div>

              <div>
            <label  className="text-sm">QTY</label>
            <input
             value={currentrow.quantity}
             onChange={(e) => setcurrentrow({...currentrow,quantity:e.target.value})}
             placeholder="Quantity"
             className="w-[110px] outline-none border rounded-lg px-3 py-2 mt-1" type="number"/>
              
            </div>

             <div>
            <label  className="text-sm">PRICE</label>
            <input 
             value={currentrow.price}
             onChange={(e) => setcurrentrow({...currentrow,price:e.target.value})}
             placeholder="Price"
            className="w-[160px] outline-none border rounded-lg px-3 py-2 mt-1" type="number" />
             </div>

             <div>
            <label className="text-sm">DISC</label>
            <input 
            value={currentrow.discount}
            onChange={(e) => setcurrentrow({...currentrow,discount:e.target.value})}
            placeholder="Discount"
            className="w-[100px] outline-none border rounded-lg px-3 py-2 mt-1" type="text" />
            </div>

             <div className="relative" ref={unitRef}>
            <label className="text-sm" >UOM</label>
            <input 
             value={currentrow.unit}
             onChange={(e) => setcurrentrow({...currentrow,unit:e.target.value})}
             onFocus={() => setShowunitDropdown(true)}
             placeholder="Unit"
            className="w-[100px] outline-none border rounded-lg px-3 py-2 mt-1" type="text" />
             
             {/* Dropdown */}
               
               {showunitDropdown && (
                <div className="absolute top-19 left-0 w-[100px]  rounded-lg bg-white shadow-lg z-50 ">
                   {["Nos","Kg", "Ltr", "Mtr" ].map((unit) => (

                     <div 
                      onClick={(e) => {e.stopPropagation();
                        setcurrentrow(prev => ({...prev,unit}));
                        setShowunitDropdown(false);
                      }}
                      key={unit}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                       {unit}
                     </div>
                    ))}  

                 </div>
               )}

            </div>

             <div>
            <label className="text-sm">PART NO</label>
            <input 
             value={currentrow.partno}
             onChange={(e) => setcurrentrow({...currentrow,partno:e.target.value})}
             placeholder="Part No"
             className="w-[70px] outline-none border rounded-lg px-3 py-2 mt-1" type="number" />
            </div>

            <div className="flex gap-3 mt-5">
            <button onClick={addItem} className="bg-black text-white px-3  rounded-lg">
              ADD
            </button>
            <button onClick={clearRow} className="bg-red-600 text-white px-3 p-2 rounded-lg">
              CLEAR
            </button>
            </div>

          </div>
    
          {/* TABLE */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] border text-sm">
              <thead>
                <tr className="">
                  <th className="border px-2 py-2 text-left pl-5">ITEM NAME</th>
                  <th className="border px-2 py-2">QTY</th>
                  <th className="border px-2 py-2">PRICE</th>
                  <th className="border px-2 py-2">AMOUNT</th>
                  <th className="border px-2 py-2">DISC</th>
                  <th className="border px-2 py-2">PARTNO</th>
                  <th className="border px-2 py-2">UOM</th>
                  <th className="border px-2 py-2">NET</th>
                  <th className="border px-2 py-2">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                 {tabledata.length === 0 ? (
                    <tr className="">
                         <td colSpan="10" className="text-center p-5 text-medium text-gray-600">No items</td>
                    </tr>
                 ) : (
                  tabledata.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="border px-2 py-2 pl-8 text-left">{item.item_name}</td>
                      <td className="border px-2 py-2 text-center">{item.quantity}</td>
                      <td className="border px-2 py-2 text-center">₹{item.price}</td>
                      <td className="border px-2 py-2 text-center">₹{item.amount}</td>
                      <td className="border px-2 py-2 text-center">{item.discount}</td>
                      <td className="border px-2 py-2 text-center">{item.partno}</td>
                      <td className="border px-2 py-2 text-center">{item.unit}</td>
                      <td className="border px-2 py-2 text-center">₹{item.net_amount}</td>
                        <td className="px-5 py-3">
                        <div className="flex gap-3 ml-2">
                              <SquarePen onClick={() => editItem(index)} className="text-blue-600 hover:text-blue-800 font-medium" size={18}/>
                             <Trash2 onClick={() => deleteItem(index)} className="text-red-600 hover:text-red-800 font-medium" size={18}/>
                        </div>
                    </td>
                    </tr>
                  ))
                 )}
                <tr>
                  <td colSpan="10" className="text-center py-4 text-gray-400">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* BOTTOM */}
        <div className=" pt-3 mt-3 space-y-3 min-w-0">

          
          {/* TOTAL */}
          <div className=" items-center justify-between gap-3">
                <div className="flex justify-between">

                    <div className="flex flex-col gap-4 min-w-0" ref={dnRef}>
                      

                    <div className="flex flex-col gap-4">
                      <span className="block mb-1">DELIVERY CHARGES :</span>
                      <input
                        type="number"
                        value={Formdata.delivery_charges}
                        onChange={(e) => setFormData({...Formdata, delivery_charges: e.target.value})}
                        className="w-full border px-3 py-2 rounded flex-1 min-w-[150px] max-w-[250px] outline-none"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">TDS</p>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={Formdata.tds}
                        onChange={(e) => setFormData({...Formdata, tds: e.target.value})}
                        className="outline-none border rounded-lg px-3 py-2 w-full max-w-[200px]"
                      />
                    </div>


                    <div className="items-center gap-2 relative">
                        <span className="block mb-1">SELECT DN NO :</span>
                        <input
                           value={loadDnnumber}
                           onFocus={() => setshowdnNumber(true)}
                           onChange={(e) => {const value = e.target.value;
                            setloadDnnumber(value);
                            SearchDn(value);
                            if(value) setshowdnNumber(true);
                           }}
                          className=" w-full border px-3 py-2 rounded flex-1 min-w-[150px] max-w-[250px] outline-none"
                          placeholder="Enter / Search DC No"
                        />
                        {/* dropdown */}
                        {showdnNumber && (
                        <div className="absolute top-[65px] left-0  w-[250px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                           {Dnlist.length > 0 ? (
                          Dnlist.map((dn) => (
                            <div
                              key={dn.dn_number}
                              onClick={() => {
                                setloadDnnumber(dn.dn_number);
                                setshowdnNumber(false);
                                loadDn(dn.dn_number);
                              }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                            >
                              {dn.dn_number}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-400 text-sm">No DN found</div>
                        )}
                      </div>
                      )}
                    </div>
            </div>


            <div className="w-full max-w-md text-sm space-y-2">

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">CGST (9%):</span>
                <span className="font-medium">{totals.cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">SGST (9%):</span>
                <span className="font-medium">{totals.sgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">IGST (18%):</span>
                <span className="font-medium">{totals.igst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charges:</span>
                <span className="font-medium">{(parseFloat(Formdata.delivery_charges) || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">TDS:</span>
                <span className="font-medium">-{(parseFloat(Formdata.tds) || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-medium">{(totals.roundOff || 0).toFixed(2)}</span>        
             </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold text-base">Grand Total:</span>
                <span className="font-bold text-blue-600 text-lg">{totals.grandTotal.toFixed(2)}</span>
              </div>

            </div>
          </div>
            
          </div>

        </div>

      </div>
    </div>
  );
}

export default Debitnote;