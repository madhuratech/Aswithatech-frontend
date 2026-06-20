import React, { useEffect, useState, useRef } from "react";
import { X, Minus, Square, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";
import JobDeliveryChallan from "../pages/Services/jobDcFormat";
import StandbyDeliveryChallan from "../pages/Services/standbyDcFormat";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const ServiceWindowModal = ({ title, isOpen, type, onClose, isMinimized, onMinimize, children, onFilterChange, initialViewMode, initialView, filters: externalFilters }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [dcList, setDcList] = useState([]);
    const [opendown, setopendown] = useState(false);
    const [viewMode, setViewMode] = useState(initialViewMode || initialView || "dc");
    const [clientopen, setclientopen] = useState(false);
    const [clientlist, setclientlist] = useState([]);
    const [docType, setDocType] = useState("Job DC");
    const contentRef = useRef(null);
    const dcDropdownRef = useRef(null);
    const clientDropdownRef = useRef(null);
    const modalContainerRef = useRef(null);

    useOutsideClick([
      { ref: dcDropdownRef, onClose: () => setopendown(false) },
      { ref: clientDropdownRef, onClose: () => setclientopen(false) },
      { ref: modalContainerRef, onClose: () => { if (!isMaximized) onClose(); } }
    ]);

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);
    

    useEffect(() => {
        if (isOpen) {
            setViewMode(initialViewMode || initialView || "dc");
            setReportData([]);
        }
    }, [isOpen, initialViewMode, initialView]);

    const Api_urls = type === "Inward Report"
        ? "http://localhost:3000/api/Inwardentries"
        : type === "DC Format View"
            ? docType === "Job DC"
                ? "http://localhost:3000/api/jobdcentry"
                : docType === "Job Return DC"
                    ? "http://localhost:3000/api/jobreturndc"
                    : docType === "Standby DC"
                        ? "http://localhost:3000/api/standbydcentry"
                        : docType === "Standby Return DC"
                            ? "http://localhost:3000/api/standbyreturndc"
                            : "http://localhost:3000/api/jobdcentry"
            : type === "Standby DC Format"
                ? "http://localhost:3000/api/standbydcentry"
                : type === "Job DC Format"
                    ? "http://localhost:3000/api/jobdcentry"
                    : type === "Job Return DC Format"
                        ? "http://localhost:3000/api/jobreturndc"
                        : type === "Standby Return DC Format"
                            ? "http://localhost:3000/api/standbyreturndc"
                            : "http://localhost:3000/api/servicedcentry";

    const [filters, setFilters] = useState({
        fromDate: "",
        toDate: "",
        clientName: "",
        dcNumber: externalFilters?.dcNumber || ""
    });

    // Today date

    useEffect(() => {
        setFilters(prev => ({ ...prev, toDate: new Date().toISOString().split("T")[0] }));
    }, []);



    useEffect(() => {
        const fetchDCs = async () => {
            if (externalFilters?.dcNumber) {
                setFilters(prev => ({ ...prev, dcNumber: externalFilters.dcNumber }));
            }

            try {
                let searchurl = null;
                if (type === "DC Format" || type === "Standby DC Format" || type === "Job DC Format" || type === "Job Return DC Format" || type === "Standby Return DC Format" || type === "DC Format View") {
                    searchurl = `${Api_urls}/DC/search?q=`;
                } else if (type === "dc" || type === "Inward Report") {
                    searchurl = `${Api_urls}/IE/search?q=`;
                } else if (type === "Invoice Format") {
                    searchurl = `http://localhost:3000/api/serviceinvoice/search-invoice?q=`;
                }

                if (!searchurl) return;

                const res = await fetch(searchurl);
                const data = await res.json();

                const uniqueDCs = [
                    ...new Map(
                        data.map((item) => [
                            item.dc_number || item.inward_dc_no || item.invoice_no,
                            item,
                        ])
                    ).values()
                ];

                setDcList(uniqueDCs);

                if (uniqueDCs.length > 0) {
                    setFilters(prev => {
                        if (prev.dcNumber && type !== "DC Format View") return prev;
                        const latestDC = uniqueDCs[0]?.dc_number || uniqueDCs[0]?.inward_dc_no || uniqueDCs[0]?.invoice_no || "";
                        const updated = { ...prev, dcNumber: latestDC };
                        onFilterChange?.(updated);
                        return updated;
                    });
                } else {
                    setFilters(prev => {
                        const updated = { ...prev, dcNumber: "" };
                        onFilterChange?.(updated);
                        return updated;
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (isOpen) {
            fetchDCs();
        }
    }, [isOpen, type, onFilterChange, externalFilters?.dcNumber, Api_urls]);

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
            if (filters.dcNumber) params.append("dcNumber", filters.dcNumber);
            if (filters.clientName) params.append("clientName", filters.clientName);

            const res = await fetch(`${Api_urls}/report/filters?${params.toString()}`);
            const data = await res.json();
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
        if (filters.dcNumber) params.append("dcNumber", filters.dcNumber);
        if (filters.clientName) params.append("clientName", filters.clientName);

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
                html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["avoid-all", "legacy"] },
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
            if (error.name !== "AbortError") console.error("PDF Save Error:", error);
        }
    };



    const handlePrint = () => {
        window.print();
    };

    if (!isOpen || isMinimized) return null;

    return (
        <div
            className="service-modal-overlay"
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex",
                alignItems: isMaximized ? "stretch" : "center",
                justifyContent: isMaximized ? "stretch" : "center",
                background: isMaximized ? "transparent" : "rgba(0,0,0,0.45)",
            }}
        >
            <div
                ref={modalContainerRef}
                className="service-modal-container"
                style={{
                    display: "flex", flexDirection: "column",
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
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        cursor: "default", userSelect: "none", flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>{title}</span>
                    <div style={{ display: "flex" }}>
                        <button
                            onClick={onMinimize}
                            title="Minimize"
                            style={{ width: 28, height: 22, background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                            onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                            <Minus size={12} strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            title={isMaximized ? "Restore Down" : "Maximize"}
                            style={{ width: 28, height: 22, background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                            onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                            <Square size={10} strokeWidth={3} />
                        </button>
                        <button
                            onClick={onClose}
                            style={{ width: 32, height: 22, background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2 }}
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
                        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                        flexShrink: 0, flexWrap: "wrap", gap: "8px",
                    }}
                >
                    {/* Left: filter fields */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>

                        {/* DOCUMENT TYPE */}
                        {type === "DC Format View" && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                                    DOCUMENT TYPE
                                </label>
                                <select
                                    value={docType}
                                    onChange={(e) => {
                                        const nextDocType = e.target.value;
                                        setDocType(nextDocType);
                                        setFilters(prev => ({ ...prev, dcNumber: "" }));
                                    }}
                                    style={{ width: 180, padding: "4px 6px", border: "1px solid #aaa", background: "white", color: "#000", fontSize: "12px", outline: "none" }}
                                >
                                    <option value="Job DC">Job DC</option>
                                    <option value="Standby DC">Standby DC</option>
                                   
                                </select>
                            </div>
                        )}

                        {/* FROM DATE */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                                FROM DATE
                            </label>
                            <input
                                type="date"
                                value={filters?.fromDate || ""}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                style={{ width: 130, padding: "4px 6px", border: "1px solid #aaa", background: "white", color: "#000", fontSize: "12px", outline: "none" }}
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
                                style={{ width: 130, padding: "4px 6px", border: "1px solid #aaa", background: "white", color: "#000", fontSize: "12px", outline: "none" }}
                            />
                        </div>

                        {/* DC / INVOICE NUMBER */}
                        <div style={{ display: "flex", flexDirection: "column", position: "relative" }} className="dc-dropdown" ref={dcDropdownRef}>
                            <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                                {type === "DC Format View"
                                    ? (docType.includes("Return") ? "RETURN DC NO" : "DC NO")
                                    : (type === "dc" || type === "DC Format" || type === "Standby DC Format" || type === "Job DC Format" || type === "Job Return DC Format" || type === "Standby Return DC Format" ? "DC NO" : "INVOICE NO")
                                }
                            </label>
                            <input
                                type="text"
                                placeholder={
                                    type === "DC Format View"
                                        ? "e.g. DC-001"
                                        : (type === "dc" || type === "DC Format" || type === "Standby DC Format" || type === "Job DC Format" || type === "Job Return DC Format" || type === "Standby Return DC Format" ? "e.g. DC-001" : "e.g. INV-001")
                                }
                                value={filters.dcNumber}
                                onFocus={() => setopendown(true)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFilters({ ...filters, dcNumber: value });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (onFilterChange) onFilterChange(filters);
                                        setViewMode("dc");
                                        setopendown(false);
                                    }
                                }}
                                style={{ width: 150, padding: "4px 6px", border: "1px solid #aaa", background: "white", color: "#000", fontSize: "12px", outline: "none" }}
                            />
                            {opendown && (
                                <div
                                    style={{
                                        position: "absolute", top: "100%", left: 0, minWidth: "100%",
                                        background: "white", border: "1px solid #ccc", zIndex: 9999,
                                        maxHeight: 200, overflowY: "auto", boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    {dcList.length > 0 ? (
                                        dcList.map((dcItem, idx) => (
                                            <div
                                                key={idx}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const selectedDc = dcItem.dc_number || dcItem.inward_dc_no || dcItem.invoice_no;
                                                    const updatedFilters = { ...filters, dcNumber: selectedDc };
                                                    setFilters(updatedFilters);
                                                    if (onFilterChange) onFilterChange(updatedFilters);
                                                    setReportData([]);
                                                    setViewMode("dc");
                                                    setopendown(false);
                                                }}
                                                style={{ padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                                                onMouseOver={e => e.currentTarget.style.background = "#e8f0f8"}
                                                onMouseOut={e => e.currentTarget.style.background = "white"}
                                            >
                                                {dcItem.dc_number || dcItem.inward_dc_no || dcItem.invoice_no}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: "8px 10px", color: "#999", fontSize: "12px" }}>No DC found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CLIENT / SUPPLIER NAME */}
                        <div style={{ display: "flex", flexDirection: "column", position: "relative" }} ref={clientDropdownRef}>
                            <label style={{ color: "#fff", fontWeight: "bold", fontSize: "11px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                                {type === "Inward Report" ? "SUPPLIER NAME" : "CLIENT NAME"}
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
                                placeholder={type === "Inward Report" ? "Supplier Name" : "Client Name"}
                                style={{ width: 160, padding: "4px 6px", border: "1px solid #aaa", background: "white", color: "#000", fontSize: "12px", outline: "none" }}
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
                        <button
                            onClick={gentratereport}
                            style={{
                                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)", letterSpacing: "0.3px",
                            }}
                            onMouseOver={e => e.currentTarget.style.background = "#fff"}
                            onMouseOut={e => e.currentTarget.style.background = "#f0f0f0"}
                        >
                            GENERATE REPORT
                        </button>
                        {type === "DC Format View" && (
                            <button
                                onClick={() => {
                                    setViewMode("dc");
                                    if (onFilterChange) onFilterChange(filters);
                                }}
                                style={{
                                    background: "#0069d9", color: "#fff", border: "1px solid #0062cc",
                                    padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                                    cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)", letterSpacing: "0.3px",
                                }}
                                onMouseOver={e => e.currentTarget.style.background = "#0056b3"}
                                onMouseOut={e => e.currentTarget.style.background = "#0069d9"}
                            >
                                VIEW
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: "#f0f0f0", color: "#000", border: "1px solid #888",
                                padding: "5px 18px", fontSize: "12px", fontWeight: "bold",
                                cursor: "pointer", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)", letterSpacing: "0.3px",
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
                            style={{ background: "#28a745", color: "#fff", border: "1px solid #1e7e34", padding: "6px 14px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", borderRadius: "3px" }}
                            onMouseOver={e => e.currentTarget.style.background = "#218838"}
                            onMouseOut={e => e.currentTarget.style.background = "#28a745"}
                        >
                            MAIN REPORT
                        </button>
                        <button
                            onClick={handlePrint}
                            style={{ background: "#0069d9", color: "#fff", border: "1px solid #0062cc", padding: "6px 14px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", gap: "5px" }}
                            onMouseOver={e => e.currentTarget.style.background = "#0056b3"}
                            onMouseOut={e => e.currentTarget.style.background = "#0069d9"}
                        >
                            <Printer size={13} /> PRINT
                        </button>
                        <button
                            onClick={exportToPdf}
                            style={{ background: "#dc3545", color: "#fff", border: "1px solid #c82333", padding: "6px 14px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", borderRadius: "3px" }}
                            onMouseOver={e => e.currentTarget.style.background = "#c82333"}
                            onMouseOut={e => e.currentTarget.style.background = "#dc3545"}
                        >
                            EXPORT PDF
                        </button>
                    </div>

                    {/* Printable / report area */}
                    <div
                        ref={contentRef}
                        className="print-area"
                        style={{ width: "100%", minHeight: "100%", boxSizing: "border-box" }}
                    >

                        {/* ── REPORT VIEW ── */}
                        {viewMode === "report" && (
                            <div className="report-sheet" style={{ background: "white", border: "1px solid #bbb", padding: "16px 18px 20px 18px", minHeight: "297mm" }}>

                                {/* Report heading */}
                                <div style={{ marginBottom: "10px" }}>
                                    <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>
                                        {title ? title.toUpperCase() : "REPORT"}
                                    </h2>
                                    <div style={{ fontSize: "12px", color: "#333", display: "flex", gap: "18px" }}>
                                        <span>FROM : <strong>{filters.fromDate || "—"}</strong></span>
                                        <span>TO : <strong>{filters.toDate || "—"}</strong></span>
                                        <span>
                                            {type === "Inward Report" ? "SUPPLIER" : "CLIENT"} : <strong>{filters.clientName || (type === "Inward Report" ? "ALL SUPPLIERS" : "ALL CLIENTS")}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div style={{ overflowX: "auto" }}>

                                    {/* ── INWARD REPORT TABLE ── */}
                                    {type === "Inward Report" ? (
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "auto" }}>
                                            <thead>
                                                <tr style={{ background: "#b8cce4" }}>
                                                    {["SNO", "DC NUMBER", "ENTRY DATE", "SUPPLIER NAME", "ITEM NAME", "QUANTITY", "PROBLEMS", "REMARKS"].map((col, i) => (
                                                        <th key={i} style={thStyle(i >= 5 ? "right" : "left")}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.length > 0 ? (
                                                    reportData.map((row, i) => (
                                                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#dce6f1" }}>
                                                            <td style={tdStyle("left")}>{i + 1}</td>
                                                            <td style={{ ...tdStyle("left"), color: "#1a3f7a", fontWeight: "bold" }}>{row.dc_number}</td>
                                                            <td style={tdStyle("left")}>{row.entry_date ? new Date(row.entry_date).toLocaleDateString("en-GB") : ""}</td>
                                                            <td style={{ ...tdStyle("left"), color: "#1a3f7a", fontWeight: "bold" }}>{row.client_name}</td>
                                                            <td style={tdStyle("left")}>{row.item_name}</td>
                                                            <td style={tdStyle("right")}>{row.quantity}</td>
                                                            <td style={{ ...tdStyle("left"), color: row.problems ? "#cc0000" : "#333" }}>{row.problems}</td>
                                                            <td style={tdStyle("left")}>{row.remarks}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "#888", fontSize: "13px" }}>No Data Available</td>
                                                    </tr>
                                                )}
                                                {reportData.length > 0 && (
                                                    <tr style={{ background: "#b8cce4", fontWeight: "bold" }}>
                                                        <td colSpan="5" style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>OVERALL TOTAL:</td>
                                                        <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                                                            {reportData.reduce((sum, row) => sum + Number(row.quantity || 0), 0)}
                                                        </td>
                                                        <td colSpan="2" style={{ border: "1px solid #9baec8", padding: "6px 10px" }}></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        /* ── DC / INVOICE REPORT TABLE ── */
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "auto" }}>
                                            <thead>
                                                <tr style={{ background: "#b8cce4" }}>
                                                    {["SNO", "DC NUMBER", "DATE", "CLIENT NAME", "ITEM NAME", "QUANTITY", "REMARKS"].map((col, i) => (
                                                        <th key={i} style={thStyle(i === 5 ? "right" : "left")}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.length > 0 ? (
                                                    reportData.map((row, i) => (
                                                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#dce6f1" }}>
                                                            <td style={tdStyle("left")}>{i + 1}</td>
                                                            <td style={{ ...tdStyle("left"), color: "#1a3f7a", fontWeight: "bold" }}>{row.dc_number}</td>
                                                            <td style={tdStyle("left")}>{row.dc_date ? new Date(row.dc_date).toLocaleDateString("en-GB") : ""}</td>
                                                            <td style={{ ...tdStyle("left"), color: "#1a3f7a", fontWeight: "bold" }}>{row.client_name}</td>
                                                            <td style={tdStyle("left")}>{row.item_name}</td>
                                                            <td style={tdStyle("right")}>{row.quantity}</td>
                                                            <td style={tdStyle("left")}>{row.remarks}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#888", fontSize: "13px" }}>No Data Available</td>
                                                    </tr>
                                                )}
                                                {reportData.length > 0 && (
                                                    <tr style={{ background: "#b8cce4", fontWeight: "bold" }}>
                                                        <td colSpan="5" style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>OVERALL TOTAL:</td>
                                                        <td style={{ border: "1px solid #9baec8", padding: "6px 10px", textAlign: "right", fontSize: "12px" }}>
                                                            {reportData.reduce((sum, row) => sum + Number(row.quantity || 0), 0)}
                                                        </td>
                                                        <td style={{ border: "1px solid #9baec8", padding: "6px 10px" }}></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── DC / DOCUMENT VIEW ── */}
                        {viewMode === "dc" && (
                            <div
                                className="printable-area"
                                style={{ width: "100%", minHeight: "auto", padding: 0, overflow: "visible", boxSizing: "border-box", background: "white" }}
                            >
                                {type === "DC Format View" ? (
                                    filters.dcNumber ? (
                                        docType === "Job DC" ? (
                                            <JobDeliveryChallan key={filters.dcNumber} dcNumber={filters.dcNumber} />
                                        ): docType === "Standby DC" ? (
                                            <StandbyDeliveryChallan key={filters.dcNumber} dcNumber={filters.dcNumber} />
                                        ) : null
                                    ) : (
                                        <div style={{ padding: "24px", textAlign: "center", color: "#888", fontSize: "13px" }}>No Document Number Selected</div>
                                    )
                                ) : (
                                    children
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* ── STATUS BAR ── */}
                <div
                    style={{
                        background: "#f0f0f0", borderTop: "1px solid #aaa",
                        padding: "2px 12px", fontSize: "11px", fontWeight: "bold", color: "#555",
                        display: "flex", justifyContent: "space-between", flexShrink: 0,
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
                    body { margin: 0 !important; padding: 0 !important; background: white !important; }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important; top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important; padding: 0 !important;
                        border: none !important; box-shadow: none !important;
                    }
                    #root,
                    #root > div,
                    main,
                    main > div,
                    main > div > div,
                    .service-modal-overlay,
                    .service-modal-container,
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
                    }
                    .custom-scrollbar {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print, button { display: none !important; }
                    .report-sheet { min-height: auto !important; border: none !important; }
                    .printable-area { width: 100% !important; min-height: auto !important; overflow: visible !important; }
                    table { border-collapse: collapse !important; }
                    tr, td, th { page-break-inside: avoid !important; }
                }
            `}</style>
        </div>
    );
};

// Shared cell style helpers (UI only)
const thStyle = (align = "left") => ({
    border: "1px solid #9baec8",
    padding: "7px 10px",
    textAlign: align,
    fontWeight: "bold",
    color: "#000",
    whiteSpace: "nowrap",
    fontSize: "12px",
});

const tdStyle = (align = "left") => ({
    border: "1px solid #ccc",
    padding: "5px 10px",
    textAlign: align,
    fontSize: "12px",
    whiteSpace: "nowrap",
});

export default ServiceWindowModal;
