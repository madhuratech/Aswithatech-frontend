import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/salesdc";
const TODAY = new Date().toISOString().split("T")[0];
const UOM_LIST = ["Nos", "Set", "Pkt", "Kg", "Mtr", "Ltr", "Box", "Unit"];
const DESPATCH_OPTIONS = ["By Hand", "By Courier", "By Transport", "By Air", "By Road", "By Rail", "By Sea"];

const INIT_FORM = {
    customer_name: "",
    dc_no: "",
    dc_date: TODAY,
    client_dc_no: "",
    Client_dc_date: "",
    order_no: "",
    order_date: "",
    despatch_through: "",
    status: "To Sell",
    ordertype: "Service",
};

const INIT_ITEM = {
    item_name: "",
    quantity: "",
    price: "",
    sl_no: "",
    hsn: "",
    uom: "Nos",
    pending_qty: "",
};

const SalesDCEntry = () => {
    const navigate = useNavigate();

    // ── form & table state ──────────────────────────────────────────────────
    const [form, setForm] = useState(INIT_FORM);
    const [rows, setRows] = useState([]);
    const [item, setItem] = useState(INIT_ITEM);

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

    // ── derived flags ────────────────────────────────────────────────────────
    const customerSelected = !!form.customer_name;
    const clientDcSelected = !!form.client_dc_no;

    // ── outside-click + initial DC no ────────────────────────────────────────
    useEffect(() => {
        fetchNextDcNo();
        const handler = (e) => {
            if (custRef.current && !custRef.current.contains(e.target)) closeAll("customer");
            if (clientDcRef.current && !clientDcRef.current.contains(e.target)) closeAll("clientDc");
            if (prodRef.current && !prodRef.current.contains(e.target)) closeAll("product");
            if (uomRef.current && !uomRef.current.contains(e.target)) closeAll("uom");
            if (loadDcRef.current && !loadDcRef.current.contains(e.target)) closeAll("loadDc");
            if (despatchRef.current && !despatchRef.current.contains(e.target)) closeAll("despatch");
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

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

    // Refetch products when order type changes
    useEffect(() => {
        if (form.ordertype) {
            fetchProducts(form.ordertype, prodSearch);
        }
    }, [form.ordertype]);


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
                client_dc_no: header.payment_terms || "",
                client_dc_date: header.Client_dc_date
                    ? new Date(header.Client_dc_date).toISOString().split("T")[0]
                    : "",
                order_no: header.order_no || "",
                order_date: header.order_date
                    ? new Date(header.order_date).toISOString().split("T")[0]
                    : "",
                despatch_through: header.despatch_through || "",
                status: header.status || "To Sell",
                ordertype: header.ordertype || "Service",
            });
            setCustSearch(header.customer_name || "");
            setRows(items || []);
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
        if (rows.some((r) => r.item_name === p.item_name)) {
            toast.error("This product is already added.");
            return;
        }
        setItem({
            item_name: p.item_name,
            quantity: p.pending_qty > 0 ? String(p.pending_qty) : "",
            price: p.price != null ? String(p.price) : "",
            sl_no: "",
            hsn: p.hsn_number || "",
            uom: p.uom || "Nos",
            pending_qty: String(p.pending_qty),
        });
        setProdSearch(p.item_name);
        closeAll("product");
    };

    const handleAddItem = () => {
        if (!item.item_name) {
            toast.error("Select a product first.");
            return;
        }
        const qty = parseFloat(item.quantity);
        if (!item.quantity || isNaN(qty) || qty <= 0) {
            toast.error("Quantity must be greater than 0.");
            return;
        }
        const pending = parseFloat(item.pending_qty);
        if (!isNaN(pending) && qty > pending) {
            toast.error(`Quantity (${qty}) exceeds pending quantity (${pending}).`);
            return;
        }
        if (rows.some((r) => r.item_name === item.item_name)) {
            toast.error("Duplicate product — already in the list.");
            return;
        }
        setRows((p) => [...p, { ...item }]);
        setItem(INIT_ITEM);
        setProdSearch("");
    };

    const handleRemoveRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx));

    // CRUD

    const buildPayload = () => ({
        customer_name: form.customer_name,
        dc_no: form.dc_no,
        dc_date: form.dc_date,
        order_no: form.order_no || null,
        order_date: form.order_date || null,
        payment_terms: form.client_dc_no || null,
        Client_dc_date: form.client_dc_date || null,
        despatch_through: form.despatch_through || null,
        status: form.status,
        ordertype: form.ordertype,
        items: rows.map((r) => ({
            item_name: r.item_name,
            quantity: r.quantity,
            price: r.price || 0,
            sl_no: r.sl_no || null,
            hsn: r.hsn || null,
            uom: r.uom || "Nos",
        })),
    });

    const validateHeader = () => {
        if (!form.customer_name?.trim()) { toast.error("Customer is required."); return false; }
        if (!form.client_dc_no?.trim()) { toast.error("Client DC Number is required."); return false; }
        if (!rows.length) { toast.error("Add at least one product."); return false; }
        return true;
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
                toast.success("Sales DC saved successfully.");
                resetForm();
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
    const disInputCls = "w-full p-2.5 border border-gray-100 rounded-lg text-[13px] font-semibold text-gray-400 bg-gray-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

    // Render
    return (
        <div className="min-h-screen bg-gray-50/70 p-6 font-sans">
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
                            onClick={saveDC}
                            disabled={busy.save}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40"
                        >
                            {busy.save ? "Saving…" : "SAVE"}
                        </button>
                        <button
                            onClick={updateDC}
                            disabled={busy.save}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-40"
                        >
                            UPDATE
                        </button>
                        <button
                            onClick={deleteDC}
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
                    <div className="grid grid-cols-4 gap-5">

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
                                type="date"
                                value={form.dc_date || TODAY}
                                onChange={(e) => setForm((p) => ({ ...p, dc_date: e.target.value }))}
                                className={inputCls}
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
                                            className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${
                                                form.despatch_through === d ? "bg-blue-50 text-blue-700" : ""
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

                {/* 
                    STEP 2 — Client DC Selection + Auto-fill
                 */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
                    <div className="grid grid-cols-4 gap-5">
                        <div className="relative" ref={clientDcRef}>
                            <label className={labelCls}>Client DC Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.client_dc_no}
                                onChange={(e) => setForm((p) => ({ ...p, client_dc_no: e.target.value }))}
                                className={`${inputCls} flex justify-between items-center cursor-pointer select-none min-h-[43px]`}
                                placeholder="Enter client DC number"
                            />
                        </div>

                        {/* Client DC Date — auto-filled to today (editable) */}
                        <div>
                            <label className={labelCls}>
                                Client DC Date
                                <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                            </label>
                            <input
                                type="date"
                                value={form.client_dc_date || TODAY}
                                onChange={(e) => setForm((p) => ({ ...p, client_dc_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        {/* Order No — manual entry */}
                        <div>
                            <label className={labelCls}>Order No</label>
                            <input
                                type="text"
                                value={form.order_no}
                                onChange={(e) => setForm((p) => ({ ...p, order_no: e.target.value }))}
                                className={inputCls}
                                placeholder="Enter order number"
                            />
                        </div>

                        {/* Order Date — manual entry */}
                        <div>
                            <label className={labelCls}>Order Date</label>
                            <input
                                type="date"
                                value={form.order_date}
                                onChange={(e) => setForm((p) => ({ ...p, order_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    Status + Order Type
                ═══════════════════════════════════════════════════════════ */}
                <div className="flex gap-16 pb-6 mb-5 border-b border-gray-100">
                    <div>
                        <label className={labelCls}>Status</label>
                        <div className="flex items-center gap-6 h-[38px]">
                            {["To Sell", "ReService"].map((s) => (
                                <label key={s} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={form.status === s}
                                        onChange={() => setForm((p) => ({ ...p, status: s }))}
                                        className="w-4 h-4 accent-black"
                                    />
                                    <span className="text-[12px] font-bold text-gray-700 uppercase">{s}</span>
                                </label>
                            ))}
                        </div>
                    </div>

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
                                    openDrop("product");
                                    fetchProducts(form.ordertype, e.target.value);
                                }}
                                onFocus={() => {
                                    openDrop("product");
                                    fetchProducts(form.ordertype, prodSearch);
                                }}
                                className={`${inputCls} bg-gray-50/50`}
                                placeholder={`Search ${form.ordertype || ''} products…`}
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
                                                <span className={p.pending_qty > 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                                    Pending: {p.pending_qty}
                                                </span>
                                                <span>{p.uom}</span>
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
                        <div>
                            <label className={labelCls}>
                                Qty
                                {item.pending_qty !== "" && (
                                    <span className="ml-1.5 text-[10px] text-orange-500 font-black normal-case">
                                        Max: {item.pending_qty}
                                    </span>
                                )}
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

                        {/* HSN — auto-filled and editable */}
                        <div>
                            <label className={labelCls}>
                                HSN
                                {item.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto / editable</span>}
                            </label>
                            <input
                                type="text"
                                value={item.hsn}
                                onChange={(e) => setItem((p) => ({ ...p, hsn: e.target.value }))}
                                className={`${inputCls} bg-gray-50/50`}
                                placeholder="HSN code"
                            />
                        </div>

                        {/* Serial No */}
                        <div>
                            <label className={labelCls}>Serial No</label>
                            <input
                                type="text"
                                value={item.sl_no}
                                onChange={(e) => setItem((p) => ({ ...p, sl_no: e.target.value }))}
                                placeholder="Optional"
                                className={`${inputCls} bg-gray-50/50`}
                            />
                        </div>

                        {/* UOM — auto-filled, still editable */}
                        <div className="relative" ref={uomRef}>
                            <label className={labelCls}>
                                UOM
                                {item.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
                            </label>
                            <div
                                onClick={() => setOpen((p) => ({ ...p, uom: !p.uom }))}
                                className={`${inputCls} ${item.item_name ? "border-blue-100 bg-blue-50 text-blue-800" : "bg-gray-50/50"} flex justify-between items-center cursor-pointer`}
                            >
                                <span>{item.uom}</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {open.uom && (
                                <div className={dropdownCls}>
                                    {UOM_LIST.map((u) => (
                                        <div
                                            key={u}
                                            onClick={() => { setItem((p) => ({ ...p, uom: u })); closeAll("uom"); }}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] font-medium border-b border-gray-50 last:border-0"
                                        >
                                            {u}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price — auto-filled */}
                        <div>
                            <label className={labelCls}>
                                Price
                                {item.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={(e) => setItem((p) => ({ ...p, price: e.target.value }))}
                                placeholder="0.00"
                                className={`${inputCls} bg-gray-50/50`}
                            />
                        </div>

                        {/* Add / Clear */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddItem}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[13px] font-bold transition-colors"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => { setItem(INIT_ITEM); setProdSearch(""); }}
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
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-2 min-h-[220px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["#", "Product", "Qty", "Pending Qty", "HSN", "Serial No", "UOM", "Price", ""].map((h, i) => (
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
                                        className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors"
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
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${parseFloat(r.pending_qty) > 0
                                                ? "bg-orange-50 text-orange-600"
                                                : "bg-gray-100 text-gray-400"
                                                }`}>
                                                {r.pending_qty || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{r.hsn || "—"}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{r.sl_no || "—"}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{r.uom}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-800 text-center font-medium">
                                            {r.price ? `₹${r.price}` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveRow(idx)}
                                                className="text-red-400 hover:text-red-600 text-[12px] font-bold transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
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
                                placeholder="AT/SDC-001"
                            />
                            {open.loadDc && dcSearchList.length > 0 && (
                                <div className="absolute top-full left-0 w-52 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                                    {dcSearchList.map((d) => (
                                        <div
                                            key={d.dc_no}
                                            onClick={() => {
                                                setLoadDcSearch(d.dc_no);
                                                loadExistingDC(d.dc_no);
                                                closeAll("loadDc");
                                            }}
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
        </div>
    );
};

export default SalesDCEntry;
