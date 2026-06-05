import React, { useEffect, useState } from "react";
import { X, Minus, Square } from "lucide-react";

const WindowModal = ({ title, isOpen, type, onClose, isMinimized, onMinimize, children, onFilterChange, initialViewMode, initialView, filters: externalFilters }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [poList, setPoList] = useState([]);
    const [openpo , setpodown] = useState(false);
    const [viewMode, setViewMode] = useState(initialViewMode || initialView || "qt");
    const [clientopen , setclientopen] = useState(false);
    const [clientlist , setclientlist] = useState([]);
 

     useEffect(() => {
  if (isOpen) {
    setViewMode(initialViewMode || initialView || ((type === "Credit Note" || type === "cn") ? "cn" : "qt"));   
    setReportData([]);
    loadAllClients();
  }
}, [isOpen, initialViewMode, initialView, type]);


  
  const Api_urls =
    type === "Quotation Format" || type === "qt"
      ? "http://localhost:3000/api/quotations"
      : "http://localhost:3000/api/creditnotes";


 const [filters , setFilters] = useState({
  fromDate: "",
  toDate: "",
  clientName: "",
  QtNumber: externalFilters?.QtNumber || ""
 });

useEffect(() => {
  if (!externalFilters?.QtNumber) return;

  setFilters(prev => {
    if (prev.QtNumber === externalFilters.QtNumber) return prev;
    return { ...prev, QtNumber: externalFilters.QtNumber };
  });
}, [externalFilters?.QtNumber]);

//  Search PO
useEffect(() =>{
  const searchurl = (type === "qt" || type === "Quotation Format")
   ? `${Api_urls}/QT/search?q=`
   : (type === "Credit Note" || type === "cn")
   ? `${Api_urls}/cn/search?q=`
   : null;

  if (searchurl) {
    fetch(searchurl)
      .then(res => res.json())
      .then(data => setPoList(data))
      .catch(err => console.error(err));
  } else {
    setPoList([]);
  }
},[type, Api_urls]);


// search client
const searchclient = async(value) => {
  try {
    const res = await fetch(`http://localhost:3000/api/customers/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setclientlist(data);
  } catch(error) {
    console.error("Error fetching client list:", error);
  }
}

const loadAllClients = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/customers/all`);
    const data = await res.json();
    setclientlist(data);
  } catch(error) {
    console.error("Error loading all clients:", error);
  }
}



const gentratereport = async () => {
  try {
    const params = new URLSearchParams();
    if (filters.fromDate && filters.toDate) {
      params.append("fromDate", filters.fromDate);   
      params.append("toDate", filters.toDate);   
    }

    if ((type === "qt" || type === "Quotation Format") && filters.QtNumber) {
      params.append("quotationNo", filters.QtNumber); 
    }

    if ((type === "Credit Note" || type === "cn") && filters.QtNumber) {
      params.append("cnNumber", filters.QtNumber); 
    }

    const response = await fetch(
      `${Api_urls}/report/filters?${params.toString()}`
    );

    const data = await response.json();

    console.log("REPORT DATA:", data); 

    // Frontend filter by client name if provided
    let filteredData = data;
    if (filters.clientName) {
      filteredData = data.filter(row => 
        (row.customer_name || row.client_name || "")
          .toLowerCase()
          .includes(filters.clientName.toLowerCase())
      );
    }

    setReportData(filteredData);
    setViewMode("report"); 

  } catch (error) {
    console.error("Error generating report:", error);
  }
};

//  Download Excel format
 
const downloadExcel = () =>{
   const params = new URLSearchParams();
   
   if(filters.fromDate && filters.toDate){
      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);
     }

     if((type === "qt" || type === "Quotation Format") && filters.QtNumber) {
       params.append("quotationNo", filters.QtNumber);
     }

     if((type === "Credit Note" || type === "cn") && filters.QtNumber) {
       params.append("cnNumber", filters.QtNumber);
     }

     const url = `${Api_urls}/report/excel?${params.toString()}`;
     window.open(url, "_blank");

  }


  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".qt-dropdown")) {
      setpodown(false);
    }
    if (!e.target.closest(".client-dropdown-container")) {
      setclientopen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

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
<div className="flex flex-col relative qt-dropdown">
  <label>
    {type === "qt" || type === "Quotation Format" ? "QUOTATION NO" : "CREDIT NOTE NO"}
  </label>
    <input
      type="text"
      placeholder={type === "qt" || type === "Quotation Format" ? "e.g. AT-QT-001" : "e.g. CN-2026-001"}
      value={filters.QtNumber}
      onFocus={() => setpodown(true)}
      onChange={(e) => {
      const value = e.target.value;
      setFilters({...filters, QtNumber:value});
      if(value){
        setViewMode(type === "qt" || type === "Quotation Format" ? "qt" : "cn");
      }
      }}
      className="w-[150px] px-2 py-1 mt-[4px] border text-black  border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"
    />

    {/* Drop Down */}

      <div className="">
          {
        openpo && (
         <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
            {poList.length > 0 ? (
               poList.map((po) => {
                 const displayNo = (type === "qt" || type === "Quotation Format") ? po.quotation_no : po.cn_number;
                 return (
                   <div
                     key={displayNo}
                     onClick={(e) => {
                       e.stopPropagation();
                       setFilters((prev) => ({ ...prev, QtNumber: displayNo }));

                       if (onFilterChange) {
                         onFilterChange({ ...filters, QtNumber: displayNo });
                       }
                       setReportData([]);        
                       setViewMode((type === "qt" || type === "Quotation Format") ? "qt" : "cn");        
                       setpodown(false);
                     }}
                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm border-b border-gray-100 last:border-0"
                   >
                     {displayNo}
                   </div>
                 );
               })
             ) : (
               <div className="px-3 py-2 text-gray-400 text-sm">No entries found</div>
             )}
          </div>
        )}
      </div>
     
  </div>

  {/* Client Name wise search */}
    <div className="flex flex-col relative client-dropdown-container">
      <label htmlFor="">CLIENT NAME</label>
       <input type="text" 
       value={filters?.clientName|| ""}
        onFocus={() => {
          setclientopen(true);
          if (clientlist.length === 0) {
            loadAllClients();
          }
        }}
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
          <div className="flex gap-3">
               <button onClick={downloadExcel} className=" bg-green-400 text-white border border-green-400 px-3 py-1.5 rounded-[3px] font-semibold text-xs transition">Main Report</button>
               {(viewMode === "qt" || viewMode === "cn") && (
                 <>
                   <button 
                     onClick={() => window.print()} 
                     className="bg-blue-500 text-white border border-blue-500 px-3 py-1.5 rounded-[3px] font-semibold text-xs hover:bg-blue-600 transition"
                   >
                     PRINT (A4)
                   </button>
                   <button 
                     onClick={() => window.print()} 
                     className="bg-red-500 text-white border border-red-500 px-3 py-1.5 rounded-[3px] font-semibold text-xs hover:bg-red-600 transition"
                   >
                     DOWNLOAD PDF
                   </button>
                 </>
               )}
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
    <table  className="w-full mt-4 relative border-gray-400 w-[1500px] border-collapse]">

      <thead>
        <tr className="border border-gray-400 font-bold text-[13px]">

          <th className="text-left py-2 px-3 w-[60px] border-r ">SNO</th>
          <th className="text-left py-2 px-3 truncate w-[120px] border-r">
            {type === "qt" || type === "Quotation Format" ? "QUOTATION NO" : "CN NUMBER"}
          </th>
          <th className="text-left py-2 px-3 w-[120px] border-r ">DATE</th>
           <th className="text-left py-2 px-3 w-[120px] truncate border-r ">CLIENT NAME</th>
          <th className="text-right py-2 px-3 truncate w-[120px] border-r ">PURCHASE ITEM</th>
            <th className="text-right py-2 px-3 w-[110px] border-r  ">QUANTITY</th>
          <th className="text-center py-2 px-3 w-[110px] border-r">PRICE</th>
          <th className="text-center py-2 px-3 w-[110px] pl-5 border-r ">SUBTOTAL</th>
           <th className="text-center py-2 px-3 w-[110px] pl-3 border-r ">SGST</th>
           <th className="text-center py-2 px-3 w-[110px] pl-3 border-r ">CGST</th>
            <th className="text-center py-2 px-3 w-[110px] pl-3 border-r ">IGST</th>
           <th className="text-center py-2 px-3 w-[110px] pl-3 border-r  ">GRANDTOTAL</th>

        </tr>
      </thead>

      <tbody className="w-[600px]  font-semibold text-[14px] text-gray-600">

        {/* DATA ROWS */}
        {reportData.length > 0 ? (
          reportData.map((row, i) => (
            <tr key={i} className="border border-gray-400 ">

              <td className="p-2 text-left truncate border-r border-gray-400 ">{i + 1}</td>

              <td className="p-2 text-left truncate  border-r border-gray-400 ">
                {((type === "qt" || type === "Quotation Format") ? row.quotation_no : row.cn_number) || "-"}
             </td>

              <td className="p-2 text-left truncate border-r border-gray-400 ">
                {(type === "qt" || type === "Quotation Format") ? row.quotation_date : (row.cn_date ? row.cn_date.split('T')[0] : "-")}
              </td>

             <td className="p-2 text-left truncate border-r border-gray-400 " title={row.customer_name || row.client_name}>
              {row.customer_name || row.client_name}
              </td>

              <td className="p-2 text-center truncate border-r border-gray-400 ">
                {row.item_name || "-"}
              </td>

              <td className="p-2 text-center truncate border-r border-gray-400 ">
                {row.quantity ?? 0}
              </td>

              <td className="p-2 text-center pl-8 border-r border-gray-400 ">
                    {row.price ?? 0}
              </td>


              <td className="p-2 pl-8 text-center border-r border-gray-400 ">
                 {row.subtotal ?? 0}
              </td>
              

              <td className="p-2 pl-8 text-center border-r border-gray-400 ">
                    {row.sgst ?? 0}
              </td>

              <td className="p-2 pl-8 text-center border-r border-gray-400 ">
                    {row.cgst ?? 0}

              </td>
              <td className="p-2 pl-8 text-center border-r border-gray-400 ">
                    {row.igst || "-"}

              </td>

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
        {(viewMode === "qt" || viewMode === "cn") && (
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
