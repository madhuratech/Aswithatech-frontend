import React, { useEffect, useState } from "react";
import { X, Minus, Square } from "lucide-react";

const WindowModal = ({ title, isOpen, type, onClose, isMinimized, onMinimize, children, onFilterChange, initialViewMode }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [poList, setPoList] = useState([]);
    const [openpo , setpodown] = useState(null);
    const [viewMode, setViewMode] = useState(initialViewMode || "po");
    const [clientopen , setclientopen] = useState(false);
    const [clientlist , setclientlist] = useState([]);
 

     useEffect(() => {
  if (isOpen) {
    setViewMode(initialViewMode || "po");   
    setReportData([]);                     
  }
}, [isOpen, initialViewMode]);


  
  const Api_urls =
  type === "po"
    ? "http://localhost:3000/api/purchaseorders"
    : type === "dn"
    ? "http://localhost:3000/api/debitnotes"
    : "http://localhost:3000/api/billpayment";


 const [filters , setFilters] = useState({
  fromDate: "",
  toDate: "",
  poNumber: "",
  dnNumber: "",
  billNumber: "",
  clientName: "",
 });

//  Search PO
useEffect(() => {
  const searchUrl =
    type === "po"
      ? `${Api_urls}/po/search?q=`
      : type === "dn"
      ? `${Api_urls}/dn/search?q=`
      : `${Api_urls}/allbills`;

  fetch(searchUrl)
    .then(res => res.json())
    .then(data => setPoList(data))
    .catch(err => console.error(err));

}, [type, Api_urls]); 


// search client
const searchclient = async(value) =>{
  try{
    const res = await fetch(`${Api_urls}/clients/search?q=${value}`);
    const data = await res.json();
    setclientlist(data);
  }catch(error){
    console.error("Error fetching client list:", error);
  }
}




 const gentratereport = async() =>{
  try{

     if (type === "billwise") {
      return;   
    }

     const params = new URLSearchParams();

     if(filters.fromDate && filters.toDate){
      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);  
     }

     if (type === "po" && filters.poNumber) {
      params.append("poNumber", filters.poNumber);
     }

     if (type === "dn" && filters.dnNumber) {
      params.append("dnNumber", filters.dnNumber);
      }
     
      if(type === "po" && filters.clientName){
      params.append("clientName", filters.clientName)     
     }
      if(type === "dn" && filters.clientName){
        params.append("clientName", filters.clientName)
      }
    const response = await fetch(`${Api_urls}/report/filters?${params.toString()}`);
     const data = await response.json();
     setReportData(data);
    setViewMode("report");

    }catch(error){
    console.error("Error generating report:", error);
  }
 } 


//  Download Excel format
 
