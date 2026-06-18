import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2} from "lucide-react";
import toast from "react-hot-toast";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";

const TODAY = new Date().toISOString().split("T")[0];
const Api_url = "http://localhost:3000/api/standbyreturndc";
const REMARKS_OPTIONS = ["Serviced", "Re Serviced", "For Sale", "Beyond", "For Testing Purpose"];
const UOM_LIST = ["NOS", "KG", "MTR", "NO", "SET", "PKT"];



const INIT_FORM = {
    return_dc_no: "",
    return_date: TODAY,
    standby_dc_no: "",
    customer_name: "",
    despatch_through: "",
    general_remarks: ""
};

const INIT_ROW = {
    standby_dc_item_id: "",
    item_name: "",
    serial_no: "",
    hsn_code: "",
    available_qty: "0",
    quantity: "",
    uom: "NOS",
    remarks: ""
};

const DESPATCH_OPTIONS = [" Courier", "Transport", "By Hand"];

const StandbyReturnDcEntryForm = () => {
    const navigate = useNavigate();
    const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

    const [formData, setFormData] = useState(INIT_FORM);
    const [tabledata, settabledata] = useState([]);
    const [currentrow, setCurrentrow] = useState(INIT_ROW);

    const [pendingJobs, setPendingJobs] = useState([]);
    const [selectedJobItems, setSelectedJobItems] = useState([]);
    const [allReturnDc, setAllReturnDc] = useState([]);
    const [loadReturnNo, setLoadReturnNo] = useState("");

    // Success modal state
    const [savedDcNo, setSavedDcNo] = useState("");
    const [showDcFormat, setShowDcFormat] = useState(false);
    const [dcModalMinimized, setDcModalMinimized] = useState(false);

    // Dropdowns
    const [customerOpen, setCustomerOpen] = useState(false);
    const [jobOpen, setJobOpen] = useState(false);
    const [itemOpen, setItemOpen] = useState(false);
    const [despatchOpen, setDespatchOpen] = useState(false);
    const [remarksOpen , setRemarksOpen] = useState(false);
    const [uomOpen, setUomOpen] = useState(false);

    const [editIndex, setEditIndex] = useState(null);

    const customerRef = useRef(null);
    const jobRef = useRef(null);
    const itemRef = useRef(null);
    const despatchRef = useRef(null);
    const uomRef = useRef(null);
    const remarksRef = useRef(null);
    const stdbyRetDateRef = useRef(null);
    const stdbyRetDateFp = useRef(null);

    // Search suggestions
    const [editSearch, setEditSearch] = useState("");
    const [editSuggestions, setEditSuggestions] = useState([]);
    const [editOpen, setEditOpen] = useState(false);
    const editRef = useRef(null);

    const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight";
    const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto";

    useEffect(() => {
        fetchPendingJobs();
        fetchAllReturnDc();
    }, []);

    useEffect(() => {
        stdbyRetDateFp.current = flatpickr(stdbyRetDateRef.current, {
            disableMobile: true,
            monthSelectorType: "static",
            dateFormat: "d-m-Y",
            defaultDate: formData.return_date ? toDmy(formData.return_date) : new Date(),
            onChange: (selectedDates, dateStr) => {
                setFormData(p => ({ ...p, return_date: toYmd(dateStr) }));
            },
        });
        return () => stdbyRetDateFp.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (stdbyRetDateFp.current && formData.return_date) {
            stdbyRetDateFp.current.setDate(toDmy(formData.return_date));
        }
    }, [formData.return_date]);

    useOutsideClick([
        { ref: customerRef, onClose: () => setCustomerOpen(false) },
        { ref: jobRef,      onClose: () => setJobOpen(false) },
        { ref: itemRef,     onClose: () => setItemOpen(false) },
        { ref: despatchRef, onClose: () => setDespatchOpen(false) },
        { ref: editRef,     onClose: () => setEditOpen(false) },
    ]);

 
    const fetchPendingJobs = async () => {
        try {
            const res = await fetch(`${Api_url}/pending-jobs`);
            setPendingJobs(await res.json());
        } catch {
            setPendingJobs([]);
        }
    };

    const fetchAllReturnDc = async () => {
        try {
            const res = await fetch(`${Api_url}/all`);
            setAllReturnDc(await res.json());
        } catch {
            setAllReturnDc([]);
        }
    };

    useEffect(() => {
        if (!editSearch) {
            setEditSuggestions([]);
            return;
        }
        const filtered = allReturnDc.filter(item =>
            item.return_dc_no.toLowerCase().includes(editSearch.toLowerCase())
        );
        setEditSuggestions(filtered.slice(0, 10));
    }, [editSearch, allReturnDc]);

    const handleCustomerSelect = (customer) => {
        setFormData(p => ({
            ...p,
            customer_name: customer,
            standby_dc_no: "",
            general_remarks: ""
        }));
        setSelectedJobItems([]);
        setCustomerOpen(false);
        settabledata([]);
        setCurrentrow(INIT_ROW);
        setJobOpen(true);
    };

    const handleJobSelect = (job) => {
        setFormData(p => ({
            ...p,
            standby_dc_no: job.standby_dc_no,
            customer_name: job.customer_name,
            general_remarks: ""
        }));
        setSelectedJobItems(job.items || []);
        setJobOpen(false);
        settabledata([]);
        setCurrentrow(INIT_ROW);
        if (job.items && job.items.length > 0) {
            setItemOpen(true);
        }
    };

    const handleItemSelect = (item) => {
        setCurrentrow({
            standby_dc_item_id: item.id,
            item_name: item.item_name,
            serial_no: item.serial_no || "",
            hsn_code: item.hsn || "",
            available_qty: item.pending_qty,
            quantity: item.pending_qty,
            uom: item.uom || "NOS",
            remarks: "Returned"
        });
        setItemOpen(false);
    };

    const handleAddData = () => {
        if (!currentrow.item_name || !currentrow.quantity) {
            toast.error("Item Name and Quantity are required");
            return;
        }
        
        const returnQty = Number(currentrow.quantity);
        const availQty = Number(currentrow.available_qty);

        if (isNaN(returnQty) || returnQty <= 0) {
            toast.error("Returned quantity must be greater than 0");
            return;
        }

        if (returnQty > availQty) {
            toast.error(`Returned quantity cannot exceed Available Qty (${availQty})`);
            return;
        }

        if (editIndex !== null && editIndex >= 0) {
            // Update row in-place
            settabledata(p => {
                const updated = [...p];
                updated[editIndex] = { ...currentrow };
                return updated;
            });
            setEditIndex(null);
        } else {
            // Add to grid
            settabledata(p => [...p, { ...currentrow }]);
        }
        // Clear item row inputs
        setCurrentrow(INIT_ROW);
    };

    const handleItemRemove = (index) => {
        settabledata(p => p.filter((_, i) => i !== index));
    };

    const handleClearData = () => {
        setCurrentrow(INIT_ROW);
        setEditIndex(null);
    };

    const handleReset = () => {
        setFormData(p => ({
            ...p,
            standby_dc_no: "",
            customer_name: "",
            despatch_through: "By Hand",
            general_remarks: ""
        }));
        settabledata([]);
        handleClearData();
    };

    const handleSaveReturnDc = () => {
        saveReturnDc();
    };

    const handleDeleteReturnDc = () => {
        deleteReturnDc();
    };

    const saveReturnDc = async () => {
        if (!formData.return_dc_no) { toast.error("Return DC number is required"); return; }
        if (!formData.standby_dc_no) { toast.error("Please select a Standby DC"); return; }
        if (!formData.customer_name) { toast.error("Customer Name is required"); return; }
        if (!formData.despatch_through?.trim()) { toast.error("Despatch Through is required."); return; }
        if (!tabledata.length) { toast.error("Please add at least one returned item to the grid"); return; }

        const payload = {
            ...formData,
            items: tabledata
        };

        const url = loadReturnNo ? `${Api_url}/updatedc/${encodeURIComponent(loadReturnNo)}` : `${Api_url}/createdc`;
        const method = loadReturnNo ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save Return DC");

            setSavedDcNo(formData.return_dc_no);
            fetchAllReturnDc();
            fetchPendingJobs();
        } catch (error) {
            toast.error(error.message || "Failed to Save Return DC");
        }
    };




    const resetAll = () => {
        setFormData(INIT_FORM);
        setSelectedJobItems([]);
        setLoadReturnNo("");
        settabledata([]);
        setEditSearch("");
        setEditIndex(null);
        fetchPendingJobs();
    };

    const loadReturnForEdit = async (returnDc) => {
        try {
            const res = await fetch(`${Api_url}/full/${encodeURIComponent(returnDc.return_dc_no)}`);
            const data = await res.json();
            setFormData({
                return_dc_no: data.return_dc_no || "",
                return_date: data.return_date ? data.return_date.split("T")[0] : TODAY,
                standby_dc_no: data.standby_dc_no || "",
                customer_name: data.customer_name || "",
                despatch_through: data.despatch_through || "By Hand",
                general_remarks: data.general_remarks || ""
            });
            const items = (data.items || []).map(item => ({
                ...item,
                hsn_code: item.hsn_code || ""
            }));
            settabledata(items);
            setLoadReturnNo(data.return_dc_no);
            setEditOpen(false);
            setEditIndex(null);

            if (data.standby_dc_no) {
                const sourceRes = await fetch(`http://localhost:3000/api/standbydcentry/editdc/${encodeURIComponent(data.standby_dc_no)}`);
                if (sourceRes.ok) {
                    const sourceData = await sourceRes.json();
                    setSelectedJobItems(sourceData.items || []);
                    settabledata(prev => prev.map(loadedItem => {
                        const sourceItem = (sourceData.items || []).find(si => si.id === loadedItem.standby_dc_item_id);
                        return {
                            ...loadedItem,
                            available_qty: sourceItem ? (sourceItem.pending_qty + loadedItem.quantity) : loadedItem.quantity
                        };
                    }));
                }
            }

            toast.success("Loaded Return DC");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load Return DC");
        }
    };

    const deleteReturnDc = async () => {
        if (!loadReturnNo) { toast.error("Load a Return DC first to delete"); return; }
        if (!window.confirm(`Delete Return DC ${loadReturnNo}? This will revert the Standby DC item status and pending quantities.`)) return;

        try {
            const res = await fetch(`${Api_url}/deletedc/${encodeURIComponent(loadReturnNo)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("Return DC Deleted");
            resetAll();
            fetchAllReturnDc();
            fetchPendingJobs();
        } catch {
            toast.error("Failed to delete Return DC");
        }
    };

    const handlePrintClick = () => {
        if (loadReturnNo || savedDcNo) {
            setShowDcFormat(true);
        } else {
            toast.error("Save or Load a Return DC to print.");
        }
    };

    const handleEditClick = () => {
        setEditOpen(true);
        if (editRef.current) {
            const input = editRef.current.querySelector("input");
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
        toast.info("Please search or select a Return DC from the registry to edit.");
    };

    return (
        <><div className="min-h-screen bg-gray-50 p-6 font-sans">
            {/* Minimized bar */}
            {showDcFormat && dcModalMinimized && (
                <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setDcModalMinimized(false)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
                    >
                        <div className="w-3 h-3 border border-white/50"></div>
                        Standby Return DC Format
                    </button>
                </div>
            )}

            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit mb-6"
            >
                ← Go Back
            </button>

            <div className="max-w-[1500px] mx-auto bg-white p-8 shadow-sm border border-gray-200 rounded-xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black text-black tracking-tight">STANDBY RETURN ENTRY</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Select Pending Standby DC → Deduct Quantity → Save Return.</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={resetAll} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
                        <button onClick={handleEditClick} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors">EDIT</button>
                        <button onClick={handleSaveReturnDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">{loadReturnNo ? "UPDATE" : "SAVE"}</button>
                        <button onClick={handleReset} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-600 hover:text-white transition-colors">RESET</button>
                        <button onClick={handleDeleteReturnDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
                        <button onClick={handlePrintClick} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-indigo-600 hover:text-white transition-colors">PRINT</button>
                        <button onClick={() => navigate("/")} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-rose-600 hover:text-white transition-colors">CLOSE</button>
                    </div>
                </div>

                {/* Step 1 — Return Details */}
                {(() => {
                    const uniqueCustomers = Array.from(new Set(pendingJobs.map(job => job.customer_name)));
                    return (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Return Details</p>
                            <div className="grid grid-cols-5 gap-5">
                                {/* Customer Name Dropdown */}
                                <div className="relative" ref={customerRef}>
                                    <label className={labelCls}>Customer Name <span className="text-red-500">*</span></label>
                                    <div
                                        onClick={() => { if (!loadReturnNo) setCustomerOpen(p => !p); }}
                                        className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px] ${loadReturnNo ? "bg-blue-50/50 cursor-not-allowed text-blue-800 font-semibold" : ""}`}
                                    >
                                        <span>{formData.customer_name || "Select Customer..."}</span>
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {customerOpen && uniqueCustomers.length > 0 && (
                                        <div className={dropdownCls}>
                                            {uniqueCustomers.map((cust, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleCustomerSelect(cust)}
                                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="text-[13px] font-bold text-gray-900">{cust}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {customerOpen && uniqueCustomers.length === 0 && (
                                        <div className={`${dropdownCls} p-4 text-center text-[12px] text-gray-400 font-semibold`}>
                                            No pending customers available.
                                        </div>
                                    )}
                                </div>

                                {/* DC No (Standby DC Dropdown) */}
                                <div className="relative" ref={jobRef}>
                                    <label className={labelCls}>DC No <span className="text-red-500">*</span></label>
                                    <div
                                        onClick={() => {
                                            if (!loadReturnNo) {
                                                if (!formData.customer_name) {
                                                    toast.error("Please select a Customer first");
                                                    return;
                                                }
                                                setJobOpen(p => !p);
                                            }
                                        }}
                                        className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px] ${loadReturnNo ? "bg-blue-50/50 cursor-not-allowed text-blue-800 font-semibold" : ""} ${!formData.customer_name ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                                    >
                                        <span>{formData.standby_dc_no || "Select DC No..."}</span>
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {jobOpen && pendingJobs.filter(j => j.customer_name === formData.customer_name).length > 0 && (
                                        <div className={dropdownCls}>
                                            {pendingJobs
                                                .filter(j => j.customer_name === formData.customer_name)
                                                .map((job) => (
                                                    <div
                                                        key={job.id}
                                                        onClick={() => handleJobSelect(job)}
                                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="text-[13px] font-bold text-gray-900">{job.standby_dc_no}</div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    {jobOpen && pendingJobs.filter(j => j.customer_name === formData.customer_name).length === 0 && (
                                        <div className={`${dropdownCls} p-4 text-center text-[12px] text-gray-400 font-semibold`}>
                                            No pending standby jobs for this customer.
                                        </div>
                                    )}
                                </div>

                                {/* Return DC No (Manual Entry) */}
                                <div>
                                    <label className={labelCls}>
                                        Return DC No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.return_dc_no || ""}
                                        onChange={(e) => setFormData(p => ({ ...p, return_dc_no: e.target.value }))}
                                        className={loadReturnNo ? roInputCls : inputCls}
                                        disabled={!!loadReturnNo}
                                        placeholder="Enter Return DC No"
                                    />
                                </div>
                                
                                {/* Date */}
                                <div>
                                    <label className={labelCls}>Date</label>
                                    <input
                                        ref={stdbyRetDateRef}
                                        type="text"
                                        placeholder="Select Date"
                                        className={inputCls}
                                        readOnly
                                    />
                                </div>

                                {/* Despatch Through */}
                                <div className="relative" ref={despatchRef}>
                                    <label className={labelCls}>Despatch Through</label>
                                    <div
                                        onClick={() => { if (!loadReturnNo) setDespatchOpen(p => !p); }}
                                        className={`${inputCls} flex justify-between items-center cursor-pointer select-none min-h-[43px] ${loadReturnNo ? "bg-blue-50/50 cursor-not-allowed text-blue-800 font-semibold" : ""}`}
                                    >
                                        <span className={formData.despatch_through ? "text-black" : "text-gray-400"}>
                                            {formData.despatch_through || "Select despatch mode"}
                                        </span>
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {despatchOpen && (
                                        <div className={dropdownCls}>
                                            {DESPATCH_OPTIONS.map((d) => (
                                                <div
                                                    key={d}
                                                    onClick={() => { setFormData(p => ({ ...p, despatch_through: d })); setDespatchOpen(false); }}
                                                    className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${formData.despatch_through === d ? "bg-blue-50 text-blue-700" : ""}`}
                                                >
                                                    {d}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Step 2 — Add Return Items */}
                <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 2 — Add Return Items</p>
                    <div className="grid grid-cols-9 gap-2">
                        {/* Item Name dropdown */}
                        <div className="relative col-span-2" ref={itemRef}>
                            <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
                            <div
                                onClick={() => { if (selectedJobItems.length > 0 && !loadReturnNo) setItemOpen(p => !p); }}
                                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px] ${selectedJobItems.length === 0 || loadReturnNo ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                            >
                                <span className={currentrow.item_name ? "text-black font-semibold" : "text-gray-400 font-normal"}>
                                    {currentrow.item_name || "Select item..."}
                                </span>
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {itemOpen && selectedJobItems.length > 0 && (
                                <div className={dropdownCls}>
                                    {selectedJobItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleItemSelect(item)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] border-b border-gray-50 last:border-0 font-semibold text-gray-800"
                                        >
                                            {item.item_name} (Pend: {item.pending_qty})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Serial Number */}
                        <div>
                            <label className={labelCls}>Serial No</label>
                            <input
                                type="text"
                                placeholder="Serial No"
                                value={currentrow.serial_no || ""}
                                onChange={(e) => setCurrentrow(p => ({ ...p, serial_no: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* HSN Code */}
                        <div>
                            <label className={labelCls}>HSN Code</label>
                            <input type="text" value={currentrow.hsn_code || ""} readOnly className={roInputCls} placeholder="HSN" />
                        </div>

                        {/* Quantity (returned quantity) */}
                        <div>
                            <label className={labelCls}>Quantity <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={currentrow.quantity}
                                onChange={(e) => setCurrentrow(p => ({ ...p, quantity: e.target.value }))}
                                className={inputCls}
                            />
                        </div>
                         <div className="relative" ref={uomRef}>
                            <label className={labelCls}>UOM</label>
                            <input
                                type="text"
                                placeholder="UOM"
                                value={currentrow.uom}
                                onFocus={() => setUomOpen(true)}
                                onChange={(e) => setCurrentrow(p => ({ ...p, uom: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                            {uomOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                    {UOM_LIST.map((unit) => (
                                        <div
                                            key={unit}
                                            onClick={() => {
                                                setCurrentrow(p => ({ ...p, uom: unit }));
                                                setUomOpen(false);
                                            }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        >
                                            {unit}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Remarks */}
                        <div className="col-span-2 relative" ref={remarksRef}>
                            <label className={labelCls}>Remarks</label>
                             <div
                                onClick={() => setRemarksOpen((p) => !p)}
                                className={`${inputCls} bg-gray-50/50 flex justify-between items-center cursor-pointer select-none min-h-[43px]`}
                            >
                                <span className={currentrow.remarks ? "text-black" : "text-gray-400"}>
                                    {currentrow.remarks || "Select"}
                                </span>
                            </div>

                            {/* Dropdwons */}

                              {remarksOpen && (
                                <div className={dropdownCls}>
                                    {REMARKS_OPTIONS.map((remarks) => (
                                        <div
                                            key={remarks}
                                            onClick={() => {
                                                setCurrentrow((p) => ({ ...p, remarks }));
                                                setRemarksOpen(false);
                                            }}
                                            className={`px-3 py-2 cursor-pointer hover:bg-blue-100 text-[13px] font-semibold border-b border-gray-50 last:border-0 ${currentrow.remarks === remarks ? "bg-blue-50 text-blue-700" : ""}`}
                                        >
                                            {remarks}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* Action buttons ADD / CLR */}
                        <div className="mt-5 flex items-center gap-2">
                            <button
                                onClick={handleAddData}
                                className="flex-1 bg-green-500 text-white py-2.5 px-3 rounded-lg hover:bg-green-600 text-[13px] font-bold transition-colors"
                            >
                                {editIndex !== null ? "UPDATE" : "ADD"}
                            </button>
                            <button
                                onClick={handleClearData}
                                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors"
                            >
                                CLR
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4 bg-white">
                    <div className="h-[250px] overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["#", "Item Name", "Serial Number", "HSN Code", "Qty", "Remarks", "Actions"].map((h, i) => (
                                    <th key={i} className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-r border-gray-100 last:border-0">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tabledata.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center">
                                        <div className="text-gray-300 text-4xl mb-3">📦</div>
                                        <p className="text-[13px] text-gray-400 font-medium">No items added yet.</p>
                                        <p className="text-[12px] text-gray-300 mt-1">Select a Standby DC and items to begin.</p>
                                    </td>
                                </tr>
                            ) : (
                                tabledata.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-[12px] text-gray-500 border-r w-[5%]">{idx + 1}</td>
                                        <td className="p-3 text-[12px] font-semibold border-r w-[30%]">{item.item_name}</td>
                                        <td className="p-3 text-[12px] border-r w-[15%]">{item.serial_no || "—"}</td>
                                        <td className="p-3 text-[12px] border-r w-[10%]">{item.hsn_code || "—"}</td>
                                        <td className="p-3 text-[12px] border-r w-[10%]">{item.quantity}</td>
                                        <td className="p-3 text-[12px] border-r w-[20%]">{item.remarks || "—"}</td>
                                        <td className="p-3 w-[10%]">
                                            <div className="flex gap-3 justify-center">
                                                <SquarePen onClick={() => {
                                                    setCurrentrow({ ...item });
                                                    setEditIndex(idx);
                                                }} className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800" />
                                                <Trash2 onClick={() => handleItemRemove(idx)} className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 bg-blue-50 border-t-2 border-gray-200">
                            <tr>
                                <td colSpan={7} className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-[13px] font-black text-gray-600 uppercase tracking-wide">TOTAL QTY</span>
                                        <span className="text-[13px] font-black text-gray-500">:</span>
                                        <span className="text-[18px] font-black text-blue-700">{tabledata.reduce((s, r) => s + Number(r.quantity || 0), 0)}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6">
                    <div>
                        <label className={labelCls}>General Remarks</label>
                        <input
                            type="text"
                            value={formData.general_remarks || ""}
                            onChange={(e) => setFormData(p => ({ ...p, general_remarks: e.target.value }))}
                            placeholder="Add general return notes..."
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* Select Return DC No to View / Modify Details */}
                <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6 relative" ref={editRef}>
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic shrink-0">
                        Select Return DC No To View / Modify :
                    </label>
                    <div className="relative w-[250px]">
                        <input
                            type="text"
                            value={editSearch}
                            onFocus={() => setEditOpen(true)}
                            onChange={(e) => { setEditSearch(e.target.value); setEditOpen(true); }}
                            placeholder="AT/SBRDC-001"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-white"
                        />
                        {editOpen && editSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                {editSuggestions.map((dc, i) => (
                                    <div key={i}
                                         onClick={() => { setEditSearch(dc.return_dc_no); setEditOpen(false); requirePassword(() => loadReturnForEdit(dc)); }}
                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-b border-gray-50 last:border-0 text-gray-800"
                                    >
                                        {dc.return_dc_no}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stored Standby Return DC Entries Registry */}
                <div className="mt-10">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-base font-black text-gray-800">
                            {formData.customer_name
                                ? `Standby Return DC Entries — ${formData.customer_name}`
                                : "All Standby Return DC Entries"}
                        </h2>
                        <span className="text-[11px] text-gray-400">{allReturnDc.length} record{allReturnDc.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="w-full border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto bg-white font-semibold">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 sticky top-0 font-bold">
                                <tr>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Return DC No</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Customer Name</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Standby DC No</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Date</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Despatch Through</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">General Remarks</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allReturnDc.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No Standby Return DC entries found.</td></tr>
                                ) : (
                                    allReturnDc.map((dc, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 font-normal">
                                            <td className="p-3 text-[12px] font-semibold border-r">{dc.return_dc_no}</td>
                                            <td className="p-3 text-[12px] border-r">{dc.customer_name}</td>
                                            <td className="p-3 text-[12px] border-r font-semibold">{dc.standby_dc_no}</td>
                                            <td className="p-3 text-[12px] border-r">
                                                {dc.return_date ? new Date(dc.return_date).toLocaleDateString("en-GB") : "—"}
                                            </td>
                                            <td className="p-3 text-[12px] border-r">{dc.despatch_through || "—"}</td>
                                            <td className="p-3 text-[12px] border-r text-gray-600">{dc.general_remarks || "—"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
            {showPasswordModal && (
                <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
            )}
    </>);
};

export default StandbyReturnDcEntryForm;
