import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2, CheckCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import DeliveryChallan from "../pages/Services/dcFormat";
import ServiceWindowModal from "../ui/servicewindowModal";

const TODAY = new Date().toISOString().split("T")[0];
const Api_url = "http://localhost:3000/api/servicedcentry";

const INIT_FORM = {
    supplier_name: "",
    inward_dc_no: "",
    dc_date: TODAY,
    party_dc_no: "",
    party_dc_date: "",
    payment_terms: "",
    despatch_through: "",
    status: ""
};

const INIT_ROW = {
    item_name: "",
    quantity: "",
    serial_no: "",
    received_qty: "",
    uom: "",
    hsn: "",
    remarks: ""
};

const UOM_LIST = ["NOS", "KG", "MTR", "NO", "SET", "PKT"];
const DESPATCH_OPTIONS = ["By Hand", "By Courier", "FedEx", "DHL", "BlueDart", "Delhivery"];

const DcEntryForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState(INIT_FORM);
    const [tabledata, settabledata] = useState([]);
    const [currentrow, setCurrentrow] = useState(INIT_ROW);
    const [loadDcnumber, setLoadDcnumber] = useState("");
    const [allDcData, setAllDcData] = useState([]);

    // Inward DC items — populated when a client DC is selected
    const [inwardDcItems, setInwardDcItems] = useState([]);
    const [inwardDate, setInwardDate] = useState("");

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedDcNo, setSavedDcNo] = useState("");
    const [showDcFormat, setShowDcFormat] = useState(false);
    const [dcModalMinimized, setDcModalMinimized] = useState(false);
    const [viewDcNo, setViewDcNo] = useState("");

    // Client search
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState("");
    const [clientOpen, setClientOpen] = useState(false);
    const clientRef = useRef(null);

    // Client DC list (from inward_entry)
    const [clientDcList, setClientDcList] = useState([]);
    const [clientDcSearch, setClientDcSearch] = useState("");
    const [clientDcOpen, setClientDcOpen] = useState(false);
    const clientDcRef = useRef(null);

    // Item dropdown
    const [itemOpen, setItemOpen] = useState(false);
    const itemRef = useRef(null);

    // Other dropdowns
    const [uomOpen, setUomOpen] = useState(false);
    const [remarksOpen, setRemarksOpen] = useState(false);
    const [despatchOpen, setDespatchOpen] = useState(false);
    const uomRef = useRef(null);
    const remarksRef = useRef(null);
    const despatchRef = useRef(null);

    // Edit section
    const [editSearch, setEditSearch] = useState("");
    const [editSuggestions, setEditSuggestions] = useState([]);
    const [editOpen, setEditOpen] = useState(false);
    const editRef = useRef(null);

    const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight";
    const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto";

    // Immediately update status when remarks dropdown changes
    useEffect(() => {
        const r = (currentrow.remarks || "").trim().toLowerCase();
        if (r === "re service") {
            setFormData(p => ({ ...p, status: "Re Service" }));
        } else if (r === "service" || r === "services") {
            setFormData(p => ({ ...p, status: "Service" }));
        }
    }, [currentrow.remarks]);

    // Auto-set status from table items (covers edit/load scenarios)
    useEffect(() => {
        const hasReService = tabledata.some(item => {
            const r = (item.remarks || "").trim().toLowerCase();
            return r === "re service";
        });
        const hasService = tabledata.some(item => {
            const r = (item.remarks || "").trim().toLowerCase();
            return r === "service" || r === "services";
        });
        if (hasReService) {
            setFormData(p => ({ ...p, status: "Re Service" }));
        } else if (hasService) {
            setFormData(p => ({ ...p, status: "Service" }));
        }
    }, [tabledata]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (clientOpen && clients.length > 0) {
                handleClientSelect(clients[0]);
            } else if (clientDcOpen && clientDcList.length > 0) {
                handleClientDcSelect(clientDcList[0]);
            } else if (itemOpen && filteredInwardItems.length > 0) {
                handleItemSelect(filteredInwardItems[0]);
            } else if (uomOpen) {
                setUomOpen(false);
            } else if (remarksOpen) {
                setRemarksOpen(false);
            } else if (despatchOpen) {
                setDespatchOpen(false);
            } else if (editOpen && editSuggestions.length > 0) {
                loadDcForEdit(editSuggestions[0].inward_dc_no);
            }
        }
    };

    useEffect(() => {
        fetchNextDcNo();
        fetchAllDc();
        const handler = (e) => {
            if (clientRef.current && !clientRef.current.contains(e.target)) setClientOpen(false);
            if (clientDcRef.current && !clientDcRef.current.contains(e.target)) setClientDcOpen(false);
            if (itemRef.current && !itemRef.current.contains(e.target)) setItemOpen(false);
            if (uomRef.current && !uomRef.current.contains(e.target)) setUomOpen(false);
            if (remarksRef.current && !remarksRef.current.contains(e.target)) setRemarksOpen(false);
            if (despatchRef.current && !despatchRef.current.contains(e.target)) setDespatchOpen(false);
            if (editRef.current && !editRef.current.contains(e.target)) setEditOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchNextDcNo = async () => {
        try {
            const res = await fetch(`${Api_url}/next-dc-no`);
            const data = await res.json();
            setFormData(p => ({ ...p, inward_dc_no: data.dc_no }));
        } catch {
            console.error("Could not fetch DC No");
        }
    };

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const url = clientSearch
                    ? `${Api_url}/clients/search?q=${encodeURIComponent(clientSearch)}`
                    : `${Api_url}/clients`;
                const res = await fetch(url);
                setClients(await res.json());
            } catch { setClients([]); }
        };
        fetchClients();
    }, [clientSearch]);

    useEffect(() => {
        if (!formData.supplier_name) { setClientDcList([]); return; }
        const fetchClientDcList = async () => {
            try {
                const params = new URLSearchParams({ client: formData.supplier_name });
                if (clientDcSearch) params.set("q", clientDcSearch);
                const res = await fetch(`${Api_url}/client-dc-list?${params}`);
                setClientDcList(await res.json());
            } catch { setClientDcList([]); }
        };
        fetchClientDcList();
    }, [formData.supplier_name, clientDcSearch]);

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

    const handleClientSelect = (client) => {
        const dcNo = formData.inward_dc_no;
        const dcDate = formData.dc_date;
        setFormData({ ...INIT_FORM, inward_dc_no: dcNo, dc_date: dcDate, supplier_name: client.customer_name });
        setClientSearch(client.customer_name);
        setClientDcSearch("");
        setInwardDcItems([]);
        setInwardDate("");
        setClientOpen(false);
        setClientDcOpen(true);
    };

    const handleClientDcSelect = async (dc) => {
        setFormData(p => ({ ...p, party_dc_no: dc.dc_number }));
        setClientDcSearch(dc.dc_number);
        setClientDcOpen(false);
        try {
            const res = await fetch(`${Api_url}/inward/${encodeURIComponent(dc.dc_number)}`);
            const data = await res.json();
            if (data.header?.dc_date) {
                setFormData(p => ({ ...p, party_dc_date: data.header.dc_date.split("T")[0] }));
            }
            if (data.header?.inward_date) {
                setInwardDate(data.header.inward_date.split("T")[0]);
            }
            setInwardDcItems(data.items || []);
        } catch {
            setInwardDcItems([]);
        }
    };

    // Items filtered from inward DC for dropdown
    const filteredInwardItems = inwardDcItems.filter(item =>
        !currentrow.item_name ||
        item.item_name.toLowerCase().includes(currentrow.item_name.toLowerCase())
    );

    const handleItemSelect = (item) => {
        setCurrentrow(p => ({
            ...p,
            item_name: item.item_name || "",
            hsn: item.hsn || "",
            uom: item.unit || p.uom,
            quantity: item.quantity || p.quantity,
            serial_no: item.pcb_sl_no || p.serial_no,
            remarks: item.problems || item.remarks || p.remarks
        }));
        setItemOpen(false);
    };

    const addRow = () => {
        if (!currentrow.item_name || !currentrow.quantity) {
            toast.error("Item Name and Quantity are required");
            return;
        }
        settabledata(p => [...p, currentrow]);
        setCurrentrow(INIT_ROW);
    };

    const editItem = (index) => {
        setCurrentrow({ ...tabledata[index] });
        settabledata(p => p.filter((_, i) => i !== index));
    };

    const deleteItem = (index) => settabledata(p => p.filter((_, i) => i !== index));

    const SaveDc = async () => {
        if (!formData.supplier_name.trim()) { toast.error("Client Name is required"); return; }
        if (!formData.inward_dc_no.trim()) { toast.error("DC Number is required"); return; }
        if (!formData.dc_date) { toast.error("DC Date is required"); return; }
        if (!formData.status) { toast.error("Please select a Status (Service / Re Service)"); return; }
        if (!tabledata.length) { toast.error("Please add at least one item"); return; }

        const payload = {
            ...formData,
            items: tabledata.map(item => ({
                item_name: item.item_name,
                quantity: item.quantity,
                serial_no: item.serial_no,
                received_qty: item.received_qty,
                uom: item.uom,
                hsn: item.hsn,
                remarks: item.remarks
            }))
        };

        try {
            const method = loadDcnumber ? "PUT" : "POST";
            const url = loadDcnumber
                ? `${Api_url}/updatedc/${loadDcnumber}`
                : `${Api_url}/createdc`;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "failed");

            setSavedDcNo(formData.inward_dc_no);
            setShowSuccessModal(true);
            fetchAllDc();
        } catch {
            toast.error("Failed to Save DC");
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
        setClientSearch("");
        setClientDcSearch("");
        setEditSearch("");
        settabledata([]);
        setLoadDcnumber("");
        setInwardDcItems([]);
        setInwardDate("");
        fetchNextDcNo();
    };

    const loadDcForEdit = async (dcNumber) => {
        try {
            const res = await fetch(`${Api_url}/editdc/${encodeURIComponent(dcNumber)}`);
            const data = await res.json();
            const h = data.header;
            setFormData({
                supplier_name: h.supplier_name || "",
                inward_dc_no: h.inward_dc_no || "",
                dc_date: h.dc_date ? h.dc_date.split("T")[0] : TODAY,
                party_dc_no: h.party_dc_no || "",
                party_dc_date: h.party_dc_date ? h.party_dc_date.split("T")[0] : "",
                payment_terms: h.payment_terms || "",
                despatch_through: h.despatch_through || "",
                status: h.status || ""
            });
            setClientSearch(h.supplier_name || "");
            setClientDcSearch(h.party_dc_no || "");
            settabledata(data.items || []);
            setLoadDcnumber(h.id);
            toast.success("DC Loaded");
        } catch {
            toast.error("Failed to Load DC");
        }
    };

    const deleteDc = async () => {
        if (!loadDcnumber) { toast.error("Load a DC first to delete"); return; }
        if (!window.confirm("Delete this DC? This cannot be undone.")) return;
        try {
            const res = await fetch(`${Api_url}/deletedc/${encodeURIComponent(formData.inward_dc_no)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("DC Deleted");
            resetAll();
            fetchAllDc();
        } catch {
            toast.error("Failed to Delete DC");
        }
    };

    // Bottom table: filter by selected party_dc_no first, then by supplier, else show all
    const filteredAllDc = formData.party_dc_no
        ? allDcData.filter(dc => dc.party_dc_no === formData.party_dc_no)
        : formData.supplier_name
            ? allDcData.filter(dc => dc.supplier_name === formData.supplier_name)
            : allDcData;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">

            {/* ── Success Modal ── */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-1">Service DC Saved Successfully!</h2>
                        <p className="text-sm text-gray-500 mb-1">Service DC has been created.</p>
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

            {/* ── Service Window Modal (DC Format) ── */}
            <ServiceWindowModal
                title="DC Format"
                isOpen={showDcFormat}
                type="DC Format"
                isMinimized={dcModalMinimized}
                onMinimize={() => setDcModalMinimized(true)}
                onClose={() => { setShowDcFormat(false); setDcModalMinimized(false); resetAll(); }}
                filters={{ dcNumber: viewDcNo }}
                onFilterChange={(f) => setViewDcNo(f.dcNumber || viewDcNo)}
            >
                <DeliveryChallan key={viewDcNo} dcNumber={viewDcNo} />
            </ServiceWindowModal>

            {/* Minimized bar */}
            {showDcFormat && dcModalMinimized && (
                <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setDcModalMinimized(false)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
                    >
                        <div className="w-3 h-3 border border-white/50"></div>
                        DC Format
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
                        <h2 className="text-xl font-black text-black tracking-tight">SERVICE DC ENTRY</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Client → Client DC → Items → Save</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={resetAll} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
                        <button onClick={SaveDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">SAVE</button>
                        <button onClick={SaveDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors">UPDATE</button>
                        <button onClick={deleteDc} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
                    </div>
                </div>

                {/* Step 1 — Client + DC Header */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Client Details</p>
                    <div className="grid grid-cols-4 gap-5">

                        {/* Client (Supplier) Name */}
                        <div className="relative" ref={clientRef}>
                            <label className={labelCls}>Supplier / Client <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setFormData(p => ({ ...p, supplier_name: e.target.value }));
                                    setClientOpen(true);
                                }}
                                onFocus={() => setClientOpen(true)}
                                placeholder="Type to search client…"
                                className={inputCls}
                            />
                            {clientOpen && clients.length > 0 && (
                                <div className={dropdownCls}>
                                    {clients.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleClientSelect(c)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                                        >
                                            {c.customer_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Auto-generated Service DC No */}
                        <div>
                            <label className={labelCls}>
                                Service DC No <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                            </label>
                            <input type="text" value={formData.inward_dc_no} readOnly className={roInputCls} />
                        </div>

                        {/* DC Date */}
                        <div>
                            <label className={labelCls}>DC Date</label>
                            <input
                                type="date"
                                value={formData.dc_date || TODAY}
                                onChange={(e) => setFormData(p => ({ ...p, dc_date: e.target.value }))}
                                className={inputCls}
                            />
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

                {/* Step 2 — Client DC */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2 — Client DC Details</p>
                    <div className="grid grid-cols-4 gap-5">

                        {/* Client DC Number dropdown from inward_entry */}
                        <div className="relative" ref={clientDcRef}>
                            <label className={labelCls}>
                                Client DC Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={clientDcSearch}
                                onChange={(e) => {
                                    setClientDcSearch(e.target.value);
                                    setFormData(p => ({ ...p, party_dc_no: e.target.value }));
                                    setClientDcOpen(true);
                                }}
                                onFocus={() => { if (formData.supplier_name) setClientDcOpen(true); }}
                                placeholder={formData.supplier_name ? "Select client DC number…" : "Select a client first"}
                                disabled={!formData.supplier_name}
                                className={`${inputCls} ${!formData.supplier_name ? "bg-gray-100 cursor-not-allowed text-gray-400" : "cursor-pointer"}`}
                            />
                            {clientDcOpen && clientDcList.length > 0 && (
                                <div className={dropdownCls}>
                                    {clientDcList.map((dc, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleClientDcSelect(dc)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        >
                                            <div className="text-[13px] font-bold text-gray-900">{dc.dc_number}</div>
                                            {dc.dc_date && (
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    {new Date(dc.dc_date).toLocaleDateString("en-GB")}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {clientDcOpen && formData.supplier_name && clientDcList.length === 0 && (
                                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                                    No inward DCs found for this client.
                                </div>
                            )}
                        </div>

                        {/* Client DC Date */}
                        <div>
                            <label className={labelCls}>
                                Client DC Date
                                {formData.party_dc_date && (
                                    <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                                )}
                            </label>
                            <input
                                type="date"
                                value={formData.party_dc_date}
                                onChange={(e) => setFormData(p => ({ ...p, party_dc_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* Inward Date (read-only, auto-filled) */}
                        {inwardDate && (
                            <div>
                                <label className={labelCls}>
                                    Inward Date <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                                </label>
                                <input type="date" value={inwardDate} readOnly className={roInputCls} />
                            </div>
                        )}

                        {/* Status — auto-set from item remarks; not manually selectable */}
                        <div>
                            <label className={labelCls}>
                                Status <span className="text-red-500">*</span>
                                <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                            </label>
                            <div className="flex items-center gap-6 h-[43px]">
                                {["Service", "Re Service"].map((s) => (
                                    <label key={s} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="status"
                                            value={s}
                                            checked={formData.status === s}
                                            onChange={() => {}}
                                            onClick={(e) => e.preventDefault()}
                                            className="w-4 h-4 accent-black pointer-events-none"
                                        />
                                        <span className="text-[12px] font-bold text-gray-700">{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Inward DC items chip list */}
                    {inwardDcItems.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                                Items from Client DC — click to add
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {inwardDcItems.map((item, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setCurrentrow(p => ({
                                                ...p,
                                                item_name: item.item_name || "",
                                                hsn: item.hsn || "",
                                                uom: item.unit || p.uom,
                                                quantity: item.quantity || p.quantity,
                                                serial_no: item.pcb_sl_no || p.serial_no,
                                                remarks: item.problems || item.remarks || p.remarks
                                            }));
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                                    >
                                        <span>{item.item_name}</span>
                                        {item.pcb_sl_no && <span className="text-[10px] text-blue-400">SL:{item.pcb_sl_no}</span>}
                                        {item.hsn && <span className="text-[10px] text-blue-400">HSN:{item.hsn}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 3 — Add Items */}
                <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 3 — Add Items</p>
                    <div className="grid grid-cols-8 gap-2">

                        {/* Item Name with dropdown from inward DC items */}
                        <div className="col-span-2 relative" ref={itemRef}>
                            <label className={labelCls}>Product <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={currentrow.item_name}
                                onFocus={() => { if (inwardDcItems.length > 0) setItemOpen(true); }}
                                onChange={(e) => {
                                    setCurrentrow(p => ({ ...p, item_name: e.target.value }));
                                    if (inwardDcItems.length > 0) setItemOpen(true);
                                }}
                                placeholder={inwardDcItems.length > 0 ? "Select from DC items…" : "Item Name"}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50"
                            />
                            {itemOpen && filteredInwardItems.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-48 overflow-y-auto border border-gray-200">
                                    {filteredInwardItems.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleItemSelect(item);
                                            }}
                                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        >
                                            <div className="text-[13px] font-semibold text-gray-900">{item.item_name}</div>
                                            {(item.problems || item.remarks) && (
                                                <div className="text-[11px] text-gray-400 mt-0.5">{item.problems || item.remarks}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                             <label className={labelCls} >Qty</label>
                            <input type="text" placeholder="Quantity"
                                value={currentrow.quantity}
                                onChange={(e) => setCurrentrow(p => ({ ...p, quantity: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                        </div>

                        <div>
                            <label className={labelCls} >Serial No</label>
                            <input type="text" placeholder="Serial No"
                                value={currentrow.serial_no}
                                onChange={(e) => setCurrentrow(p => ({ ...p, serial_no: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                        </div>

                        {/* UOM */}
                        <div className="relative" ref={uomRef}>
                            <label className={labelCls}>UOM</label>
                            <input type="text" placeholder="UOM"
                                value={currentrow.uom}
                                onFocus={() => setUomOpen(true)}
                                onChange={(e) => setCurrentrow(p => ({ ...p, uom: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                            {uomOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                    {UOM_LIST.map((uom) => (
                                        <div key={uom} onClick={() => { setCurrentrow(p => ({ ...p, uom })); setUomOpen(false); }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">{uom}</div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelCls} >HSN</label>
                            <input type="text" placeholder="HSN"
                                value={currentrow.hsn}
                                onChange={(e) => setCurrentrow(p => ({ ...p, hsn: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                        </div>

                        {/* Remarks */}
                    <div className="mt- relative w-30" ref={remarksRef}>
                        <label className={labelCls}>Remarks</label>
                        <input type="text" placeholder="Remarks"
                            value={currentrow.remarks}
                            onFocus={() => setRemarksOpen(true)}
                            onChange={(e) => setCurrentrow(p => ({ ...p, remarks: e.target.value }))}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                        {remarksOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                {["Damaged", "Service", "Re Service", "Under Warranty"].map((r) => (
                                    <div key={r} onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentrow(p => ({ ...p, remarks: r }));
                                        setRemarksOpen(false);
                                        if (r === "Service") {
                                            setFormData(p => ({ ...p, status: "Service" }));
                                        } else if (r === "Re Service") {
                                            setFormData(p => ({ ...p, status: "Re Service" }));
                                        }
                                    }}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">{r}</div>
                                ))}
                            </div>
                        )}
                    </div>

                        <div className=" mt-5 flex items-center gap-2">
                            <button onClick={addRow} className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 text-[13px] font-bold">ADD</button>
                            <button onClick={() => setCurrentrow(INIT_ROW)} className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 text-[13px] font-bold">CLR</button>
                        </div>
                    </div>

                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4 min-h-[200px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["#", "Item Name", "Qty", "Unit", "Rec. Qty", "HSN", "Serial No", "Remarks", "Actions"].map((h, i) => (
                                    <th key={i} className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-r border-gray-100 last:border-0">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tabledata.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-14 text-center">
                                        <div className="text-gray-300 text-4xl mb-3">📦</div>
                                        <p className="text-[13px] text-gray-400 font-medium">No products added yet.</p>
                                        <p className="text-[12px] text-gray-300 mt-1">Select a customer and client DC to begin.</p>
                                    </td>
                                </tr>
                            ) : (
                                tabledata.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-[12px] text-gray-500 border-r">{idx + 1}</td>
                                        <td className="p-3 text-[12px] font-semibold border-r">{item.item_name}</td>
                                        <td className="p-3 text-[12px] border-r">{item.quantity}</td>
                                        <td className="p-3 text-[12px] border-r">{item.uom}</td>
                                        <td className="p-3 text-[12px] border-r">{item.received_qty}</td>
                                        <td className="p-3 text-[12px] border-r">{item.hsn}</td>
                                        <td className="p-3 text-[12px] border-r">{item.serial_no}</td>
                                        <td className="p-3 text-[12px] border-r">{item.remarks}</td>
                                        <td className="p-3">
                                            <div className="flex gap-3">
                                                <SquarePen onClick={() => editItem(idx)} className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800" />
                                                <Trash2 onClick={() => deleteItem(idx)} className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load / Edit existing DC */}
                <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6 relative" ref={editRef}>
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic shrink-0">
                        Select DC No To View / Modify :
                    </label>
                    <div className="relative w-[250px]">
                        <input
                            type="text"
                            value={editSearch}
                            onFocus={() => setEditOpen(true)}
                            onChange={(e) => { setEditSearch(e.target.value); setEditOpen(true); }}
                            placeholder="AT/SVC-001"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-white"
                        />
                        {editOpen && editSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                {editSuggestions.map((dc, i) => (
                                    <div key={i}
                                        onClick={() => { loadDcForEdit(dc.dc_number); setEditSearch(dc.dc_number); setEditOpen(false); }}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">
                                        {dc.dc_number}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* All DC Entries — filtered by selected supplier DC */}
                <div className="mt-10">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-base font-black text-gray-800">
                            {formData.party_dc_no
                                ? `DC Entries — Client DC: ${formData.party_dc_no}`
                                : formData.supplier_name
                                    ? `DC Entries — ${formData.supplier_name}`
                                    : "All DC Entries"}
                        </h2>
                        <span className="text-[11px] text-gray-400">{filteredAllDc.length} record{filteredAllDc.length !== 1 ? "s" : ""}</span>
                        {formData.party_dc_no && (
                            <span className="text-[11px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                                Filtered by Client DC
                            </span>
                        )}
                        {!formData.party_dc_no && formData.supplier_name && (
                            <span className="text-[11px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">
                                Filtered by Client
                            </span>
                        )}
                    </div>
                    <div className="w-full border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">DC No</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Client</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Date</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Client DC No</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Status</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b border-r">Items</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-b">View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAllDc.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No DC entries found.</td></tr>
                                ) : (
                                    filteredAllDc.map((dc, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-3 text-[12px] font-semibold border-r">{dc.inward_dc_no}</td>
                                            <td className="p-3 text-[12px] border-r">{dc.supplier_name}</td>
                                            <td className="p-3 text-[12px] border-r">
                                                {dc.dc_date ? new Date(dc.dc_date).toLocaleDateString("en-GB") : "—"}
                                            </td>
                                            <td className="p-3 text-[12px] border-r">{dc.party_dc_no || "—"}</td>
                                            <td className="p-3 text-[12px] text-red-600 font-medium border-r">{dc.status}</td>
                                            <td className="p-3 text-[12px] border-r">
                                                <div className="max-h-[60px] overflow-y-auto flex flex-wrap gap-1">
                                                    {(dc.items || []).map((item, j) => (
                                                        <span key={j} className="inline-block bg-gray-100 rounded px-2 py-0.5 text-[11px] whitespace-nowrap">
                                                            {item.item_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => { setViewDcNo(dc.inward_dc_no); setDcModalMinimized(false); setShowDcFormat(true); }}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    <Eye className="w-3 h-3" /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DcEntryForm;
