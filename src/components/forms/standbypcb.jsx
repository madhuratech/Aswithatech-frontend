import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useDropdownKeyNav } from "../../hooks/useDropdownKeyNav";
import { SquarePen, Trash2, Printer } from "lucide-react";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";

const StandbyPCB = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // Tab State: "form" or "reports"
  const initialTab = location.state?.activeTab || "form";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form states
  const [standbyNo, setStandbyNo] = useState("");
  const [pcbCode, setPcbCode] = useState("");
  const [pcbName, setPcbName] = useState("");
  const [pcbModel, setPcbModel] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [serviceDcNo, setServiceDcNo] = useState("");
  const [inwardDcNo, setInwardDcNo] = useState("");
  const [allocatedDate, setAllocatedDate] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const initialStatus = location.state?.status || "Available";
  const [status, setStatus] = useState(initialStatus);
  const [remarks, setRemarks] = useState("");

  // Edit / List / Autocomplete Data states
  const [isEditing, setIsEditing] = useState(false);
  const [, setLoadNoVal] = useState("");
  const [, setShowSearchDropdown] = useState(false);
  const [allStandbyList, setAllStandbyList] = useState([]);

  // Masters datasets for Autocomplete
  const [customers, setCustomers] = useState([]);
  const [pcbStockList, setPcbStockList] = useState([]);

  // Search & Select dropdown opens
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [showPcbDropdown, setShowPcbDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Search values
  const [custSearch, setCustSearch] = useState("");
  const [pcbSearch, setPcbSearch] = useState("");

  // Report Filter states
  const initialReportType = location.state?.reportType || "standby";
  const [reportType, setReportType] = useState(initialReportType);
  const [reportFilters, setReportFilters] = useState({
    fromDate: "",
    toDate: "",
    customerName: "",
    pcbCode: "",
    status: location.state?.status || "",
  });
  const [reportData, setReportData] = useState([]);
  const [reportTitle, setReportTitle] = useState("Standby PCB Report");

  const [showRepCustDropdown, setShowRepCustDropdown] = useState(false);
  const [showRepPcbDropdown, setShowRepPcbDropdown] = useState(false);
  const [repCustSearch, setRepCustSearch] = useState("");
  const [repPcbSearch, setRepPcbSearch] = useState("");

  const custRef = useRef(null);
  const pcbRef = useRef(null);
  const statusRef = useRef(null);
  const searchRef = useRef(null);
  const repCustRef = useRef(null);
  const repPcbRef = useRef(null);
  const printAreaRef = useRef(null);
  const allocDateRef = useRef(null);
  const allocDateFp = useRef(null);
  const expRetDateRef = useRef(null);
  const expRetDateFp = useRef(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setAllocatedDate(today);
  }, []);

  useEffect(() => {
    allocDateFp.current = flatpickr(allocDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: allocatedDate ? toDmy(allocatedDate) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setAllocatedDate(toYmd(dateStr));
      },
    });
    return () => allocDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allocDateFp.current && allocatedDate) {
      allocDateFp.current.setDate(toDmy(allocatedDate));
    }
  }, [allocatedDate]);

  useEffect(() => {
    expRetDateFp.current = flatpickr(expRetDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: expectedReturnDate ? toDmy(expectedReturnDate) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setExpectedReturnDate(toYmd(dateStr));
      },
    });
    return () => expRetDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (expRetDateFp.current && expectedReturnDate) {
      expRetDateFp.current.setDate(toDmy(expectedReturnDate));
    }
  }, [expectedReturnDate]);

  // Fetch Next Standby No
  const fetchNextNo = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/standby-pcb/next-no");
      const data = await res.json();
      if (data.nextNo) setStandbyNo(data.nextNo);
    } catch (err) {
      console.error("Error loading next standby number:", err);
    }
  };

  // Fetch All Standby entries
  const fetchAllStandby = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/standby-pcb/all");
      const data = await res.json();
      setAllStandbyList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching standby entries:", err);
    }
  };

  // Fetch Customers & PCB list for autocompletion
  useEffect(() => {
    fetchNextNo();
    fetchAllStandby();

    // Fetch Customers
    fetch("http://localhost:3000/api/customers/all")
      .then((res) => res.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching clients list:", err));

    // Fetch PCBs
    fetch("http://localhost:3000/api/pcb-stock/all")
      .then((res) => res.json())
      .then((data) => setPcbStockList(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching PCB stock:", err));
  }, []);

  // Autocomplete change hooks
  const handleCustomerSelect = (cust) => {
    setCustomerName(cust.customer_name);
    setCustSearch(cust.customer_name);
    setShowCustDropdown(false);
  };

  const handlePcbSelect = (pcb) => {
    setPcbCode(pcb.pcb_code);
    setPcbName(pcb.pcb_name);
    setPcbModel(pcb.pcb_model);
    setPcbSearch(pcb.pcb_code);
    setShowPcbDropdown(false);
  };

  // Reset / Clear Form
  const handleResetForm = () => {
    setPcbCode("");
    setPcbName("");
    setPcbModel("");
    setQuantity("");
    setCustomerName("");
    setServiceDcNo("");
    setInwardDcNo("");
    const today = new Date().toISOString().split("T")[0];
    setAllocatedDate(today);
    setExpectedReturnDate("");
    setStatus("Available");
    setRemarks("");
    setIsEditing(false);
    setLoadNoVal("");
    setCustSearch("");
    setPcbSearch("");
    fetchNextNo();
    fetchAllStandby();
  };

  // Save / Update record
  const handleSaveEntry = async () => {
    if (!pcbCode) return alert("PCB Code is required");
    if (!pcbName) return alert("PCB Name is required");
    if (!quantity || isNaN(parseInt(quantity))) return alert("Quantity is required");
    if (!customerName) return alert("Customer Name is required");
    if (!allocatedDate) return alert("Allocated Date is required");
    if (!status) return alert("Status is required");

    const payload = {
      pcb_code: pcbCode,
      pcb_name: pcbName,
      pcb_model: pcbModel,
      quantity: parseInt(quantity),
      customer_name: customerName,
      service_dc_no: serviceDcNo,
      inward_dc_no: inwardDcNo,
      allocated_date: allocatedDate,
      expected_return_date: expectedReturnDate,
      status: status,
      remarks: remarks,
    };

    const toastId = toast.loading(
      isEditing ? "Updating Standby PCB..." : "Saving Standby PCB..."
    );
    try {
      const url = isEditing
        ? `http://localhost:3000/api/standby-pcb/${standbyNo}`
        : "http://localhost:3000/api/standby-pcb/new";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save Standby entry");
      }

      toast.success(
        isEditing
          ? "Standby PCB updated successfully!"
          : "Standby PCB saved successfully!",
        { id: toastId }
      );
      handleResetForm();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // Load details for editing
  const handleLoadEntry = async (sNo) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/standby-pcb/${sNo}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load record");

      setStandbyNo(data.standby_no);
      setPcbCode(data.pcb_code);
      setPcbName(data.pcb_name);
      setPcbModel(data.pcb_model);
      setQuantity(data.quantity);
      setCustomerName(data.customer_name);
      setServiceDcNo(data.service_dc_no || "");
      setInwardDcNo(data.inward_dc_no || "");
      setAllocatedDate(data.allocated_date?.split("T")[0] || "");
      setExpectedReturnDate(data.expected_return_date?.split("T")[0] || "");
      setStatus(data.status);
      setRemarks(data.remarks || "");

      setCustSearch(data.customer_name);
      setPcbSearch(data.pcb_code);
      setIsEditing(true);
      setLoadNoVal(data.standby_no);
      setShowSearchDropdown(false);
      alert("Loaded Successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Record
  const handleDeleteEntry = async (sNo) => {
    const activeNo = sNo || standbyNo;
    if (!activeNo) {
      alert("Please select an entry to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Standby PCB entry ${activeNo}?`))
      return;

    const toastId = toast.loading("Deleting Standby PCB...");
    try {
      const res = await fetch(`http://localhost:3000/api/standby-pcb/${activeNo}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Deleted successfully!", { id: toastId });
        handleResetForm();
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleSaveWithPassword = () => {
    handleSaveEntry();
  };

  // Filter Autocomplete options
  const filteredCustomers = customers.filter((c) =>
    (c.customer_name || "")
      .toLowerCase()
      .includes(custSearch.toLowerCase())
  );

  const filteredPcbStock = pcbStockList.filter((p) =>
    (p.pcb_code || "").toLowerCase().includes(pcbSearch.toLowerCase()) ||
    (p.pcb_name || "").toLowerCase().includes(pcbSearch.toLowerCase())
  );

  // Outside-click: close all dropdowns when clicking outside their containers
  useOutsideClick([
    { ref: custRef,    onClose: () => setShowCustDropdown(false) },
    { ref: pcbRef,     onClose: () => setShowPcbDropdown(false) },
    { ref: statusRef,  onClose: () => setShowStatusDropdown(false) },
    { ref: searchRef,  onClose: () => setShowSearchDropdown(false) },
    { ref: repCustRef, onClose: () => setShowRepCustDropdown(false) },
    { ref: repPcbRef,  onClose: () => setShowRepPcbDropdown(false) },
  ]);

  // ════════════════════════════════════════════════════════════════════
  // Reports Logic
  // ════════════════════════════════════════════════════════════════════
  const generateReport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (reportFilters.fromDate && reportFilters.toDate) {
        params.append("fromDate", reportFilters.fromDate);
        params.append("toDate", reportFilters.toDate);
      }
      if (reportFilters.customerName) {
        params.append("customerName", reportFilters.customerName);
      }
      if (reportFilters.pcbCode) {
        params.append("pcbCode", reportFilters.pcbCode);
      }
      if (reportFilters.status) {
        params.append("status", reportFilters.status);
      }
      params.append("reportType", reportType);

      const res = await fetch(
        `http://localhost:3000/api/standby-pcb/report/filters?${params.toString()}`
      );
      const data = await res.json();
      setReportData(Array.isArray(data) ? data : []);

      // Set titles dynamically based on reportType
      if (reportType === "standby") setReportTitle("Standby PCB Report");
      else if (reportType === "customer") setReportTitle("Customer-wise Standby Report");
      else if (reportType === "allocated") setReportTitle("Allocated PCB Report");
      else if (reportType === "returned") setReportTitle("Returned PCB Report");
      else if (reportType === "available") setReportTitle("Available Standby Stock Report");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    }
  }, [reportFilters, reportType]);

  useEffect(() => {
    if (activeTab === "reports") {
      generateReport();
    }
  }, [activeTab, generateReport]);

  const handlePrint = () => {
    const win = window.open("", "", "width=1200,height=750");
    win.document.write(`
      <html><head><title>${reportTitle}</title>
      <style>
        body { margin: 0; padding: 14px; font-family: Arial, sans-serif; font-size: 11px; }
        @page { size: A4 landscape; margin: 8mm; }
        h2 { font-size: 14px; margin: 0 0 4px; text-transform: uppercase; }
        .hdr { margin-bottom: 8px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #c5d7e9; color: #0d2340; border: 1px solid #8ca8c5; padding: 5px 6px; font-size: 10px; font-weight: bold; white-space: nowrap; }
        td { border: 1px solid #ccc; padding: 4px 6px; font-size: 10px; }
        .tc { text-align: center; }
        .tr { text-align: right; }
      </style>
      </head><body>${printAreaRef.current.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const exportPDF = () => {
    if (!printAreaRef.current) return;
    html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `${reportTitle.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(printAreaRef.current)
      .save();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const header = [
      [
        "STANDBY NO",
        "PCB CODE",
        "PCB NAME",
        "PCB MODEL",
        "CUSTOMER NAME",
        "SERVICE DC NO",
        "INWARD DC NO",
        "ALLOCATED DATE",
        "EXPECTED RETURN DATE",
        "QTY",
        "STATUS",
        "REMARKS",
      ],
    ];
    const rows = reportData.map((r) => [
      r.standby_no,
      r.pcb_code,
      r.pcb_name,
      r.pcb_model,
      r.customer_name,
      r.service_dc_no || "—",
      r.inward_dc_no || "—",
      r.allocated_date,
      r.expected_return_date || "—",
      r.quantity,
      r.status,
      r.remarks || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportTitle.replace(/\s+/g, "_")}.xlsx`);
  };

  // Reference design styles matching Sales Invoice Form
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 select-none";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors duration-150";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  const STATUS_LIST = ["Available", "Allocated", "Installed", "Returned", "Damaged"];

  // Keyboard nav hooks
  const pcbNav = useDropdownKeyNav({
    items: filteredPcbStock,
    isOpen: showPcbDropdown,
    onSelect: handlePcbSelect,
    onClose: () => setShowPcbDropdown(false),
    onOpen:  () => setShowPcbDropdown(true),
  });
  const custNav = useDropdownKeyNav({
    items: filteredCustomers,
    isOpen: showCustDropdown,
    onSelect: handleCustomerSelect,
    onClose: () => setShowCustDropdown(false),
    onOpen:  () => setShowCustDropdown(true),
  });
  const statusNav = useDropdownKeyNav({
    items: STATUS_LIST,
    isOpen: showStatusDropdown,
    onSelect: (s) => { setStatus(s); setShowStatusDropdown(false); },
    onClose: () => setShowStatusDropdown(false),
    onOpen:  () => setShowStatusDropdown(true),
  });

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans text-sm">
      {/* Back Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm transition duration-150"
        onClick={() => navigate(-1)}
      >
        ← Go Back
      </button>

      {/* Tab Select Bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-250 pb-2">
        <button
          onClick={() => setActiveTab("form")}
          className={`px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all ${
            activeTab === "form"
              ? "bg-[#0078d7] text-white shadow-md"
              : "bg-white border text-gray-700 hover:bg-gray-100"
          }`}
        >
          Standby Entry Form
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all ${
            activeTab === "reports"
              ? "bg-[#0078d7] text-white shadow-md"
              : "bg-white border text-gray-700 hover:bg-gray-100"
          }`}
        >
          Standby Reports
        </button>
      </div>

      {/* TAB CONTENT: ENTRY FORM & TABLE */}
      {activeTab === "form" && (
        <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
          {/* HEADER SECTION */}
          <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Standby PCB Registry
              </h2>
              <p className="text-[12px] text-gray-400 mt-1">
                Enter details to register, allocate, or update Standby PCBs.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetForm}
                className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors"
              >
                NEW
              </button>
              <button
                onClick={handleSaveWithPassword}
                className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors"
              >
                {isEditing ? "UPDATE" : "SAVE"}
              </button>
            </div>
          </div>

          {/* FORM GRID */}
          <div className="space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Standby No */}
              <div>
                <label className={labelCls}>Standby No (Auto)</label>
                <input
                  type="text"
                  value={standbyNo}
                  readOnly
                  className={roInputCls}
                />
              </div>

              {/* PCB Code Autocomplete */}
              <div className="relative" ref={pcbRef}>
                <label className={labelCls}>
                  PCB Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pcbSearch}
                  onFocus={() => {
                    setShowPcbDropdown(true);
                    setPcbSearch("");
                  }}
                  onKeyDown={pcbNav.handleKeyDown}
                  onChange={(e) => {
                    setPcbSearch(e.target.value);
                    setShowPcbDropdown(true);
                  }}
                  placeholder="Type/Search PCB Code..."
                  className={inputCls}
                />
                {showPcbDropdown && filteredPcbStock.length > 0 && (
                  <div className={dropdownCls}>
                    {filteredPcbStock.map((p, i) => (
                      <div
                        key={p.pcb_code}
                        onClick={() => handlePcbSelect(p)}
                        className={`px-4 py-2.5 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${i === pcbNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                      >
                        <span className="text-blue-800">{p.pcb_code}</span> — {p.pcb_name}
                      </div>
                    ))}
                  </div>
                )}
                {showPcbDropdown && filteredPcbStock.length === 0 && pcbSearch && (
                  <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                    No PCB stock found matching "{pcbSearch}"
                  </div>
                )}
              </div>

              {/* PCB Name */}
              <div>
                <label className={labelCls}>PCB Name (Auto)</label>
                <input
                  type="text"
                  value={pcbName}
                  readOnly
                  className={roInputCls}
                />
              </div>

              {/* PCB Model */}
              <div>
                <label className={labelCls}>PCB Model (Auto)</label>
                <input
                  type="text"
                  value={pcbModel}
                  readOnly
                  className={roInputCls}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Quantity */}
              <div>
                <label className={labelCls}>
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>

              {/* Customer Name Autocomplete */}
              <div className="relative" ref={custRef}>
                <label className={labelCls}>
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={custSearch}
                  onFocus={() => {
                    setShowCustDropdown(true);
                    setCustSearch("");
                  }}
                  onKeyDown={custNav.handleKeyDown}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setCustomerName(e.target.value);
                    setShowCustDropdown(true);
                  }}
                  placeholder="Search customer..."
                  className={inputCls}
                />
                {showCustDropdown && filteredCustomers.length > 0 && (
                  <div className={dropdownCls}>
                    {filteredCustomers.map((c, i) => (
                      <div
                        key={c.id}
                        onClick={() => handleCustomerSelect(c)}
                        className={`px-4 py-2.5 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${i === custNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                      >
                        {c.customer_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service DC No */}
              <div>
                <label className={labelCls}>Service DC No</label>
                <input
                  type="text"
                  value={serviceDcNo}
                  onChange={(e) => setServiceDcNo(e.target.value)}
                  placeholder="e.g. SDC-900"
                  className={inputCls}
                />
              </div>

              {/* Inward DC No */}
              <div>
                <label className={labelCls}>Inward DC No</label>
                <input
                  type="text"
                  value={inwardDcNo}
                  onChange={(e) => setInwardDcNo(e.target.value)}
                  placeholder="e.g. IDC-700"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Allocated Date */}
              <div>
                <label className={labelCls}>
                  Allocated Date <span className="text-red-500">*</span>
                </label>
                <input
                  ref={allocDateRef}
                  type="text"
                  placeholder="Select Date"
                  className={inputCls}
                  readOnly
                />
              </div>

              {/* Expected Return Date */}
              <div>
                <label className={labelCls}>Expected Return Date</label>
                <input
                  ref={expRetDateRef}
                  type="text"
                  placeholder="Select Date"
                  className={inputCls}
                  readOnly
                />
              </div>

              {/* Status Select Box */}
              <div className="relative" ref={statusRef}>
                <label className={labelCls}>
                  Status <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setShowStatusDropdown((p) => !p)}
                  onKeyDown={statusNav.handleKeyDown}
                  tabIndex={0}
                  className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[42px]`}
                >
                  <span className="font-bold text-[#0078d7]">{status}</span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {showStatusDropdown && (
                  <div className={dropdownCls}>
                    {STATUS_LIST.map((s, i) => (
                      <div
                        key={s}
                        onClick={() => {
                          setStatus(s);
                          setShowStatusDropdown(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer text-[13px] font-bold border-b border-gray-50 last:border-0 text-gray-700 ${i === statusNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className={labelCls}>Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Standby comments..."
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* TABLE SECTION (REGISTRY LIST) */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-8 min-h-[250px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    "Standby No",
                    "PCB Code",
                    "PCB Name",
                    "Customer Name",
                    "Service DC No",
                    "Quantity",
                    "Status",
                    "Allocated Date",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${
                        i === 0 || i === 8 ? "text-center" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allStandbyList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-gray-400 font-medium">
                      No standby records found. Fill details above and click SAVE to register.
                    </td>
                  </tr>
                ) : (
                  allStandbyList.map((stby, idx) => (
                    <tr
                      key={stby.standby_no}
                      className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-4 py-3 text-[12px] font-black text-blue-800 text-center select-all">
                        {stby.standby_no}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold text-gray-700 uppercase">
                        {stby.pcb_code}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-800 uppercase">
                        {stby.pcb_name}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold text-gray-800 uppercase">
                        {stby.customer_name}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600 font-medium">
                        {stby.service_dc_no || "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-center font-extrabold text-gray-800">
                        {stby.quantity}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-left">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold border ${
                            stby.status === "Available"
                              ? "bg-green-50 border-green-200 text-green-700"
                              : stby.status === "Damaged"
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}
                        >
                          {stby.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500 font-semibold">
                        {stby.allocated_date}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => requirePassword(() => handleLoadEntry(stby.standby_no))}
                            title="Edit"
                          >
                            <SquarePen
                              size={16}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(stby.standby_no)}
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPORTS */}
      {activeTab === "reports" && (
        <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
          {/* TOOLBAR FILTER OPTIONS */}
          <div className="bg-black p-4 rounded-xl flex flex-wrap items-end gap-4 mb-6 text-white select-none">
            {/* Report Type Selector */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-gray-300 tracking-widest">REPORT TYPE</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-[210px] px-2 py-[4px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-bold"
                style={{ height: "26px" }}
              >
                <option value="standby">Standby PCB Report</option>
                <option value="customer">Customer-wise Standby Report</option>
                <option value="allocated">Allocated PCB Report</option>
                <option value="returned">Returned PCB Report</option>
                <option value="available">Available Standby Stock Report</option>
              </select>
            </div>

            {/* FROM DATE */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-gray-300 tracking-widest">FROM DATE</label>
              <input
                type="date"
                value={reportFilters.fromDate}
                onChange={(e) =>
                  setReportFilters((p) => ({ ...p, fromDate: e.target.value }))
                }
                className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
              />
            </div>

            {/* TO DATE */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-gray-300 tracking-widest">TO DATE</label>
              <input
                type="date"
                value={reportFilters.toDate}
                onChange={(e) =>
                  setReportFilters((p) => ({ ...p, toDate: e.target.value }))
                }
                className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400"
              />
            </div>

            {/* Customer Autocomplete */}
            <div className="flex flex-col gap-0.5 relative" ref={repCustRef}>
              <label className="text-[10px] font-bold text-gray-300 tracking-widest">CUSTOMER NAME</label>
              <input
                type="text"
                value={repCustSearch}
                onFocus={() => setShowRepCustDropdown(true)}
                onChange={(e) => {
                  setRepCustSearch(e.target.value);
                  setReportFilters((p) => ({ ...p, customerName: e.target.value }));
                  setShowRepCustDropdown(true);
                }}
                placeholder="All customers..."
                className="w-[180px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-semibold"
                style={{ height: "26px" }}
              />
              {showRepCustDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 text-black max-h-32 overflow-y-auto text-xs w-[180px]">
                  <div
                    onClick={() => {
                      setRepCustSearch("");
                      setReportFilters((p) => ({ ...p, customerName: "" }));
                      setShowRepCustDropdown(false);
                    }}
                    className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer font-bold border-b border-gray-50"
                  >
                    -- ALL CUSTOMERS --
                  </div>
                  {customers
                    .filter((c) =>
                      c.customer_name.toLowerCase().includes(repCustSearch.toLowerCase())
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setRepCustSearch(c.customer_name);
                          setReportFilters((p) => ({ ...p, customerName: c.customer_name }));
                          setShowRepCustDropdown(false);
                        }}
                        className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer border-b border-gray-50"
                      >
                        {c.customer_name}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* PCB Code Autocomplete */}
            <div className="flex flex-col gap-0.5 relative" ref={repPcbRef}>
              <label className="text-[10px] font-bold text-gray-300 tracking-widest">PCB CODE</label>
              <input
                type="text"
                value={repPcbSearch}
                onFocus={() => setShowRepPcbDropdown(true)}
                onChange={(e) => {
                  setRepPcbSearch(e.target.value);
                  setReportFilters((p) => ({ ...p, pcbCode: e.target.value }));
                  setShowRepPcbDropdown(true);
                }}
                placeholder="All PCBs..."
                className="w-[130px] px-2 py-[3px] border border-gray-400 text-[11px] bg-white text-black outline-none focus:border-blue-400 font-semibold"
                style={{ height: "26px" }}
              />
              {showRepPcbDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 text-black max-h-32 overflow-y-auto text-xs w-[130px]">
                  <div
                    onClick={() => {
                      setRepPcbSearch("");
                      setReportFilters((p) => ({ ...p, pcbCode: "" }));
                      setShowRepPcbDropdown(false);
                    }}
                    className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer font-bold border-b border-gray-50"
                  >
                    -- ALL PCBS --
                  </div>
                  {pcbStockList
                    .filter((p) =>
                      p.pcb_code.toLowerCase().includes(repPcbSearch.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.pcb_code}
                        onClick={() => {
                          setRepPcbSearch(p.pcb_code);
                          setReportFilters((p) => ({ ...p, pcbCode: p.pcb_code }));
                          setShowRepPcbDropdown(false);
                        }}
                        className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer border-b border-gray-50"
                      >
                        {p.pcb_code}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* GENERATE BUTTON */}
            <button
              onClick={generateReport}
              className="px-4 py-[3px] text-[11px] font-bold bg-[#0078d7] text-white rounded hover:bg-blue-600 active:bg-blue-700 tracking-wide font-sans shrink-0 border border-blue-500"
              style={{ height: "26px" }}
            >
              GENERATE REPORT
            </button>
          </div>

          {/* EXPORTS STRIP */}
          <div className="flex gap-2.5 px-3 py-2 bg-[#ececec] border border-gray-300 rounded-lg mb-4 select-none">
            <button
              onClick={exportExcel}
              className="bg-green-600 text-white text-[10px] px-3 py-1 font-bold border border-green-700 hover:bg-green-700 active:bg-green-800 rounded shadow"
            >
              EXPORT EXCEL
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#1a5ea8] text-white text-[10px] px-3 py-1 font-bold border border-[#154c8a] hover:bg-[#154c8a] flex items-center gap-1 rounded shadow"
            >
              <Printer size={10} /> PRINT
            </button>
            <button
              onClick={exportPDF}
              className="bg-[#b22222] text-white text-[10px] px-3 py-1 font-bold border border-[#8b1a1a] hover:bg-[#8b1a1a] rounded shadow"
            >
              EXPORT PDF
            </button>
          </div>

          {/* REPORT VIEWABLE / PRINTABLE CANVAS */}
          <div
            ref={printAreaRef}
            className="bg-white border border-gray-300 rounded-xl p-6 min-h-[350px]"
          >
            {/* Header */}
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h2 className="text-[15px] font-bold text-black tracking-wide uppercase">
                {reportTitle}
              </h2>
              <div className="flex gap-8 mt-1 text-[10px] text-gray-600 font-bold uppercase">
                <span>From Date: <span className="text-black">{reportFilters.fromDate || "—"}</span></span>
                <span>To Date: <span className="text-black">{reportFilters.toDate || "—"}</span></span>
                <span>Customer: <span className="text-black">{reportFilters.customerName || "All"}</span></span>
                <span>PCB Code: <span className="text-black">{reportFilters.pcbCode || "All"}</span></span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr style={{ background: "#c5d7e9", color: "#0d2340" }}>
                    {[
                      "S.No",
                      "Standby No",
                      "PCB Code",
                      "PCB Name",
                      "Customer Name",
                      "Service DC",
                      "Inward DC",
                      "Qty",
                      "Status",
                      "Alloc Date",
                      "Expected Return",
                      "Remarks",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="border border-[#8ca8c5] p-2 font-bold uppercase text-[10px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="text-center py-12 text-gray-400 font-medium italic border border-gray-200"
                      >
                        No report records found. Change filters and click GENERATE.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 border-b border-gray-200"
                      >
                        <td className="border border-gray-200 p-2 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-200 p-2 font-black text-blue-800 text-center select-all">
                          {row.standby_no}
                        </td>
                        <td className="border border-gray-200 p-2 font-bold uppercase">
                          {row.pcb_code}
                        </td>
                        <td className="border border-gray-200 p-2 font-semibold text-gray-800 uppercase">
                          {row.pcb_name}
                        </td>
                        <td className="border border-gray-200 p-2 font-bold uppercase text-gray-800">
                          {row.customer_name}
                        </td>
                        <td className="border border-gray-200 p-2 text-gray-600 font-semibold">
                          {row.service_dc_no || "—"}
                        </td>
                        <td className="border border-gray-200 p-2 text-gray-600 font-medium">
                          {row.inward_dc_no || "—"}
                        </td>
                        <td className="border border-gray-200 p-2 text-center font-extrabold text-gray-800">
                          {row.quantity}
                        </td>
                        <td className="border border-gray-200 p-2 text-left">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold border text-[9px] ${
                              row.status === "Available"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : row.status === "Damaged"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-2 text-gray-500 font-bold">
                          {row.allocated_date}
                        </td>
                        <td className="border border-gray-200 p-2 text-gray-500 font-medium">
                          {row.expected_return_date || "—"}
                        </td>
                        <td className="border border-gray-200 p-2 text-gray-500 max-w-[150px] truncate" title={row.remarks}>
                          {row.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};

export default StandbyPCB;
