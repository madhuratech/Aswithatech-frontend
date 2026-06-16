import React, { useEffect, useState, useRef } from "react";
import { X, Minus, Square, Printer } from "lucide-react";
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

  // Search PO/DN/Bill list
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

  // Search client
  const searchclient = async (value) => {
    try {
      const res = await fetch(`${Api_urls}/clients/search?q=${value}`);
      const data = await res.json();
      setclientlist(data);
    } catch (error) {
      console.error("Error fetching client list:", error);
    }
  };

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
        params.append("clientName", filters.clientName);
      }
      if (type === "dn" && filters.clientName) {
        params.append("clientName", filters.clientName);
      }

      const response = await fetch(`${Api_urls}/report/filters?${params.toString()}`);
      const data = await response.json();
      setReportData(data);
      setViewMode("report");
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  // Download Excel format
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
  };

  const exportToPdf = async () => {
    try {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const opt = {
        margin: [0, 0, 0, 0],
        filename: `${title || "Report"}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0, windowWidth: 794, windowHeight: 1123 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      const worker = html2pdf().set(opt).from(element);
      const pdfBlob = await worker.outputPdf("blob");
      const handle = await window.showSaveFilePicker({
        suggestedName: `${title || "Report"}.pdf`,
        types: [{ description: "PDF Files", accept: { "application/pdf": [".pdf"] } }],
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
    window.print();
  };
  if (!isOpen || isMinimized) return null;

  // Compute totals for report view
  const totalQty = reportData.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalPrice = reportData.reduce((s, r) => s + (Number(r.price) || 0), 0).toFixed(2);
  const totalDiscount = reportData.reduce((s, r) => s + (Number(r.discount) || 0), 0).toFixed(2);
  const totalSubtotal = reportData.reduce((s, r) => s + (Number(r.subtotal) || 0), 0).toFixed(2);
  const totalSgst = reportData.reduce((s, r) => s + (Number(r.sgst) || 0), 0).toFixed(2);
  const totalCgst = reportData.reduce((s, r) => s + (Number(r.cgst) || 0), 0).toFixed(2);
  const totalIgst = reportData.reduce((s, r) => s + (Number(r.igst) || 0), 0).toFixed(2);
  const totalDelivery = reportData.reduce((s, r) => s + (Number(r.delivery_charge) || 0), 0).toFixed(2);
  const totalGrand = reportData.reduce((s, r) => s + (Number(r.grandTotal) || 0), 0).toFixed(2);

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isMaximized ? "items-stretch" : "items-center justify-center p-4 bg-black/30"} purchase-modal-overlay`}>
      <div className={`bg-[#f0f0f0] border-2 border-white flex flex-col shadow-2xl transition-all duration-200 ${isMaximized ? "w-full h-full border-none" : "w-[98vw] h-[95vh]"} purchase-modal-container`}>

        {/* ── Title Bar ── */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className="bg-gradient-to-r from-[#0050a0] to-[#0078d7] text-white px-2 py-1 flex justify-between items-center cursor-default select-none"
        >
          <span className="text-xs font-bold tracking-wide">{title}</span>
          <div className="flex shrink-0">
            <button onClick={onMinimize} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title="Minimize">
              <Minus size={12} strokeWidth={3} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-5 hover:bg-white/20 flex justify-center items-center" title={isMaximized ? "Restore Down" : "Maximize"}>
              <Square size={10} strokeWidth={3} />
            </button>
            <button onClick={onClose} className="w-8 h-5 hover:bg-red-500 flex justify-center items-center ml-0.5">
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-black px-4 py-2 flex flex-wrap items-end gap-4">

          {/* FROM DATE */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">FROM DATE</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>

          {/* TO DATE */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-white tracking-widest">TO DATE</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
          </div>

          {/* PO / DN / BILL NUMBER */}
          <div className="flex flex-col gap-0.5 relative">
            <label className="text-[10px] font-bold text-white tracking-widest">
              {type === "po" ? "PURCHASE ORDER NO" : type === "dn" ? "DEBIT NOTE NO" : "BILL NO"}
            </label>
            <input
              type="text"
              placeholder="e.g. PO-2026-001"
              value={type === "po" ? filters.poNumber : type === "dn" ? filters.dnNumber : filters.billNumber}
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
                if (value) setViewMode("po");
              }}
              className="w-[160px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
            {openpo && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
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
                        setViewMode("po");
                      }}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                    >
                      {type === "po" ? po.po_number : type === "dn" ? po.dn_number : po.bill_no}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-gray-400 text-[11px]">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* CLIENT NAME */}
          <div className="flex flex-col gap-0.5 relative">
            <label className="text-[10px] font-bold text-white tracking-widest">CLIENT NAME</label>
            <input
              type="text"
              value={filters.clientName}
              onFocus={() => setclientopen(true)}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ ...filters, clientName: value });
                searchclient(value);
              }}
              placeholder="Client Name"
              className="w-[180px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
            />
            {clientopen && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-[10000] max-h-40 overflow-y-auto mt-1">
                {clientlist.length > 0 ? (
                  clientlist.map((client, index) => (
                    <div
                      key={index}
                      onClick={() => { setFilters({ ...filters, clientName: client.customer_name || client.supplier_name }); setclientopen(false); }}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 text-[11px]"
                    >
                      {client.customer_name || client.supplier_name}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-gray-400 text-[11px]">No clients found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-auto items-end">
            {type !== "billwise" && (
              <button
                onClick={gentratereport}
                className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
                style={{ height: "26px" }}
              >
                GENERATE REPORT
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-[3px] text-[11px] font-bold bg-white text-black border border-gray-400 hover:bg-gray-100 active:bg-gray-200 tracking-wide"
              style={{ height: "26px" }}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* ── Report Area ── */}
        <div className="flex-1 overflow-auto bg-[#f4f4f4] custom-scrollbar">

          {/* Action Strip */}
          <div className="flex gap-1.5 px-3 py-2 bg-[#ececec] border-b border-gray-300 no-print">
            <button
              onClick={downloadExcel}
              className="bg-green-600 text-white text-[10px] px-3 py-1 font-bold border border-green-700 hover:bg-green-700 active:bg-green-800"
              style={{ letterSpacing: "0.5px" }}
            >
              MAIN REPORT
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#1a5ea8] text-white text-[10px] px-3 py-1 font-bold border border-[#154c8a] hover:bg-[#154c8a] flex items-center gap-1"
            >
              <Printer size={10} /> PRINT
            </button>
            <button
              onClick={exportToPdf}
              className="bg-[#b22222] text-white text-[10px] px-3 py-1 font-bold border border-[#8b1a1a] hover:bg-[#8b1a1a]"
            >
              EXPORT PDF
            </button>
          </div>

          {/* Report Canvas */}
          <div className="print-area bg-white mx-2 my-2 border border-gray-300"
            ref={contentRef}
          >

            {/* Report View — tabular data */}
            {viewMode === "report" && type !== "billwise" && (
              <div>
                {/* Report heading */}
                <div className="border-b border-gray-300 px-4 py-2 bg-white">
                  <div className="text-[13px] font-bold text-black tracking-wide uppercase">
                    {type === "po" ? "Purchase Order Report" : "Debit Note Report"}
                  </div>
                  <div className="flex gap-8 mt-1 text-[10px] text-gray-700 font-semibold">
                    <span>FROM : <span className="text-black">{filters.fromDate || "—"}</span></span>
                    <span>TO : <span className="text-black">{filters.toDate || "—"}</span></span>
                    <span>CUSTOMER : <span className="text-black uppercase">{filters.clientName || "ALL CUSTOMERS"}</span></span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse table-auto min-w-full" style={{ fontSize: "13px", fontFamily: "Arial, sans-serif" }}>
                    <thead>
                      <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                        {[
                          ["SNO", "center", "36px"],
                          [type === "po" ? "PO NUMBER" : "DN NUMBER", "left", "130px"],
                          ["DATE", "center", "90px"],
                          ["CLIENT NAME", "left", "220px"],
                          ["PURCHASE ITEM", "left", "200px"],
                          ["QUANTITY", "right", "80px"],
                          ["PRICE", "right", "80px"],
                          ...(type === "dn" ? [["DISCOUNT", "right", "80px"]] : []),
                          ["SUBTOTAL", "right", "90px"],
                          ["SGST", "right", "70px"],
                          ["CGST", "right", "70px"],
                          ...(type === "dn" ? [["IGST", "right", "70px"]] : []),
                          ...(type === "dn" ? [["DELIVERY CHARGE", "right", "90px"]] : []),
                          ["GRAND TOTAL", "right", "100px"],
                        ].map(([label, align, width]) => (
                          <th key={label} style={{
                            border: "1px solid #8ca8c5",
                            padding: "4px 5px",
                            textAlign: align,
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                            width,
                            minWidth: width,
                          }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.length > 0 ? (
                        <>
                          {reportData.map((row, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>
                                {type === "po" ? row.po_number : type === "dn" ? row.dn_number : row.bill_no || "—"}
                              </td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "center", whiteSpace: "nowrap" }}>
                                {type === "po" ? row.po_date : row.dn_date}
                              </td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", color: "#00008b", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }} title={row.client_name}>
                                {row.client_name}
                              </td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px" }}>{row.item_name || "—"}</td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right" }}>{row.quantity ?? 0}</td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.price ?? 0}</td>
                              {type === "dn" && (
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.discount}</td>
                              )}
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.subtotal ?? 0}</td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.sgst ?? 0}</td>
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.cgst ?? 0}</td>
                              {type === "dn" && (
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.igst ?? 0}</td>
                              )}
                              {type === "dn" && (
                                <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.delivery_charge ?? 0}</td>
                              )}
                              <td style={{ border: "1px solid #d0d0d0", padding: "3px 5px", textAlign: "right", color: "#8b0000", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{row.grandTotal ?? 0}</td>
                            </tr>
                          ))}

                          {/* Totals row */}
                          <tr style={{ background: "#d5e3f0", fontWeight: "bold", borderTop: "2px solid #6a90b5" }}>
                            <td colSpan={type === "dn" ? 5 : 5} style={{ border: "1px solid #a0bbd0", padding: "4px 8px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>OVERALL TOTAL</td>
                            <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right" }}>{totalQty}</td>
                            <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalPrice}</td>
                            {type === "dn" && (
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalDiscount}</td>
                            )}
                            <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalSubtotal}</td>
                            <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalSgst}</td>
                            <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalCgst}</td>
                            {type === "dn" && (
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalIgst}</td>
                            )}
                            {type === "dn" && (
                              <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{totalDelivery}</td>
                            )}
                            <td style={{ border: "1px solid #a0bbd0", padding: "4px 5px", textAlign: "right", color: "#8b0000", fontVariantNumeric: "tabular-nums" }}>{totalGrand}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={type === "dn" ? 13 : 11} style={{ textAlign: "center", padding: "24px", color: "#aaa", fontStyle: "italic", border: "1px solid #ddd" }}>
                            No data available. Use filters above and click GENERATE REPORT.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Po / DN / Billwise Format View */}
            {viewMode === "po" && (
              <div style={{ width: "100%", background: "white", padding: "0", boxSizing: "border-box" }}>
                {children}
              </div>
            )}
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div className="bg-white border-t border-gray-400 px-3 py-0.5 text-[10px] font-bold text-gray-600 flex justify-between shadow-[inset_0px_1px_0px_#ffffff]">
          <span className="flex items-center gap-4">
            <span className="border-r border-gray-400 pr-4">Total Page No: 1</span>
            <span>READY</span>
          </span>
          <span>ZOOM: 100%</span>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          #root,
          #root > div,
          main,
          main > div,
          main > div > div,
          body *:has(.print-area),
          .purchase-modal-overlay,
          .purchase-modal-container,
          .custom-scrollbar {
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            float: none !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print,
          .no-print *,
          button,
          select,
          input,
          .bg-black,
          .status-bar,
          header,
          nav,
          .bg-white.border-t {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
          }
          tr, td, th {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WindowModal;
