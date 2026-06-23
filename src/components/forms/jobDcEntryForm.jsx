import API_BASE_URL from "../../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2, CheckCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import JobDeliveryChallan from "../pages/Services/jobDcFormat";
import ServiceWindowModal from "../ui/servicewindowModal";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const TODAY = new Date().toISOString().split("T")[0];
const Api_url = `${API_BASE_URL}/jobdcentry`;
const REMARKS_OPTIONS = ["Serviced", "Re Serviced", "For Sale", "Beyond", "For Testing Purpose"];

const INIT_FORM = {
    job_dc_no: "",
    dc_date: TODAY,
    customer_name: "",
    is_returnable: "No",
    order_no: "",
    order_date: "",
    despatch_through: "",
    purpose: "",
    order_type: "Service" // Default order type
};

const INIT_ROW = {
    item_name: "",
    serial_no: "",
    quantity: "",
    uom: "NOS",
    remarks: "",
    hsn: ""
};

const UOM_LIST = ["NOS", "KG", "MTR", "NO", "SET", "PKT"];
const DESPATCH_OPTIONS = [ "Courier", "Transport", "By Hand"];

const JobDcEntryForm = () => {
    const navigate = useNavigate();
    const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

    const [formData, setFormData] = useState(INIT_FORM);
    const [tabledata, settabledata] = useState([]);
    const [currentrow, setCurrentrow] = useState(INIT_ROW);
    const [editIndex, setEditIndex] = useState(-1);
    const [loadDcId, setLoadDcId] = useState("");
    const [allDcData, setAllDcData] = useState([]);

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedDcNo, setSavedDcNo] = useState("");
    const [showDcFormat, setShowDcFormat] = useState(false);
    const [dcModalMinimized, setDcModalMinimized] = useState(false);
    const [viewDcNo, setViewDcNo] = useState("");

    // Customer autocomplete
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerOpen, setCustomerOpen] = useState(false);
    const customerRef = useRef(null);

    // Spares/Services autocomplete
    const [spares, setSpares] = useState([]);
    const [services, setServices] = useState([]);
    const [spareOpen, setSpareOpen] = useState(false);
    const spareRef = useRef(null);

    // Dropdowns
    const [despatchOpen, setDespatchOpen] = useState(false);
    const [uomOpen, setUomOpen] = useState(false);
    const despatchRef = useRef(null);
    const uomRef = useRef(null);
    const [remarksOpen, setRemarksOpen] = useState(false);
    const remarksRef = useRef(null);

    // Search existing
    const [editSearch, setEditSearch] = useState("");
    const [editSuggestions, setEditSuggestions] = useState([]);
    const [editOpen, setEditOpen] = useState(false);
    const editRef = useRef(null);
    const jobDcDateRef = useRef(null);
    const jobDcDateFp = useRef(null);

    const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight";
    const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto";

    useEffect(() => {
        fetchNextDcNo();
        fetchAllDc();
        fetchSpares();
        fetchServices();
    }, []);

    useOutsideClick([
        { ref: customerRef, onClose: () => setCustomerOpen(false) },
        { ref: spareRef,    onClose: () => setSpareOpen(false) },
        { ref: despatchRef, onClose: () => setDespatchOpen(false) },
        { ref: uomRef,      onClose: () => setUomOpen(false) },
        { ref: editRef,     onClose: () => setEditOpen(false) },
    ]);

    const fetchNextDcNo = async () => {
        try {
            const res = await fetch(`${Api_url}/next-dc-no`);
            const data = await res.json();
            setFormData(p => ({ ...p, job_dc_no: data.dc_no }));
        } catch {
            console.error("Could not fetch Job DC No");
        }
    };

    const fetchSpares = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/Sparemodels/all`);
            setSpares(await res.json());
        } catch {
            setSpares([]);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/Services/all`);
            setServices(await res.json());
        } catch {
            setServices([]);
        }
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const url = customerSearch
                    ? `${API_BASE_URL}/customers/search?q=${encodeURIComponent(customerSearch)}`
                    : `${API_BASE_URL}/customers/all`;
                const res = await fetch(url);
                const data = await res.json();
                setCustomers(Array.isArray(data) ? data : []);
            } catch { setCustomers([]); }
        };
        fetchCustomers();
    }, [customerSearch]);

    useEffect(() => {
        const fetchEditDc = async () => {
            try {
                const res = await fetch(`${Api_url}/DC/search?q=${encodeURIComponent(editSearch || "")}`);
                setEditSuggestions(await res.json());
            } catch { setEditSuggestions([]); }
        };
        fetchEditDc();
    }, [editSearch]);

    const fetchAllDc = async () => {
        try {
            const res = await fetch(`${Api_url}/all`);
            setAllDcData(await res.json());
        } catch { setAllDcData([]); }
    };

    const handleCustomerSelect = (client) => {
        setFormData(p => ({
            ...p,
            customer_name: client.customer_name
        }));
        setCustomerSearch(client.customer_name);
        setCustomerOpen(false);
    };

    const handleSpareSelect = (sp) => {
        setCurrentrow(p => ({
            ...p,
            item_name: sp.spare_name,
            uom: "NOS",
            hsn: sp.hsn_number || ""
        }));
        setSpareOpen(false);
    };

    const handleServiceSelect = (sv) => {
        setCurrentrow(p => ({
            ...p,
            item_name: sv.service_name,
            uom: "NOS",
            hsn: sv.hsn_number || ""
        }));
        setSpareOpen(false);
    };

    const handleAddData = () => {
        if (!currentrow.item_name || !currentrow.quantity) {
            toast.error("Item Name and Quantity are required");
            return;
        }
        if (editIndex >= 0) {
            settabledata(p => {
                const updated = [...p];
                updated[editIndex] = { ...currentrow };
                return updated;
            });
            setEditIndex(-1);
        } else {
            settabledata(p => [...p, { ...currentrow }]);
        }
        setCurrentrow(INIT_ROW);
    };

    const editItem = (index) => {
        setCurrentrow({ ...tabledata[index] });
        setEditIndex(index);
    };

    const deleteItem = (index) => {
        settabledata(p => p.filter((_, i) => i !== index));
    };

    const handleClearData = () => {
        setCurrentrow(INIT_ROW);
    };

    const handleReset = () => {
        setFormData(p => ({
            ...p,
            customer_name: "",
            is_returnable: "No",
            despatch_through: "By Hand",
            purpose: "",
            order_type: "Service"
        }));
        setCustomerSearch("");
        settabledata([]);
        handleClearData();
    };

    const handleSaveDc = () => {
        SaveDc();
    };

    const handleDeleteDc = () => {
        deleteDc();
    };

    const SaveDc = async () => {
        if (!formData.customer_name.trim()) { toast.error("Customer Name is required"); return; }
        if (!formData.job_dc_no.trim()) { toast.error("Job DC Number is required"); return; }
        if (!formData.dc_date) { toast.error("DC Date is required"); return; }
        if (!formData.despatch_through?.trim()) { toast.error("Despatch Through is required."); return; }
        if (!tabledata.length) { toast.error("Please add at least one item"); return; }

        const payload = {
            ...formData,
            items: tabledata
        };

        try {
            const method = loadDcId ? "PUT" : "POST";
            const url = loadDcId
                ? `${Api_url}/updatedc/${loadDcId}`
                : `${Api_url}/createdc`;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "failed");

            setSavedDcNo(formData.job_dc_no);
            setShowSuccessModal(true);
            fetchAllDc();
        } catch (error) {
            toast.error(error.message || "Failed to Save Job DC");
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setShowDcFormat(false);
        resetAll();
    };

    const handleViewDc = () => {
        setViewDcNo(savedDcNo);
        setShowSuccessModal(false);
        setDcModalMinimized(false);
        setShowDcFormat(true);
    };

    const resetAll = () => {
        setFormData(INIT_FORM);
        setCustomerSearch("");
        setEditSearch("");
        settabledata([]);
        setLoadDcId("");
        fetchNextDcNo();
    };

    const loadDcForEdit = async (dcNumber) => {
        try {
            const res = await fetch(`${Api_url}/editdc/${encodeURIComponent(dcNumber)}`);
            const data = await res.json();
            const h = data.header;
            setFormData({
                job_dc_no: h.job_dc_no || "",
                dc_date: h.dc_date ? h.dc_date.split("T")[0] : TODAY,
                customer_name: h.customer_name || "",
                is_returnable: h.is_returnable || "No",
                despatch_through: h.despatch_through || "By Hand",
                purpose: h.purpose || "",
                order_type: h.order_type || "Service"
            });
            setCustomerSearch(h.customer_name || "");
            settabledata(data.items || []);
            setLoadDcId(h.id);
            toast.success("Job DC Loaded");
            setEditOpen(false);
        } catch {
            toast.error("Failed to Load Job DC");
        }
    };

    const deleteDc = async () => {
        if (!loadDcId) { toast.error("Load a Job DC first to delete"); return; }
        if (!window.confirm("Delete this Job DC? This cannot be undone.")) return;
        try {
            const res = await fetch(`${Api_url}/deletedc/${encodeURIComponent(formData.job_dc_no)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("Job DC Deleted");
            resetAll();
            fetchAllDc();
        } catch {
            toast.error("Failed to Delete Job DC");
        }
    };

    const handlePrintClick = () => {
        if (loadDcId || savedDcNo) {
            setViewDcNo(formData.job_dc_no);
            setDcModalMinimized(false);
            setShowDcFormat(true);
        } else {
            toast.error("Save or Load a DC to print.");
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
        toast.info("Please search or select a Job DC from the registry to edit.");
    };

    const filteredSpares = spares.filter(s =>
        s.spare_name.toLowerCase().includes((currentrow.item_name || "").toLowerCase())
    );

    const filteredServices = services.filter(s =>
        s.service_name.toLowerCase().includes((currentrow.item_name || "").toLowerCase())
    );

    useEffect(() => {
        jobDcDateFp.current = flatpickr(jobDcDateRef.current, {
            disableMobile: true,
            monthSelectorType: "static",
            dateFormat: "d-m-Y",
            defaultDate: toDmy(formData.dc_date) || new Date(),
            onChange: (selectedDates, dateStr) => {
                setFormData(p => ({ ...p, dc_date: toYmd(dateStr) }));
            },
        });
        return () => jobDcDateFp.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (jobDcDateFp.current && formData.dc_date) {
            jobDcDateFp.current.setDate(toDmy(formData.dc_date));
        }
    }, [formData.dc_date]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-1">Job DC Saved Successfully!</h2>
                        <p className="text-sm text-gray-500 mb-1">Job DC has been created.</p>
                        <p className="text-sm font-black text-blue-600 mb-6">{savedDcNo}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleViewDc}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> View DC
                            </button>
                            <button
                                onClick={handleCloseSuccessModal}
                                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            <ServiceWindowModal
                title="Job DC Format"
                isOpen={showDcFormat}
                type="Job DC Format"
                isMinimized={dcModalMinimized}
                onMinimize={() => setDcModalMinimized(true)}
                onClose={() => { setShowDcFormat(false); setDcModalMinimized(false); resetAll(); }}
                filters={{ dcNumber: viewDcNo }}
                onFilterChange={(f) => setViewDcNo(f.dcNumber || viewDcNo)}
            >
                <JobDeliveryChallan key={viewDcNo} dcNumber={viewDcNo} />
            </ServiceWindowModal>

            {/* Minimized bar */}
            {showDcFormat && dcModalMinimized && (
                <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setDcModalMinimized(false)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
                    >
                        <div className="w-3 h-3 border border-white/50"></div>
                        Job DC Format
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
                        <h2 className="text-xl font-black text-black tracking-tight">JOB DC ENTRY</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Customer → Job DC → Items → Save</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={resetAll} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
                        <button onClick={handleEditClick} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors">EDIT</button>
                        <button onClick={handleSaveDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">{loadDcId ? "UPDATE" : "SAVE"}</button>
                        <button onClick={handleReset} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-600 hover:text-white transition-colors">RESET</button>
                        <button onClick={handleDeleteDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
                        <button onClick={handlePrintClick} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-indigo-600 hover:text-white transition-colors">PRINT</button>
                        <button onClick={() => navigate("/")} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-rose-600 hover:text-white transition-colors">CLOSE</button>
                    </div>
                </div>

                {/* Step 1 — Client + DC Header */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Client Details</p>
                    <div className="grid grid-cols-4 gap-5">
                        {/* Customer Name */}
                        <div className="relative" ref={customerRef}>
                            <label className={labelCls}>Supplier / Client <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setFormData(p => ({ ...p, customer_name: e.target.value }));
                                    setCustomerOpen(true);
                                }}
                                onFocus={() => setCustomerOpen(true)}
                                placeholder="Type to search client..."
                                className={inputCls}
                            />
                            {customerOpen && customers.length > 0 && (
                                <div className={dropdownCls}>
                                    {customers.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleCustomerSelect(c)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                                        >
                                            {c.customer_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Job DC No */}
                        <div>
                            <label className={labelCls}>
                                Job DC No <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                            </label>
                            <input type="text" value={formData.job_dc_no} readOnly className={roInputCls} />
                        </div>

                        {/* DC Date */}
                        <div>
                            <label className={labelCls}>DC Date</label>
                            <input ref={jobDcDateRef} type="text" readOnly className={inputCls} />
                        </div>

                        {/* Despatch Through */}
                        <div className="relative" ref={despatchRef}>
                            <label className={labelCls}>Despatch Through</label>
                            <div
                                onClick={() => setDespatchOpen(p => !p)}
                                className={`${inputCls} flex justify-between items-center cursor-pointer select-none min-h-[43px]`}
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

                {/* Step 2 — Order Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2 — Order Details</p>
                    <div className="grid grid-cols-4 gap-5">
                        {/* Order Type */}
                        <div>
                            <label className={labelCls}>
                                Order Type <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-6 h-[43px]">
                                {["Service", "Spare"].map((type) => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="order_type"
                                            value={type}
                                            checked={formData.order_type === type}
                                            onChange={(e) => {
                                                setFormData(p => ({ ...p, order_type: e.target.value }));
                                                handleClearData();
                                            }}
                                            className="w-4 h-4 accent-black cursor-pointer"
                                        />
                                        <span className="text-[12px] font-bold text-gray-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* Order No */}
                        {/* <div>
                            <label className={labelCls}>Order No <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="Enter Order Number"
                                value={formData.order_no}
                                onChange={(e) => setFormData(p => ({ ...p, order_no: e.target.value }))}
                                className={inputCls}
                            />
                        </div> */}

                        {/* <div>
                            <label className={labelCls}>Order Date</label>
                            <input
                                type="text"
                                placeholder="Enter Order Date(s)"
                                value={formData.order_date}
                                onChange={(e) => setFormData(p => ({ ...p, order_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div> */}

                    </div>
                </div>

                {/* Step 3 — Add Items */}
                <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 3 — Add Items</p>
                    <div className="grid grid-cols-9 gap-2">
                        {/* Product / Item Name input */}
                        <div className="col-span-2 relative" ref={spareRef}>
                            <label className={labelCls}>Product <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={currentrow.item_name}
                                onFocus={() => setSpareOpen(true)}
                                onChange={(e) => {
                                    setCurrentrow(p => ({ ...p, item_name: e.target.value }));
                                    setSpareOpen(true);
                                }}
                                placeholder={formData.order_type === "Spare" ? "Search spare item..." : "Search service item..."}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                            {spareOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-48 overflow-y-auto border border-gray-200">
                                    {formData.order_type === "Spare" ? (
                                        filteredSpares.length > 0 ? (
                                            filteredSpares.map((sp) => (
                                                <div
                                                    key={sp.id}
                                                    onClick={() => handleSpareSelect(sp)}
                                                    className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-[13px] font-semibold text-gray-900"
                                                >
                                                    {sp.spare_name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2.5 text-gray-400 text-xs font-semibold">No spares found</div>
                                        )
                                    ) : (
                                        filteredServices.length > 0 ? (
                                            filteredServices.map((sv) => (
                                                <div
                                                    key={sv.id}
                                                    onClick={() => handleServiceSelect(sv)}
                                                    className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-[13px] font-semibold text-gray-900"
                                                >
                                                    {sv.service_name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2.5 text-gray-400 text-xs font-semibold">No services found</div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Serial Number */}
                        <div>
                            <label className={labelCls}>Serial Number</label>
                            <input
                                type="text"
                                placeholder="Serial Number"
                                value={currentrow.serial_no || ""}
                                onChange={(e) => setCurrentrow(p => ({ ...p, serial_no: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                        </div>
                        

                        {/* Qty */}
                        <div>
                            <label className={labelCls}>Qty</label>
                            <input
                                type="text"
                                placeholder="Quantity"
                                value={currentrow.quantity}
                                onChange={(e) => setCurrentrow(p => ({ ...p, quantity: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* UOM with dropdown */}
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

                    {/* Hsn */}
                        <div>
                            <label className={labelCls}>HSN</label>
                            <input
                                type="text"
                                placeholder="HSN"
                                value={currentrow.hsn}
                                onChange={(e) => setCurrentrow(p => ({ ...p, hsn: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
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
                            className={`flex-1 text-white py-2.5 px-3 rounded-lg text-[13px] font-bold transition-colors ${editIndex >= 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"}`}
                        >
                            {editIndex >= 0 ? "UPD" : "ADD"}
                        </button>
                        <button
                            onClick={() => { handleClearData(); setEditIndex(-1); }}
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
                            {["#", "Item Name", "Serial Number", "Qty", "UOM", "Remarks", "Actions"].map((h, i) => (
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
                                    <p className="text-[12px] text-gray-300 mt-1">Select an order type and product to begin.</p>
                                </td>
                            </tr>
                        ) : (
                            tabledata.map((item, idx) => (
                                <tr key={idx} className={`border-b border-gray-100 ${editIndex === idx ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                                    <td className="p-3 text-[12px] text-gray-500 border-r w-[5%]">{idx + 1}</td>
                                    <td className="p-3 text-[12px] font-semibold border-r w-[35%]">{item.item_name}</td>
                                    <td className="p-3 text-[12px] border-r w-[15%]">{item.serial_no || "—"}</td>
                                    <td className="p-3 text-[12px] border-r w-[10%]">{item.quantity}</td>
                                    <td className="p-3 text-[12px] border-r w-[10%]">{item.uom}</td>
                                    <td className="p-3 text-[12px] border-r w-[15%]">{item.remarks || "—"}</td>
                                    <td className="p-3 w-[10%]">
                                        <div className="flex gap-3 justify-center">
                                            <SquarePen onClick={() => editItem(idx)} className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800" />
                                            <Trash2 onClick={() => deleteItem(idx)} className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-10">
                        <tr>
                            <td colSpan={7} className="px-4 py-3">
                                <div className="flex items-center ml-[30%] gap-2">
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
                    <label className={labelCls}>Purpose</label>
                    <input
                        type="text"
                        value={formData.purpose || ""}
                        onChange={(e) => setFormData(p => ({ ...p, purpose: e.target.value }))}
                        placeholder="State the purpose of the Job DC..."
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Select Job DC No to View / Modify Details */}
            <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6 relative" ref={editRef}>
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic shrink-0">
                    Select Job DC No To View / Modify :
                </label>
                <div className="relative w-[250px]">
                    <input
                        type="text"
                        value={editSearch}
                        onFocus={() => setEditOpen(true)}
                        onChange={(e) => { setEditSearch(e.target.value); setEditOpen(true); }}
                        placeholder="AT/JBDC-001"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-white"
                    />
                    {editOpen && editSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                            {editSuggestions.map((dc, i) => (
                                    <div key={i}
                                        onClick={() => { setEditSearch(dc.dc_number); setEditOpen(false); requirePassword(() => loadDcForEdit(dc.dc_number)); }}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-b border-gray-50 last:border-0 text-gray-800"
                                    >
                                        {dc.dc_number}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stored Job DC Entries Registry */}
            <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-base font-black text-gray-800">
                        {formData.customer_name
                            ? `Job DC Entries — ${formData.customer_name}`
                            : "All Job DC Entries"}
                    </h2>
                    <span className="text-[11px] text-gray-400">{allDcData.length} record{allDcData.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto bg-white">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Job DC No</th>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Customer Name</th>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Date</th>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Order Type</th>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Return</th>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Purpose</th>
                                <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allDcData.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No Job DC entries found.</td></tr>
                            ) : (
                                allDcData.map((dc, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-[12px] font-semibold border-r">{dc.job_dc_no}</td>
                                        <td className="p-3 text-[12px] border-r">{dc.customer_name}</td>
                                        <td className="p-3 text-[12px] border-r">
                                            {dc.dc_date ? new Date(dc.dc_date).toLocaleDateString("en-GB") : "—"}
                                        </td>
                                        <td className="p-3 text-[12px] border-r font-medium text-blue-600">{dc.order_type || "Service"}</td>
                                        <td className="p-3 text-[12px] border-r">{dc.is_returnable || "No"}</td>
                                        <td className="p-3 text-[12px] border-r text-gray-600">{dc.purpose || "—"}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => requirePassword(() => loadDcForEdit(dc.job_dc_no))}
                                                    className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => { setViewDcNo(dc.job_dc_no); setDcModalMinimized(false); setShowDcFormat(true); }}
                                                    className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
                                                >
                                                    Print
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

export default JobDcEntryForm;
