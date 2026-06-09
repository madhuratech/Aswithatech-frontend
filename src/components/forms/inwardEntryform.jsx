import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2, CheckCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";

const TODAY = new Date().toISOString().split("T")[0];
const Api_url = "http://localhost:3000/api/Inwardentries";

const INIT_FORM = {
    supplier_name: "",
    sl_no: "",
    entry_date: TODAY,
    dc_number: "",
    dc_date: TODAY,
    transport: "",
    description_type: "",
    remarks: ""
};

const INIT_ROW = {
    item_name: "",
    quantity: "",
    unit: "",
    pcb_sl_no: "",
    hsn: "",
    problems: "",
    remarks: ""
};

const UOM_LIST = ["NOS", "KG", "MTR", "NO", "SET", "PKT"];
const TRANSPORT_OPTIONS = ["By Hand", "By Courier", "FedEx", "DHL", "BlueDart", "Delhivery"];
const REMARKS_OPTIONS = ["Damaged", "Services", "sell", "Under Warranty"];

const InwardEntry = () => {
    const navigate = useNavigate();

    // Form & Table States
    const [formData, setFormData] = useState(INIT_FORM);
    const [tabledata, settabledata] = useState([]);
    const [currentrow, setCurrentrow] = useState(INIT_ROW);
    const [orderType, setOrderType] = useState("");
    const [shouldAutoSelect, setShouldAutoSelect] = useState(false);

    // suggestions / data
    const [clients, setClients] = useState([]);
    const [items, setItems] = useState([]);
    const [allInwardData, setAllInwardData] = useState([]);
    const [inwardList, setInwardlist] = useState([]);

    // search inputs
    const [supplierSearch, setSupplierSearch] = useState("");
    const [itemsearch, setitemsearch] = useState("");
    const [inwardSearch, setInwardSearch] = useState("");

    // Dropdown open states
    const [clientOpen, setclientOpen] = useState(false);
    const [itemOpen, setitemOpen] = useState(false);
    const [transportOpen, setTransportOpen] = useState(false);
    const [remarksopen, setRemarksOpen] = useState(false);
    const [openunit, setOpenUnit] = useState(false);
    const [inwardnoOpen, setinwardnoOpen] = useState(false);

    // Success Modal & View States
    const [savedInwardNo, setSavedInwardNo] = useState("");
    const [viewInwardNo, setViewInwardNo] = useState("");

    // Refs
    const clientRef = useRef(null);
    const itemRef = useRef(null);
    const unitRef = useRef(null);
    const inwardRef = useRef(null);
    const transportRef = useRef(null);
    const remarksRef = useRef(null);

    const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight";
    const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto";

    // Setup initial data & click outside handler
    useEffect(() => {
        fetchNextSl();
        fetchAllInward();

        const handleClickOutside = (event) => {
            if (clientRef.current && !clientRef.current.contains(event.target)) setclientOpen(false);
            if (itemRef.current && !itemRef.current.contains(event.target)) setitemOpen(false);
            if (unitRef.current && !unitRef.current.contains(event.target)) setOpenUnit(false);
            if (inwardRef.current && !inwardRef.current.contains(event.target)) setinwardnoOpen(false);
            if (transportRef.current && !transportRef.current.contains(event.target)) setTransportOpen(false);
            if (remarksRef.current && !remarksRef.current.contains(event.target)) setRemarksOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Clients for Dropdowns
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const url = supplierSearch
                    ? `${Api_url}/clients/search?q=${encodeURIComponent(supplierSearch)}`
                    : `${Api_url}/clients`;

                const res = await fetch(url);
                const data = await res.json();
                setClients(data);
            } catch (err) {
                console.error("Error fetching clients:", err);
            }
        };
        fetchClients();
    }, [supplierSearch]);

    // Fetch Next SL number
    const fetchNextSl = async () => {
        try {
            const res = await fetch(`${Api_url}/next-sl`);
            const data = await res.json();
            setFormData(prev => ({ ...prev, sl_no: data.sl_no }));
        } catch (err) {
            console.error("SL fetch error:", err);
        }
    };

    // Fetch All Inward Entries
    const fetchAllInward = async () => {
        try {
            const res = await fetch(`${Api_url}/all`);
            const data = await res.json();
            setAllInwardData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch all inward error:", err);
        }
    };

    // Description type change
    const typechange = (type) => {
        setOrderType(type);
        setitemsearch("");
        setShouldAutoSelect(true);
        setFormData(prev => ({
            ...prev,
            description_type: type
        }));
    };

    // Fetch Items based on Category (orderType)
    useEffect(() => {
        const fetchItems = async () => {
            if (!orderType) return;
            try {
                const url = itemsearch
                    ? `${Api_url}/items/${orderType}?q=${encodeURIComponent(itemsearch)}`
                    : `${Api_url}/items/${orderType}`;

                const res = await fetch(url);
                const data = await res.json();

                if (Array.isArray(data)) {
                    setItems(data);
                    if (shouldAutoSelect && data.length > 0) {
                        setCurrentrow((prev) => ({
                            ...prev,
                            item_name: data[0].item_name || "",
                            hsn: data[0].hsn_number || ""
                        }));
                        setShouldAutoSelect(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching items:", error);
                setItems([]);
            }
        };
        fetchItems();
    }, [orderType, itemsearch, shouldAutoSelect]);

    const selectitem = (selectedItem) => {
        setCurrentrow({
            ...currentrow,
            item_name: selectedItem.item_name,
            hsn: selectedItem.hsn_number || "",
        });
        setitemOpen(false);
    };

    // Add row to items table
    const addrow = () => {
        if (!currentrow.item_name || !currentrow.quantity || !currentrow.unit) {
            toast.error("Item Name, Quantity and Unit are required");
            return;
        }
        settabledata([...tabledata, currentrow]);
        setCurrentrow(INIT_ROW);
    };

    const clearRow = () => {
        setCurrentrow(INIT_ROW);
    };

    // Save/Update Inward
    const SaveInward = async () => {
        if (!formData.supplier_name.trim()) {
            toast.error("Supplier Name is required");
            return;
        }
        if (!formData.dc_number.trim()) {
            toast.error("DC Number is required");
            return;
        }
        if (!formData.dc_date) {
            toast.error("DC Date is required");
            return;
        }
        if (!formData.entry_date) {
            toast.error("Entry Date is required");
            return;
        }
        if (!formData.description_type) {
            toast.error("Please select Description Type (Service / Spares / Purchase Items)");
            return;
        }
        if (tabledata.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        const Inwarddata = {
            ...formData,
            items: tabledata.map(item => ({
                item_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit,
                pcb_sl_no: item.pcb_sl_no,
                hsn: item.hsn,
                problems: item.problems,
                remarks: item.remarks
            }))
        };

        try {
            const method = savedInwardNo ? "PUT" : "POST";
            const url = savedInwardNo
                ? `${Api_url}/update/${encodeURIComponent(savedInwardNo)}`
                : `${Api_url}/new`;

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(Inwarddata),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "failed");
            }
            toast.success(savedInwardNo ? "Inward Entry Updated Successfully" : "Inward Entry Saved Successfully");
            resetAll();
            fetchAllInward();
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("Failed to Save Inward");
        }
    };

    const handleCloseSuccessModal = () => {
        resetAll();
    };

    const handleViewInward = () => {
        setViewInwardNo(savedInwardNo);
    };

    const resetAll = () => {
        setFormData(INIT_FORM);
        settabledata([]);
        setSavedInwardNo("");
        setOrderType("");
        setSupplierSearch("");
        setitemsearch("");
        setInwardSearch("");
        fetchNextSl();
    };

    // Load Inward Entry details for editing
    const LoadInwardnumber = async (dc_number) => {
        try {
            const res = await fetch(`${Api_url}/edit/${encodeURIComponent(dc_number)}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to Load");
            }

            const formatDate = (date) => {
                if (!date) return "";
                try {
                    const d = new Date(date);
                    if (isNaN(d.getTime())) return "";
                    return d.toISOString().split("T")[0];
                } catch (e) {
                    return "";
                }
            };

            const formattedItems = (data.items || []).map(item => ({
                item_name: item.item_name || "",
                quantity: item.quantity || "",
                unit: item.unit || "",
                pcb_sl_no: item.pcb_sl_no || "",
                hsn: item.hsn || "",
                problems: item.problems || "",
                remarks: item.remarks || ""
            }));

            setSavedInwardNo(dc_number);
            setFormData({
                supplier_name: data.header.supplier_name || "",
                sl_no: data.header.sl_no || "",
                entry_date: formatDate(data.header.entry_date) || TODAY,
                dc_number: data.header.dc_number || "",
                dc_date: formatDate(data.header.dc_date) || TODAY,
                transport: data.header.transport || "",
                description_type: data.header.description_type || "",
                remarks: data.header.remarks || ""
            });

            setSupplierSearch(data.header.supplier_name || "");
            settabledata(formattedItems);
            setOrderType(data.header.description_type || "");
            toast.success("Inward Entry Loaded");
        } catch (error) {
            console.error("Load Error", error);
            toast.error("Failed to Load Inward Entry");
        }
    };

    // Search Inward Entries for loadsuggestions
    const searchInward = async (value) => {
        try {
            const res = await fetch(`${Api_url}/IE/search?q=${encodeURIComponent(value)}`);
            const data = await res.json();
            setInwardlist(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log("Search Error", error);
        }
    };

    // Delete Inward
    const deleteInward = async () => {
        if (!savedInwardNo) {
            toast.error("Load an Inward Entry first to delete");
            return;
        }
        const confirmDelete = window.confirm(`Are you sure you want to delete Inward entry ${savedInwardNo}? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            const res = await fetch(`${Api_url}/delete/${encodeURIComponent(savedInwardNo)}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to delete");
            }
            toast.success("Inward Entry Deleted");
            resetAll();
            fetchAllInward();
        } catch (error) {
            console.error("Delete error", error);
            toast.error("Failed to Delete Inward Entry");
        }
    };

    // Edit an added item row
    const edititem = (index) => {
        const item = tabledata[index];
        setCurrentrow({
            item_name: item.item_name || "",
            quantity: item.quantity || "",
            unit: item.unit || "",
            pcb_sl_no: item.pcb_sl_no || "",
            hsn: item.hsn || "",
            problems: item.problems || "",
            remarks: item.remarks || ""
        });
        settabledata(prev => prev.filter((_, i) => i !== index));
    };

    const deleterow = (index) => {
        settabledata(prev => prev.filter((_, i) => i !== index));
    };

    // Filter bottom table by selected supplier
    const filteredAllInward = formData.supplier_name
        ? allInwardData.filter(entry => entry.supplier_name === formData.supplier_name)
        : allInwardData;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
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
                        <h2 className="text-xl font-black text-black tracking-tight">INWARD ENTRY</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Supplier → Supplier DC → Items → Save</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={resetAll} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
                        <button onClick={SaveInward} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">SAVE</button>
                        <button onClick={SaveInward} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors">UPDATE</button>
                        <button onClick={deleteInward} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
                    </div>
                </div>

                {/* Step 1 — Supplier Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Supplier Details</p>
                    <div className="grid grid-cols-4 gap-5">

                        {/* Supplier Name */}
                        <div className="relative" ref={clientRef}>
                            <label className={labelCls}>Supplier Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={supplierSearch}
                                onChange={(e) => {
                                    setSupplierSearch(e.target.value);
                                    setFormData(p => ({ ...p, supplier_name: e.target.value }));
                                    setclientOpen(true);
                                }}
                                onFocus={() => setclientOpen(true)}
                                placeholder="Type to search supplier…"
                                className={inputCls}
                            />
                            {clientOpen && clients.length > 0 && (
                                <div className={dropdownCls}>
                                    {clients.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, supplier_name: c.customer_name }));
                                                setSupplierSearch(c.customer_name);
                                                setclientOpen(false);
                                            }}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                                        >
                                            {c.customer_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Inward Number */}
                        <div>
                            <label className={labelCls}>
                                Inward Number <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                            </label>
                            <input type="text" value={formData.sl_no} readOnly className={roInputCls} />
                        </div>

                        {/* Date */}
                        <div>
                            <label className={labelCls}>Date</label>
                            <input
                                type="date"
                                value={formData.entry_date || TODAY}
                                onChange={(e) => setFormData(p => ({ ...p, entry_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* Transport */}
                        <div className="relative" ref={transportRef}>
                            <label className={labelCls}>Transport</label>
                            <div
                                onClick={() => setTransportOpen(p => !p)}
                                className={`${inputCls} flex justify-between items-center cursor-pointer select-none min-h-[43px]`}
                            >
                                <span className={formData.transport ? "text-black" : "text-gray-400"}>
                                    {formData.transport || "Select transport Mode"}
                                </span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {transportOpen && (
                                <div className={dropdownCls}>
                                    {TRANSPORT_OPTIONS.map((t) => (
                                        <div
                                            key={t}
                                            onClick={() => { setFormData(p => ({ ...p, transport: t })); setTransportOpen(false); }}
                                            className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${formData.transport === t ? "bg-blue-50 text-blue-700" : ""}`}
                                        >
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Step 2 — Supplier DC Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2 — Supplier DC Details</p>
                    <div className="grid grid-cols-3 gap-5">

                        {/* Client DC Number */}
                        <div>
                            <label className={labelCls}>Client DC Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.dc_number}
                                onChange={(e) => setFormData(p => ({ ...p, dc_number: e.target.value }))}
                                placeholder="Enter Client DC Number"
                                className={inputCls}
                            />
                        </div>

                        {/* DC Date */}
                        <div>
                            <label className={labelCls}>DC Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={formData.dc_date || TODAY}
                                onChange={(e) => setFormData(p => ({ ...p, dc_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* Description Type */}
                        <div>
                            <label className={labelCls}>Description Type <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-4 h-[43px]">
                                {[["service", "Service"], ["spare", "Spares"], ["purchase_item", "Purchase Items"]].map(([val, label]) => (
                                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="description_type"
                                            value={val}
                                            checked={formData.description_type === val}
                                            onChange={() => typechange(val)}
                                            className="w-4 h-4 accent-black"
                                        />
                                        <span className="text-[12px] font-bold text-gray-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Step 3 — Add Items */}
                <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 3 — Add Items</p>
                    <div className="grid grid-cols-8 gap-2">

                        {/* Item Name */}
                        <div className="col-span-2 relative" ref={itemRef}>
                            <input
                                type="text"
                                value={currentrow.item_name}
                                onFocus={() => { if (orderType) setitemOpen(true); }}
                                onChange={(e) => {
                                    setCurrentrow(p => ({ ...p, item_name: e.target.value }));
                                    setitemsearch(e.target.value);
                                    if (orderType) setitemOpen(true);
                                }}
                                placeholder={orderType ? "Select item..." : "Select type first..."}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                            {itemOpen && items.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-48 overflow-y-auto border border-gray-200">
                                    {items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectitem(item);
                                            }}
                                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        >
                                            <div className="text-[13px] font-semibold text-gray-900">{item.item_name}</div>
                                            {item.hsn_number && (
                                                <div className="text-[11px] text-gray-400 mt-0.5">HSN: {item.hsn_number}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quantity */}
                        <div>
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={currentrow.quantity}
                                onChange={(e) => setCurrentrow(p => ({ ...p, quantity: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Unit */}
                        <div className="relative" ref={unitRef}>
                            <input
                                type="text"
                                placeholder="Unit"
                                value={currentrow.unit}
                                onFocus={() => setOpenUnit(true)}
                                onChange={(e) => setCurrentrow(p => ({ ...p, unit: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                            {openunit && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                    {UOM_LIST.map((unit) => (
                                        <div
                                            key={unit}
                                            onClick={() => { setCurrentrow(p => ({ ...p, unit })); setOpenUnit(false); }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        >
                                            {unit}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PCB SL NO */}
                        <div>
                            <input
                                type="text"
                                placeholder="PCB SL NO"
                                value={currentrow.pcb_sl_no}
                                onChange={(e) => setCurrentrow(p => ({ ...p, pcb_sl_no: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* HSN */}
                        <div>
                            <input
                                type="text"
                                placeholder="HSN"
                                value={currentrow.hsn}
                                onChange={(e) => setCurrentrow(p => ({ ...p, hsn: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                        </div>
                        {/* Item Remarks */}
                        <div className="relative" ref={remarksRef}>
                            <input
                                type="text"
                                placeholder="Remarks"
                                value={currentrow.remarks}
                                onFocus={() => setRemarksOpen(true)}
                                onChange={(e) => setCurrentrow(p => ({ ...p, remarks: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                            {remarksopen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                    {REMARKS_OPTIONS.map((r) => (
                                        <div
                                            key={r}
                                            onClick={() => { setCurrentrow(p => ({ ...p, remarks: r })); setRemarksOpen(false); }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-b last:border-0"
                                        >
                                            {r}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={addrow} className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 text-[13px] font-bold">ADD</button>
                            <button type="button" onClick={clearRow} className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 text-[13px] font-bold">CLR</button>
                        </div>
                    </div>

                    
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4 min-h-[200px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["SL NO", "Item Name", "Qty", "Unit", "PCB SL NO", "HSN","Remarks", "Actions"].map((h, i) => (
                                    <th key={i} className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-r border-gray-100 last:border-0">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tabledata.length === 0 ? (
                                <tr><td colSpan={9} className="p-8 text-center text-gray-400 text-sm">No items added yet.</td></tr>
                            ) : (
                                tabledata.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-[12px] text-gray-500 border-r">{idx + 1}</td>
                                        <td className="p-3 text-[12px] font-semibold border-r">{item.item_name}</td>
                                        <td className="p-3 text-[12px] border-r">{item.quantity}</td>
                                        <td className="p-3 text-[12px] border-r">{item.unit}</td>
                                        <td className="p-3 text-[12px] border-r">{item.pcb_sl_no}</td>
                                        <td className="p-3 text-[12px] border-r">{item.hsn}</td>
                                        <td className="p-3 text-[12px] border-r">{item.remarks}</td>
                                        <td className="p-3">
                                            <div className="flex gap-3">
                                                <SquarePen onClick={() => edititem(idx)} className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800" />
                                                <Trash2 onClick={() => deleterow(idx)} className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load / Edit existing Inward */}
                <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6 relative" ref={inwardRef}>
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic shrink-0">
                        Select Inward No To View / Modify :
                    </label>
                    <div className="relative w-[250px]">
                        <input
                            type="text"
                            value={inwardSearch}
                            onFocus={() => { setinwardnoOpen(true); searchInward(""); }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setInwardSearch(value);
                                searchInward(value);
                                setinwardnoOpen(true);
                            }}
                            placeholder="Enter DC Number"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-white"
                        />
                        {inwardnoOpen && inwardList.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                {inwardList.map((inward, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setInwardSearch(inward.dc_number);
                                            LoadInwardnumber(inward.dc_number);
                                            setinwardnoOpen(false);
                                        }}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-b border-gray-50 last:border-0"
                                    >
                                        {inward.dc_number}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>



            </div>
        </div>
    );
};

export default InwardEntry;