const downloadExcel = () =>{
   const params = new URLSearchParams();
   
   if(filters.fromDate && filters.toDate){
      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);
     }

     if (type === "po" && filters.poNumber) {
     params.append("poNumber", filters.poNumber);
     }

    if (type === "dn" && filters.dnNumber) {
      params.append("dnNumber", filters.dnNumber);
     }

     const url = `${Api_urls}/report/excel?${params.toString()}`;
     window.open(url, "_blank");

  }

  if (!isOpen || isMinimized) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-6 bg-black/30 transition-colors"}`}>
      
      <div
        className={`bg-gray border-2 border-white flex flex-col shadow-2xl transition-all duration-200 pointer-events-auto
        ${isMaximized ? "w-full h-full border-none" : "w-[1200px] h-[90vh]"}`}
      >

        {/* TITLE BAR */}
        <div 
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-white text-black px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold truncate max-w-[200px]">{title}</span>

          <div className="flex shrink-0">
            
            {/* MINIMIZE */}
            <button
              onClick={onMinimize}
              className="w-7 h-5 hover:bg-white/20 border border-transparent hover:border-white/30 flex justify-center items-center transition-colors"
              title="Minimize"
            >
              <Minus size={12} strokeWidth={3} />
            </button>

            {/* MAXIMIZE / RESTORE */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-7 h-5 hover:bg-white/20 border border-transparent hover:border-white/30 flex justify-center items-center transition-colors"
              title={isMaximized ? "Restore Down" : "Maximize"}
            >
              <Square size={10} strokeWidth={3} />
            </button>

            {/* CLOSE */}
            <button
              onClick={onClose}
              className="w-8 h-5 hover:bg-red-500 border border-transparent flex justify-center items-center transition-colors ml-0.5"
            >
              <X size={14} strokeWidth={3} />
            </button>

          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-black text-white border-white px-3  flex justify-between text-xs font-bold shadow-[inset_1px_1px_0px_#ffffff]">
     <div className="  px-4 py-3 flex items-end gap-6 text-xs font-semibold">

  {/* FROM DATE */}
  <div className="flex flex-col text-white">
    <label className="text-gray-700 mb-1 text-white">FROM DATE</label>
    <input
      type="date"
      placeholder="From Date"
      value={filters?.fromDate || ""}
      onChange={(e) => setFilters({...filters,fromDate:e.target.value})}
      className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"
    />
  </div>

  {/* TO DATE */}
  <div className="flex flex-col">
    <label className="text-gray-700 mb-1 text-white">TO DATE</label>
    <input
      type="date"
      placeholder="To Date"
      value={filters?.toDate || ""}
      onChange={(e) => setFilters({...filters, toDate:e.target.value})}
      className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"
    />
  </div>

  {/* PO NUMBER */}
  <div className="flex flex-col">
    <label>
    {type === "po" ? "PURCHASE ORDER NO" : type === "dn" ? "DEBIT NOTE NO" : "BILL NO"}
</label>
    <input
      type="text"
      placeholder="e.g. PO-2026-001"
      value={type === "po" ? filters?.poNumber : type === "dn" ? filters?.dnNumber : filters?.billNumber}
      onFocus={() => setpodown(true)}
      onChange={(e) => {
      const value = e.target.value;
       if (type === "po") {
       setFilters({ ...filters, poNumber: value });
       } else if (type === "dn") {
         setFilters({ ...filters, dnNumber: value });
       } else {
         setFilters({ ...filters, billNumber: value });
       }
       if (value) {
       setViewMode("po");}}}
      className="w-[150px] px-2 py-1 mt-[4px] border text-black  border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"
    />

    {/* Drop Down */}

      <div className="relative">
          {
        openpo && (
          <div className="absolute top-0 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {poList.length > 0 ? (
              poList.map((po) => (
                <div
                  key={type === "po" ? po.po_number : type === "dn" ? po.dn_number : po.bill_no}
                  onClick={() => {
                    if (type === "po") {
                      setFilters({ ...filters, poNumber: po.po_number });
                    } else if (type === "dn") {
                      setFilters({ ...filters, dnNumber: po.dn_number });
                    } else {
                      setFilters({ ...filters, billNumber: po.bill_no });
                    }
                    setpodown(false);
                   if (type === "billwise") {
                   setViewMode("po");  
                   } else {
                   setViewMode("po");
                   }
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm border-b border-gray-100 last:border-0"
                >
                  {type === "po" ? po.po_number : type === "dn" ? po.dn_number : po.bill_no}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400 text-sm">No PO found</div>
            )}
          </div>
        )}
      </div>
     
  </div>

  {/* Client Name wise search */}
    <div className="flex flex-col">
      <label htmlFor="">CLIENT NAME</label>
       <input type="text" 
       value={filters?.clientName|| ""}
        onFocus={() => setclientopen(true)}
        onChange={(e) => {const value = e.target.value;
          setFilters({...filters, clientName:value});
          searchclient(value);
        }}
        placeholder="Client Name"
       className="w-full px-2 mt-[4px] py-1 border text-black border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"
      />

       {/* dropdown */}
        <div className="relative">
              {clientopen && (
                <div className="absolute top-0 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {clientlist.length > 0 ? (
                    clientlist.map((client, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFilters({ ...filters, clientName: client.customer_name });
                          setclientopen(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm border-b border-gray-100 last:border-0"
                      >
                        {client.customer_name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">No clients found</div>
                  )}
                </div>
              ) }
        </div>


    </div>

</div>

          <div className="flex gap-5 mr-20">
            {type !== "billwise" && (
          <button 
            onClick={gentratereport} 
            className="border h-[30px] mt-7 text-black border-gray-500 px-3 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-gray-50"
          >
            GENERATE REPORT
          </button>
          )}

          <button 
            onClick={onClose} 
            className="border h-[30px] mt-7 text-black border-gray-500 px-3 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-gray-50"
          >
            CLOSE
          </button>
          </div>
        </div>


        {/* CONTENT */}
        <div className="flex-1 overflow-auto bg-white p-6 custom-scrollbar">
          <div>
               <button onClick={downloadExcel} className=" bg-green-400 text-white border border-green-400 px-1 py-1.5 rounded-[3px]">Main Report</button>
           </div>
            
          <div className={`w-full h-[100vh] mt-10 mx-auto ${viewMode === "report" ? "border" : ""}`}>
                  
                   {/*Report View  */}
                   {/*table*/}
                  
   {viewMode === "report" && type !== "billwise" && ( 
  <div
    className="mx-auto mt-4 text-[12px] text-black"
    style={{ width: "100%", maxWidth: "1000px" }}
  >

    {/* ===== HEADER LINE ===== */}
    <div className=" pb-2 leading-8">

      <div className="inline-flex gap-6">
          <h2 className="text-black font-bold text-[14px]">FROM : <span className="text-red-500 font-semibold text-[15px]">{filters.fromDate}</span></h2>
           <h2 className="text-black font-bold text-[14px]">TO : <span className="text-red-500 font-semibold text-[15px]">{filters.toDate}</span></h2> 
      </div>
       <h2 className="text-black font-bold text-[14px]">CUSTOMER NAME :  <span className="text-red-600 font-semibold text-[15px]">{filters.clientName}</span></h2>

    </div>

    {/* ===== TABLE HEADER ===== */}
    <div className="overflow-x-auto">
    <table  className="w-full mt-4 relative  border-t border-b border-gray-400 w-[1000px] border-collapse]">

      <thead>
        <tr className="border-b border-gray-400 font-bold text-[13px]">

          <th className="text-left p-2 w-[60px]">SNO</th>
          <th className="text-left p-2 truncate w-[120px]">
            {type === "po" ? "PO NUMBER" : type === "dn" ? "DN NUMBER" : "BILL NUMBER"}
          </th>
          <th className="text-left p-2 w-[120px]">DATE</th>
           <th className="text-left p-2 w-[120px] truncate">CLIENT NAME</th>
          <th className="text-right p-2 truncate w-[120px]">PURCHASE ITEM</th>
            <th className="text-right p-2 w-[110px] ">QUANTITY</th>
          <th className="text-center p-2 w-[110px] pl-5">PRICE</th>
          {type === "dn" && (
          <th className="text-center p-2 w-[110px] pl-3">DISCOUNT</th>
           )}
          <th className="text-center p-2 w-[110px] pl-5">SUBTOTAL</th>
           <th className="text-center p-2 w-[110px] pl-3">SGST</th>
           <th className="text-center p-2 w-[110px] pl-3">CGST</th>
            {type === "dn" && (
            <th className="text-center p-2 w-[110px] pl-3">IGST</th>
            )}
           <th className="text-center p-2 w-[110px] pl-3 ">GRANDTOTAL</th>

        </tr>
      </thead>

      <tbody className="w-[500px] font-semibold text-[14px] text-gray-600">

        {/* DATA ROWS */}
        {reportData.length > 0 ? (
          reportData.map((row, i) => (
            <tr key={i} className="border-b ">

              <td className="p-2 text-left truncate">{i + 1}</td>

              <td className="p-2 text-left truncate ">
                {type === "po" ? row.po_number : type === "dn" ? row.dn_number : row.bill_no || "-"}
              </td>

              <td className="p-2 text-left truncate">
                {type === "po" ? row.po_date : row.dn_date}
              </td>

             <td className="p-2 text-left truncate" title={row.client_name}>
              {row.client_name}
              </td>

              <td className="p-2 text-center truncate">
                {row.item_name || "-"}
              </td>

              <td className="p-2 text-center truncate">
                {row.quantity ?? 0}
              </td>

              <td className="p-2 text-center pl-8">
                    {row.price ?? 0}
              </td>

               {type === "dn" && (
               <td className="p-2 text-center">
                 {row.discount}
               </td>
               )}

              <td className="p-2 pl-8 text-center">
                 {row.subtotal ?? 0}
              </td>
              

              <td className="p-2 pl-8 text-center">
                    {row.sgst ?? 0}
              </td>

              <td className="p-2 pl-8 text-center">
                    {row.cgst ?? 0}

              </td>
             {type === "dn" && (
                <td className="p-2 pl-8 text-center">
                  {row.igst ?? 0}
                </td>
               )}

               <td className="p-2 pl-8 text-center text-blue-500">
                    {row.grandTotal ?? 0}

              </td>

            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center py-10 text-gray-500">
              No Data Available
            </td>
          </tr>
        )}

      </tbody>
    </table>
  </div>

  </div>
  
)}

         {/* Po View */}
        {viewMode === "po" && (
          <div  className=" mx-auto mt-10"
           style={{ width: "210mm", minHeight: "297mm" }} >
            
            {children}
          </div>
)}
    </div>
    </div>

        {/* STATUS BAR */}
        <div className="bg-white border-t border-gray-400 px-3 py-0.5 text-[10px] font-bold text-gray-600 flex justify-between shadow-[inset_0px_1px_0px_#ffffff]">
          <span className="flex items-center gap-4">
             <span className="border-r border-gray-400 pr-4">Total Page No: 1</span>
             <span>READY</span>
          </span>
          <span>ZOOM: 100%</span>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #c0c0c0;
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border: 2px solid #808080;
          box-shadow: inset 1px 1px 0px white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #d0d0d0;
        }
      `}</style>
    </div>
  );
};

export default WindowModal;
