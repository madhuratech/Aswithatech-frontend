import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useDropdownKeyNav } from "../../hooks/useDropdownKeyNav";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import API_BASE_URL from "../../config/api";

// Debounce helper for search
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const SpareUsage = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // Form states
  const [usageNo, setUsageNo] = useState("");
  const [usageDate, setUsageDate] = useState("");
  const [pcbModel, setPcbModel] = useState("");
  const [jobBatchNo, setJobBatchNo] = useState("");
  const [spareCode, setSpareCode] = useState("");
  const [spareName, setSpareName] = useState("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [usageType, setUsageType] = useState("");
  const [remarks, setRemarks] = useState("");

  // Autocomplete / master data lists
  const [pcbStocks, setPcbStocks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sparesMaster, setSparesMaster] = useState([]);
  const [usageList, setUsageList] = useState([]);

  // Dropdown visibility states
  const [showPcbDropdown, setShowPcbDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [showSpareDropdown, setShowSpareDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Edit & Search States
  const [isEditing, setIsEditing] = useState(false);
  const [loadSnoVal, setLoadSnoVal] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [snoList, setSnoList] = useState([]);

  // Refs for closing dropdowns on click outside
  const pcbRef = useRef(null);
  const empRef = useRef(null);
  const spareRef = useRef(null);
  const typeRef = useRef(null);
  const searchRef = useRef(null);
  const spareUsageDateRef = useRef(null);
  const spareUsageDateFp = useRef(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setUsageDate(today);
  }, []);

  useEffect(() => {
    spareUsageDateFp.current = flatpickr(spareUsageDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: usageDate ? toDmy(usageDate) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setUsageDate(toYmd(dateStr));
      },
    });
    return () => spareUsageDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (spareUsageDateFp.current && usageDate) {
      spareUsageDateFp.current.setDate(toDmy(usageDate));
    }
  }, [usageDate]);

  // Fetch next sequential Usage SNO
  const fetchNextSno = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/spareusage/next-sno`);
      const data = await res.json();
      if (data.nextSno) {
        setUsageNo(data.nextSno);
      }
    } catch (err) {
      console.error("Error loading next usage number:", err);
    }
  };

  // Fetch all spare usage list records
  const fetchUsageList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/spareusage/all`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsageList(data);
      }
    } catch (err) {
      console.error("Error fetching usage list:", err);
    }
  };

  // Fetch all necessary autocomplete masters
  useEffect(() => {
    fetchNextSno();
    fetchUsageList();

    // Fetch PCB Stocks for Models
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

    // Fetch Spares from master
    fetch(`${API_BASE_URL}/Sparemodels/all`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSparesMaster(data);
        }
      })
      .catch((err) => console.error("Error loading spares master:", err));
  }, []);

  // Automatically calculate Total Cost whenever Quantity or Unit Cost changes
  useEffect(() => {
    const qty = parseFloat(quantityUsed) || 0;
    const cost = parseFloat(unitCost) || 0;
    setTotalCost((qty * cost).toFixed(2));
  }, [quantityUsed, unitCost]);

  // Reset / Clear Form
  const handleResetForm = () => {
    setPcbModel("");
    setJobBatchNo("");
    setSpareCode("");
    setSpareName("");
    setQuantityUsed("");
    setUnitCost("");
    setTotalCost("");
    setEmployeeName("");
    setDepartment("");
    setUsageType("");
    setRemarks("");
    const today = new Date().toISOString().split("T")[0];
    setUsageDate(today);
    setIsEditing(false);
    setLoadSnoVal("");
    fetchNextSno();
    fetchUsageList();
  };

  // Save or Update Entry
  const handleSaveEntry = async () => {
    if (!usageDate) return alert("Usage Date is required");
    if (!pcbModel.trim()) return alert("PCB Model is required");
    if (!jobBatchNo.trim()) return alert("Job / Batch No is required");
    if (!String(spareCode || "").trim()) return alert("Spare Code is required");
    if (!spareName.trim()) return alert("Spare Name is required");
    if (quantityUsed === "" || isNaN(parseFloat(quantityUsed)) || parseFloat(quantityUsed) <= 0) {
      return alert("Valid Quantity Used is required");
    }
    if (unitCost === "" || isNaN(parseFloat(unitCost)) || parseFloat(unitCost) < 0) {
      return alert("Valid Unit Cost is required");
    }
    if (!employeeName.trim()) return alert("Employee Name is required");
    if (!department.trim()) return alert("Department is required");
    if (!usageType) return alert("Usage Type is required");

    const payload = {
      usage_date: usageDate,
      pcb_model: pcbModel,
      job_batch_no: jobBatchNo,
      spare_code: spareCode,
      spare_name: spareName,
      quantity_used: parseFloat(quantityUsed),
      unit_cost: parseFloat(unitCost),
      employee_name: employeeName,
      department: department,
      usage_type: usageType,
      remarks: remarks,
    };

    const toastId = toast.loading(
      isEditing ? "Updating Spare Usage..." : "Saving Spare Usage..."
    );
    try {
      const url = isEditing
        ? `${API_BASE_URL}/spareusage/${usageNo}`
        : `${API_BASE_URL}/spareusage/new`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save entry");
      }

      toast.success(
        isEditing
          ? "Spare Usage entry updated successfully!"
          : "Spare Usage entry saved successfully!",
        { id: toastId }
      );
      handleResetForm();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (snoToDelete) => {
    const targetSno = snoToDelete || usageNo;
    if (!targetSno) {
      alert("Select a Spare Usage entry to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete entry ${targetSno}?`))
      return;

    const toastId = toast.loading("Deleting Spare Usage...");
    try {
      const res = await fetch(`${API_BASE_URL}/spareusage/${targetSno}`, {
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

  // Load details of an entry for edit
  const handleLoadEntry = async (selectedSno) => {
    try {
      const res = await fetch(`${API_BASE_URL}/spareusage/${selectedSno}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");

      setUsageNo(data.usage_no);
      setUsageDate(data.usage_date?.split("T")[0] || "");
      setPcbModel(data.pcb_model);
      setJobBatchNo(data.job_batch_no);
      setSpareCode(data.spare_code);
      setSpareName(data.spare_name);
      setQuantityUsed(data.quantity_used);
      setUnitCost(data.unit_cost);
      setTotalCost(Number(data.total_cost).toFixed(2));
      setEmployeeName(data.employee_name);
      setDepartment(data.department);
      setUsageType(data.usage_type);
      setRemarks(data.remarks || "");
      setIsEditing(true);
      setLoadSnoVal(data.usage_no);
      setShowSearchDropdown(false);
      alert("Loaded Successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert(err.message);
    }
  };

  // Search existing database Usage Nos
  const handleSearchSno = async (val) => {
    try {
      let url = "";
      if (!val.trim()) {
        url = `${API_BASE_URL}/spareusage/search?q=`;
      } else {
        url = `${API_BASE_URL}/spareusage/search?q=${encodeURIComponent(val)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSnoList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedSnoSearch = useRef(debounce(handleSearchSno, 300)).current;

  // Outside-click: close all dropdowns when clicking outside their containers
  useOutsideClick([
    { ref: pcbRef,    onClose: () => setShowPcbDropdown(false) },
    { ref: empRef,    onClose: () => setShowEmpDropdown(false) },
    { ref: spareRef,  onClose: () => setShowSpareDropdown(false) },
    { ref: typeRef,   onClose: () => setShowTypeDropdown(false) },
    { ref: searchRef, onClose: () => setShowSearchDropdown(false) },
  ]);

  // Autocomplete suggestions filtering
  const filteredPcbs = pcbStocks.filter(
    (pcb) =>
      (pcb.pcb_model || "").toLowerCase().includes(pcbModel.toLowerCase()) ||
      (pcb.pcb_name || "").toLowerCase().includes(pcbModel.toLowerCase())
  );

  const selectPcb = (pcb) => {
    setPcbModel(pcb.pcb_model);
    setShowPcbDropdown(false);
  };

  const filteredEmployees = employees.filter((emp) =>
    (emp.employee_name || "").toLowerCase().includes(employeeName.toLowerCase())
  );

  const selectEmployee = (emp) => {
    setEmployeeName(emp.employee_name);
    setDepartment(emp.department || "");
    setShowEmpDropdown(false);
  };

  const filteredSpares = sparesMaster.filter(
    (sp) =>
      (sp.spare_name || "").toLowerCase().includes(String(spareCode || "").toLowerCase()) ||
      (sp.hsn_number && String(sp.hsn_number).includes(spareCode))
  );

  const selectSpare = (sp) => {
    setSpareCode(sp.hsn_number || `SPR-${sp.id}`);
    setSpareName(sp.spare_name);
    setShowSpareDropdown(false);
  };

  // CSS classes to match active ERP styling
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 select-none";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors duration-150";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  const USAGE_TYPES = ["Production", "Service", "Repair", "Testing", "Rework"];

  // Keyboard nav hooks (placed after filtered arrays to avoid temporal dead zone)
  const pcbNav = useDropdownKeyNav({
    items: filteredPcbs,
    isOpen: showPcbDropdown,
    onSelect: selectPcb,
    onClose: () => setShowPcbDropdown(false),
    onOpen:  () => setShowPcbDropdown(true),
  });
  const empNav = useDropdownKeyNav({
    items: filteredEmployees,
    isOpen: showEmpDropdown,
    onSelect: selectEmployee,
    onClose: () => setShowEmpDropdown(false),
    onOpen:  () => setShowEmpDropdown(true),
  });
  const spareNav = useDropdownKeyNav({
    items: filteredSpares,
    isOpen: showSpareDropdown,
    onSelect: selectSpare,
    onClose: () => setShowSpareDropdown(false),
    onOpen:  () => setShowSpareDropdown(true),
  });
  const typeNav = useDropdownKeyNav({
    items: USAGE_TYPES,
    isOpen: showTypeDropdown,
    onSelect: (opt) => { setUsageType(opt); setShowTypeDropdown(false); },
    onClose: () => setShowTypeDropdown(false),
    onOpen:  () => setShowTypeDropdown(true),
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

      {/* MAIN CONTAINER */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Spare Usage Entry
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">
              Track spare parts and components consumed during PCB production, repairs, or service jobs.
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
            {/* Usage No (Auto Generate) */}
            <div>
              <label className={labelCls}>Usage No (Auto)</label>
              <input
                type="text"
                value={usageNo}
                readOnly
                className={roInputCls}
              />
            </div>

            {/* Usage Date */}
            <div>
              <label className={labelCls}>
                Usage Date <span className="text-red-500">*</span>
              </label>
              <input
                ref={spareUsageDateRef}
                type="text"
                placeholder="Select Date"
                className={inputCls}
                readOnly
              />
            </div>

            {/* Usage Type Dropdown */}
            <div className="relative" ref={typeRef}>
              <label className={labelCls}>
                Usage Type <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => setShowTypeDropdown((p) => !p)}
                onKeyDown={typeNav.handleKeyDown}
                tabIndex={0}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[42px]`}
              >
                <span className={usageType ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {usageType || "Select Usage Type..."}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showTypeDropdown && (
                <div className={dropdownCls}>
                  {USAGE_TYPES.map((opt, i) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setUsageType(opt);
                        setShowTypeDropdown(false);
                      }}
                      className={`px-4 py-2.5 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${i === typeNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Job / Batch No */}
            <div>
              <label className={labelCls}>
                Job / Batch No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobBatchNo}
                onChange={(e) => setJobBatchNo(e.target.value)}
                placeholder="Enter Job / Batch No"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* PCB Model Autocomplete */}
            <div className="relative" ref={pcbRef}>
              <label className={labelCls}>
                PCB Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pcbModel}
                onFocus={() => setShowPcbDropdown(true)}
                onKeyDown={pcbNav.handleKeyDown}
                onChange={(e) => {
                  setPcbModel(e.target.value);
                  setShowPcbDropdown(true);
                }}
                placeholder="Search PCB Model..."
                className={inputCls}
              />
              {showPcbDropdown && (
                <div className={dropdownCls}>
                  {filteredPcbs.length > 0 ? (
                    filteredPcbs.map((pcb, i) => (
                      <div
                        key={pcb.id}
                        onClick={() => selectPcb(pcb)}
                        className={`px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 ${i === pcbNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                      >
                        <div className="text-[13px] font-bold text-gray-800">{pcb.pcb_model}</div>
                        <div className="text-[11px] font-medium text-gray-500">{pcb.pcb_name} ({pcb.pcb_code})</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400 font-medium">No models found</div>
                  )}
                </div>
              )}
            </div>

            {/* Employee Name Autocomplete */}
            <div className="relative" ref={empRef}>
              <label className={labelCls}>
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={employeeName}
                onFocus={() => setShowEmpDropdown(true)}
                onKeyDown={empNav.handleKeyDown}
                onChange={(e) => {
                  setEmployeeName(e.target.value);
                  setShowEmpDropdown(true);
                }}
                placeholder="Search Employee..."
                className={inputCls}
              />
              {showEmpDropdown && (
                <div className={dropdownCls}>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp, i) => (
                      <div
                        key={emp.id}
                        onClick={() => selectEmployee(emp)}
                        className={`px-4 py-2.5 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${i === empNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
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

            {/* Department */}
            <div>
              <label className={labelCls}>
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Employee Department"
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
                placeholder="Enter Remarks"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Spare Code Autocomplete */}
            <div className="relative" ref={spareRef}>
              <label className={labelCls}>
                Spare Code / Search <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={spareCode}
                onFocus={() => setShowSpareDropdown(true)}
                onKeyDown={spareNav.handleKeyDown}
                onChange={(e) => {
                  setSpareCode(e.target.value);
                  setShowSpareDropdown(true);
                }}
                placeholder="Search Spare Code/Name..."
                className={inputCls}
              />
              {showSpareDropdown && (
                <div className={dropdownCls}>
                  {filteredSpares.length > 0 ? (
                    filteredSpares.map((sp, i) => (
                      <div
                        key={sp.id}
                        onClick={() => selectSpare(sp)}
                        className={`px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 ${i === spareNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                      >
                        <div className="text-[13px] font-bold text-gray-800">{sp.spare_name}</div>
                        <div className="text-[11px] font-medium text-gray-500">HSN: {sp.hsn_number}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-gray-400 font-medium">No spares found</div>
                  )}
                </div>
              )}
            </div>

            {/* Spare Name */}
            <div>
              <label className={labelCls}>
                Spare Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={spareName}
                onChange={(e) => setSpareName(e.target.value)}
                placeholder="Spare Name"
                className={inputCls}
              />
            </div>

            {/* Quantity Used */}
            <div>
              <label className={labelCls}>
                Quantity Used <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className={labelCls}>
                Unit Cost <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-3">
            <div className="w-full md:w-80 p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wide">Total Cost:</span>
              <span className="text-xl font-black text-blue-800">
                ₹{totalCost ? Number(totalCost).toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM: Search & List Table */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Spare Usage Log
              </h3>
              <p className="text-[12px] text-gray-400 mt-1">
                List of logged spare usage entries.
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
                placeholder="Search by Usage No, PCB Model, Spare..."
              />
              {showSearchDropdown && (
                <div className={`${dropdownCls} w-72`}>
                  {snoList.length > 0 ? (
                    snoList.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => requirePassword(() => handleLoadEntry(item.usage_no))}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div className="text-[13px] font-bold text-gray-800">{item.usage_no}</div>
                        <div className="text-[11px] font-semibold text-gray-500">{item.spare_name} ({item.usage_type})</div>
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
            <table className="w-full min-w-[1100px] border-collapse text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold select-none">
                  <th className="px-5 py-3 text-center w-[60px]">S.No</th>
                  <th className="px-5 py-3">Usage No</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">PCB Model</th>
                  <th className="px-5 py-3">Spare Code</th>
                  <th className="px-5 py-3">Spare Name</th>
                  <th className="px-5 py-3 text-center">Qty Used</th>
                  <th className="px-5 py-3 text-right pr-6">Total Cost</th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Usage Type</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usageList.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-14 text-center">
                      <div className="text-gray-300 text-4xl mb-3">🧾</div>
                      <p className="text-[13px] text-gray-400 font-medium">No usage records logged yet.</p>
                    </td>
                  </tr>
                ) : (
                  usageList.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3 text-center font-semibold text-gray-400">{index + 1}</td>
                      <td className="px-5 py-3 font-bold text-blue-700">{item.usage_no}</td>
                      <td className="px-5 py-3 font-semibold text-gray-600">
                        {new Date(item.usage_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-800">{item.pcb_model}</td>
                      <td className="px-5 py-3 font-semibold text-gray-700">{item.spare_code}</td>
                      <td className="px-5 py-3 font-bold text-gray-800 uppercase">{item.spare_name}</td>
                      <td className="px-5 py-3 text-center font-bold text-gray-900">{item.quantity_used}</td>
                      <td className="px-5 py-3 text-right pr-6 font-bold text-gray-900">₹{Number(item.total_cost).toFixed(2)}</td>
                      <td className="px-5 py-3 font-semibold text-gray-700">{item.employee_name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 uppercase">
                          {item.usage_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => requirePassword(() => handleLoadEntry(item.usage_no))} title="Edit">
                            <SquarePen size={17} className="text-blue-500 hover:text-blue-700 transition-colors" />
                          </button>
                          <button onClick={() => handleDeleteEntry(item.usage_no)} title="Delete">
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

export default SpareUsage;