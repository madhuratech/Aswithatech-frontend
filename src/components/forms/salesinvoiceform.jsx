import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import SaleswindowModel from"../ui/saleswindowModal";
import InvoiceFormat from "../pages/Sales/invoiceformat";
import { isTamilNadu, calcGstAmounts } from "../../utils/gstUtils";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";

const API = "http://localhost:3000/api/salesinvoices";
const TODAY = new Date().toISOString().split("T")[0];

const DESPATCH_OPTIONS = [ "Courier", "Transport", "By Hand", "Lorry"];

const INIT_FORM = {
    customer_name: "",
    invoice_date: TODAY,
    dc_no: "",            // Admin DC No — internal identifier
    dc_date: "",          // Admin DC date — auto-filled
    order_no: "",
    order_date: "",
    dispatch_through: "",
    discount: 0,
    transport: 0,
};

const INIT_ITEM = {
    item_name: "",
    quantity: "",
    price: "",      // MANUAL — never auto-filled
    uom: "",
    hsn_number: "",
    sl_no: "",       // auto-fetched from DC item (display only)
    dc_quantity: "", // reference from DC (max allowed qty)
    amount: 0,
};

const SalesInvoiceForm = () => {
    const navigate = useNavigate();
    const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

    // ── core state ────────────────────────────────────────────────────────
    const [invoiceNo, setInvoiceNo]   = useState("");
    const [loadedInvoiceNo, setLoadedInvoiceNo] = useState(""); // editing mode
    const [form, setForm]             = useState(INIT_FORM);
    const [tableData, setTableData]   = useState([]);
    const [currentItem, setCurrentItem] = useState(INIT_ITEM);
    const [editIndex, setEditIndex]   = useState(-1);
    const [gstPct, setGstPct]         = useState(18);
    const [customerState, setCustomerState] = useState("");
    const [customerGst, setCustomerGst]     = useState("");

    // ── dropdown data ─────────────────────────────────────────────────────
    const [customers, setCustomers]   = useState([]);
    const [dcList, setDcList]         = useState([]);
    const [dcProducts, setDcProducts] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);

    // ── search display values ─────────────────────────────────────────────
    const [custSearch, setCustSearch] = useState("");
    const [prodSearch, setProdSearch] = useState("");
    const [loadSearch, setLoadSearch] = useState("");

    // ── open flags ────────────────────────────────────────────────────────
    const [open, setOpen] = useState({
        customer: false, dc: false, product: false,
        uom: false, despatch: false, loadInv: false,
    });

    // ── SHOW display fields (comma-separated, read-only) ────────────────
    const [dcNoDisplay, setDcNoDisplay]         = useState("");
    const [orderNoDisplay, setOrderNoDisplay]   = useState("");
    const [orderDateDisplay, setOrderDateDisplay] = useState("");

    // ── loading flags ─────────────────────────────────────────────────────
    const [busy, setBusy] = useState({ dcs: false, products: false, save: false });

    // ── success modal ─────────────────────────────────────────────────────
    const [showInvoiceWindow, setShowInvoiceWindow] = useState(false); 
    const [isMinimized, setIsMinimized] = useState(false);
    const [savedNo, setSavedNo] = useState(null);


    // ── refs ──────────────────────────────────────────────────────────────
    const custRef    = useRef(null);
    const dcRef      = useRef(null);
    const prodRef    = useRef(null);
    const uomRef     = useRef(null);
    const despRef    = useRef(null);
    const loadRef    = useRef(null);
    const invoiceDateRef = useRef(null);
    const invoiceDateFp  = useRef(null);

    // ── derived ───────────────────────────────────────────────────────────
    const customerSelected = !!form.customer_name;
    const dcSelected       = !!form.dc_no;

    // ════════════════════════════════════════════════════════════════════
    // Lifecycle
    // ════════════════════════════════════════════════════════════════════
    useEffect(() => {
        fetchNextInvoiceNo();
    }, []);

    useOutsideClick([
        { ref: custRef, onClose: () => closeAll("customer") },
        { ref: dcRef,   onClose: () => closeAll("dc") },
        { ref: prodRef, onClose: () => closeAll("product") },
        { ref: uomRef,  onClose: () => closeAll("uom") },
        { ref: despRef, onClose: () => closeAll("despatch") },
        { ref: loadRef, onClose: () => closeAll("loadInv") },
    ]);

    const closeAll = (key) => setOpen((p) => ({ ...p, [key]: false }));
    const openDrop = (key) => setOpen((p) => ({ ...p, [key]: true }));

    // ════════════════════════════════════════════════════════════════════
    // API helpers
    // ════════════════════════════════════════════════════════════════════
    const fetchNextInvoiceNo = async () => {
        try {
            const res  = await fetch(`${API}/next-In-billno`);
            const data = await res.json();
            if (data?.invoice_no) setInvoiceNo(data.invoice_no);
        } catch {
            console.error("Could not fetch invoice number");
        }
    };

    const searchCustomers = async (q = "") => {
        try {
            const res  = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch { setCustomers([]); }
    };

    const fetchDcsForCustomer = async (customerName) => {
        setBusy((p) => ({ ...p, dcs: true }));
        try {
            const res  = await fetch(`${API}/sales-dc/search?customer=${encodeURIComponent(customerName)}&q=`);
            const data = await res.json();
            setDcList(Array.isArray(data) ? data : []);
            if (!data.length) toast("No Sales DC entries found for this customer.", { icon: "ℹ️" });
        } catch {
            toast.error("Failed to load DC list.");
        } finally {
            setBusy((p) => ({ ...p, dcs: false }));
        }
    };

    const fetchDcDetails = async (dcNo) => {
        setBusy((p) => ({ ...p, products: true }));
        try {
            const res  = await fetch(`${API}/sales-dc/${encodeURIComponent(dcNo)}`);
            if (!res.ok) throw new Error();
            const { header, items, aggregated_order_no, aggregated_order_date } = await res.json();

            // Store only the selected DC reference — do NOT auto-fill order fields
            setForm((p) => ({
                ...p,
                dc_no:           header.dc_no    || "",
                dc_date:         header.dc_date   ? new Date(header.dc_date).toISOString().split("T")[0] : "",
                _selOrderNo:     aggregated_order_no || header.order_no || "",
                _selOrderDate:   aggregated_order_date || header.order_date || "",
                dispatch_through:  "",
            }));

            setDcProducts(Array.isArray(items) ? items : []);
            setCurrentItem(INIT_ITEM);
            setProdSearch("");
            closeAll("dc");
            toast.success(`DC ${dcNo} loaded — click SHOW to add to invoice.`);
        } catch {
            toast.error("Failed to load DC details.");
        } finally {
            setBusy((p) => ({ ...p, products: false }));
        }
    };

    const handleShowClick = () => {
        const dcNo = form.dc_no?.trim();
        const orderNo = form._selOrderNo?.trim();
        const orderDate = form._selOrderDate?.trim();
        if (!dcNo) { toast.error("Select an Admin DC first."); return; }
        if (!orderNo) { toast.error("No Order No found for this DC."); return; }

        // Check duplicate DC No
        const existingDcs = dcNoDisplay.split(",").map(s => s.trim()).filter(Boolean);
        if (existingDcs.includes(dcNo)) { toast.error(`DC ${dcNo} already added.`); return; }

        // Append to display fields
        setDcNoDisplay(prev => prev ? `${prev}, ${dcNo}` : dcNo);
        setOrderNoDisplay(prev => {
            const existing = (prev || "").split(",").map(s => s.trim()).filter(Boolean);
            // Append each order number individually (handle comma-separated from aggregation)
            const newNos = orderNo.split(",").map(s => s.trim()).filter(Boolean);
            for (const no of newNos) {
                if (!existing.includes(no)) {
                    prev = prev ? `${prev}, ${no}` : no;
                    existing.push(no);
                }
            }
            return prev;
        });
        setOrderDateDisplay(prev => {
            const existing = (prev || "").split(",").map(s => s.trim()).filter(Boolean);
            const newDates = orderDate.split(",").map(s => s.trim()).filter(Boolean);
            for (const d of newDates) {
                if (!existing.includes(d)) {
                    prev = prev ? `${prev}, ${d}` : d;
                    existing.push(d);
                }
            }
            return prev;
        });
        toast.success(`DC ${dcNo} added to invoice.`);
    };

    const searchInvoices = async (q = "") => {
        try {
            const res  = await fetch(`${API}/INV/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setInvoiceList(Array.isArray(data) ? data : []);
        } catch { setInvoiceList([]); }
    };

    const loadInvoice = async (invNo) => {
        try {
            const res  = await fetch(`${API}/edit/${encodeURIComponent(invNo)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Not found");

            const fmtDate = (d) => d ? new Date(d).toISOString().split("T")[0] : "";

            setLoadedInvoiceNo(invNo);
            setInvoiceNo(invNo);
            setCustSearch(data.header.customer_name || "");
            setForm({
                customer_name:    data.header.customer_name    || "",
                invoice_date:     fmtDate(data.header.invoice_date),
                dc_no:            "",  // not auto-selected
                dc_date:          data.header.dc_date          || "",
                order_no:         "",  // not auto-filled
                order_date:       "",  // not auto-filled
                dispatch_through: data.header.dispatch_through || "",
                discount:         data.header.discount         || 0,
                transport:        data.header.transport        || 0,
            });
            setDcNoDisplay(data.header.dc_no || "");
            setOrderNoDisplay(data.header.order_no || "");
            setOrderDateDisplay(data.header.order_date || "");

            const items = (data.items || []).map((it) => ({
                item_name:   it.item_name   || "",
                quantity:    it.quantity    || "",
                price:       it.price       || "",
                uom:         it.uom         || "",
                hsn_number:  it.hsn_number  || "",
                dc_quantity: "",
                amount:      Number(it.quantity || 0) * Number(it.price || 0),
                order_no:    it.order_no    || "",
                order_date:  it.order_date  || "",
                dc_no:       it.dc_no || data.header.dc_no || "",
                dc_date:     it.dc_date || data.header.dc_date || "",
            }));
            setTableData(items);
            closeAll("loadInv");            setLoadSearch(invNo);
            toast.success("Invoice loaded.");
        } catch (err) {
            toast.error(err.message || "Failed to load invoice.");
        }
    };

    // ════════════════════════════════════════════════════════════════════
    // Event handlers
    // ════════════════════════════════════════════════════════════════════
    const handleCustomerSelect = (customer) => {
        const name = customer.customer_name;
        setCustomerState(customer.state || "");
        setCustomerGst(customer.gst_number || "");
        setForm({ ...INIT_FORM, invoice_date: form.invoice_date, customer_name: name });
        setCustSearch(name);
        setDcList([]);
        setDcProducts([]);
        setTableData([]);
        setCurrentItem(INIT_ITEM);
        setProdSearch("");
        setDcNoDisplay("");
        setOrderNoDisplay("");
        setOrderDateDisplay("");
        closeAll("customer");
        fetchDcsForCustomer(name);
    };

    const handleDcSelect = (dc) => {
        fetchDcDetails(dc.dc_no);
    };

    const handleProductSelect = (prod) => {
        if (tableData.some((r, i) => i !== editIndex && r.item_name === prod.item_name)) {
            toast.error("This product is already added.");
            return;
        }
        setCurrentItem({
            item_name:   prod.item_name,
            quantity:    prod.quantity || "",
            price:       "",           // MANUAL — left blank intentionally
            uom:         prod.uom      || "Nos",
            hsn_number:  prod.hsn      || "",
            sl_no:       prod.sl_no    || "",
            dc_quantity: prod.quantity || "",
            amount:      0,
            order_no:    prod.order_no    || form._selOrderNo || "",
            order_date:  prod.order_date  || form._selOrderDate || "",
            dc_no:       prod.dc_no       || form.dc_no || "",
            dc_date:     prod.dc_date     || form.dc_date || "",
        });
        setProdSearch(prod.item_name);
        closeAll("product");
    };

    const handleAddItem = () => {
        if (!currentItem.item_name) { toast.error("Select a product."); return; }
        if (!currentItem.quantity || parseFloat(currentItem.quantity) <= 0) {
            toast.error("Quantity must be greater than 0."); return;
        }
        if (!currentItem.price || parseFloat(currentItem.price) <= 0) {
            toast.error("Price is required."); return;
        }
        const dcQty = parseFloat(currentItem.dc_quantity);
        if (!isNaN(dcQty) && parseFloat(currentItem.quantity) > dcQty) {
            toast.error(`Quantity cannot exceed DC quantity (${dcQty}).`); return;
        }
        if (editIndex < 0 && tableData.some((r) => r.item_name === currentItem.item_name)) {
            toast.error("Duplicate product — already in the list."); return;
        }
        const amount = (parseFloat(currentItem.quantity) * parseFloat(currentItem.price)).toFixed(2);
        const newRow = { 
            ...currentItem, 
            amount, 
            order_no: currentItem.order_no || form._selOrderNo || "", 
            order_date: currentItem.order_date || form._selOrderDate || "",
            dc_no: currentItem.dc_no || form.dc_no || "",
            dc_date: currentItem.dc_date || form.dc_date || ""
        };
        if (editIndex >= 0) {
            setTableData((p) => { const u = [...p]; u[editIndex] = newRow; return u; });
            setEditIndex(-1);
        } else {
            setTableData((p) => [...p, newRow]);
        }
        setCurrentItem(INIT_ITEM);
        setProdSearch("");
    };

    const editItem = (idx) => {
        const it = tableData[idx];
        setCurrentItem({
            item_name:   it.item_name,
            quantity:    it.quantity,
            price:       it.price,
            uom:         it.uom,
            hsn_number:  it.hsn_number,
            sl_no:       it.sl_no || "",
            dc_quantity: it.dc_quantity,
            amount:      it.amount,
            order_no:    it.order_no || "",
            order_date:  it.order_date || "",
            dc_no:       it.dc_no || "",
            dc_date:     it.dc_date || "",
        });
        setProdSearch(it.item_name);
        setEditIndex(idx);
    };

    const deleteItem = (idx) => setTableData((p) => p.filter((_, i) => i !== idx));

    // ════════════════════════════════════════════════════════════════════
    // Calculations
    // ════════════════════════════════════════════════════════════════════
    const subtotal   = tableData.reduce((s, it) => s + Number(it.amount || 0), 0);
    const totalQty   = tableData.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const transport  = Number(form.transport || 0);
    const taxableValue = parseFloat((subtotal + transport).toFixed(2));
    const isIntrastate = isTamilNadu(customerState, customerGst);
    const { cgst, sgst, igst, cgstPct, sgstPct, igstPct } = calcGstAmounts(taxableValue, gstPct, isIntrastate);
    const rawTotal   = taxableValue + cgst + sgst + igst;
    const roundOff   = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2));
    const grandTotal = Math.round(rawTotal);

    // ════════════════════════════════════════════════════════════════════
    // CRUD
    // ════════════════════════════════════════════════════════════════════
    const validate = () => {
        if (!form.customer_name?.trim()) { toast.error("Customer is required.");     return false; }
        if (!orderNoDisplay?.trim())  { toast.error("Click SHOW to add at least one DC Order."); return false; }
        if (!form.dispatch_through?.trim()) { toast.error("Despatch Through is required."); return false; }
        if (!tableData.length)           { toast.error("Add at least one product."); return false; }
        return true;
    };

    const buildPayload = () => {
        const uniqueDcDates = [...new Set(tableData.map(it => it.dc_date).filter(Boolean))];
        const uniqueOrderDates = [...new Set(tableData.map(it => it.order_date).filter(Boolean))];

        const dcNoStr = dcNoDisplay || (form.dc_no || "");
        const dcDateStr = uniqueDcDates.length ? uniqueDcDates.join(", ") : (form.dc_date || "");
        const orderNoStr = orderNoDisplay || (form._selOrderNo || "");
        const orderDateStr = uniqueOrderDates.length ? uniqueOrderDates.join(", ") : (orderDateDisplay || form._selOrderDate || "");

        return {
            customer_name:    form.customer_name,
            invoice_no:       invoiceNo,
            invoice_date:     form.invoice_date,
            dc_no:            dcNoStr,
            dc_date:          dcDateStr,
            order_no:         orderNoStr,
            order_date:       orderDateStr,
            dispatch_through: form.dispatch_through  || null,
            transport:        transport,
            subtotal:         subtotal,
            taxable_value:    taxableValue,
            cgst:             cgst,
            sgst:             sgst,
            igst:             igst,
            round_off:        roundOff,
            grandtotal:       grandTotal,
            ordertype:        null,
            items: tableData.map((it) => ({
                item_name:    it.item_name,
                quantity:     it.quantity,
                price:        it.price,
                uom:          it.uom,
                hsn_number:   it.hsn_number,
                order_no:   it.order_no   || null,
                order_date: it.order_date || null,
                dc_no:      it.dc_no      || null,
                dc_date:    it.dc_date    || null,
            })),
        };
    };

    const handleSaveInvoice = () => {
        saveInvoice();
    };

    const handleDeleteInvoice = () => {
        deleteInvoice();
    };

    const saveInvoice = async () => {
        if (!validate()) return;
        setBusy((p) => ({ ...p, save: true }));
        try {
            const method = loadedInvoiceNo ? "PUT" : "POST";
            const url    = loadedInvoiceNo
                ? `${API}/update/${encodeURIComponent(loadedInvoiceNo)}`
                : `${API}/new`;
            const res  = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(buildPayload()),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Save failed");

            setSavedNo(invoiceNo);  // open success modal
        } catch (err) {
            toast.error(err.message || "Failed to save invoice.");
        } finally {
            setBusy((p) => ({ ...p, save: false }));
        }
    };

    const deleteInvoice = async () => {
        if (!loadedInvoiceNo) { toast.error("Load an invoice first."); return; }
        if (!window.confirm(`Delete ${loadedInvoiceNo}?`)) return;
        try {
            const res = await fetch(`${API}/delete/${encodeURIComponent(loadedInvoiceNo)}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Invoice deleted.");
            resetAll();
        } catch {
            toast.error("Failed to delete invoice.");
        }
    };

    const resetAll = () => {
        setForm(INIT_FORM);
        setCustSearch("");
        setProdSearch("");
        setLoadSearch("");
        setTableData([]);
        setCurrentItem(INIT_ITEM);
        setEditIndex(-1);
        setDcList([]);
        setDcProducts([]);
        setInvoiceList([]);
        setLoadedInvoiceNo("");
        setGstPct(18);
        setCustomerState("");
        setCustomerGst("");
        setDcNoDisplay("");
        setOrderNoDisplay("");
        setOrderDateDisplay("");
        fetchNextInvoiceNo();
    };

    // ════════════════════════════════════════════════════════════════════
    // Filtered products
    // ════════════════════════════════════════════════════════════════════
    const filteredProducts = dcProducts.filter((p) =>
        p.item_name.toLowerCase().includes(prodSearch.toLowerCase())
    );

    // ════════════════════════════════════════════════════════════════════
    // Shared class shortcuts
    // ════════════════════════════════════════════════════════════════════
    const labelCls   = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
    const inputCls   = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const disInputCls = "w-full p-2.5 border border-gray-100 rounded-lg text-[13px] font-semibold text-gray-300 bg-gray-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";


    const formatQty = (qty) => {
  const num = Number(qty);
  return num % 1 === 0 ? num : num.toFixed(2);
};

    // ════════════════════════════════════════════════════════════════════
    // Flatpickr: Invoice Date
    // ════════════════════════════════════════════════════════════════════
    useEffect(() => {
        invoiceDateFp.current = flatpickr(invoiceDateRef.current, {
            disableMobile: true,
            monthSelectorType: "static",
            dateFormat: "d-m-Y",
            defaultDate: toDmy(form.invoice_date) || new Date(),
            onChange: (selectedDates, dateStr) => {
                setForm(p => ({ ...p, invoice_date: toYmd(dateStr) }));
            },
        });
        return () => invoiceDateFp.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (invoiceDateFp.current && form.invoice_date) {
            invoiceDateFp.current.setDate(toDmy(form.invoice_date));
        }
    }, [form.invoice_date]);

    // Render
    return (
        <div className="min-h-screen bg-gray-50/70 p-6 font-sans">
            {/* ── Success Modal ─────────────────────────────────────────── */}
            {savedNo && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-[22px] font-black text-gray-900 mb-1">
                            Sales Invoice Saved Successfully!
                        </h2>
                        <p className="text-[13px] text-gray-400 mb-6">
                            Invoice No: <span className="font-bold text-gray-700">{savedNo}</span>
                        </p>
                        <div className="flex gap-3 mb-4">
                            <button
                                 onClick={() => {setShowInvoiceWindow(true);}}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-colors"
                            >
                                View Invoice
                            </button>
                            <button
                      onclick={() => {setShowInvoiceWindow(true)}}
                      className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[14px] font-bold hover:bg-black transition-colors"
                            >
                                Print Invoice
                            </button>
                        </div>
                        <button
                              onClick={() => { setSavedNo(null); resetAll(); }}
                            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Close &amp; start new invoice
                        </button>
                    </div>
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

                {/* ── Title + Buttons ──────────────────────────────────── */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Sales Invoice</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Customer → Client DC → Products → Save</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={resetAll}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">
                            NEW
                        </button>
                        <button onClick={handleSaveInvoice} disabled={busy.save}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40">
                            {busy.save ? "Saving…" : loadedInvoiceNo ? "UPDATE" : "SAVE"}
                        </button>
                        <button onClick={handleDeleteInvoice}
                            className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">
                            DELETE
                        </button>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    STEP 1 — Customer + Invoice Header
                ══════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        Step 1 — Invoice Header
                    </p>
                    <div className="grid grid-cols-4 gap-5">

                        {/* Customer */}
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
                                onFocus={() => { openDrop("customer"); searchCustomers(custSearch); }}
                                className={inputCls}
                                placeholder="Type to search DC customers…"
                            />
                            {open.customer && customers.length > 0 && (
                                <div className={dropdownCls}>
                                    {customers.map((c, i) => (
                                        <div key={i} onClick={() => handleCustomerSelect(c)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                                            {c.customer_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {open.customer && customers.length === 0 && custSearch && (
                                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                                    No DC customers found matching "{custSearch}"
                                </div>
                            )}
                        </div>

                        {/* Invoice No (auto-generated) */}
                        <div>
                            <label className={labelCls}>Invoice No (Auto)</label>
                            <input type="text" value={invoiceNo} readOnly className={roInputCls} />
                        </div>

                        {/* Invoice Date */}
                        <div>
                            <label className={labelCls}>Invoice Date</label>
                            <input ref={invoiceDateRef} type="text" readOnly className={inputCls} />
                        </div>

                        {/* Despatch Through — dropdown */}
                        <div className="relative" ref={despRef}>
                            <label className={labelCls}>
                                Despatch Through
                                {dcSelected && <span className="ml-1.5 text-[10px] text-blue-500 font-black normal-case">Auto-filled</span>}
                            </label>
                            <div
                                onClick={() => customerSelected && setOpen((p) => ({ ...p, despatch: !p.despatch }))}
                                className={`${customerSelected ? inputCls : disInputCls} flex justify-between items-center cursor-pointer min-h-[43px]`}
                            >
                                <span className={form.dispatch_through ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                                    {form.dispatch_through || "Select mode…"}
                                </span>
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {open.despatch && (
                                <div className={dropdownCls}>
                                    {DESPATCH_OPTIONS.map((opt) => (
                                        <div key={opt}
                                            onClick={() => { setForm((p) => ({ ...p, dispatch_through: opt })); closeAll("despatch"); }}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    STEP 2 — Client DC Selection + Auto-fill
                ══════════════════════════════════════════════════════ */}
                <div className={`rounded-xl p-5 border mb-5 transition-all duration-200 ${
                    customerSelected
                        ? "bg-gradient-to-br from-blue-50/40 to-white border-blue-100"
                        : "bg-gray-50 border-gray-100 opacity-50 pointer-events-none"
                }`}>
                    <div className="flex items-center gap-3 mb-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Step 2 — Client DC Number
                        </p>
                        {busy.dcs && (
                            <span className="text-[11px] text-blue-500 font-semibold animate-pulse">Loading DCs…</span>
                        )}
                        {busy.products && (
                            <span className="text-[11px] text-blue-500 font-semibold animate-pulse">Loading products…</span>
                        )}
                    </div>
                    <div className="grid grid-cols-6 gap-5">

                        {/* Admin DC No — searchable dropdown */}
                        <div className="relative" ref={dcRef}>
                            <label className={labelCls}>
                                Admin DC No <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => customerSelected && openDrop("dc")}
                                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px]`}
                            >
                                <span className={form.dc_no ? "text-black" : "text-gray-400 font-medium"}>
                                    {form.dc_no || (busy.dcs ? "Loading…" : "Select Admin DC…")}
                                </span>
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {open.dc && (
                                <div className={dropdownCls}>
                                    {dcList.length === 0 ? (
                                        <div className="px-4 py-3 text-[13px] text-gray-400">No eligible DCs found for this customer.</div>
                                    ) : (
                                        dcList.map((dc, i) => (
                                            <div key={i} onClick={() => handleDcSelect(dc)}
                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                                                <div className="text-[14px] font-bold text-gray-900">{dc.dc_no || "—"}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SHOW Button */}
                        <div className="flex items-end">
                            <button type="button" onClick={handleShowClick}
                                disabled={!form.dc_no}
                                className={`w-full max-w-[100px] px-4 py-2.5 rounded-lg text-[13px] font-black uppercase tracking-wider transition-all duration-150 ${
                                    form.dc_no
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}>
                                SHOW
                            </button>
                        </div>

                        {/* Order No Display — read-only, accumulates from SHOW */}
                        <div>
                            <label className={labelCls}>
                                Order No
                            </label>
                            <input type="text" value={orderNoDisplay}
                                readOnly
                                className={roInputCls}
                                placeholder="Click SHOW to add" />
                        </div>

                        {/* Order Date Display — read-only, accumulates from SHOW */}
                        <div>
                            <label className={labelCls}>
                                Order Date
                            </label>
                            <input type="text" value={orderDateDisplay}
                                readOnly
                                className={roInputCls}
                                placeholder="Click SHOW to add" />
                        </div>

                    </div>

                    {/* DC Date row */}
                    {dcSelected && (
                        <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2.5 border border-blue-100">
                            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[12px] text-blue-700 font-semibold">
                                Admin DC No: <strong>{form.dc_no}</strong>
                                {form.dc_date && <> &nbsp;·&nbsp; DC Date: <strong>{form.dc_date}</strong></>}
                                &nbsp;·&nbsp; {dcProducts.length} product{dcProducts.length !== 1 ? "s" : ""} available
                            </span>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════
                    STEP 3 — Add Products
                ══════════════════════════════════════════════════════ */}
                <div className={`transition-all duration-200 mb-4 ${!dcSelected ? "opacity-40 pointer-events-none" : ""}`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Step 3 — Add Products &amp; Price
                    </p>

                    <div className="grid grid-cols-10 gap-3 items-end">
                        {/* Product Search — locked once a product is selected */}
                        <div className="col-span-3 relative" ref={prodRef}>
                            <label className={labelCls}>Product <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={prodSearch}
                                readOnly={!!currentItem.item_name}
                                onChange={(e) => { setProdSearch(e.target.value); openDrop("product"); }}
                                onFocus={() => { if (!currentItem.item_name) openDrop("product"); }}
                                disabled={!dcSelected}
                                className={!dcSelected ? disInputCls : currentItem.item_name ? roInputCls : `${inputCls} bg-gray-50/60`}
                                placeholder="Search DC products…"
                            />
                            {open.product && filteredProducts.length > 0 && (
                                <div className={dropdownCls}>
                                    {filteredProducts.map((p, i) => (
                                        <div key={i} onClick={() => handleProductSelect(p)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                                            <div className="text-[13px] font-bold text-gray-900">{p.item_name}</div>
                                            <div className="flex gap-4 text-[11px] text-gray-400 mt-0.5">
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
                            </label>
                            <input type="number" value={
                                currentItem.quantity || ""
                                    ? (Number(currentItem.quantity) % 1 === 0 ? String(Number(currentItem.quantity)) : String(currentItem.quantity))
                                    : ""
                            }
                                onChange={(e) => setCurrentItem((p) => ({ ...p, quantity: e.target.value }))}
                                placeholder="0"
                                className={`${inputCls} bg-gray-50/60`} />
                        </div>

                        {/* Price — MANUAL */}
                        <div>
                            <label className={labelCls}>
                                Price <span className="text-red-500">*</span>
                                <span className="ml-1.5 text-[10px] text-gray-400 font-black normal-case">Manual</span>
                            </label>
                            <input type="number" min="0" value={currentItem.price}
                                onChange={(e) => {
                                    const price = e.target.value;
                                    const amount = (parseFloat(currentItem.quantity || 0) * parseFloat(price || 0)).toFixed(2);
                                    setCurrentItem((p) => ({ ...p, price, amount }));
                                }}
                                placeholder="Enter price"
                                className={`${inputCls} bg-gray-50/60`} />
                        </div>

                        {/* UOM — auto-fetched, read-only */}
                        <div className="relative" ref={uomRef}>
                            <label className={labelCls}>
                                UOM
                                {currentItem.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
                            </label>
                            <input
                                type="text"
                                value={currentItem.uom}
                                readOnly
                                className={currentItem.item_name ? roInputCls : `${inputCls} bg-gray-50/60 cursor-not-allowed`}
                                placeholder="Auto"
                            />
                        </div>

                        {/* Serial No — auto-fetched, read-only */}
                        <div>
                            <label className={labelCls}>
                                Serial No
                                {currentItem.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
                            </label>
                            <input
                                type="text"
                                value={currentItem.sl_no}
                                readOnly
                                className={currentItem.item_name ? roInputCls : `${inputCls} bg-gray-50/60 cursor-not-allowed`}
                                placeholder="Auto"
                            />
                        </div>

                        {/* HSN — auto-fetched, read-only */}
                        <div>
                            <label className={labelCls}>
                                HSN
                                {currentItem.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
                            </label>
                            <input type="text" value={currentItem.hsn_number}
                                readOnly
                                className={currentItem.item_name ? roInputCls : `${inputCls} bg-gray-50/60 cursor-not-allowed`}
                                placeholder="Auto" />
                        </div>

                        {/* Amount (calculated) */}
                        <div>
                            <label className={labelCls}>Amount</label>
                            <input type="text"
                                value={currentItem.price && currentItem.quantity
                                    ? (parseFloat(currentItem.quantity || 0) * parseFloat(currentItem.price || 0)).toFixed(2)
                                    : ""}
                                readOnly
                                className={roInputCls}
                                placeholder="Auto" />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button onClick={handleAddItem}
                                className={`flex-1 py-2.5 text-white rounded-lg text-[13px] font-bold transition-colors ${editIndex >= 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}>
                                {editIndex >= 0 ? "Update" : "Add"}
                            </button>
                            <button onClick={() => { setCurrentItem(INIT_ITEM); setProdSearch(""); setEditIndex(-1); }}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Items Table ──────────────────────────────────────── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-3">
                    <div className="h-[250px] overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["#", "Product", " Quantity", "Rate", "Amount", "UOM", "HSN", "Actions"].map((h, i) => (
                                    <th key={i}
                                        className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${
                                            i === 0 ? "w-10 text-center" : i === 1 ? "text-left" : "text-center"
                                        }`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-14 text-center">
                                        <div className="text-gray-300 text-4xl mb-3">🧾</div>
                                        <p className="text-[13px] text-gray-400 font-medium">No products added yet.</p>
                                        <p className="text-[12px] text-gray-300 mt-1">Select customer → Client DC → products to begin.</p>
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((it, idx) => (
                                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${editIndex === idx ? "bg-blue-50" : "hover:bg-gray-50/70"}`}>
                                        <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">{idx + 1}</td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">{it.item_name}{it.sl_no}</td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 text-center">{formatQty(it.quantity)}</td>
                                        <td className="px-4 py-3 text-[13px] font-medium text-gray-700 text-center">₹{it.price}</td>
                                        <td className="px-4 py-3 text-[13px] font-bold text-gray-900 text-center">₹{Number(it.amount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{it.uom}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{it.hsn_number || "—"}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => editItem(idx)} title="Edit">
                                                    <SquarePen size={16} className="text-blue-500 hover:text-blue-700 transition-colors" />
                                                </button>
                                                <button onClick={() => deleteItem(idx)} title="Delete">
                                                    <Trash2 size={16} className="text-red-400 hover:text-red-600 transition-colors" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 ">
                            <tr>
                                <td colSpan={9} className="px-4 py-3">
                                    <div className="flex items-center ml-[23%] gap-2">
                                        <span className="text-[13px] font-black text-gray-600 uppercase tracking-wide">TOTAL QTY</span>
                                        <span className="text-[13px] font-black text-gray-500">:</span>
                                        <span className="text-[18px] font-black text-blue-700">{totalQty}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                </div>

                {/* ── Totals + Load Invoice ─────────────────────────── */}
                <div className="grid grid-cols-2 gap-10 mt-8">

                    {/* Load Existing Invoice */}
                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                            Load / Edit Existing Invoice
                        </p>
                        <div className="relative w-64" ref={loadRef}>
                            <label className={labelCls}>Invoice No</label>
                            <input
                                type="text"
                                value={loadSearch}
                                onChange={(e) => { setLoadSearch(e.target.value); searchInvoices(e.target.value); openDrop("loadInv"); }}
                                onFocus={() => { openDrop("loadInv"); searchInvoices(loadSearch); }}
                                className={`${inputCls} w-64`}
                                placeholder="AT/SINV-001"
                            />
                            {open.loadInv && invoiceList.length > 0 && (
                                <div className={`${dropdownCls} w-64`}>
                                    {invoiceList.map((inv, i) => (
                                        <div key={i}
                                            onClick={() => requirePassword(() => loadInvoice(inv.invoice_no))}
                                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                                            {inv.invoice_no}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grand Total Summary */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3 max-w-sm ml-auto">

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-gray-500 uppercase">Sub Total</span>
                                <span className="text-[13px] font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-gray-500 uppercase">Transport Charges (+)</span>
                                <input type="number" min="0" value={form.transport}
                                    onChange={(e) => setForm((p) => ({ ...p, transport: e.target.value }))}
                                    className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
                            </div>

                            <div className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded">
                                <span className="text-[12px] font-black text-blue-700 uppercase">Taxable Value</span>
                                <span className="text-[13px] font-bold text-blue-900">₹{taxableValue.toFixed(2)}</span>
                            </div>

                            {/* GST % selector + state badge */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-black text-gray-500 uppercase">GST %</span>
                                    <input type="number" value={gstPct}
                                        onChange={(e) => setGstPct(Number(e.target.value))}
                                        className="w-12 p-1 border border-gray-200 rounded text-center text-[11px] font-bold outline-none" />
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isIntrastate ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                    {isIntrastate ? "TN — CGST+SGST" : "IGST"}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-gray-500 uppercase">CGST @{cgstPct}%</span>
                                <span className="text-[13px] font-bold text-gray-700">₹{cgst.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-gray-500 uppercase">SGST @{sgstPct}%</span>
                                <span className="text-[13px] font-bold text-gray-700">₹{sgst.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-gray-500 uppercase">IGST @{igstPct}%</span>
                                <span className="text-[13px] font-bold text-gray-700">₹{igst.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-gray-500 uppercase">Round Off</span>
                                <span className="text-[13px] font-bold text-gray-700">{roundOff.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                                <span className="text-[15px] font-black text-black uppercase">NET TOTAL</span>
                                <span className="text-[24px] font-black text-indigo-700">₹{grandTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <SaleswindowModel
    title="Invoice Format"
    isOpen={showInvoiceWindow}
    type="Invoice Format"
    onClose={() => setShowInvoiceWindow(false)}
    isMinimized={isMinimized}
    onMinimize={() => {
        setIsMinimized(true);
        setShowInvoiceWindow(false);
    }}
    initialView="qt"
    filters={{
        QtNumber: savedNo
    }}
>
    <InvoiceFormat InvNumber={savedNo} />
</SaleswindowModel>

{showPasswordModal && (
    <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
)}

            </div>
        </div>
    );
};



export default SalesInvoiceForm;
