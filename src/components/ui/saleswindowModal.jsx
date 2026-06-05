import React, { useEffect, useState, useRef } from "react";
import { X, Minus, Square, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";

const WindowModal = ({ title, isOpen, type, onClose, isMinimized, onMinimize, children, onFilterChange, initialViewMode, initialView, filters: externalFilters }) => {
  const navigate = useNavigate();
  const [isMaximized, setIsMaximized] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [poList, setPoList] = useState([]);
  const [openpo, setpodown] = useState(false);
  const [viewMode, setViewMode] = useState("qt");
  const [clientopen, setclientopen] = useState(false);
  const [clientlist, setclientlist] = useState([]);
  const contentRef = useRef(null);


  useEffect(() => {
    if (isOpen) {
      setViewMode(initialViewMode || initialView || "qt");
      setReportData([]);
    }
  }, [isOpen, initialViewMode, initialView]);



  const Api_urls = "http://localhost:3000/api/quotations"


  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    clientName: "",
    QtNumber: externalFilters?.QtNumber || ""
  });


 const qtNumber = externalFilters?.QtNumber || "";

useEffect(() => {

  if (!qtNumber) return;

  setFilters((prev) => {

    if (prev.QtNumber === qtNumber) {
      return prev;
    }

    return {
      ...prev,
      QtNumber: qtNumber,
    };

  });

}, [qtNumber]);



  //  Search PO
  useEffect(() => {
    const searchurl = (type === "qt" || type === "Quotation Format")
      ? `${Api_urls}/QT/search?q=`
      : (type === "Invoice Format")
      ? `http://localhost:3000/api/salesinvoices/INV/search?q=`
      : (type === "DC Format")
      ? `http://localhost:3000/api/salesdc/DC/search?q=`
      : null;

    if (searchurl) {
      fetch(searchurl)
        .then(res => res.json())
        .then(data => setPoList(data))
        .catch(err => console.error(err));
    } else {
      setPoList([]);
    }
  }, [type, Api_urls, isOpen]);


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
      const params = new URLSearchParams();
      if (filters.fromDate && filters.toDate) {
        params.append("fromDate", filters.fromDate);
        params.append("toDate", filters.toDate);
      }

      if ((type === "qt" || type === "Quotation Format") && filters.QtNumber) {
        params.append("quotationNo", filters.QtNumber);
      }

      if ((type === "Invoice Format") && filters.QtNumber) {
        params.append("invoiceNo", filters.QtNumber);
      }

      if ((type === "DC Format") && filters.QtNumber) {
        params.append("dcNo", filters.QtNumber);
      }

      if ((type === "qt" || type === "Quotation Format" || type === "Invoice Format" || type === "DC Format") && filters.clientName) {
        params.append("clientName", filters.clientName);
      }

      const url = (type === "Invoice Format")
        ? `http://localhost:3000/api/salesinvoices/report/filters?${params.toString()}`
        : (type === "DC Format")
        ? `http://localhost:3000/api/salesdc/report/filters?${params.toString()}`
        : `${Api_urls}/report/filters?${params.toString()}`;
      const response = await fetch(url);

      const data = await response.json();

      console.log("REPORT DATA:", data);

      setReportData(data);

      setViewMode("report");

    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const downloadExcel = () => {
    const params = new URLSearchParams();

    if (filters.fromDate && filters.toDate) {
      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);
    }

    if ((type === "qt" || type === "Quotation Format") && filters.QtNumber) {
      params.append("quotationNo", filters.QtNumber);
    }
    if ((type === "Invoice Format") && filters.QtNumber) {
        params.append("invoiceNo", filters.QtNumber);
    }
    if ((type === "DC Format") && filters.QtNumber) {
        params.append("dcNo", filters.QtNumber);
    }
    const url = (type === "Invoice Format")
        ? `http://localhost:3000/api/salesinvoices/report/excel?${params.toString()}`
        : (type === "DC Format")
        ? `http://localhost:3000/api/salesdc/report/excel?${params.toString()}`
        : `${Api_urls}/report/excel?${params.toString()}`;
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
          *{box-sizing:border-box;}
          body{margin:0;padding:0;background:white;}
          @page{size:A4;margin:8mm 10mm;}
          .print-container{
            width:190mm;
            margin:0 auto;
            background:white;
            padding:0;
          }
          /* Remove outer wrapper padding added by the format component */
          .print-container > div > div:first-child{
            padding-top:0 !important;
            padding-bottom:0 !important;
          }
          /* Ensure overflow is visible so content isn't clipped */
          *{overflow:visible !important;}
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #d1d5db;padding:6px 8px;word-break:break-word;}
          tr{page-break-inside:avoid;}
          .no-print{display:none !important;}
          /* Hide the outer py-6 wrapper's padding */
          [class*="py-6"]{padding-top:0 !important;padding-bottom:0 !important;}
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



  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".qt-dropdown")) {
        setpodown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!isOpen || isMinimized) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex",
        alignItems: isMaximized ? "stretch" : "center",
        justifyContent: isMaximized ? "stretch" : "center",
        background: isMaximized ? "transparent" : "rgba(0,0,0,0.45)",
        padding: isMaximized ? 0 : "0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          border: "2px solid #888",
          width: isMaximized ? "100%" : "calc(100vw - 40px)",
          maxWidth: isMaximized ? "100%" : "1500px",
          height: isMaximized ? "100%" : "90vh",
          background: "#f0f0f0",
          pointerEvents: "auto",
        }}
      >

        {/* ── TITLE BAR ── */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          style={{
            background: "linear-gradient(to right, #0050a0, #1478d4)",
            color: "white",
            padding: "3px 6px 3px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "default",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: "bold" }}>{title}</span>
          <div style={{ display: "flex" }}>
            <button
              onClick={onMinimize}
              title="Minimize"
              style={{
                width: 28, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Minus size={12} strokeWidth={3} />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore Down" : "Maximize"}
              style={{
                width: 28, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Square size={10} strokeWidth={3} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 22, background: "transparent", border: "none",
                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2,
              }}
              onMouseOver={e => e.currentTarget.style.background = "#e81123"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div
          style={{
            background: "#000",
            padding: "8px 16px 10px 16px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {/* Left: filter fields */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>

            {/* FROM DATE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                FROM DATE
              </label>
              <input
                type="date"
                value={filters?.fromDate || ""}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
            </div>

            {/* TO DATE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                TO DATE
              </label>
              <input
                type="date"
                value={filters?.toDate || ""}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                style={{
                  width: 130, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
            </div>

            {/* QT / INVOICE / DC NUMBER */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }} className="qt-dropdown">
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                {type === "qt" || type === "Quotation Format"
                  ? "QUOTATION NO"
                  : type === "Invoice Format"
                  ? "INVOICE NO"
                  : type === "dn"
                  ? "DEBIT NOTE NO"
                  : "BILL NO"}
              </label>
              <input
                type="text"
                placeholder="e.g. AT-QT-001"
                value={filters.QtNumber}
                onFocus={() => setpodown(true)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({ ...filters, QtNumber: value });
                  if (value) setViewMode("qt");
                }}
                style={{
                  width: 150, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
              {openpo && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, minWidth: "100%",
                    background: "white", border: "1px solid #ccc", zIndex: 9999,
                    maxHeight: 200, overflowY: "auto", boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {poList.length > 0 ? (
                    poList.map((po) => (
                      <div
                        key={po.dc_no || po.invoice_no || po.quotation_no}
                        onClick={(e) => {
                          e.stopPropagation();
                          const selectedQt = type === "Invoice Format" ? po.invoice_no : type === "DC Format" ? po.dc_no : po.quotation_no;
                          setFilters((prev) => ({ ...prev, QtNumber: selectedQt }));
                          if (onFilterChange) onFilterChange({ ...filters, fromDate: filters.fromDate, toDate: filters.toDate, clientName: filters.clientName, QtNumber: selectedQt });
                          setReportData([]);
                          setViewMode("qt");
                          setpodown(false);
                        }}
                        style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                        onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                        onMouseOut={e => e.currentTarget.style.background = "white"}
                      >
                        {po.dc_no || po.invoice_no || po.quotation_no}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "8px 10px", color: "#999", fontSize: "12px" }}>No PO found</div>
                  )}
                </div>
              )}
            </div>

            {/* CLIENT NAME */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
              <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                CLIENT NAME
              </label>
              <input
                type="text"
                value={filters?.clientName || ""}
                onFocus={() => setclientopen(true)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({ ...filters, clientName: value });
                  searchclient(value);
                }}
                placeholder="Client Name"
                style={{
                  width: 160, padding: "4px 6px", border: "1px solid #aaa",
                  background: "white", color: "#000", fontSize: "12px", outline: "none",
                }}
              />
              {clientopen && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, minWidth: "100%",
                    background: "white", border: "1px solid #ccc", zIndex: 9999,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {clientlist.length > 0 ? (
                    clientlist.map((client, index) => (
                      <div
                        key={index}
                        onClick={() => { setFilters({ ...filters, clientName: client.customer_name }); setclientopen(false); }}
                        style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                        onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                        onMouseOut={e => e.currentTarget.style.background = "white"}
                      >
                        {client.customer_name}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "8px 10px", color: "#999", fontSize: "12px" }}>No clients found</div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right: action buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            {type !== "billwise" && (
              <button
                onClick={gentratereport}
                style={{
                  background: "#f0f0f0", color: "#000", border: "1px solid #888",
                  padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                  cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                  letterSpacing: "0.3px",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#fff"}
                onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
              >
                GENERATE REPORT
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                letterSpacing: "0.3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#fff"}
              onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div
          className="custom-scrollbar"
          style={{ flex: 1, overflowY: "auto", background: "#f0f0f0", padding: "12px 14px" }}
        >

          {/* Action buttons row */}
          <div className="no-print" style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            <button
              onClick={downloadExcel}
              style={{
                background: "#28a745", color: "#fff", border: "1px solid #1e7e34",
                padding: "6px 14px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", borderRadius: "3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#218838"}
              onMouseOut={e => e.currentTarget.style.background = "#28a745"}
            >
              MAIN REPORT
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: "#0069d9", color: "#fff", border: "1px solid #0062cc",
                padding: "6px 14px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", gap: "5px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#0056b3"}
              onMouseOut={e => e.currentTarget.style.background = "#0069d9"}
            >
              <Printer size={13} /> PRINT
            </button>
            <button
              onClick={exportToPdf}
              style={{
                background: "#dc3545", color: "#fff", border: "1px solid #c82333",
                padding: "6px 14px", fontSize: "12px", fontWeight: "bold",
                cursor: "pointer", borderRadius: "3px",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#c82333"}
              onMouseOut={e => e.currentTarget.style.background = "#dc3545"}
            >
              EXPORT PDF
            </button>
          </div>

          {/* Printable / report area */}
          <div ref={contentRef} style={{ width: "100%" }}>

            {/* ── REPORT VIEW ── */}
            {viewMode === "report" && type !== "billwise" && (
              <div
                style={{
                  background: "white",
                  border: "1px solid #bbb",
                  padding: "16px 18px 20px 18px",
                  minHeight: "297mm",
                }}
              >
                {/* Report heading */}
                <div style={{ marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>
                    {title ? title.toUpperCase() : "REPORT"}
                  </h2>
                  <div style={{ fontSize: "12px", color: "#333", display: "flex", gap: "18px" }}>
                    <span>FROM : <strong>{filters.fromDate || "—"}</strong></span>
                    <span>TO : <strong>{filters.toDate || "—"}</strong></span>
                    <span>CLIENT : <strong>{filters.clientName || "ALL CLIENTS"}</strong></span>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%", borderCollapse: "collapse",
                      fontSize: "12px", tableLayout: "auto",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#b8cce4" }}>
                        {[
                          { label: "SNO",           align: "left"  },
                          { label: "QUOTATION NO",  align: "left"  },
                          { label: "DATE",          align: "left"  },
                          { label: "CLIENT NAME",   align: "left"  },
                          { label: "PURCHASE ITEM", align: "left"  },
                          { label: "QUANTITY",      align: "right" },
                          { label: "PRICE",         align: "right" },
                          { label: "SUBTOTAL",      align: "right" },
                          { label: "SGST",          align: "right" },
                          { label: "CGST",          align: "right" },
                          { label: "IGST",          align: "right" },
                          { label: "GRANDTOTAL",    align: "right" },
                        ].map(({ label, align }) => (
                          <th
                            key={label}
                            style={{
                              border: "1px solid #9baec8", padding: "7px 10px",
                              textAlign: align, fontWeight: "bold", color: "#000",
                              whiteSpace: "nowrap", fontSize: "12px",
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {reportData.length > 0 ? (
                        reportData.map((row, i) => (
                          <tr
                            key={i}
                            style={{ background: i % 2 === 0 ? "#fff" : "#dce6f1" }}
                          >
                            <td style={tdStyle("left")}>{i + 1}</td>
                            <td style={{ ...tdStyle("left"), color: "#1a3f7a", fontWeight: "bold" }}>
                              {row.quotation_no || "-"}
                            </td>
                            <td style={tdStyle("left")}>{row.quotation_date}</td>
                            <td style={{ ...tdStyle("left"), color: "#1a3f7a", fontWeight: "bold" }}>
                              {row.customer_name}
                            </td>
                            <td style={tdStyle("left")}>{row.item_name || "-"}</td>
                            <td style={tdStyle("right")}>{row.quantity ?? 0}</td>
                            <td style={tdStyle("right")}>{row.price ?? 0}</td>
                            <td style={tdStyle("right")}>{row.subtotal ?? 0}</td>
                            <td style={tdStyle("right")}>{row.sgst ?? 0}</td>
                            <td style={tdStyle("right")}>{row.cgst ?? 0}</td>
                            <td style={tdStyle("right")}>{row.igst || "-"}</td>
                            <td style={{ ...tdStyle("right"), color: "#1a3f7a", fontWeight: "bold" }}>
                              {row.grandTotal ?? 0}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="12"
                            style={{ textAlign: "center", padding: "24px", color: "#888", fontSize: "13px" }}
                          >
                            No Data Available
                          </td>
                        </tr>
                      )}

                      {/* Total row */}
                      {reportData.length > 0 && (
                        <tr style={{ background: "#b8cce4", fontWeight: "bold" }}>
                          <td colSpan="5" style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                            TOTAL
                          </td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                            {reportData.reduce((s, r) => s + (Number(r.quantity) || 0), 0)}
                          </td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px" }}></td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                            {reportData.reduce((s, r) => s + (Number(r.subtotal) || 0), 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                            {reportData.reduce((s, r) => s + (Number(r.sgst) || 0), 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                            {reportData.reduce((s, r) => s + (Number(r.cgst) || 0), 0).toFixed(2)}
                          </td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px" }}></td>
                          <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                            {reportData.reduce((s, r) => s + (Number(r.grandTotal) || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── QT / DOCUMENT VIEW ── */}
            {viewMode === "qt" && (
              <div
                className="printable-area"
                style={{
                  width: "190mm", minHeight: "270mm",
                  boxSizing: "border-box", background: "white",
                }}
              >
                {children}
              </div>
            )}

          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <div
          style={{
            background: "#f0f0f0",
            borderTop: "1px solid #aaa",
            padding: "2px 12px",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#555",
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ borderRight: "1px solid #aaa", paddingRight: "16px" }}>Total Page No: 1</span>
            <span>READY</span>
          </span>
          <span>ZOOM: 100%</span>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #d1d5db; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #9ca3af; }
        .printable-area { width: 100% !important; max-width: 100% !important; }
        @media print {
          body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .printable-area { width: 100% !important; overflow: visible !important; }
          tr { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};

// Shared cell style helper (UI only)
const tdStyle = (align = "left") => ({
  border: "1px solid #ccc",
  padding: "5px 10px",
  textAlign: align,
  fontSize: "12px",
  whiteSpace: "nowrap",
});

export default WindowModal;
