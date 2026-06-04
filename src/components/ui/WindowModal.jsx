import React, { useEffect, useState, useRef } from "react";
import { X, Minus, Square } from "lucide-react";
import html2pdf from "html2pdf.js";

const WindowModal = ({ title, isOpen, type, onClose, isMinimized, onMinimize, children, onFilterChange, initialViewMode }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [poList, setPoList] = useState([]);
  const [openpo, setpodown] = useState(null);
  const [viewMode, setViewMode] = useState(initialViewMode || "po");
  const [clientopen, setclientopen] = useState(false);
  const [clientlist, setclientlist] = useState([]);
  const contentRef = useRef(null);


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


  const [filters, setFilters] = useState({
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
  const searchclient = async (value) => {
    try {
      const res = await fetch(`${Api_urls}/clients/search?q=${value}`);
      const data = await res.json();
      setclientlist(data);
    } catch (error) {
      console.error("Error fetching client list:", error);
    }
  }




  const gentratereport = async () => {
    try {

      if (type === "billwise") {
        return;
      }

      const params = new URLSearchParams();

      if (filters.fromDate && filters.toDate) {
        params.append("fromDate", filters.fromDate);
        params.append("toDate", filters.toDate);
      }

      if (type === "po" && filters.poNumber) {
        params.append("poNumber", filters.poNumber);
      }

      if (type === "dn" && filters.dnNumber) {
        params.append("dnNumber", filters.dnNumber);
      }

      if (type === "po" && filters.clientName) {
        params.append("clientName", filters.clientName)
      }
      if (type === "dn" && filters.clientName) {
        params.append("clientName", filters.clientName)
      }
      const response = await fetch(`${Api_urls}/report/filters?${params.toString()}`);
      const data = await response.json();
      setReportData(data);
      setViewMode("report");

    } catch (error) {
      console.error("Error generating report:", error);
    }
  }


  //  Download Excel format

  const downloadExcel = () => {
    const params = new URLSearchParams();

    if (filters.fromDate && filters.toDate) {
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

  const exportToPdf = async () => {

    try {

      if (!contentRef.current) return;

      const element = contentRef.current;

      const opt = {

        margin: [0, 0, 0, 0],

        filename: `${title || "Report"}.pdf`,

        image: {
          type: "jpeg",
          quality: 1,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 794,
          windowHeight: 1123,
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },

        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
        },
      };

      const worker = html2pdf()
        .set(opt)
        .from(element);

      const pdfBlob = await worker.outputPdf("blob");

      const handle = await window.showSaveFilePicker({
        suggestedName: `${title || "Report"}.pdf`,
        types: [
          {
            description: "PDF Files",
            accept: {
              "application/pdf": [".pdf"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();

      await writable.write(pdfBlob);

      await writable.close();

    } catch (error) {

      if (error.name !== "AbortError") {
        console.error("PDF Save Error:", error);
      }

    }
  };

  const handlePrint = () => {

    const printContents = contentRef.current;

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <html>
      <head>
        <title>${title || "Report"}</title>

        <script src="https://cdn.tailwindcss.com"></script>

        <style>
          body{
            margin:0;
            padding:0;
            background:white;
          }

          @page{
            size:A4;
            margin:0;
          }

          .print-container{
            width:210mm;
            min-height:297mm;
            margin:0 auto;
            background:white;
            padding:0 !important;
          }

          table{
            width:100%;
            border-collapse:collapse;
          }

          th,td{
            border:1px solid #d1d5db;
            padding:8px;
          }

          tr{
            page-break-inside:avoid;
          }

          .no-print{
            display:none !important;
          }
        </style>
      </head>

      <body>
        <div class="print-container">
          ${printContents.outerHTML}
        </div>
      </body>
    </html>
  `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);
  };

  if (!isOpen || isMinimized) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-6 bg-black/30 transition-colors"}`}>

      <div
        className={`bg-gray border-2 border-white flex flex-col shadow-2xl transition-all duration-200 pointer-events-auto
       ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"}`}
      >

        {/* TITLE BAR */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold tracking-wide">{title}</span>

          <div className="flex shrink-0">

            {/* MINIMIZE */}
            <button
              onClick={onMinimize}
              className="w-7 h-5 hover:bg-white/20 flex justify-center items-center"
              title="Minimize"
            >
              <Minus size={12} strokeWidth={3} />
            </button>

            {/* MAXIMIZE / RESTORE */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-7 h-5 hover:bg-white/20 flex justify-center items-center"
              title={isMaximized ? "Restore Down" : "Maximize"}
            >
              <Square size={10} strokeWidth={3} />
            </button>

            {/* CLOSE */}
            <button
              onClick={onClose}
              className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5"
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
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
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
                    setViewMode("po");
                  }
                }}
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
                value={filters?.clientName || ""}
                onFocus={() => setclientopen(true)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({ ...filters, clientName: value });
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
                )}
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
        <div className="flex-1 bg-white p-3 w-full overflow-y-auto">
          <div className="flex gap-3 no-print">
            <button onClick={downloadExcel} className=" bg-green-400 text-white border border-green-400 px-2 py-1.5 rounded-[3px]">Main Report</button>
            <button onClick={handlePrint} className=" bg-blue-500 text-white border border-blue-500 px-4 py-1.5 rounded-[3px] shadow">Print</button>
            <button onClick={exportToPdf} className=" bg-red-500 text-white border border-red-500 px-4 py-1.5 rounded-[3px] shadow">Export PDF</button>
          </div>
          <div ref={contentRef} className="printable-area bg-white w-full">

            {/*Report View  */}
            {/*table*/}

            {viewMode === "report" && type !== "billwise" && (
              <div
                className="w-full mt-2 text-[12px] text-black"
                style={{
                  width: "100%",
                  minHeight: "100%",
                  padding: "10px",
                  boxSizing: "border-box"
                }}
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
                  <table className="min-w-[1800px] w-full mt-4 border border-gray-300 border-collapse bg-white">
                    <thead>
                      <tr className="border-b border-gray-400 font-bold text-[13px]">

                        <th className="text-left p-2 ">SNO</th>
                        <th className="text-left p-2">
                          {type === "po" ? "PO NUMBER" : type === "dn" ? "DN NUMBER" : "BILL NUMBER"}
                        </th>
                        <th className="text-left p-2 ">DATE</th>
                        <th className="text-left p-2  ">CLIENT NAME</th>
                        <th className="text-left p-2 ">PURCHASE ITEM</th>
                        <th className="text-left p-2  ">QUANTITY</th>
                        <th className="text-left p-2  pl-5">PRICE</th>
                        {type === "dn" && (
                          <th className="text-left p-2  pl-3">DISCOUNT</th>
                        )}
                        <th className="text-left p-2 ">SUBTOTAL</th>
                        <th className="text-left p-2 ">SGST</th>
                        <th className="text-left p-2 ">CGST</th>
                        {type === "dn" && (
                          <th className="text-left p-2 ">IGST</th>
                        )}
                        <th className="text-left p-2">GRANDTOTAL</th>

                      </tr>
                    </thead>

                    <tbody className="font-semibold text-[14px] text-gray-600">

                      {/* DATA ROWS */}
                      {reportData.length > 0 ? (
                        reportData.map((row, i) => (
                          <tr key={i} className="border-b ">

                            <td className="p-2 text-left">{i + 1}</td>

                            <td className="p-2 text-left ">
                              {type === "po" ? row.po_number : type === "dn" ? row.dn_number : row.bill_no || "-"}
                            </td>

                            <td className="p-2 text-left">
                              {type === "po" ? row.po_date : row.dn_date}
                            </td>

                            <td className="p-2 text-left " title={row.client_name}>
                              {row.client_name}
                            </td>

                            <td className="p-2 text-left ">
                              {row.item_name || "-"}
                            </td>

                            <td className="p-2 text-left ">
                              {row.quantity ?? 0}
                            </td>

                            <td className="p-2 text-left">
                              {row.price ?? 0}
                            </td>

                            {type === "dn" && (
                              <td className="p-2 text-left">
                                {row.discount}
                              </td>
                            )}

                            <td className="p-2 pl-8 text-left">
                              {row.subtotal ?? 0}
                            </td>


                            <td className="p-2 pl-8 text-left">
                              {row.sgst ?? 0}
                            </td>

                            <td className="p-2 pl-8 text-left">
                              {row.cgst ?? 0}

                            </td>
                            {type === "dn" && (
                              <td className="p-2 pl-8 text-left">
                                {row.igst ?? 0}
                              </td>
                            )}

                            <td className="p-2 pl-8 text-left text-blue-500">
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

                      <tr className="bg-gray-100 font-bold text-black">

                        <td
                          colSpan={type === "dn" ? 5 : 5}
                          className="p-3 text-right"
                        >
                          OVERALL TOTAL
                        </td>

                        <td className="p-3 text-left">
                          {reportData.reduce(
                            (sum, row) => sum + (Number(row.quantity) || 0),
                            0
                          )}
                        </td>

                        <td className="p-3 text-left">
                          {reportData
                            .reduce((sum, row) => sum + (Number(row.price) || 0), 0)
                            .toFixed(2)}
                        </td>

                        {type === "dn" && (
                          <td className="p-3 text-left">
                            {reportData
                              .reduce((sum, row) => sum + (Number(row.discount) || 0), 0)
                              .toFixed(2)}
                          </td>
                        )}

                        <td className="p-3 text-left">
                          {reportData
                            .reduce((sum, row) => sum + (Number(row.subtotal) || 0), 0)
                            .toFixed(2)}
                        </td>

                        <td className="p-3 text-left">
                          {reportData
                            .reduce((sum, row) => sum + (Number(row.sgst) || 0), 0)
                            .toFixed(2)}
                        </td>

                        <td className="p-3 text-left">
                          {reportData
                            .reduce((sum, row) => sum + (Number(row.cgst) || 0), 0)
                            .toFixed(2)}
                        </td>

                        {type === "dn" && (
                          <td className="p-3 text-left">
                            {reportData
                              .reduce((sum, row) => sum + (Number(row.igst) || 0), 0)
                              .toFixed(2)}
                          </td>
                        )}

                        <td className="p-3 text-left text-blue-600">
                          {reportData
                            .reduce((sum, row) => sum + (Number(row.grandTotal) || 0), 0)
                            .toFixed(2)}
                        </td>

                      </tr>


                    </tbody>
                  </table>
                </div>

              </div>

            )}

            {/* Po View */}
            {viewMode === "po" && (<div ref={contentRef} className="printable-area bg-white mx-auto "
              style={{
                width: "190mm", minHeight: "270mm", padding: "0", overflow: "hidden", boxSizing: "border-box",
                background: "white"
              }}>
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
  width: 10px;
  height: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #d1d5db;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #9ca3af;
}

.printable-area{
  width:100% !important;
  max-width:100% !important;
}

table{
  width:100% !important;
  border-collapse:collapse !important;
  table-layout:fixed !important;
}

th,
td{
  border:1px solid #cbd5e1;
  padding:10px;
  word-break:break-word;
  white-space:normal !important;
}

@media print {

  body{
    margin:0 !important;
    padding:0 !important;
  }

  .no-print{
    display:none !important;
  }

  .printable-area{
    width:100% !important;
    overflow:visible !important;
  }

  table{
    width:100% !important;
  }

  tr{
    page-break-inside:avoid !important;
  }
}
`}</style>
    </div>
  );
};

export default WindowModal;
