import API_BASE_URL from "../../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2, CheckCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import InvoiceFormat from "../pages/Services/invoiceFormat";
import ServiceWindowModal from "../ui/servicewindowModal";
import { isTamilNadu, calcGstAmounts } from "../../utils/gstUtils";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const TODAY = new Date().toISOString().split("T")[0];
const API = `${API_BASE_URL}/serviceinvoice`;

const INIT_FORM = {
    customer_name: "",
    invoice_no: "",
    invoice_date: TODAY,
    client_dc_no: "",
    dc_no: "",
    dc_date: "",
    order_no: "",
    order_date: "",
    payment_terms: "",
    dispatch_through: "",
    discount: 0,
    transport: 0,
};

const INIT_ROW = {
    item_name: "",
    serial_no: "",
    quantity: "",
    price: "",
    gst_percent: 18,
    discount: 0,
    amount: 0,
    uom: "",
    hsn_number: "",
    order_no:"",
    order_date:""
};

const DESPATCH_OPTIONS = ["Courier", "By Hand", "Transport"];

const ServiceInvoiceForm = () => {
    const navigate = useNavigate();
    const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

    const [formData, setFormData] = useState(INIT_FORM);
    const [tabledata, settabledata] = useState([]);
    const [currentrow, setCurrentrow] = useState(INIT_ROW);
    const [dcItems, setDcItems] = useState([]);
    const [editIndex, setEditIndex] = useState(-1);
    const [loadInvoice, setLoadInvoice] = useState("");

    // Totals
    const [subtotal, setSubtotal] = useState(0);
    const [gstPct, setGstPct] = useState(18);
    const [cgst, setCgst] = useState(0);
    const [sgst, setSgst] = useState(0);
    const [igst, setIgst] = useState(0);
    const [roundOff, setRoundOff] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [customerState, setCustomerState] = useState("");
    const [customerGst, setCustomerGst] = useState("");

    // Success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedInvoiceNo, setSavedInvoiceNo] = useState("");
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceModalMin, setInvoiceModalMin] = useState(false);
    const [viewInvoiceNo, setViewInvoiceNo] = useState("");

    // Client dropdown
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState("");
    const [clientOpen, setClientOpen] = useState(false);
    const clientRef = useRef(null);

    // DC dropdown
    const [dcList, setDcList] = useState([]);
    const [dcOpen, setDcOpen] = useState(false);
    const [selectedDcNos, setSelectedDcNos] = useState([]);
    const dcRef = useRef(null);

    // Item dropdown
    const [itemOpen, setItemOpen] = useState(false);
    const itemRef = useRef(null);

    // UOM dropdown
    const uomRef = useRef(null);

    // Despatch dropdown
    const [despatchOpen, setDespatchOpen] = useState(false);
    const despatchRef = useRef(null);

    // SHOW display fields (comma-separated, read-only)
    const [orderNoDisplay, setOrderNoDisplay]   = useState("");
    const [orderDateDisplay, setOrderDateDisplay] = useState("");

    // Load invoice section
    const [loadSearch, setLoadSearch] = useState("");
    const [loadList, setLoadList] = useState([]);
    const [loadOpen, setLoadOpen] = useState(false);
    const loadRef = useRef(null);
    const invoiceDateRef = useRef(null);
    const invoiceDateFp = useRef(null);

    const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight";
    const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white shadow-sm";
    const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
    const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto";

    useOutsideClick([
        { ref: clientRef,   onClose: () => setClientOpen(false) },
        { ref: dcRef,       onClose: () => setDcOpen(false) },
        { ref: itemRef,     onClose: () => setItemOpen(false) },
        { ref: despatchRef, onClose: () => setDespatchOpen(false) },
        { ref: loadRef,     onClose: () => setLoadOpen(false) },
    ]);

    // Fetch next invoice number on mount
    useEffect(() => {
        fetchNextInvoiceNo();
    }, []);

    const fetchNextInvoiceNo = async () => {
        try {
            const res = await fetch(`${API}/next-SV-no`);
            const data = await res.json();
            setFormData(p => ({ ...p, invoice_no: data.invoice_no || "" }));
        } catch {
            console.error("Could not fetch invoice no");
        }
    };

    // Fetch clients (only Service DC customers)
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const url = `${API}/clients/search?q=${encodeURIComponent(clientSearch || "")}`;
                const res = await fetch(url);
                setClients(await res.json());
            } catch { setClients([]); }
        };
        fetchClients();
    }, [clientSearch]);

    // Fetch DC list when customer selected or search changes
    useEffect(() => {
        if (!formData.customer_name) { setDcList([]); return; }
        const fetchDcList = async () => {
            try {
                const params = new URLSearchParams({ supplier: formData.customer_name });
                const res = await fetch(`${API}/service-dc/search?${params}`);
                setDcList(await res.json());
            } catch { setDcList([]); }
        };
        fetchDcList();
    }, [formData.customer_name]);

    // Recalculate totals whenever table or tax inputs change
    useEffect(() => {
        const sub = tabledata.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        setSubtotal(sub);

        const trans = Number(formData.transport) || 0;
        const taxable = parseFloat((sub + trans).toFixed(2));

        const intrastate = isTamilNadu(customerState, customerGst);
        const gst = calcGstAmounts(taxable, Number(gstPct), intrastate);
        setCgst(gst.cgst);
        setSgst(gst.sgst);
        setIgst(gst.igst);

        const total = taxable + gst.cgst + gst.sgst + gst.igst;
        const ro = parseFloat((Math.round(total) - total).toFixed(2));
        setRoundOff(ro);
        setGrandTotal(Math.round(total));
    }, [tabledata, formData.transport, gstPct, customerState, customerGst]);

    // Fetch invoice list for load section
    useEffect(() => {
        if (!loadSearch && !loadOpen) return;
        const fetchLoad = async () => {
            try {
                const res = await fetch(`${API}/search-invoice?q=${encodeURIComponent(loadSearch || "")}`);
                setLoadList(await res.json());
            } catch { setLoadList([]); }
        };
        fetchLoad();
    }, [loadSearch, loadOpen]);

    const handleClientSelect = (c) => {
        const invoiceNo = formData.invoice_no;
        const invDate = formData.invoice_date;
        setCustomerState(c.state || "");
        setCustomerGst(c.gst_number || "");
        setFormData({ ...INIT_FORM, invoice_no: invoiceNo, invoice_date: invDate, customer_name: c.customer_name });
        setClientSearch(c.customer_name);
        setDcItems([]);
        setOrderNoDisplay("");
        setOrderDateDisplay("");
        setSelectedDcNos([]);
        setClientOpen(false);
        setDcOpen(true);
    };

    const handleDcSelect = async (dc) => {
        const adminDcNo = dc.inward_dc_no;
        setDcOpen(false);
        try {
            const res = await fetch(`${API}/service-dc/by-admin/${encodeURIComponent(adminDcNo)}`);
            const data = await res.json();
            if (!res.ok) { toast.error(data.message); return; }
            // Do NOT auto-fill order_no/order_date — store them in temp fields for SHOW
            setFormData(p => ({
                ...p,
                dc_no: adminDcNo,
                client_dc_no: data.header?.party_dc_no || "",
                dc_date: data.header?.dc_date ? data.header.dc_date.split("T")[0] : "",
                _selOrderNo: data.aggregated_order_no || data.header?.party_dc_no || "",
                _selOrderDate: data.aggregated_order_date || (data.header?.dc_date ? data.header.dc_date.split("T")[0] : ""),
                order_no: "",
                order_date: "",
                dispatch_through: p.despatch_through || "",
            }));
            setDcItems(data.items || []);
            toast.success(`DC ${adminDcNo} loaded — click SHOW to add.`);
        } catch {
            toast.error("Failed to fetch DC data");
        }
    };

    const handleShowClick = () => {
        const orderNo = formData._selOrderNo?.trim();
        const orderDate = formData._selOrderDate?.trim();
        const currentDcNo = formData.dc_no?.trim();
        if (!orderNo) { toast.error("Select an Admin DC first."); return; }

        // Check duplicate order number
        const existing = (orderNoDisplay || "").split(",").map(s => s.trim()).filter(Boolean);
        const newNos = orderNo.split(",").map(s => s.trim()).filter(Boolean);
        let hasNew = false;
        for (const no of newNos) {
            if (!existing.includes(no)) {
                existing.push(no);
                hasNew = true;
            }
        }
        if (!hasNew) { toast.error("Order Number already added."); return; }

        setOrderNoDisplay(prev => {
            let result = prev || "";
            for (const no of newNos) {
                if (!result.split(",").map(s => s.trim()).filter(Boolean).includes(no)) {
                    result = result ? `${result}, ${no}` : no;
                }
            }
            return result;
        });
        setOrderDateDisplay(prev => {
            const existingDates = (prev || "").split(",").map(s => s.trim()).filter(Boolean);
            const newDates = orderDate.split(",").map(s => s.trim()).filter(Boolean);
            let result = prev || "";
            for (const d of newDates) {
                if (!existingDates.includes(d)) {
                    result = result ? `${result}, ${d}` : d;
                    existingDates.push(d);
                }
            }
            return result;
        });

        // Mark this DC as selected so it won't appear in dropdown again
        if (currentDcNo) {
            setSelectedDcNos(prev => prev.includes(currentDcNo) ? prev : [...prev, currentDcNo]);
        }
        // Clear selected DC and reopen dropdown with remaining items
        setFormData(p => ({ ...p, dc_no: "", _selOrderNo: "", _selOrderDate: "" }));
        setDcOpen(true);
        toast.success(`Order ${newNos.join(", ")} added.`);
    };

    // Product input is select-only now, so always show every DC item in the dropdown
    const filteredDcItems = dcItems;

    const handleItemSelect = (item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(currentrow.price) || 0;
        const disc = Number(currentrow.discount) || 0;
        setCurrentrow(p => ({
            ...p,
            item_name: item.item_name || "",
            serial_no: item.serial_no || "",
            quantity:  item.quantity || "",
            hsn_number: item.hsn_number || item.hsn || "",
            uom: item.uom || "",
            amount: qty && price ? (qty * price) - disc : p.amount,
            order_no:    item.party_dc_no   || formData._selOrderNo || "",
            order_date:  item.party_dc_date || formData._selOrderDate || "",
            dc_no:       formData.dc_no || "",
            dc_date:     formData.dc_date || "",
        }));
        setItemOpen(false);
    };

    const calcAmount = (row) => {
        const qty = Number(row.quantity) || 0;
        const price = Number(row.price) || 0;
        const disc = Number(row.discount) || 0;
        return Math.max(0, (qty * price) - disc);
    };

    const addRow = () => {
        if (!currentrow.item_name) { toast.error("Item Name is required"); return; }
        if (!currentrow.quantity) { toast.error("Quantity is required"); return; }
        if (!currentrow.price) { toast.error("Rate / Price is required"); return; }

        const newRow = {
            ...currentrow,
            amount: calcAmount(currentrow),
            order_no: currentrow.order_no || formData._selOrderNo || "",
            order_date: currentrow.order_date || formData._selOrderDate || "",
            dc_no: currentrow.dc_no || formData.dc_no || "",
            dc_date: currentrow.dc_date || formData.dc_date || "",
        };

        if (editIndex >= 0) {
            const updated = [...tabledata];
            updated[editIndex] = newRow;
            settabledata(updated);
            setEditIndex(-1);
        } else {
            settabledata(p => [...p, newRow]);
        }
        setCurrentrow(INIT_ROW);
    };

    const editItem = (idx) => {
        setCurrentrow({ ...tabledata[idx] });
        setEditIndex(idx);
    };

    const deleteItem = (idx) => settabledata(p => p.filter((_, i) => i !== idx));

    const handleSaveInvoice = () => {
        saveInvoice();
    };

    const handleDeleteInvoice = () => {
        deleteInvoice();
    };

    const saveInvoice = async () => {
        if (!formData.customer_name.trim()) { toast.error("Customer Name is required"); return; }
        if (!formData.invoice_date) { toast.error("Invoice Date is required"); return; }
        if (!formData.dispatch_through?.trim()) { toast.error("Despatch Through is required."); return; }
        if (!tabledata.length) { toast.error("Please add at least one item"); return; }

        const uniqueDcDates = [...new Set(tabledata.map(it => it.dc_date).filter(Boolean))];
        const uniqueOrderDates = [...new Set(tabledata.map(it => it.order_date).filter(Boolean))];

        // Combine all selected DCs with any currently-loaded (not yet SHOW'd) DC
        const allSelectedDcNos = [...new Set([
            ...selectedDcNos,
            ...(formData.dc_no ? [formData.dc_no] : [])
        ])];
        const dcNoStr = allSelectedDcNos.length ? allSelectedDcNos.join(", ") : "";
        const dcDateStr = uniqueDcDates.length ? uniqueDcDates.join(", ") : (formData.dc_date || "");
        const orderNoStr = orderNoDisplay || (formData._selOrderNo || "");
        const orderDateStr = uniqueOrderDates.length ? uniqueOrderDates.join(", ") : (orderDateDisplay || formData._selOrderDate || "");

        const payload = {
            ...formData,
            dc_no: dcNoStr,
            dc_date: dcDateStr,
            order_no: orderNoStr,
            order_date: orderDateStr,
            taxable_value: taxableValue,
            cgst,
            sgst,
            igst,
            round_off: roundOff,
            grand_total: grandTotal,
            items: tabledata.map(r => ({
                item_name:    r.item_name,
                serial_no:    r.serial_no,
                quantity:     Number(r.quantity),
                price:        r.price,
                discount:     r.discount,
                amount:       r.amount,
                uom:          r.uom,
                hsn_number:   r.hsn_number,
                order_no:   r.order_no   || null,
                order_date: r.order_date || null,
                dc_no:      r.dc_no      || null,
                dc_date:    r.dc_date    || null,
            }))
        };

        try {
            const method = loadInvoice ? "PUT" : "POST";
            const url = loadInvoice ? `${API}/update/${loadInvoice}` : `${API}/create`;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            setSavedInvoiceNo(formData.invoice_no);
            setShowSuccessModal(true);
        } catch {
            toast.error("Failed to Save Invoice");
        }
    };

    const handleViewInvoice = () => {
        setViewInvoiceNo(savedInvoiceNo);
        setShowSuccessModal(false);
        setInvoiceModalMin(false);
        setShowInvoiceModal(true);
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        resetAll();
    };

    const loadInvoiceForEdit = async (invNo) => {
        try {
            const res = await fetch(`${API}/invoice/${encodeURIComponent(invNo)}`);
            const data = await res.json();
            if (!res.ok) throw new Error();
            const h = data.header;
            const safeDate = (d) => {
                if (!d) return "";
                return d.includes("T") ? d.split("T")[0] : d;
            };
            setFormData({
                customer_name: h.customer_name || "",
                invoice_no: h.invoice_no || "",
                invoice_date: safeDate(h.invoice_date || TODAY),
                client_dc_no: h.client_dc_no || "",
                dc_no: "",
                dc_date: safeDate(h.dc_date),
                order_no: "",
                order_date: "",
                dispatch_through: h.dispatch_through || "",
                discount: h.discount || 0,
                transport: h.transport || 0,
            });
            setOrderNoDisplay(h.order_no || "");
            setOrderDateDisplay(safeDate(h.order_date));
            setClientSearch(h.customer_name || "");
            // Populate selected DCs from loaded invoice so they don't appear in dropdown
            if (h.dc_no) {
                const loadedDcs = h.dc_no.split(",").map(s => s.trim()).filter(Boolean);
                setSelectedDcNos(loadedDcs);
            } else {
                setSelectedDcNos([]);
            }
            setIgst(h.igst || 0);
            settabledata((data.items || []).map(it => ({
                ...it,
                order_no: it.order_no || "",
                order_date: safeDate(it.order_date),
                dc_no: it.dc_no || h.dc_no || "",
                dc_date: it.dc_date ? safeDate(it.dc_date) : safeDate(h.dc_date),
            })));
            setLoadInvoice(h.invoice_no);
            toast.success("Invoice Loaded");
        } catch {
            toast.error("Failed to Load Invoice");
        }
    };

    const deleteInvoice = async () => {
        if (!loadInvoice) { toast.error("Load an invoice first to delete"); return; }
        if (!window.confirm(`Delete ${loadInvoice}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API}/delete/${encodeURIComponent(loadInvoice)}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Invoice Deleted");
            resetAll();
        } catch {
            toast.error("Failed to Delete Invoice");
        }
    };

    const resetAll = () => {
        setFormData(INIT_FORM);
        setClientSearch("");
        setLoadSearch("");
        setDcItems([]);
        settabledata([]);
        setCurrentrow(INIT_ROW);
        setEditIndex(-1);
        setLoadInvoice("");
        setSelectedDcNos([]);
        setOrderNoDisplay("");
        setOrderDateDisplay("");
        setSubtotal(0);
        setCgst(0);
        setSgst(0);
        setIgst(0);
        setRoundOff(0);
        setGrandTotal(0);
        setGstPct(18);
        setCustomerState("");
        setCustomerGst("");
        fetchNextInvoiceNo();
    };

    const isIntrastate = isTamilNadu(customerState, customerGst);
    const gstRates = calcGstAmounts(1, gstPct, isIntrastate);
    const taxableValue = parseFloat((subtotal + (Number(formData.transport) || 0)).toFixed(2));

    useEffect(() => {
        invoiceDateFp.current = flatpickr(invoiceDateRef.current, {
            disableMobile: true,
            monthSelectorType: "static",
            dateFormat: "d-m-Y",
            defaultDate: toDmy(formData.invoice_date) || new Date(),
            onChange: (selectedDates, dateStr) => {
                setFormData(p => ({ ...p, invoice_date: toYmd(dateStr) }));
            },
        });
        return () => invoiceDateFp.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (invoiceDateFp.current && formData.invoice_date) {
            invoiceDateFp.current.setDate(toDmy(formData.invoice_date));
        }
    }, [formData.invoice_date]);

    return (
        <><div className="min-h-screen bg-gray-50 p-6 font-sans">

            {/* ── Success Modal ── */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-1">Service Invoice Saved Successfully!</h2>
                        <p className="text-sm text-gray-500 mb-1">Invoice has been created.</p>
                        <p className="text-sm font-black text-blue-600 mb-6">{savedInvoiceNo}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleViewInvoice}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> View Invoice
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

            {/* ── Invoice View Modal ── */}
            <ServiceWindowModal
                title="Service Invoice"
                isOpen={showInvoiceModal}
                type="Invoice Format"
                isMinimized={invoiceModalMin}
                onMinimize={() => setInvoiceModalMin(true)}
                onClose={() => { setShowInvoiceModal(false); setInvoiceModalMin(false); resetAll(); }}
                filters={{ dcNumber: viewInvoiceNo }}
                onFilterChange={(f) => setViewInvoiceNo(f.dcNumber || viewInvoiceNo)}
            >
                <InvoiceFormat key={viewInvoiceNo} dcNumber={viewInvoiceNo} />
            </ServiceWindowModal>

            {/* ── Minimized bar ── */}
            {showInvoiceModal && invoiceModalMin && (
                <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setInvoiceModalMin(false)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
                    >
                        <div className="w-3 h-3 border border-white/50"></div>
                        Service Invoice
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
                        <h2 className="text-xl font-black text-black tracking-tight">SERVICE INVOICE</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Client → Service DC → Items → Save</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={resetAll} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">NEW</button>
                        <button onClick={handleSaveInvoice} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors">SAVE</button>
                        <button onClick={handleSaveInvoice} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors">UPDATE</button>
                        <button onClick={handleDeleteInvoice} className="border px-3 py-1.5 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">DELETE</button>
                    </div>
                </div>

                {/* ── Step 1 — Customer + Invoice Header ── */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1 — Customer & Invoice Details</p>
                    <div className="grid grid-cols-4 gap-5">

                        {/* Customer */}
                        <div className="relative" ref={clientRef}>
                            <label className={labelCls}>Customer <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setFormData(p => ({ ...p, customer_name: e.target.value }));
                                    setClientOpen(true);
                                }}
                                onFocus={() => setClientOpen(true)}
                                placeholder="Type to search customer…"
                                className={inputCls}
                            />
                            {clientOpen && clients.length > 0 && (
                                <div className={dropdownCls}>
                                    {clients.map((c, i) => (
                                        <div key={i} onClick={() => handleClientSelect(c)}
                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                                            {c.customer_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Invoice No */}
                        <div>
                            <label className={labelCls}>
                                Invoice No <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                            </label>
                            <input type="text" value={formData.invoice_no} readOnly className={roInputCls} />
                        </div>

                        {/* Invoice Date */}
                        <div>
                            <label className={labelCls}>Invoice Date <span className="text-red-500">*</span></label>
                            <input ref={invoiceDateRef} type="text" readOnly className={inputCls} />
                        </div>
                  
                   {/* Despatch Through */}
                        <div className="relative" ref={despatchRef}>
                            <label className={labelCls}>Despatch Through</label>
                            <div onClick={() => setDespatchOpen(p => !p)}
                                className={`${inputCls} flex justify-between items-center cursor-pointer select-none min-h-[43px]`}>
                                <span className={formData.dispatch_through ? "text-black" : "text-gray-400"}>
                                    {formData.dispatch_through || "Select despatch mode"}
                                </span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {despatchOpen && (
                                <div className={dropdownCls}>
                                    {DESPATCH_OPTIONS.map((d) => (
                                        <div key={d}
                                            onClick={() => { setFormData(p => ({ ...p, dispatch_through: d })); setDespatchOpen(false); }}
                                            className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${formData.dispatch_through === d ? "bg-blue-50 text-blue-700" : ""}`}>
                                            {d}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                       
                    </div>
                </div>

                {/* ── Step 2 — Service DC Details ── */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 2 — Service DC Details</p>

                    <div className="grid grid-cols-5 gap-8">

                         {/* Admin DC No — select-only dropdown (non-searchable) */}
                        <div className="relative" ref={dcRef}>
                            <label className={labelCls}>
                                Admin DC No <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => { if (formData.customer_name) setDcOpen(p => !p); }}
                                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px] ${
                                    !formData.customer_name ? "bg-gray-100 text-gray-400" : ""
                                }`}
                            >
                                <span className={formData.dc_no ? "text-black" : "text-gray-400 font-medium"}>
                                    {formData.dc_no || (formData.customer_name ? "Select Admin DC…" : "Select a customer first")}
                                </span>
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {dcOpen && (
                                <>
                                    {dcList.filter(dc => !selectedDcNos.includes(dc.inward_dc_no)).length > 0 ? (
                                        <div className={dropdownCls}>
                                            {dcList
                                                .filter(dc => !selectedDcNos.includes(dc.inward_dc_no))
                                                .map((dc, i) => (
                                                    <div key={i} onClick={() => handleDcSelect(dc)}
                                                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                                                        <div className="text-[13px] font-bold text-gray-900">{dc.inward_dc_no || "—"}</div>
                                                  </div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                                            {formData.customer_name ? "No remaining DCs available." : "Select a customer first"}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                          {/* SHOW Button */}
                        <div className="flex items-end">
                            <button type="button" onClick={handleShowClick}
                                disabled={!formData._selOrderNo}
                                className={`w-full px-4 py-2.5 max-w-[100px] rounded-lg text-[13px] font-black uppercase tracking-wider transition-all duration-150 ${
                                    formData._selOrderNo
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
                                placeholder="Click SHOW to add"
                                className={`${roInputCls}`}/>
                        </div>

                        {/* Order Date Display — read-only, accumulates from SHOW */}
                        <div>
                            <label className={labelCls}>
                                Order Date
                            </label>
                            <input type="text" value={orderDateDisplay}
                                readOnly
                                placeholder="Click SHOW to add"
                                className={roInputCls} />
                        </div>

                      
                    </div>


                    {/* DC Items chip list */}
                    {dcItems.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                                Items from Service DC — click to auto-fill
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {dcItems.map((item, i) => (
                                    <button key={i} type="button"
                                        onClick={() => handleItemSelect(item)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                                    >
                                        <span>{item.item_name}</span>
                                        {item.serial_no && <span className="text-[10px] text-blue-400">SL:{item.serial_no}</span>}
                                        {item.uom && <span className="text-[10px] text-blue-400">{item.uom}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Step 3 — Add Items ── */}
                <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Step 3 — Add Items</p>
                    <div className="grid grid-cols-9 gap-3">

                        {/* Item Name — select-only from DC items, not manually editable */}
                        <div className="col-span-2 relative" ref={itemRef}>
                            <label className={labelCls}>Product <span className="text-red-500">*</span></label>
                            <input type="text"
                                value={currentrow.item_name}
                                readOnly
                                onFocus={() => { if (dcItems.length > 0) setItemOpen(true); }}
                                onClick={() => { if (dcItems.length > 0) setItemOpen(true); }}
                                placeholder={dcItems.length > 0 ? "Select from DC items…" : "Select a Service DC first"}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 cursor-pointer"
                            />
                            {itemOpen && filteredDcItems.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-48 overflow-y-auto border border-gray-200">
                                    {filteredDcItems.map((item, i) => (
                                        <div key={i} onClick={(e) => { e.stopPropagation(); handleItemSelect(item); }}
                                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                                            <div className="text-[13px] font-semibold text-gray-900">{item.item_name}</div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                {item.uom && <span>{item.uom} · </span>}
                                                Qty: {Number(item.quantity) || 0}
                                                {item.serial_no && <span> · SL: {item.serial_no}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        
                        {/* Quantity */}
                        <div>
                            <label className={labelCls}> Qty </label>
                            <input type="number" placeholder="Qty"
                                value={Number(currentrow.quantity)}
                                onChange={(e) => setCurrentrow(p => ({ ...p, quantity: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                        </div>

                        {/* Rate */}
                        <div>
                            <label className={labelCls}>
                                Price <span className="text-red-500">*</span> </label>
                            <input type="number" placeholder="Rate"
                                value={currentrow.price}
                                onChange={(e) => setCurrentrow(p => ({ ...p, price: e.target.value }))}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50" />
                        </div>

                        {/* Serial No — auto-fetched, read-only */}
                        <div>
                            <label className={labelCls}>Serial No</label>
                            <input type="text" placeholder="Auto"
                                readOnly
                                value={currentrow.serial_no}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 cursor-not-allowed" />
                        </div>

                        {/* UOM — auto-fetched, read-only */}
                        <div className="relative" ref={uomRef}>
                            <label className={labelCls}>UOM</label>
                            <input type="text" placeholder="Auto"
                                readOnly
                                value={currentrow.uom}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 cursor-not-allowed" />
                        </div>

                        {/* HSN — auto-fetched, read-only */}
                        <div>
                            <label className={labelCls}>HSN</label>
                            <input type="text" placeholder="Auto"
                                readOnly
                                value={currentrow.hsn_number}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 cursor-not-allowed" />
                        </div>

                        {/* ADD / CLR */}
                        <div className="flex items-center gap-2 mt-6">
                            <button onClick={addRow} className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 text-[13px] font-bold">
                                {editIndex >= 0 ? "UPD" : "ADD"}
                            </button>
                            <button onClick={() => { setCurrentrow(INIT_ROW); setEditIndex(-1); }} className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 text-[13px] font-bold">CLR</button>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4">
                    <div className="h-[250px] overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {["#", "Item Name", "Qty", "Rate",  "Amount","UOM", "HSN", "Actions"].map((h, i) => (
                                    <th key={i} className="p-3 text-[11px] font-black text-gray-500 uppercase text-left border-r border-gray-100 last:border-0">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tabledata.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center">
                                        <div className="text-gray-300 text-4xl mb-3">🧾</div>
                                        <p className="text-[13px] text-gray-400 font-medium">No products added yet.</p>
                                        <p className="text-[12px] text-gray-300 mt-1">Select customer → Client DC → products to begin.</p>
                                    </td>
                                </tr>
                            ) : (
                                tabledata.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-[12px] text-gray-500 border-r">{idx + 1}</td>
                                        <td className="p-3 text-[12px] font-semibold border-r">{item.item_name}{item.serial_no}</td>
                                        <td className="p-3 text-[12px] border-r">{item.quantity}</td>
                                        <td className="p-3 text-[12px] border-r">{item.price}</td>
                                        <td className="p-3 text-[12px] font-semibold border-r">{Number(item.amount).toFixed(2)}</td>
                                        <td className="p-3 text-[12px] border-r">{item.uom}</td>
                                        <td className="p-3 text-[12px] border-r">{item.hsn_number}</td>
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
                        <tfoot className="sticky bottom-0 z-10 ">
                            <tr>
                                <td colSpan={8} className="px-4 py-3">
                                    <div className="flex items-center  ml-[23%] gap-2">
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

                {/* ── Totals + Load Section ── */}
                <div className="mt-10 grid grid-cols-2 gap-10">

                    {/* Load Invoice section */}
                    <div className="mt-auto p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6" ref={loadRef}>
                        <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic shrink-0">
                            Select Invoice To View / Modify :
                        </label>
                        <div className="relative w-[250px]">
                            <input
                                type="text"
                                value={loadSearch}
                                onFocus={() => setLoadOpen(true)}
                                onChange={(e) => { setLoadSearch(e.target.value); setLoadOpen(true); }}
                                placeholder="AT/INV/001"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-white"
                            />
                            {loadOpen && loadList.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-1 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                                    {loadList.map((inv, i) => (
                                        <div key={i}
                                            onClick={() => { setLoadSearch(inv.invoice_no); setLoadOpen(false); requirePassword(() => loadInvoiceForEdit(inv.invoice_no)); }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold">
                                            {inv.invoice_no}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Totals panel */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm bg-gray-50/50 p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="space-y-3">

                                <div className="flex justify-between items-center">
                                    <label className={labelCls}>Sub Total :</label>
                                    <input type="text" value={subtotal.toFixed(2)} readOnly
                                        className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
                                </div>

                                <div className="flex justify-between items-center">
                                    <label className={labelCls}>Transport Charges (+):</label>
                                    <input type="number" value={formData.transport}
                                        onChange={(e) => setFormData(p => ({ ...p, transport: e.target.value }))}
                                        className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
                                </div>

                                <div className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded">
                                    <label className="text-[11px] font-black text-blue-700 uppercase tracking-tight">Taxable Value :</label>
                                    <span className="text-[13px] font-black text-blue-900">{taxableValue.toFixed(2)}</span>
                                </div>

                                {/* GST % + state badge */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <label className={labelCls}>GST %</label>
                                        <input type="number" value={gstPct} onChange={(e) => setGstPct(Number(e.target.value))}
                                            className="w-12 p-1 border border-gray-300 rounded text-center text-[11px] font-bold outline-none" />
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isIntrastate ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                        {isIntrastate ? "TN — CGST+SGST" : "IGST"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <label className={labelCls}>CGST @{gstRates.cgstPct}%</label>
                                    <input type="text" value={cgst.toFixed(2)} readOnly
                                        className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
                                </div>

                                <div className="flex justify-between items-center">
                                    <label className={labelCls}>SGST @{gstRates.sgstPct}%</label>
                                    <input type="text" value={sgst.toFixed(2)} readOnly
                                        className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
                                </div>

                                <div className="flex justify-between items-center">
                                    <label className={labelCls}>IGST @{gstRates.igstPct}%</label>
                                    <input type="text" value={igst.toFixed(2)} readOnly
                                        className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
                                </div>

                                <div className="flex justify-between items-center">
                                    <label className={labelCls}>Round Off :</label>
                                    <input type="text" value={roundOff.toFixed(2)} readOnly
                                        className="w-32 p-1.5 border-b border-gray-300 bg-transparent text-right font-black text-black outline-none" />
                                </div>

                                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-300">
                                    <label className="text-[14px] font-black text-black uppercase tracking-tighter">NET TOTAL :</label>
                                    <span className="text-[22px] font-black text-[#311B92] italic tracking-tighter">
                                        {grandTotal || 0}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        {showPasswordModal && (
            <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
        )}
    </>);
};

export default ServiceInvoiceForm;
