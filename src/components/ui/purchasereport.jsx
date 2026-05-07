import React, { useCallback, useEffect, useState } from "react";
import { X,Square,Minus} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PurchaseReport = ({onMinimize, onClose, setIsMinimizedInternal,title}) => {
  
     const [data , setdata] = useState([]);
     const [isMaximized, setIsMaximized] = useState(false);
     const navigate = useNavigate();
     const [isMinimized, setIsMinimized] = useState(false); 


    //  State 

    const [receiptlist, setReceiptlist] = useState([]);
    const [supplierlist, setsupplierlist] = useState([]);

    const [openbillno,setopenbillno] = useState(false);
    const [supplieropen, setsupplieropen]=useState(false);
 
      const [filters , setfilters] = useState({
        fromdate : "",
        todate : "",
        bill_no : "",
        supplier_name: ""
      });

      const Api_urls = "http://localhost:3000/api/taxpurchases"

     const gentratereport = useCallback(async () => {
    try {
    const params = new URLSearchParams();

    if (filters.fromdate && filters.todate) {
      params.append("fromdate", filters.fromdate);
      params.append("todate", filters.todate);
    }

    if (filters.bill_no) {
      params.append("billno", filters.bill_no);
    }

    if (filters.supplier_name) {
      params.append("suppliername", filters.supplier_name);
    }

    const response = await fetch(`${Api_urls}/report?${params.toString()}`);
    const result = await response.json();

    setdata(result);

  } catch (error) {
    console.error("Error generating report:", error);
  }
}, [Api_urls, filters]);


    //   Fetch Functions
    const fetchsuppliers = async(value) =>{
        try{
          const res = await fetch (`${Api_urls}/supplier/search?q=${encodeURIComponent(value)}`);
          const data = await res.json();

          const uniquesuppliers =[...new Set(data.map(item => item.supplier_name))].map((name) =>({supplier_name:name}))
          
         setsupplierlist(uniquesuppliers);
        }catch(error){
          console.error("Error fetching suppliers:", error);
        }
      }

    //   Fetch Receipt

    const fetchReceipts = async(value) =>{
        try{
          const res = await fetch (`${Api_urls}/billno/search?q=${value}`);
          const data = await res.json();
          setReceiptlist(Array.isArray(data) ? data : []);
        }catch(error){
          console.error("Error fetching receipts:", error);
        }
      }

   useEffect(() => {
  gentratereport();
},[gentratereport]);


   const handleMinimize = () => {
        if(setIsMinimizedInternal){
            setIsMinimizedInternal(true);
        }
        if(onMinimize){
            onMinimize();
        }else{
            setIsMinimized(true);
        }
      }

   const handleclose = () => {
        if(onClose){
            onClose();
        }else{
            navigate(-1);
        }
      }
      
    if(isMinimized){
        return(
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button onClick={() => {setIsMinimized(false);
            if(setIsMinimizedInternal) setIsMinimizedInternal(false);
          }}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500
          text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)]
          hover:from-blue-600 hover:to-blue-400 active:translate-x-[0.5px]
          active:translate-y-[0.5px] transition-all">
              <div>
                <div className="w-3 h-3 border border-white/50"></div>
              </div>
              {title || "Purchase Report"}  
          </button>

        </div>
        )
    }  


    return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-6 bg-black/30 transition-colors"}`}>
     
      <div className={`${isMaximized ? "h-screen w-screen" : "w-[1200px] h-[100vh]"} bg-gray  border-2 border-white  shadow-2xl transitions-all duration-200 pointer-events-auto flex flex-col`}>

    {/* Title Bar */}
      
       <div onDoubleClick={() => setIsMaximized(!isMaximized)}
        className="bg-white text-black px-2 py-1 flex justify-between items-center cursor-default select-none">
         <div className="font-bold text-sm">Purchase Report</div>
         
         <div className="flex shrink-0">

             {/*minimize */}

             <button onClick={handleMinimize}
             className="w-7 h-5 hover:bg-white/20 border border-transparent hover:border-white/30 flex justify-center items-center transitions-colors"
             title="Minimize"
             >
               <Minus size={10} strokeWidth={3}/>
             </button>

             {/* MAXIMIZE */}

             <button  onClick={() => setIsMaximized(!isMaximized)}
             className="w-7 h-5 hover:bg-white/20 border border-transparent hover:border-white/30 flex justify-center items-center transitions-colors"
              title={isMaximized ? "Restore Down" : "Maximize"} >
               <Square size={10} strokeWidth={3}/>
            </button>

            {/* close */}
          
             <button onClick={handleclose}
              className="w-8 h-5 hover:bg-red-500 border border-transparent flex justify-center items-center transition-colors ml-0.5">
               <X size={14} strokeWidth={3}/>   
            </button>
         </div>
       </div>

       {/* Tool Bar */}
        
         <div className="bg-black text-white border-white px-3 flex justify-between text-xs font-bold shadow-[inset_1px_1px_0px_#ffffff]">
            <div className="px-4 py-3 flex items-end gap-6 text-xs font-semibold">
             
              {/* Filter Date */}

               <div className="flex flex-col text-white">
                 <label htmlFor="" className="text-gray-700 mb-1 text-white">FROM DATE</label>
                  <input type="date" placeholder="From Date"
                   value={filters.fromdate}
                    onChange={(e) => setfilters({...filters,fromdate:e.target.value})}
                   className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm  outline-none " />
              </div>

              <div className="flex flex-col text-white">
                 <label htmlFor="" className="text-gray-700 mb-1 text-white">FROM DATE</label>
                  <input type="date" placeholder="To Date"
                   value={filters.todate}
                   onChange={(e) => setfilters({...filters,todate:e.target.value})}
                   className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm  outline-none " />
              </div>


               <div className="flex flex-col text-white relative">
                 <label htmlFor="" className="text-gray-700 mb-1 text-white">FROM DATE</label>
                  <input type="text" placeholder="Bill Number"
                   value={filters.bill_no}
                    onFocus={() => {setopenbillno(true); fetchReceipts(""); }}
                   onChange={(e) => {const value = e.target.value
                    setfilters({...filters, bill_no:value});
                    fetchReceipts(value);
                   }}
                   className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm  outline-none " />

                   {/* Dropdown */}

                   {openbillno && receiptlist.length > 0 && (
                    <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                      {receiptlist.map((item, index) => (
                         <div key={index} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                         onClick={() => {
                            setfilters({...filters, bill_no:item.bill_no});
                            setopenbillno(false);
                         }}
                         >
                            {item.bill_no}
                         </div>
                      ))}
                    </div>

                   )}
                   
              </div>

              <div className="flex flex-col text-white relative">
                 <label htmlFor="" className="text-gray-700 mb-1 text-white">FROM DATE</label>
                  <input type="text" placeholder="Supplier Name"
                   value={filters.supplier_name}
                   onFocus={() => {setsupplieropen(true); fetchsuppliers("") }}
                   onChange={(e) => {
                    const value = e.target.value;
                    setfilters({...filters,supplier_name:value});
                    fetchsuppliers(value);
                   }}
                   className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm  outline-none " />
                  
                  {/* drop down */}

                  {supplieropen && supplierlist.length > 0 && (
                   <div className="absolute top-[42px] left-0 w-full  border border-gray-300 bg-white shadow-lg z-[10000]  max-h-40 overflow-y-auto mt-1">
                      {supplierlist.map((item, index) => (
                         <div key={index} className="px-2 truncate py-1 w-full hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                         onClick={() => {
                            setfilters({...filters, supplier_name:item.supplier_name});
                            setsupplieropen(false);
                         }} >
                            {item.supplier_name}
                         </div>
                      ))}         
                   </div>

                  )}

              </div>

            </div>

   {/* Gentrate Report */}

           <div className="flex gap-5 mr-20">
              <button onClick={gentratereport} className="border h-[30px] mt-7 text-black border-gray-500 px-3 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-gray-50">
                GENERATE REPORT
              </button>

              <button onClick={handleclose} className="border h-[30px] mt-7 text-black border-gray-500 px-3 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-gray-50">
                 CLOSE
            </button>
           </div>
         </div>

         {/* Content */}

         <div className="flex-1 overflow-auto bg-white p-6 custom-scrollbar">
             <div>
                <button className="bg-green-400 border border-green-400 text-white px-1 py-1.5 rounded-[3px]">Main Report</button>
            </div>

            {/* Form To  */}

             <div className="mt-5 leading-9">
                <div className="inline-flex gap-5">
                   <h2 className="text-black font-bold">FROM : <span className="text-red-600 font-semibold">{filters.fromdate}</span></h2>
                    <h2 className="text-black font-bold">TO : <span className="text-red-600 font-semibold">{filters.todate}</span></h2>
                </div>
                <h2 className="text-black font-bold">SUPPLIER NAME :  <span className="text-red-600 font-semibold">{filters.supplier_name}</span></h2>
             </div>

             {/* Table */}
              <div className="overflow-x-auto">
              <table className="w-full mt-4 relative border-t border-b border-gray-400 w-[1000px] border-collapse">
                <thead>
                     <tr className="border-b border-gray-400 text-[14px]">
                        <th className=" text-left p-2 ">SNO</th>
                       <th className="text-left p-2 truncate ">BILL NUMBER</th>
                        <th className="text-left p-2 truncate ">SUPPLIER NAME</th>
                        <th className="text-left p-2 truncate">BILL DATE</th>
                       <th className="text-right p-2 truncate ">PURCHASE ITEMS</th>
                         <th className="text-right p-2  ">QUANTITY</th>
                       <th className="text-center p-2  ">PRICE</th>
                       <th className="text-center p-2 ">UOM</th>
                        <th className="text-center p-2 ">HSN</th>
                        <th className="text-center p-2 ">SUBTOTAL</th>
                        <th className="text-center p-2 ">CGST</th>
                        <th className="text-center p-2 ">SGST</th>
                        <th className="text-center p-2 truncate ">OTHER CHARGES</th>
                        <th className="text-center p-2 ">DISCOUNT</th>
                        <th className="text-center p-2 ">GRANDTOTAL</th>

                     </tr>
                </thead>
                 <tbody>
                 
                  {Array.isArray(data) && data.length > 0 ? (
                    data.map((row, i) => (
                      
                     <tr key={i} className="border-b border-gray-400 text-[14px]">
                        <td className="p-2 text-left truncate">{i + 1}</td>
                        <td className="p-2 text-left truncate">{row.bill_no}</td>
                        <td className="p-2 text-left truncate">{row.supplier_name}</td>
                        <td className="p-2 text-left truncate">{row.bill_date}</td>
                        <td className="p-2 text-center truncate">{row.item_name}</td>
                        <td className="p-2 text-center">{row.quantity}</td>
                        <td className="p-2 text-center">{row.price}</td>
                        <td className="p-2 text-center">{row.uom}</td>
                        <td className="p-2 text-center">{row.hsn}</td>
                        <td className="p-2 text-center">{row.subtotal}</td>
                        <td className="p-2 text-center">{row.cgst}</td>
                        <td className="p-2 text-center">{row.sgst}</td>
                        <td className="p-2 text-center">{row.other_charges}</td>
                        <td className="p-2 text-center">{row.discount}</td>
                         <td className="p-2 text-center font-semibold text-blue-600">{row.grand_total}</td>
                     </tr>
                    ))
                ) : (
                    <tr>
                       <td colSpan="13" className="text-center p-4 text-gray-400">
                        No data found
                        </td>        
                    </tr>

                  )}

                 </tbody>


              </table>
              </div>

         </div>
          
         
      </div>
    </div>
  )
};
export default PurchaseReport;