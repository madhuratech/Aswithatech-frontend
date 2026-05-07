import { SquarePen, Trash2 } from "lucide-react";
import React, {useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InwardEntry = () => {
    const navigate = useNavigate();
    const [orderType, setOrderType] = React.useState("");
    const [clients , setClients] = React.useState([]);
    const [items , setItems] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [itemsearch, setitemsearch] = React.useState("");
    const [tabledata, settabledata] = React.useState([]); 
    const [loadinward, setLoadinward] = React.useState("");
    const [inwardList , setInwardlist] = React.useState([]);

    // Dropdown States
    const [clientOpen, setclientOpen] = React.useState(false);
    const [itemOpen, setitemOpen] = React.useState(false);
    const [transportOpen, setTransportOpen] = React.useState(false);
    const [shouldAutoSelect, setShouldAutoSelect] = React.useState(false);
    const [remarksopen , setRemarksOpen] = React.useState(false);
    const [openunit , setOpenUnit] = React.useState(false);
    const [inwardnoOpen , setinwardnoOpen] = React.useState(false); 


    // Ref

const clientRef = React.useRef(null);
const itemRef = React.useRef(null);
const unitRef = React.useRef(null);
const inwardRef = React.useRef(null);
const transportRef = React.useRef(null);
const remarksRef = React.useRef(null);

    const Api_url = "http://localhost:3000/api/Inwardentries";

    // State for form fields
    const [formData, setFormData] = React.useState({
     supplier_name: "",
     sl_no: "",
     entry_date: "",
     dc_number: "",
     dc_date: "",
     job_number: "",
     job_order_date: "",
     transport: "",
     description_type: "",
     remarks: ""
    });

    // Items State
    const [currentrow, setCurrentrow] = React.useState({
        item_name: "",
        quantity: "",
        unit: "",
        pcb_sl_no: "",
        hsn: "",
        problems: "",
        item_remarks: ""
    });


    // Fetch Clients and Items for Dropdowns
    useEffect(() => {
        const fetchClients = async () => {
            try {
               const url = search
               ? `${Api_url}/clients/search?q=${encodeURIComponent(search)}`
               : `${Api_url}/clients`;

               const res = await fetch(url);
               const data = await res.json();
               setClients(data);
            }catch(err){
                console.error("Error fetching clients:",err);
            }
        }
        fetchClients();
        },[search]);



//  Today Date
useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, entry_date: today, dc_date: today, job_order_date: today }));
},[]);

// item Type

const typechange = (type) => {
  setOrderType(type);
  setitemsearch("");
  setShouldAutoSelect(true);

  setFormData(prev => ({
    ...prev,
    description_type: type
  }));
};

// Fetch item Based Category
useEffect(() =>{
  const fetchItems = async() => {
    if(!orderType) return;

    try{
      const url = itemsearch
      ? `${Api_url}/items/${orderType}?q=${encodeURIComponent(itemsearch)}`
      : `${Api_url}/items/${orderType}`;

      const res = await fetch(url);
      const data = await res.json();

      if(Array.isArray(data)){
      setItems(data);
 
       if(shouldAutoSelect && data.length > 0){
        setCurrentrow((prev) =>({
          ...prev,
          item_name: data[0].item_name || '',
          hsn_number: data[0].hsn_number || ''
        }));
       setShouldAutoSelect(false);
       }

      }
    } catch(error){
      console.log("Error fetching items:", error);
      setItems([]);
    }
  };
  fetchItems();
},[orderType,itemsearch,shouldAutoSelect]);


