import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SquarePen, Trash2, Eye, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import SaleswindowModel from "../ui/saleswindowModal";
import DeliveryChallan from "../pages/Sales/salesdcformat";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const API = "http://localhost:3000/api/salesdc";
const TODAY = new Date().toISOString().split("T")[0];
const DESPATCH_OPTIONS = ["Courier", "Transport", "By Hand"];
const REMARKS_OPTIONS = ["Serviced", "Re Serviced", "For Sale", "Beyond", "For Testing Purpose","Buy Back"];

const INIT_FORM = {
    customer_name: "",
    dc_no: "",
    dc_date: TODAY,
    order_no: "",
    order_date: "",
    despatch_through: "",
    ordertype: "Service",
};

const INIT_ITEM = {
    item_name: "",
    quantity: "",
    sl_no: "",
    hsn: "",
    uom: "Nos",
    pending_qty: "",
    order_no: "",
    order_date: "",
    remarks: ""
};

const SalesDCEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

    // ── form & table state ──────────────────────────────────────────────────
    const [form, setForm] = useState(INIT_FORM);
    const [rows, setRows] = useState([]);
    const [item, setItem] = useState(INIT_ITEM);
    const [editRowIndex, setEditRowIndex] = useState(-1);

    // ── Order Number multi-entry display ─────────────────────────────────────
    //Success Model state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedDcNo, setSavedDcNo] = useState("");
    const [showDcFormat, setShowDcFormat] = useState(false);
    const [dcModalMinimized, setDcModalMinimized] = useState(false);
    const [viewDcNo, setViewDcNo] = useState("");
    // ── dropdown data ────────────────────────────────────────────────────────
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [dcSearchList, setDcSearchList] = useState([]);

    // ── search / display inputs ──────────────────────────────────────────────
    const [custSearch, setCustSearch] = useState("");
    const [prodSearch, setProdSearch] = useState("");
    const [loadDcSearch, setLoadDcSearch] = useState("");

    // ── open flags ───────────────────────────────────────────────────────────
    const [open, setOpen] = useState({
        customer: false, clientDc: false, product: false, uom: false, loadDc: false, despatch: false,
    });
    const [remarksOpen, setRemarksOpen] = useState(false);

    // ── loading flags ────────────────────────────────────────────────────────
    const [busy, setBusy] = useState({
        invoices: false, products: false, save: false,
    });

    // ── refs for outside-click ───────────────────────────────────────────────
    const custRef = useRef(null);
    const clientDcRef = useRef(null);
    const prodRef = useRef(null);
    const uomRef = useRef(null);
    const loadDcRef = useRef(null);
    const despatchRef = useRef(null);
    const remarksRef = useRef(null);
    const salesDcDateRef = useRef(null);
    const salesDcDateFp = useRef(null);
    const orderDateRef = useRef(null);
    const orderDateFp = useRef(null);

    useEffect(() => {
        salesDcDateFp.current = flatpickr(salesDcDateRef.current, {
            disableMobile: true,
            monthSelectorType: "static",
            dateFormat: "d-m-Y",
            defaultDate: toDmy(form.dc_date) || new Date(),
            onChange: (selectedDates, dateStr) => {
                setForm((p) => ({ ...p, dc_date: toYmd(dateStr) }));
            },
        });
        return () => salesDcDateFp.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (salesDcDateFp.current && form.dc_date) {
            salesDcDateFp.current.setDate(toDmy(form.dc_date));
        }
    }, [form.dc_date]);

    // ── Order Date flatpickr with multi-date mode ─────────────────────────────
    useEffect(() => {
        orderDateFp.current = flatpickr(orderDateRef.current, {
            disableMobile: true,
            monthSelectorType: "static",
            dateFormat: "d-m-Y",
            mode: "multiple",
            defaultDate: form.order_date || null,
            onChange: (selectedDates, dateStr) => {
                setForm((p) => ({ ...p, order_date: dateStr }));
            },
        });
        return () => orderDateFp.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (orderDateFp.current && form.order_date !== undefined) {
            orderDateFp.current.setDate(form.order_date || "");
        }
    }, [form.order_date]);

    // ── auto-load DC from navigation state (e.g. from report view Edit) ──────
    useEffect(() => {
        const dcNo = location.state?.loadDcNo;
        if (dcNo) {
            setLoadDcSearch(dcNo);
            loadExistingDC(dcNo);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── initial DC no ────────────────────────────────────────────────────────
    useEffect(() => {
        fetchNextDcNo();
    }, []);

    useOutsideClick([
        { ref: custRef,     onClose: () => closeAll("customer") },
        { ref: clientDcRef, onClose: () => closeAll("clientDc") },
        { ref: prodRef,     onClose: () => closeAll("product") },
        { ref: uomRef,      onClose: () => closeAll("uom") },
        { ref: loadDcRef,   onClose: () => closeAll("loadDc") },
        { ref: despatchRef, onClose: () => closeAll("despatch") },
        { ref: remarksRef,  onClose: () => setRemarksOpen(false) },
    ]);

    const closeAll = (key) => setOpen((p) => ({ ...p, [key]: false }));
    const openDrop = (key) => setOpen((p) => ({ ...p, [key]: true }));

    // ════════════════════════════════════════════════════════════════════════
    // API helpers
    // ════════════════════════════════════════════════════════════════════════

    const fetchNextDcNo = async () => {
        try {
            const res = await fetch(`${API}/next-dc-no`);
            const data = await res.json();
            setForm((p) => ({ ...p, dc_no: data.dc_no }));
        } catch {
            console.error("Could not fetch DC No");
        }
    };

    const searchCustomers = async (q = "") => {
        try {
            const res = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
            setCustomers(await res.json());
        } catch {
            setCustomers([]);
        }
    };

    // Fetch products based on order type
    const fetchProducts = async (ordertype, searchQuery = "") => {
        let type = "";
        if (ordertype === "Service") type = "service";
        else if (ordertype === "Spares") type = "spare";
        else if (ordertype === "Purchase Items") type = "purchase_item";
        else return;

        try {
            const res = await fetch(`${API}/items/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
            const data = await res.json();
            setProducts(data);
        } catch {
            setProducts([]);
        }
    };

    // Refetch products when order type or product search term changes
    useEffect(() => {
        if (form.ordertype) {
            fetchProducts(form.ordertype, prodSearch);
        }
    }, [form.ordertype, prodSearch]);


    const searchLoadDc = async (q = "") => {
        try {
            const res = await fetch(`${API}/DC/search?q=${encodeURIComponent(q)}`);
            setDcSearchList(await res.json());
        } catch {
            setDcSearchList([]);
        }
    };

    const loadExistingDC = async (dcNo) => {
        try {
            const res = await fetch(`${API}/edit/${encodeURIComponent(dcNo)}`);
            if (!res.ok) throw new Error("DC not found");
            const { header, items } = await res.json();

            setForm({
                customer_name: header.customer_name || "",
                dc_no: header.dc_no || "",
                dc_date: header.dc_date ? new Date(header.dc_date).toISOString().split("T")[0] : TODAY,
                order_no: "",
                order_date: "",
                despatch_through: header.despatch_through || "",
                ordertype: header.ordertype || "Service",
            });
            setCustSearch(header.customer_name || "");
            setRows(items || []);
            // Populate display fields from saved comma-separated values
            toast.success("DC loaded for editing.");
        } catch (e) {
            toast.error(e.message || "Failed to load DC.");
        }
    };

    // Event handlers


    const handleCustomerSelect = (c) => {
        // Reset everything downstream
        setForm((p) => ({
            ...INIT_FORM,
            dc_no: p.dc_no,
            dc_date: p.dc_date,
            customer_name: c.customer_name,
        }));
        setCustSearch(c.customer_name);
        setProdSearch("");
        setRows([]);
        setItem(INIT_ITEM);
        setProducts([]);
        closeAll("customer");
    };



    const handleProductSelect = (p) => {
        setItem({
            item_name: p.item_name,
            quantity: p.pending_qty > 0 ? String(p.pending_qty) : "",
            price: p.price != null ? String(p.price) : "",
            sl_no: p.sl_no || p.serial_no || "",
            hsn: p.hsn_number || p.hsn || "",
            uom: p.uom || "Nos",
            pending_qty: p.pending_qty != null ? String(p.pending_qty) : "",
        });
        setProdSearch(p.item_name);
        closeAll("product");
    };

    const handleAddItem = () => {
        if (!item.item_name) {
            toast.error("Select a product first.");
            return;
        }
        if (!item.remarks) {
            toast.error("Select a remarks value.");
            return;
        }

        const newRow = { ...item, order_no: form.order_no, order_date: form.order_date };

        if (editRowIndex >= 0) {
            setRows(prev => {
                const updated = [...prev];
                updated[editRowIndex] = newRow;
                return updated;
            });
            setEditRowIndex(-1);
        } else {
            setRows(prev => [...prev, newRow]);
        }
        setItem(INIT_ITEM);
        setProdSearch("");
    };

    const handleEditRow = (idx) => {
        const r = rows[idx];
        setItem({
            item_name:   r.item_name,
            quantity:    r.quantity,
            sl_no:       r.sl_no   || "",
            hsn:         r.hsn     || "",
            uom:         r.uom     || "Nos",
            pending_qty: r.pending_qty || "",
            order_no:    r.order_no   || "",
            order_date:  r.order_date || "",
            remarks:     r.remarks    || "",
            price:       r.price      || "",
        });
        setProdSearch(r.item_name);
        setEditRowIndex(idx);
    };

    const handleRemoveRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx));

    // CRUD

    const buildPayload = () => ({
        customer_name: form.customer_name,
        dc_no: form.dc_no,
        dc_date: form.dc_date,
        order_no: form.order_no || null,
        order_date: form.order_date || null,
        despatch_through: form.despatch_through || null,
        ordertype: form.ordertype,
        items: rows.map((r) => ({
        item_name: r.item_name,
        quantity: r.quantity,
        sl_no: r.sl_no || null,
        hsn: r.hsn || null,
        uom: r.uom || "Nos",
        remarks: r.remarks || null,
        order_no: r.order_no || null,
        order_date: r.order_date || null
        }))
    });

    const validateHeader = () => {
        if (!form.customer_name?.trim()) { toast.error("Customer is required."); return false; }
        if (!form.order_no?.trim()) { toast.error("Order Number is required."); return false; }
        if (!form.despatch_through?.trim()) { toast.error("Despatch Through is required."); return false; }
        if (!rows.length) { toast.error("Add at least one product."); return false; }
        return true;
    };

    const handleSaveDC = () => {
        saveDC();
    };

    const handleUpdateDC = () => {
        updateDC();
    };

    const handleDeleteDC = () => {
        deleteDC();
    };

    const saveDC = async () => {
        if (!validateHeader()) return;
        setBusy((p) => ({ ...p, save: true }));
        try {
            const res = await fetch(`${API}/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            });
            if (res.ok) {
                const data = await res.json();
                setSavedDcNo(data.dc_no || form.dc_no);
                setShowSuccessModal(true);
            } else {
                const err = await res.json();
                toast.error(err.message || "Save failed.");
            }
        } catch {
            toast.error("Network error — please try again.");
        } finally {
            setBusy((p) => ({ ...p, save: false }));
        }
    };

    const updateDC = async () => {
        if (!form.dc_no) { toast.error("Load a DC first."); return; }
        if (!validateHeader()) return;
        setBusy((p) => ({ ...p, save: true }));
        try {
            const res = await fetch(`${API}/update/${encodeURIComponent(form.dc_no)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            });
            if (res.ok) {
                toast.success("Sales DC updated successfully.");
            } else {
                const err = await res.json();
                toast.error(err.message || "Update failed.");
            }
        } catch {
            toast.error("Network error — please try again.");
        } finally {
            setBusy((p) => ({ ...p, save: false }));
        }
    };

    const deleteDC = async () => {
        if (!form.dc_no) { toast.error("Load a DC first."); return; }
        if (!window.confirm(`Delete ${form.dc_no}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API}/delete/${encodeURIComponent(form.dc_no)}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Sales DC deleted.");
                resetForm();
            } else {
                toast.error("Delete failed.");
            }
        } catch {
            toast.error("Network error.");
        }
    };

    const resetForm = () => {
        setForm(INIT_FORM);
        setCustSearch("");
        setProdSearch("");
        setLoadDcSearch("");
        setRows([]);
        setItem(INIT_ITEM);
        setEditRowIndex(-1);
        setProducts([]);
        setDcSearchList([]);
        fetchNextDcNo();
    };

    // filtered product list 
    const filteredProducts = products.filter((p) =>
        p.item_name.toLowerCase().includes(prodSearch.toLowerCase())
    );

    // Shared styles
    const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
    const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

    // Close Successmodel
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setShowDcFormat(false);
        resetForm();
    };

    // HandleView Dc
    const handleViewDc = () => {
        setViewDcNo(savedDcNo);
        setShowSuccessModal(false);
        setDcModalMinimized(false);
        setShowDcFormat(true);
    }

    return (
        <div className="min-h-screen bg-gray-50/70 p-6 font-sans">
            {/* ── Success Modal ── */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-1">Sales DC Saved Successfully!</h2>
                        <p className="text-sm text-gray-500 mb-1">Sales DC has been created.</p>
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

            {/* Saleswindow model */}

            <SaleswindowModel
                title="DC Format"
                isOpen={showDcFormat}
                type="DC Format"
                isMinimized={dcModalMinimized}
                onMinimize={() => setDcModalMinimized(true)}
                onClose={() => { setShowDcFormat(false); setDcModalMinimized(false); resetForm(); }}
                filters={{ QtNumber: viewDcNo, dcNumber: viewDcNo }}
                onFilterChange={(f) => setViewDcNo(f.QtNumber || f.dcNumber || viewDcNo)}
            >
                <DeliveryChallan key={viewDcNo} dcNumber={viewDcNo} />
            </SaleswindowModel>

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

            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm"
            >
                ← Go Back
            </button>

            <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">

                {/* ── Title + Action Buttons  */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Sales DC Entry</h2>
                        <p className="text-[12px] text-gray-400 mt-1">
                            Customer → Client DC → Products → Save
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={resetForm}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors"
                        >
                            NEW
                        </button>
                        <button
                            onClick={handleSaveDC}
                            disabled={busy.save}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40"
                        >
                            {busy.save ? "Saving…" : "SAVE"}
                        </button>
                        <button
                            onClick={handleUpdateDC}
                            disabled={busy.save}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-40"
                        >
                            UPDATE
                        </button>
                        <button
                            onClick={handleDeleteDC}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors"
                        >
                            DELETE
                        </button>
                    </div>
                </div>

                {/* 
                    STEP 1 — Customer + DC Header
                 */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        Step 1 — Customer Details
                    </p>
                    <div className="grid grid-cols-4 gap-7">

                        {/* Customer Name */}
                        <div className="relative" ref={custRef}>
                            <label className={labelCls}>
                                Customer / Company <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={custSearch}
                                onChange={(e) => {
                                    setCustSearch(e.target.value);
                                    setForm((p) => ({ ...p, customer_name: e.target.value }));
                                    searchCustomers(e.target.value);
                                    openDrop("customer");
                                }}
                                onFocus={() => {
                                    openDrop("customer");
                                    searchCustomers(custSearch);
                                }}
                                className={inputCls}
                                placeholder="Type to search customer…"
                            />
                            {open.customer && customers.length > 0 && (
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

                        {/* Admin DC No (auto-generated) */}
                        <div>
                            <label className={labelCls}>Admin DC No <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span></label>
                            <input
                                type="text"
                                value={form.dc_no}
                                readOnly
                                className={roInputCls}
                            />
                        </div>

                        {/* DC Date — auto-filled (editable) */}
                        <div>
                            <label className={labelCls}>DC Date <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span></label>
                            <input
                                ref={salesDcDateRef}
                                type="text"
                                placeholder="Select Date"
                                className={inputCls}
                                readOnly
                            />
                        </div>

                    </div>
                </div>

                {/* 
                    STEP 2 — Order Number Selection → SHOW → Display Fields
                 */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        Step 2 — Order Number Details
                    </p>
                    <div className="grid grid-cols-4 gap-7 mb-4">
                        <div className="relative" ref={clientDcRef}>
                            <label className={labelCls}>Order Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.order_no}
                                onChange={(e) => setForm((p) => ({ ...p, order_no: e.target.value }))}
                                className={`${inputCls} min-h-[43px]`}
                                placeholder="Type order number"
                            />
                        </div>

                        {/* Order Date — multi-date picker */}
                        <div>
                            <label className={labelCls}>Order Date <span className="text-[10px] text-gray-400 font-normal normal-case">(optional / multi)</span></label>
                            <input
                                ref={orderDateRef}
                                type="text"
                                placeholder="Select date(s)"
                                className={inputCls}
                                readOnly
                            />
                        </div>

                        {/* Despatch Through — custom dropdown */}
                        <div className="relative" ref={despatchRef}>
                            <label className={labelCls}>Despatch Through</label>
                            <div
                                onClick={() => setOpen((p) => ({ ...p, despatch: !p.despatch }))}
                                className={`${inputCls} flex justify-between items-center cursor-pointer select-none min-h-[43px]`}
                            >
                                <span className={form.despatch_through ? "text-black" : "text-gray-400"}>
                                    {form.despatch_through || "Select despatch mode"}
                                </span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {open.despatch && (
                                <div className={dropdownCls}>
                                    {DESPATCH_OPTIONS.map((d) => (
                                        <div
                                            key={d}
                                            onClick={() => {
                                                setForm((p) => ({ ...p, despatch_through: d }));
                                                closeAll("despatch");
                                            }}
                                            className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${form.despatch_through === d ? "bg-blue-50 text-blue-700" : ""
                                                }`}
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

                {/* ═══════════════════════════════════════════════════════════
                    Order Type
                ═══════════════════════════════════════════════════════════ */}
                <div className="flex gap-16 pb-6 mb-5 border-b border-gray-100">
                    <div>
                        <label className={labelCls}>Order Type</label>
                        <div className="flex items-center gap-6 h-[38px]">
                            {["Service", "Spares", "Purchase Items"].map((t) => (
                                <label key={t} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={form.ordertype === t}
                                        onChange={() => {
                                            setForm((p) => ({ ...p, ordertype: t }));
                                            setProdSearch("");
                                            setItem(INIT_ITEM);
                                        }}
                                        className="w-4 h-4 accent-black"
                                    />
                                    <span className="text-[12px] font-bold text-gray-700 uppercase">{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    STEP 3 — Add Products
                ═══════════════════════════════════════════════════════════ */}
                <div className="transition-all duration-200 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Step 3 — Add Products
                        </p>
                        <span className="text-[11px] text-gray-400">
                            {products.length} product{products.length !== 1 ? "s" : ""} available
                        </span>
                    </div>

                    <div className="grid grid-cols-9 gap-3 items-end">
                        {/* Product Search Dropdown */}
                        <div className="col-span-3 relative" ref={prodRef}>
                            <label className={labelCls}>Product <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={prodSearch}
                                onChange={(e) => {
                                    setProdSearch(e.target.value);
                                    setItem((prev) => ({ ...prev, item_name: e.target.value }));
                                    openDrop("product");
                                }}
                                onFocus={() => openDrop("product")}
                                placeholder="Type to search…"
                                className={inputCls}
                            />
                            {open.product && filteredProducts.length > 0 && (
                                <div className={dropdownCls}>
                                    {filteredProducts.map((p, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleProductSelect(p)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        >
                                            <div className="text-[13px] font-bold text-gray-900">{p.item_name}</div>
                                            <div className="flex gap-4 text-[11px] text-gray-400 mt-0.5">
                                                {p.hsn_number && <span>HSN: {p.hsn_number}</span>}
                                                {p.pending_qty != null && (
                                                    <span className={p.pending_qty > 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                                        Pending: {p.pending_qty}
                                                    </span>
                                                )}
                                                {p.uom && <span>{p.uom}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {open.product && filteredProducts.length === 0 && prodSearch && (
                                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                                    No matching products.
                                </div>
                            )}
                        </div>

                        {/* Quantity */}
                        <div className="col-span-1">
                            <label className={labelCls}>
                                Qty
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => setItem((p) => ({ ...p, quantity: e.target.value }))}
                                placeholder="0"
                                className={`${inputCls} bg-gray-50/50`}
                            />
                        </div>

                        {/* HSN */}
                        <div className="col-span-1">
                            <label className={labelCls}>HSN</label>
                            <input
                                type="text"
                                value={item.hsn}
                                onChange={(e) => setItem((p) => ({ ...p, hsn: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* Serial No */}
                        <div className="col-span-1">
                            <label className={labelCls}>Serial No</label>
                            <input
                                type="text"
                                value={item.sl_no}
                                onChange={(e) => setItem((p) => ({ ...p, sl_no: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* UOM */}
                        <div className="col-span-1">
                            <label className={labelCls}>UOM</label>
                            <input
                                type="text"
                                value={item.uom}
                                onChange={(e) => setItem((p) => ({ ...p, uom: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* Remarks */}
                        <div className="col-span-1 relative" ref={remarksRef}>
                            <label className={labelCls}>Remarks</label>
                            <div
                                onClick={() => setRemarksOpen((p) => !p)}
                                className={`${inputCls} bg-gray-50/50 flex justify-between items-center cursor-pointer select-none min-h-[43px]`}
                            >
                                <span className={item.remarks ? "text-black" : "text-gray-400"}>
                                    {item.remarks || "Select"}
                                </span>
                            </div>
                            {remarksOpen && (
                                <div className={dropdownCls}>
                                    {REMARKS_OPTIONS.map((remarks) => (
                                        <div
                                            key={remarks}
                                            onClick={() => {
                                                setItem((p) => ({ ...p, remarks }));
                                                setRemarksOpen(false);
                                            }}
                                            className={`px-3 py-2 cursor-pointer hover:bg-blue-100 text-[13px] font-semibold border-b border-gray-50 last:border-0 ${item.remarks === remarks ? "bg-blue-50 text-blue-700" : ""}`}
                                        >
                                            {remarks}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add / Clear */}
                        <div className="col-span-1 flex gap-2">
                            <button
                                onClick={handleAddItem}
                                className={`flex-1 py-2.5 text-white rounded-lg text-[13px] font-bold transition-colors ${editRowIndex >= 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                            >
                                {editRowIndex >= 0 ? "Update" : "Add"}
                            </button>
                            <button
                                onClick={() => { setItem(INIT_ITEM); setProdSearch(""); setEditRowIndex(-1); }}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    Products Table
                ═══════════════════════════════════════════════════════════ */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-2 h-[250px] overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["#", "Product", "Qty", "HSN", "Serial No", "UOM", "Remarks", "Actions"].map((h, i) => (
                                    <th
                                        key={i}
                                        className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${i === 0 ? "w-10 text-center" : i === 1 ? "text-left" : "text-center"
                                            }`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-14 text-center">
                                        <div className="text-gray-300 text-4xl mb-3">📦</div>
                                        <p className="text-[13px] text-gray-400 font-medium">
                                            No products added yet.
                                        </p>
                                        <p className="text-[12px] text-gray-300 mt-1">
                                            Select a customer and client DC to begin.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, idx) => (
                                    <tr
                                        key={idx}
                                        className={`border-b border-gray-100 transition-colors ${editRowIndex === idx ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50/70"}`}
                                    >
                                        <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">
                                            {r.item_name}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 text-center">
                                            {r.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{r.hsn || "—"}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{r.sl_no || "—"}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{r.uom}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-800 text-center font-medium">
                                            {r.remarks}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-3">
                                                <SquarePen
                                                    onClick={() => handleEditRow(idx)}
                                                    className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800"
                                                />
                                                <Trash2
                                                    onClick={() => handleRemoveRow(idx)}
                                                    className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 ">
                            <tr>
                                <td colSpan={9} className="px-4 py-3">
                                    <div className="flex items-center ml-[22%] gap-2">
                                        <span className="text-[13px] font-black text-gray-600 uppercase tracking-wide">TOTAL QTY</span>
                                        <span className="text-[13px] font-black text-gray-500">:</span>
                                        <span className="text-[18px] font-black text-blue-700">
                                            {rows.reduce((s, r) => s + Number(r.quantity || 0), 0)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Load Existing Dc */}

                <div className="mt-10 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        Load / Edit Existing DC
                    </p>
                    <div className="flex items-end gap-3" ref={loadDcRef}>
                        <div className="relative">
                            <label className={labelCls}>DC Number</label>
                            <input
                                type="text"
                                value={loadDcSearch}
                                onChange={(e) => {
                                    setLoadDcSearch(e.target.value);
                                    searchLoadDc(e.target.value);
                                    openDrop("loadDc");
                                }}
                                onFocus={() => {
                                    openDrop("loadDc");
                                    searchLoadDc(loadDcSearch);
                                }}
                                className={`${inputCls} w-52`}
                                placeholder="AT-DC-001"
                            />
                            {open.loadDc && dcSearchList.length > 0 && (
                                <div className="absolute top-full left-0 w-52 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                                    {dcSearchList.map((d) => (
                                        <div
                                            key={d.dc_no}
                                            onClick={() => { setLoadDcSearch(d.dc_no); closeAll("loadDc"); requirePassword(() => loadExistingDC(d.dc_no)); }}
                                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                                        >
                                            {d.dc_no}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
            )}
        </div>
    );
};

export default SalesDCEntry;
