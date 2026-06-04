import React, { useEffect, useState, useCallback, useRef } from "react";
import { X, Square, Minus} from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

const SupplierModel = ({onMinimize, onClose, title, setIsMinimizedInternal}) =>{
  const [data, setData] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const contentRef = useRef(null);


  // States for search dropdowns
  const [receiptList, setReceiptList] = useState([]);
  const [showReceiptList, setShowReceiptList] = useState(false);
  const [supplierList, setSupplierList] = useState([]);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [loading, setLoading] = useState(false);

const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "", 
    receipt_no: "",
    supplier_name: ""
  });

    const Api_urls = "http://localhost:3000/api/suppliers";

    const gentratereport = useCallback (async () =>{
    try{
        setLoading(true);
        let query = [];
        if (filters.fromDate && filters.toDate) {
        query.push(`fromDate=${filters.fromDate}`);
        query.push(`toDate=${filters.toDate}`);
       }

       if (filters.receipt_no) {
       query.push(`receipt_no=${filters.receipt_no}`);
       }

       if (filters.supplier_name) {
       query.push(`supplier_name=${encodeURIComponent(filters.supplier_name)}`);
       }
        const url = `${Api_urls}/report?${query.join("&")}`;
        const res = await fetch(url);
        const result =  await res.json();
        setData(Array.isArray(result) ? result : []);
    }catch(error){
        console.error("Report Error:", error);
    } finally {
        setLoading(false);
    }
   },[filters])

   // Fetch functions for dropdowns
   const fetchReceipts = async (val) => {
     try {
       const res = await fetch(`${Api_urls}/report?receipt_no=${val}`);
       const result = await res.json();
       setReceiptList(Array.isArray(result) ? result : []);
     } catch (err) {
       console.error(err);
     }
   };

   const handlePrint = () => {

  const printContents = contentRef.current.innerHTML;

  const printWindow = window.open("", "", "width=900,height=650");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title || "Report"}</title>

        <style>
          body{
            margin:0;
            padding:20px;
            background:white;
          }

          @page{
            size:A4;
            margin:10mm;
          }

          table{
            width:100%;
            border-collapse:collapse;
          }

          th,td{
            border:1px solid #ccc;
            padding:6px;
          }
        </style>

      </head>

      <body>
        ${printContents}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};

   const fetchSuppliers = async (val) => {
     try {
       const res = await fetch(`${Api_urls}/report?supplier_name=${encodeURIComponent(val)}`);
       const result = await res.json();
       // Get unique supplier names
       const uniqueSuppliers = [...new Set(result.map(item => item.supplier_name))].map(name => ({supplier_name: name}));
       setSupplierList(uniqueSuppliers);
     } catch (err) {
       console.error(err);
     }
   };

  
   useEffect(() => {
  gentratereport();
}, [gentratereport]);


  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