const selectitem = (selectedItem) => {
    setCurrentrow({
      ...currentrow,
      item_name: selectedItem.item_name,
      hsn: selectedItem.hsn_number,
    });
    setitemOpen(false);
  };

  // Add Rows
  
  const addrow = () =>{
    if(!currentrow.item_name || !currentrow.quantity || !currentrow.unit){
      alert("Please Fill all Fields");
      return;
    }

    settabledata([...tabledata, currentrow]);
    setCurrentrow({
      item_name: "",
      quantity: "",
      unit: "",
      pcb_sl_no: "",
      hsn: "",
      problems: "",
      remarks: ""
    });
  };

  // Save Inward

  const SaveInward = async () => {
    if(tabledata.length === 0){
      alert("please Add Items");
      return;
    }

    const Inwarddata = {
      ...formData,
      supplier_name: formData.supplier_name,
      sl_no: formData.sl_no,
      entry_date: formData.entry_date,
      dc_number: formData.dc_number,
      dc_date: formData.dc_date,
      job_number: formData.job_number,
      job_order_date: formData.job_order_date,
      transport: formData.transport,
      description_type: formData.description_type,
      remarks: formData.remarks,
      items: tabledata.map(item => ({
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        pcb_sl_no: item.pcb_sl_no,
        hsn: item.hsn,
        problems: item.problems,
        remarks: item.remarks
      })),
    } 
    try{
      const method = loadinward ? "PUT" : "POST";
      const url = loadinward
      ? `${Api_url}/update/${encodeURIComponent(loadinward)}`
      : `${Api_url}/new`;

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Inwarddata),
      });

      const data = await res.json();
      if(!res.ok){
        throw new Error(data.message || "failed");
      }

      toast.success(method === "PUT" ? "Inward Updated " :"Inward Created");
      await resetAll();
    }catch(error){
      console.error("Save Error:", error);
      toast.error("Failed to Save Inward");
    }
  }

  //  Reset All

  const resetAll = () => {
    setFormData({
      supplier_name: "",
      sl_no: "",
      entry_date: "",
      dc_number: "",
      dc_date: "",
      job_number: "",
      job_order_date: "",
      transport: "",
      description_type: "",
      remarks: "",
      problems:""
    });
    settabledata([]);
    setLoadinward(null);
    setOrderType("");
  };

  // Load INWARD NUMBER


  const LoadInwardnumber = async (dc_number) => {
  try {
    const res = await fetch(
      `${Api_url}/edit/${encodeURIComponent(dc_number)}`
    );

    const data = await res.json();
      if(!res.ok){
        throw new Error(data.message || "Failed to Load");
      }

      const formatDate = (date)  => {
        if(!date) return "";
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return "";
          return d.toISOString().split("T")[0];
        } catch (e) {
          return "";
        }
      }

      const formattedItems = (data.items || []).map(item => ({
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        pcb_sl_no: item.pcb_sl_no,
        hsn: item.hsn,
        problems: item.problems,
        remarks: item.remarks
      }));

       setLoadinward(dc_number);     
       setFormData({
        supplier_name: data.header.supplier_name || "",
        sl_no: data.header.sl_no || "",
        entry_date: formatDate(data.header.entry_date),
        dc_number: data.header.dc_number || "",
        dc_date: formatDate(data.header.dc_date),
        job_number: data.header.job_number || "",
        job_order_date: formatDate(data.header.job_order_date),
        transport: data.header.transport || "",
        description_type: data.header.description_type || "",
        remarks: data.header.remarks || ""
       });
  
        settabledata(formattedItems)
        setOrderType(data.header.description_type || "")

    }catch(error){
      console.log("Load Error",error);
    }
  };

  // Search Inward Number

  const searchInward = async(value) =>{
    try{
      const res = await fetch(`${Api_url}/IE/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setInwardlist(Array.isArray(data) ? data : []);
    }catch(error){
      console.log("Search Error",error);
    }
  }

  // Delete Inward
  const deleteInward = async () => {
    if (!loadinward) {
      alert("Please Select Inward Number to Delete");
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete ${loadinward}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${Api_url}/delete/${encodeURIComponent(loadinward)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete");
      }
      toast.success("Inward Deleted");
      resetAll();
    } catch (error) {
      console.error("Delete error", error);
      toast.error("Failed to delete");
    }
  };

// Inside Edit
const edititem = (index) => {
    const item = tabledata[index];
    setCurrentrow({
      item_name: item.item_name || "",
      quantity: item.quantity || "",
      unit: item.unit || "",
      pcb_sl_no: item.pcb_sl_no || "",
      hsn: item.hsn || "",
      problems: item.problems || "",
      remarks: item.remarks || ""
    });

    // Remove the item from the table
    const updatedData = tabledata.filter((_, i) => i !== index);
    settabledata(updatedData);
  };
    
  const deleterow = (index) => {
    const updatedData = tabledata.filter((_, i) => i !== index);
    settabledata(updatedData);
  };

  // useeffect handleoutside

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (clientRef.current && !clientRef.current.contains(event.target)) {
      setclientOpen(false);
    }

    if (itemRef.current && !itemRef.current.contains(event.target)) {
      setitemOpen(false);
    }
    if(transportRef.current && !transportRef.current.contains(event.target)) {
      setTransportOpen(false);
    }
    if (remarksRef.current && !remarksRef.current.contains(event.target)) {
      setRemarksOpen(false);
    }

    if (unitRef.current && !unitRef.current.contains(event.target)) {
      setOpenUnit(false);
    }

    if (inwardRef.current && !inwardRef.current.contains(event.target)) {
      setinwardnoOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);




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
            <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-black tracking-tight">INWARD ENTRY</h2>
          <div className="flex gap-1.5">
             <button onClick={resetAll}  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>NEW</button>
              <button onClick={SaveInward}  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>SAVE</button>
              <button onClick={SaveInward} className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>EDIT</button>
              <button onClick={deleteInward} className='border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white'>DELETE</button>
          </div>
        </div>
        
        <div className="flex flex-row items-end gap-20 border-b border-gray-100 pb-8 mb-6">
         <div className='flex flex-col gap-2 flex-1 relative' ref={clientRef}>
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
         Supplier Name
         </label>   

          <input type="text" 
          placeholder="Enter Supplier Name"
          onFocus={() => setclientOpen(true)}
          value={formData.supplier_name}
          onChange={(e) =>{
            const  value = e.target.value;
            setFormData({...formData,supplier_name:value});
             setSearch(value)}}
            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" 
          />

          {/* Dropdown */}

        {clientOpen && clients.length > 0 && (
       
         <div className="absolute top-full mt-1 w-full max-w-[400px] bg-white border rounded-lg shadow-lg z-50">
            {clients.map((client) => (
              <div
                key={client.id}
                className="p-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => {
                  setFormData({ ...formData, supplier_name: client.customer_name });
                  setclientOpen(false);
                  setSearch("");
                }}
              >
                {client.customer_name}
              </div>
            ))}
          </div>
        )}
    </div>

{/*  */}
        <div className='flex flex-col gap-2 flex-1 relative'>
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
         SL NO
        </label>

          <input type="text" 
          value={formData.sl_no}
           onChange={(e) => setFormData({...formData,sl_no:e.target.value})}
          placeholder="Enter SL Number"
          className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" 
          />
        </div>   
  
  {/*  */}
        <div className='flex flex-col gap-2 flex-1 relative'>
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
         Date
         </label>   
            <input type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({...formData,entry_date:e.target.value})}
            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"/>
        </div>
        </div>

        <div className="flex flex-row  gap-10  border-gray-100 pb-8 mb-6">
            <div className='flex flex-col gap-2 flex-1 relative'>
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight"> 
            DC Number
          </label>
            <input type="text"
            placeholder="Enter DC Number"
            value={formData.dc_number}
            onChange={(e) => setFormData({...formData,dc_number:e.target.value})}
            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"
            />
           </div>

           <div className='flex flex-col gap-2 flex-1 relative'>
           <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
            DC Date
           </label>
            <input type="date"
            value={formData.dc_date}
            onChange={(e) => setFormData({...formData,dc_date:e.target.value})} 
            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"/>
           </div>

            <div className='flex flex-col gap-2 flex-1 relative'>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
             JOB Number
            </label>
             <input type="text"
             value={formData.job_number}
             onChange={(e) => setFormData({...formData,job_number:e.target.value})}
             placeholder="Enter Job Number"
             className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"/>
            </div>

            {/* Job order Date */}

            <div className='flex flex-col gap-2 flex-1 relative'>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
             Job Order Date
            </label>
             <input type="date"
             value={formData.job_order_date}
             onChange={(e) => setFormData({...formData,job_order_date:e.target.value})}
             className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"/>
            </div>

            {/* Transport Details */}
           <div className='flex flex-col gap-2 flex-1 relative' ref={transportRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                Transport
             </label>   
            <input type="text"
             value={formData.transport}
             onFocus={() => setTransportOpen(true)}
             onChange={(e) => setFormData({...formData,transport:e.target.value})}
             placeholder="Enter Transport Details"
             className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"/>
           
            {/* Drop Down */}
             {transportOpen && (
              <div className="absolute top-full mt-1 w-full max-w-[400px] bg-white border rounded-lg shadow-lg z-50">
                {["FedEx", "DHL", "BlueDart", "Delhivery"].map((transport) => (
                  <div
                    key={transport }
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                     onClick={(e) => {e.stopPropagation(); setFormData(prev => ({ ...prev, transport: transport })); setTransportOpen(false);}}
                     >
                    {transport}
                  </div>
                ))}
              </div>
            )}
           </div>
          </div>

        {/* Items */}
    <div className="flex flex-col gap-2 shrink-0">
    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
      Description
    </label>
    <div className="flex items-center gap-4 h-[42px]">
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
        <input type="radio"  name="description_type" checked={formData.description_type === "service"} onChange={() => typechange("service")}  className="w-4 h-4 accent-black" /> Service
      </label>
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
        <input type="radio" name="description_type"  checked={formData.description_type === "spare"} onChange={() => typechange("spare")} className="w-4 h-4 accent-black" /> Spares
      </label>
      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
        <input type="radio" name="description_type" checked={formData.description_type === "purchase_item"} onChange={() => typechange("purchase_item")} className="w-4 h-4 accent-black" /> Purchase Items
      </label>
    </div>
  </div>

   {/* items */}

 <div className="grid grid-cols-8 gap-2 mt-6 mb-4 bg-white">
     <div className="flex flex-col col-span-2 relative" ref={itemRef}>
       <input type="text" placeholder="Item Name" 
        value={currentrow.item_name}
        onFocus={() => setitemOpen(true)}
        onChange={(e) => {
          const value = e.target.value;
          setCurrentrow({...currentrow, item_name: value});
          setitemsearch(value)
        }}
        className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
     
     {/*dropdown */}

      {itemOpen && (
        <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
        {Array.isArray(items) && items.length > 0 ?(
          items.map((item , index) => (
            <div
             key={`${item.item_name}-${index}`}
             onClick={(e) =>{
              e.stopPropagation();
              setitemOpen(false)
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

    {/* Quantity */}

     <div>
         <input type="number" placeholder="Quantity"
          value={currentrow.quantity}
          onChange={(e) => setCurrentrow({...currentrow, quantity: e.target.value})}
          className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
     </div>

     {/* Unit */}

     <div className="relative" ref={unitRef}>
        <input type="text"
        placeholder="Unit"
        value={currentrow.unit}
        onFocus={() => setOpenUnit(true)}
        onChange={(e) => setCurrentrow({...currentrow, unit: e.target.value})}      
        className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
     
     {/* Dropdown */}

      {openunit && (
        <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
          {["NOS", "KG", "MTR", "NO"].map((unit, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentrow(prev => ({ ...prev, unit: unit }));
                setOpenUnit(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {unit}
            </div>
          ))}
        </div>
      )}
     
     </div>

     {/* PCB SL NO*/}
      <div>
        <input type="text" placeholder="PCB SL NO"
         value={currentrow.pcb_sl_no}
         onChange={(e) => setCurrentrow({...currentrow, pcb_sl_no: e.target.value})}
         className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
      </div>
      {/* HSN */}

      <div>
        <input type="text"
        placeholder="HSN"
        value={currentrow.hsn}
        onChange={(e) => setCurrentrow({...currentrow, hsn: e.target.value})}
        className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
      </div>

      {/* Problems */}

      <div>
        <input type="text"
         placeholder="Problems"
        value={currentrow.problems}
        onChange={(e) => setCurrentrow({...currentrow, problems: e.target.value})}
         className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
      </div>

       {/* buttons */}

    <div className="flex items-center gap-2 ">
      <button onClick={addrow} className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition">
        ADD
      </button>
      <button className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-gray-400 transition">
        CLEAR
      </button>
    </div>

      {/* REMarks */}
      <div className="flex flex-col col-span-2 relative mt-4" ref={remarksRef}>
        <input type="text"
         value={currentrow.remarks}
         onFocus={() => setRemarksOpen(true)}
         onChange={(e) => setCurrentrow({...currentrow, remarks: e.target.value})}
         placeholder="Remarks"
         className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>
       
       {/* Dropdown */}

       {remarksopen && (
          <div className="absolute top-0 left-0 w-full mt-12 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
            {["Damaged","Services","sell"].map((remark, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentrow(prev => ({ ...prev, remarks: remark }));
                  setRemarksOpen(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {remark}
              </div>
            ))}
          </div>
        )}
      
      </div>
 </div>

 {/* Table */}

  <div className="mt-6 flex gap-2 items-start">
      <div className="flex-grow border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white min-h-[200px]">
      <table className="w-full border-collapse">
       <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-left">
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Sl No</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Item Name</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Quantity</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Unit</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">PCB SL NO</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">HSN</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Problems</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Remarks</th>
         <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Actions</th>
        </tr>
       </thead>

       <tbody>
        {tabledata.length > 0 ? (
        tabledata.map((item,index) => ( 
        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition">
          <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{index + 1}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.item_name}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.quantity}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.unit}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.pcb_sl_no}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.hsn}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.problems}</td>
         <td className="p-3 text-sm text-gray-700 border-r border-gray-100">{item.remarks}</td>
            <td className="p-3 text-[12px]">
             <div className="flex gap-4">
                <SquarePen onClick={() => edititem(index)} className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800" />
                <Trash2 onClick={() => deleterow(index)} className="w-4 h-4 text-red-600 cursor-pointer hover:text-red-800" />
            </div>
          </td>
         </tr>
        ))
      
        ) : (
         <tr>
           <td colSpan="9" className="p-8 text-center text-gray-400">
             No Items Added
           </td>
         </tr>
         )}
       </tbody>
     </table>
   </div>
  </div>

  {/* Select and Modify */}
     <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6 relative">
          <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
            Select Quotation No To View / Modify Details :
    </label>
       <div className="relative w-[250px]" ref={inwardRef}>
        <input type="text"
         value={loadinward || ""}
         onFocus={() => { setinwardnoOpen(true); searchInward("")}}
         onChange={(e) =>{
          const value = e.target.value;
          setLoadinward(value);
          searchInward(value);
         }}
         placeholder="Enter Inward Number"
         className="w-full p-2.5 relative border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"/>

       {/* Dropdown */}
       {inwardnoOpen && (
    <div className="absolute top-full left-0 w-full mt-1 bg-white shadow-lg z-50 max-h-40 overflow-y-auto border">
    {Array.isArray(inwardList) && inwardList.length > 0 ? (
      inwardList.map((inward) => (
        <div
          key={inward.dc_number}
          onClick={(e) => {
            e.stopPropagation();   
            setLoadinward(inward.dc_number);
            LoadInwardnumber(inward.dc_number);
            setinwardnoOpen(false);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {inward.dc_number}
        </div>
      ))
    ) : (
      <div className="px-3 py-2 text-gray-400 text-sm">
        No SL numbers found
      </div>
    )}
  </div>
)}
       </div>
    </div>
 
        
    </div>      
 </div>
  )
};
export default InwardEntry;