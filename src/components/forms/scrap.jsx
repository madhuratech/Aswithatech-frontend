import API_BASE_URL from "../../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
// Debounce helper
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const ScrapPcb = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // Form states
  const [scrapNo, setScrapNo] = useState("");
  const [pcbCode, setPcbCode] = useState("");
  const [pcbName, setPcbName] = useState("");
  const [pcbModel, setPcbModel] = useState("");
  const [quantity, setQuantity] = useState("");
  const [damageDate, setDamageDate] = useState("");
  const [damageType, setDamageType] = useState("");
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const [scrapValue, setScrapValue] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [remarks, setRemarks] = useState("");

  // Autocomplete & search data
  const [pcbStocks, setPcbStocks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [scrapList, setScrapList] = useState([]);

  // Dropdown visibility states
  const [showPcbDropdown, setShowPcbDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [loadSnoVal, setLoadSnoVal] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [snoList, setSnoList] = useState([]);

  const pcbRef = useRef(null);
  const empRef = useRef(null);
  const typeRef = useRef(null);
  const sourceRef = useRef(null);
  const searchRef = useRef(null);
  const scrapDamageDateRef = useRef(null);
  const scrapDamageDateFp = useRef(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDamageDate(today);
  }, []);

  useEffect(() => {
    scrapDamageDateFp.current = flatpickr(scrapDamageDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: damageDate ? toDmy(damageDate) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setDamageDate(toYmd(dateStr));
      },
    });
    return () => scrapDamageDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrapDamageDateFp.current && damageDate) {
      scrapDamageDateFp.current.setDate(toDmy(damageDate));
    }
  }, [damageDate]);

  // Fetch next generated Scrap Number
  const fetchNextSno = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/scrappcb/next-sno`);
      const data = await res.json();
      if (data.nextSno) {
        setScrapNo(data.nextSno);
      }
    } catch (err) {
      console.error("Error loading next scrap number:", err);
    }
  };

  // Fetch all scrap list records for the table
  const fetchScrapList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/scrappcb/all`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setScrapList(data);
      }
    } catch (err) {
      console.error("Error fetching scrap list:", err);
    }
  };

  // Fetch PCB Stocks and Employees on mount
  useEffect(() => {
    fetchNextSno();
    fetchScrapList();

    // Fetch PCB Stocks
    fetch(`${API_BASE_URL}/pcb-stock/all`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPcbStocks(data);
        }
      })
      .catch((err) => console.error("Error loading PCB stock:", err));

    // Fetch Employees
    fetch(`${API_BASE_URL}/employees/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      })
      .catch((err) => console.error("Error loading employees:", err));
  }, []);

  // Reset / Clear Form
  const handleResetForm = () => {
    setPcbCode("");
    setPcbName("");
    setPcbModel("");
    setQuantity("");
    const today = new Date().toISOString().split("T")[0];
    setDamageDate(today);
    setDamageType("");
    setReason("");
    setSource("");
    setScrapValue("");
    setApprovedBy("");
    setRemarks("");
    setIsEditing(false);
    setLoadSnoVal("");
    fetchNextSno();
    fetchScrapList();
  };

  // Save or Update Entry
  const handleSaveEntry = async () => {
    if (!pcbCode.trim()) return alert("PCB Code is required");
    if (!pcbName.trim()) return alert("PCB Name is required");
    if (!pcbModel.trim()) return alert("PCB Model is required");
    if (quantity === "" || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return alert("Valid Quantity is required");
    }
    if (!damageDate) return alert("Damage Date is required");
    if (!damageType) return alert("Damage Type is required");
    if (!reason.trim()) return alert("Reason is required");
    if (!source) return alert("Source is required");
    if (scrapValue === "" || isNaN(parseFloat(scrapValue))) {
      return alert("Valid Scrap Value is required");
    }
    if (!approvedBy.trim()) return alert("Approved By is required");

    const payload = {
      pcb_code: pcbCode,
      pcb_name: pcbName,
      pcb_model: pcbModel,
      quantity: parseInt(quantity),
      damage_date: damageDate,
      damage_type: damageType,
      reason: reason,
      source: source,
      scrap_value: parseFloat(scrapValue),
      approved_by: approvedBy,
      remarks: remarks,
    };

    const toastId = toast.loading(
      isEditing ? "Updating Scrap Entry..." : "Saving Scrap Entry..."
    );
    try {
      const url = isEditing
        ? `${API_BASE_URL}/scrappcb/${scrapNo}`
        : `${API_BASE_URL}/scrappcb/new`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save scrap entry");
      }

      toast.success(
        isEditing
          ? "Scrap Entry updated successfully!"
          : "Scrap Entry saved successfully!",
        { id: toastId }
      );
      handleResetForm();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (snoToDelete) => {
    const targetSno = snoToDelete || scrapNo;
    if (!targetSno) {
      alert("Select a Scrap entry to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete scrap entry ${targetSno}?`))
      return;

    const toastId = toast.loading("Deleting Scrap Entry...");
    try {
      const res = await fetch(`${API_BASE_URL}/scrappcb/${targetSno}`, {
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

  const handleDeleteWithPassword = () => {
    handleDeleteEntry();
  };

  // Load selected scrap entry details for edit
  const handleLoadEntry = async (selectedSno) => {
    try {
      const res = await fetch(`${API_BASE_URL}/scrappcb/${selectedSno}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");

      setScrapNo(data.scrap_no);
      setPcbCode(data.pcb_code);
      setPcbName(data.pcb_name);
      setPcbModel(data.pcb_model);
      setQuantity(data.quantity);
      setDamageDate(data.damage_date?.split("T")[0] || "");
      setDamageType(data.damage_type);
      setReason(data.reason);
      setSource(data.source);
      setScrapValue(data.scrap_value);
      setApprovedBy(data.approved_by);
      setRemarks(data.remarks || "");
      setIsEditing(true);
      setLoadSnoVal(data.scrap_no);
      setShowSearchDropdown(false);
      alert("Loaded Successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert(err.message);
    }
  };

  // Search existing SNOs
  const handleSearchSno = async (val) => {
    try {
      let url = "";
      if (!val.trim()) {
        url = `${API_BASE_URL}/scrappcb/search?q=`;
      } else {
        url = `${API_BASE_URL}/scrappcb/search?q=${encodeURIComponent(val)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSnoList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedSnoSearch = useRef(debounce(handleSearchSno, 300)).current;

  useOutsideClick([
    { ref: pcbRef,    onClose: () => setShowPcbDropdown(false) },
    { ref: empRef,    onClose: () => setShowEmpDropdown(false) },
    { ref: typeRef,   onClose: () => setShowTypeDropdown(false) },
    { ref: sourceRef, onClose: () => setShowSourceDropdown(false) },
    { ref: searchRef, onClose: () => setShowSearchDropdown(false) },
  ]);

  // Filter PCBs for autocomplete
  const filteredPcbs = pcbStocks.filter(
    (pcb) =>
      (pcb.pcb_code || "").toLowerCase().includes(pcbCode.toLowerCase()) ||
      (pcb.pcb_name || "").toLowerCase().includes(pcbCode.toLowerCase())
  );

  const selectPcb = (pcb) => {
    setPcbCode(pcb.pcb_code);
    setPcbName(pcb.pcb_name);
    setPcbModel(pcb.pcb_model);
    setShowPcbDropdown(false);
  };

  // Filter Employees for autocomplete
  const filteredEmployees = employees.filter((emp) =>
    (emp.employee_name || "").toLowerCase().includes(approvedBy.toLowerCase())
  );

  const selectEmployee = (emp) => {
    setApprovedBy(emp.employee_name);
    setShowEmpDropdown(false);
  };

  // Standard CSS class shortcuts
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 select-none";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors duration-150";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  const DAMAGE_TYPES = [
    "Damaged",
    "Burnt",
    "Short Circuit",
    "Physical Damage",
    "Water Damage",
    "Manufacturing Defect",
    "Scrap",
  ];

  const SOURCES = [
    "Production",
    "Service",
    "Customer Return",
    "Standby Stock",
    "Purchase Return",
  ];

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans text-sm">
      {/* Back Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm transition duration-150"
        onClick={() => navigate(-1)}
      >
        ← Go Back
      </button>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Scrap & Damaged PCB Entry
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">
              Log damaged and scrap PCBs with source, type, values, and approvals.
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
            <button
              onClick={handleDeleteWithPassword}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors"
            >
              DELETE
            </button>
          </div>
        </div>

        {/* HORIZONTAL FORM LAYOUT */}
        <div className="space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Scrap No */}
            <div>
              <label className={labelCls}>Scrap No (Auto)</label>
              <input
                type="text"
                value={scrapNo}
                readOnly
                className={roInputCls}
              />
            </div>

            {/* Damage Date */}
            <div>
              <label className={labelCls}>
                Damage Date <span className="text-red-500">*</span>
              </label>
              <input
                ref={scrapDamageDateRef}
                type="text"
                placeholder="Select Date"
                className={inputCls}
                readOnly
              />
            </div>

            {/* Damage Type Dropdown */}
            <div className="relative" ref={typeRef}>
              <label className={labelCls}>
                Damage Type <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => setShowTypeDropdown((p) => !p)}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[42px]`}
              >
                <span className={damageType ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {damageType || "Select Type..."}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showTypeDropdown && (
                <div className={dropdownCls}>
                  {DAMAGE_TYPES.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setDamageType(opt);
                        setShowTypeDropdown(false);
                      }}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Source Dropdown */}
            <div className="relative" ref={sourceRef}>
              <label className={labelCls}>
                Source <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => setShowSourceDropdown((p) => !p)}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[42px]`}
              >
                <span className={source ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {source || "Select Source..."}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showSourceDropdown && (
                <div className={dropdownCls}>
                  {SOURCES.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setSource(opt);
                        setShowSourceDropdown(false);
                      }}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* PCB Code Autocomplete */}
            <div className="relative" ref={pcbRef}>
              <label className={labelCls}>
                PCB Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pcbCode}
                onFocus={() => setShowPcbDropdown(true)}
                onChange={(e) => {
                  setPcbCode(e.target.value);
                  setShowPcbDropdown(true);
                }}
                placeholder="Search Code or Name..."
                className={inputCls}
              />
              {showPcbDropdown && (
                <div className={dropdownCls}>
                  {filteredPcbs.length > 0 ? (
                    filteredPcbs.map((pcb) => (
                      <div
                        key={pcb.id}
                        onClick={() => selectPcb(pcb)}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div className="text-[13px] font-bold text-gray-800">{pcb.pcb_code}</div>
                        <div className="text-[11px] font-medium text-gray-500">{pcb.pcb_name} ({pcb.pcb_model})</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400 font-medium">No PCBs found</div>
                  )}
                </div>
              )}
            </div>

            {/* PCB Name */}
            <div>
              <label className={labelCls}>
                PCB Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pcbName}
                onChange={(e) => setPcbName(e.target.value)}
                placeholder="PCB Name"
                className={inputCls}
              />
            </div>

            {/* PCB Model */}
            <div>
              <label className={labelCls}>
                PCB Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pcbModel}
                onChange={(e) => setPcbModel(e.target.value)}
                placeholder="PCB Model"
                className={inputCls}
              />
            </div>

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
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Scrap Value */}
            <div>
              <label className={labelCls}>
                Scrap Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={scrapValue}
                onChange={(e) => setScrapValue(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            {/* Approved By Autocomplete */}
            <div className="relative" ref={empRef}>
              <label className={labelCls}>
                Approved By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={approvedBy}
                onFocus={() => setShowEmpDropdown(true)}
                onChange={(e) => {
                  setApprovedBy(e.target.value);
                  setShowEmpDropdown(true);
                }}
                placeholder="Search Employee..."
                className={inputCls}
              />
              {showEmpDropdown && (
                <div className={dropdownCls}>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => selectEmployee(emp)}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                      >
                        {emp.employee_name} ({emp.designation})
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400 font-medium">No employees found</div>
                  )}
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className={labelCls}>
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for scrap/damage"
                className={inputCls}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className={labelCls}>Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks if any"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM: Search & List Table */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Scrap & Damaged PCB Log
              </h3>
              <p className="text-[12px] text-gray-400 mt-1">
                List of logged scrap entries in the system.
              </p>
            </div>

            {/* Search filter input */}
            <div className="relative w-72 text-black" ref={searchRef}>
              <input
                type="text"
                value={loadSnoVal}
                onFocus={() => {
                  setShowSearchDropdown(true);
                  handleSearchSno("");
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setLoadSnoVal(value);
                  debouncedSnoSearch(value);
                  if (value) setShowSearchDropdown(true);
                }}
                className={`${inputCls} w-72`}
                placeholder="Search by Scrap No, PCB, Source..."
              />
              {showSearchDropdown && (
                <div className={`${dropdownCls} w-72`}>
                  {snoList.length > 0 ? (
                    snoList.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => requirePassword(() => handleLoadEntry(item.scrap_no))}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div className="text-[13px] font-bold text-gray-800">{item.scrap_no}</div>
                        <div className="text-[11px] font-semibold text-gray-500">{item.pcb_name} ({item.damage_type})</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400 font-medium">No matches found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LIST VIEW TABLE */}
          <div className="w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
            <table className="w-full min-w-[1000px] border-collapse text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold select-none">
                  <th className="px-5 py-3 text-center w-[60px]">S.No</th>
                  <th className="px-5 py-3">Scrap No</th>
                  <th className="px-5 py-3">PCB Code</th>
                  <th className="px-5 py-3">PCB Name</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3 text-center">Quantity</th>
                  <th className="px-5 py-3">Damage Type</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3 text-right pr-6">Scrap Value</th>
                  <th className="px-5 py-3 text-center">Date</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scrapList.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-14 text-center">
                      <div className="text-gray-300 text-4xl mb-3">🧾</div>
                      <p className="text-[13px] text-gray-400 font-medium">No scrap entries logged yet.</p>
                    </td>
                  </tr>
                ) : (
                  scrapList.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3 text-center font-semibold text-gray-400">{index + 1}</td>
                      <td className="px-5 py-3 font-bold text-blue-700">{item.scrap_no}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800">{item.pcb_code}</td>
                      <td className="px-5 py-3 font-bold text-gray-800 uppercase">{item.pcb_name}</td>
                      <td className="px-5 py-3 font-semibold text-gray-600">{item.pcb_model}</td>
                      <td className="px-5 py-3 text-center font-bold text-gray-900">{item.quantity}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 uppercase">
                          {item.damage_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-700">{item.source}</td>
                      <td className="px-5 py-3 text-right pr-6 font-bold text-gray-900">₹{Number(item.scrap_value).toFixed(2)}</td>
                      <td className="px-5 py-3 text-center font-medium text-gray-600">
                        {new Date(item.damage_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => requirePassword(() => handleLoadEntry(item.scrap_no))} title="Edit">
                            <SquarePen size={17} className="text-blue-500 hover:text-blue-700 transition-colors" />
                          </button>
                          <button onClick={() => handleDeleteEntry(item.scrap_no)} title="Delete">
                            <Trash2 size={17} className="text-red-400 hover:text-red-600 transition-colors" />
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
      </div>
      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};

export default ScrapPcb;