const handleMinimize = () => {
    if (setIsMinimizedInternal) {
        setIsMinimizedInternal(true);
    }
    if (onMinimize) {
      onMinimize();
    } else {
      setIsMinimized(true);  
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => {
            setIsMinimized(false);
            if (setIsMinimizedInternal) setIsMinimizedInternal(false);
          }}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
        >
          <div className="w-3 h-3 border border-white/50"></div>
          {title || "Supplier Ledger"}
        </button>
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

        @media print {
        body { margin: 0 !important; padding: 0 !important; }
        .no-print { display: none !important; }
        .printable-area {
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        table { width: 100% !important; page-break-inside: auto !important; }
        tr { page-break-inside: avoid !important; }
        }
      `}</style>
  </div>
    );
  }

  const exportToPdf = () => {
    if (!contentRef.current) return;
    const opt = {
        margin: [5, 5, 5, 5],
        filename: `${title || 'Supplier_Report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            windowWidth: 1200 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(contentRef.current).toPdf().get('pdf').save().then(() => {
        handleClose();
        navigate("/");
    });
  };



    return(
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-6 bg-black/30 transition-colors"}`}>

       <div
        className={`bg-gray border-2 border-white flex flex-col shadow-2xl transition-all duration-200 pointer-events-auto
       ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}>

        {/* TITLE BAR */}
        <div 
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-white text-black px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold truncate max-w-[200px]">{title}</span>

          <div className="flex shrink-0">
            
            {/* MINIMIZE */}
            <button
              onClick={handleMinimize}
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
              onClick={handleClose}
              className="w-8 h-5 hover:bg-red-500 border border-transparent flex justify-center items-center transition-colors ml-0.5"
            >
              <X size={14} strokeWidth={3} />
            </button>

          </div>
        </div>

        {/* tool bar */}
 
       <div className="bg-black text-white border-white px-3  flex justify-between text-xs font-bold shadow-[inset_1px_1px_0px_#ffffff]">
          <div className="  px-4 py-3 flex items-end gap-6 text-xs font-semibold">

                <div className="flex flex-col text-white">
                 <label className="text-gray-700 mb-1 text-white">FROM DATE</label>
                <input
                 type="date"
                 placeholder="From Date"
                 value={filters?.fromDate || ""}
                 onChange={(e) => setFilters({...filters,fromDate:e.target.value})}
                 className="w-[130px] px-2 py-1 border text-black border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"/>
                </div>

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

                {/* Receipt No */}

                <div className="flex flex-col relative">
                    <label className="text-sm" htmlFor="">Recipt Number</label>
                     <input type="text" placeholder="SUP-2026-001"
                     value={filters?.receipt_no || ""}
                     onFocus={() => { setShowReceiptList(true); fetchReceipts(""); }}
                     onChange={(e) => {
                       const val = e.target.value;
                       setFilters({...filters,receipt_no:val});
                       fetchReceipts(val);
                       setShowReceiptList(true);
                     }}
                     className="w-[150px] px-2 py-1 border text-black  border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white" />
                     
                     {showReceiptList && receiptList.length > 0 && (
                       <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                         {receiptList.map((item, idx) => (
                           <div 
                             key={idx} 
                             className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                             onClick={() => {
                               setFilters({...filters, receipt_no: item.receipt_no});
                               setShowReceiptList(false);
                             }}
                           >
                             {item.receipt_no}
                           </div>
                         ))}
                       </div>
                     )}
                </div>

                {/* Name By Overall Search */}

                 <div className="flex flex-col relative">
                 <label className="text-sm" htmlFor="">Supplier Name</label>
                 <input type="text"
                  placeholder="Supplier Name" 
                  value={filters?.supplier_name || ""}  
                  onFocus={() => { setShowSupplierList(true); fetchSuppliers(""); }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({...filters,supplier_name:val});
                    fetchSuppliers(val);
                    setShowSupplierList(true);
                  }}
                  className="w-[150px] px-2 py-1 border text-black  border-gray-300 rounded-sm outline-none focus:border-blue-500 bg-white"
                  />
                  
                  {showSupplierList && supplierList.length > 0 && (
                    <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                      {supplierList.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                          onClick={() => {
                            setFilters({...filters, supplier_name: item.supplier_name});
                            setShowSupplierList(false);
                          }}
                        >
                          {item.supplier_name}
                        </div>
                      ))}
                    </div>
                  )}
                 </div>
              
          </div>

          <div className="flex gap-5 mr-20">
          <button 
            onClick={gentratereport} 
            className="border h-[30px] mt-7 text-black border-gray-500 px-3 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-gray-50"
          >
            GENERATE REPORT
          </button>

          <button 
            onClick={handleClose} 
            className="border h-[30px] mt-7 text-black border-gray-500 px-3 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-gray-50"
          >
            CLOSE
          </button>
          </div>
      </div>

      {/* Content */}

       <div className="flex-1 overflow-auto bg-white p-6 custom-scrollbar">
           <div className="flex gap-3 no-print mb-4">
               <button  className=" bg-green-400 text-white border border-green-400 px-2 py-1.5 rounded-[3px]">Main Report</button>
               <button onClick={handlePrint} className="bg-blue-500 border border-blue-500 text-white px-4 py-1.5 rounded-[3px] shadow">Print</button>
               <button onClick={exportToPdf} className="bg-red-500 border border-red-500 text-white px-4 py-1.5 rounded-[3px] shadow">Export PDF</button>
           </div>
           
          <div ref={contentRef} className="printable-area w-full"
           style={{ width: "100%", minWidth: "100%", padding: "10px 20px", boxSizing: "border-box"}}
>
           {/* from to */}
            <div className="mt-5 leading-9">
              <div className="inline-flex gap-5">
               <h2 className="text-black font-bold">FROM : <span className="text-red-600 font-semibold">{filters.fromDate}</span></h2>
                <h2 className="text-black font-bold">TO : <span  className="text-red-600 font-semibold"> {filters.toDate}</span></h2>
                </div>
                <h2 className="text-black font-bold">SUPPLIER NAME : <span className="text-red-600 font-semibold">{filters.supplier_name}</span> </h2>
            </div>

    <div className="w-full overflow-x-auto">
  <table className="w-full table-auto mt-4 border border-gray-300 border-collapse bg-white">

      <thead>
        <tr className="border-b border-gray-400 text-[14px]">

          <th className=" text-left p-2 ">SNO</th>
          <th className="text-left p-2 whitespace-nowrap">RECEIPT NUMBER</th>
          <th className="text-left p-2">DATE</th>
           <th className="text-left p-2 ">SUPPLIER NAME</th>
          <th className="text-right p-2 truncate ">PAID AMOUNT</th>
            <th className="text-right p-2  ">TDS</th>
          <th className="text-center p-2  ">OTHERS</th>
          <th className="text-center p-2 ">GRAND TOTALS</th>
           <th className="text-center p-2 ">BALANCE AMOUNT</th>
           <th className="text-center p-2 ">PAYEMNT METHOD</th>
        </tr>
      </thead>

      <tbody >

        {/* DATA ROWS */}
        {loading ? (
          <tr>
            <td colSpan="8" className="text-center py-10 text-gray-500 italic">
              Loading report data...
            </td>
          </tr>
        ) : data.length > 0 ? (
          data.map((row, i) => (
            <tr key={i} className="border-b ">

              <td className="p-2 text-left truncate">{i + 1}</td>

              <td className="p-2 text-left truncate text-black">
                {row.receipt_no}
              </td>

              <td className="p-2 text-left truncate">
                {row.date ? new Date(row.date).toLocaleDateString() : ""}
              </td>

             <td className="p-2 text-left truncate" title={row.supplier_name}>
              {row.supplier_name}
              </td>

              <td className="p-2 font-semibold text-green-600 text-center truncate">
                {row.paid_amount || 0}
              </td>

              <td className="p-2 text-center truncate pl-4">
                {row.tds || 0}
              </td>

              <td className="p-2 text-center pl-8">
                    {row.others || 0}
              </td>

               <td className="text-blue-600 pl-8 font-semibold">
                {row.po_grand_total || 0}
                </td>
        
               <td className="text-red-600 font-semibold pl-16">
                 {(row.po_grand_total || 0) - (row.paid_amount || 0) - (row.tds || 0) - (row.others || 0)}
                </td>

                <td className="p-2 text-center text-blue-600 font-semibold">
                 {row.payment_mode}
               </td>

            </tr>
          ))

          
        ) : (
          <tr>
            <td colSpan="8" className="text-center py-10 text-gray-500">
              No Data Available
            </td>
          </tr>
        )}

        <tr className="bg-gray-100 font-bold text-black border-t-2">

  <td colSpan="4" className="p-3 text-right">
    OVERALL TOTAL
  </td>

  {/* PAID AMOUNT TOTAL */}
  <td className="p-3 text-center text-green-600">
    {data
      .reduce(
        (sum, row) => sum + (Number(row.paid_amount) || 0),
        0
      )
      .toFixed(2)}
  </td>

  {/* TDS TOTAL */}
  <td className="p-3 text-center">
    {data
      .reduce(
        (sum, row) => sum + (Number(row.tds) || 0),
        0
      )
      .toFixed(2)}
  </td>

  {/* OTHERS TOTAL */}
  <td className="p-3 text-center">
    {data
      .reduce(
        (sum, row) => sum + (Number(row.others) || 0),
        0
      )
      .toFixed(2)}
  </td>

  {/* GRAND TOTAL */}
  <td className="p-3 text-center text-blue-600">
    {data
      .reduce(
        (sum, row) => sum + (Number(row.po_grand_total) || 0),
        0
      )
      .toFixed(2)}
  </td>

  {/* BALANCE TOTAL */}
  <td className="p-3 text-center text-red-600">
    {data
      .reduce(
        (sum, row) =>
          sum +
          (
            (Number(row.po_grand_total) || 0) -
            (Number(row.paid_amount) || 0) -
            (Number(row.tds) || 0) -
            (Number(row.others) || 0)
          ),
        0
      )
      .toFixed(2)}
  </td>

  {/* EMPTY PAYMENT METHOD */}
  <td className="p-3"></td>

</tr>

      </tbody>
    </table>

           </div>
       </div>
           
       </div>
          

    </div>
 
 </div>
    )
};
export default SupplierModel;