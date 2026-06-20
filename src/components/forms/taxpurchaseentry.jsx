import API_BASE_URL from "../../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { SquarePen, Trash2 } from "lucide-react";
import SaleswindowModel from "../ui/saleswindowModal";
import TaxPurchaseFormat from "../pages/Purchase/taxpurchaseformat";
import { isTamilNadu, calcGstAmounts } from "../../utils/gstUtils";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const API = `${API_BASE_URL}/taxpurchases`;
const TODAY = new Date().toISOString().split("T")[0];
const UOM_LIST = ["Nos", "Set", "Pkt", "Kg", "Mtr", "Ltr", "Box", "Unit"];
const OTHER_CHARGE_OPTIONS = ["Transportation Charges", "Delivery Charges", "Courier Charges"];
const DESPATCH_OPTIONS = ["By Hand", "Courier", "Transport", "Bus", "Lorry", "Parcel Service"];

const INIT_FORM = {
  supplier_name: "",
  bill_date:     TODAY,
  order_no:      "",
  order_date:    "",
  despatch:      "",
  due_date:      "",
  discount:      0,
  other_name:    "",
  other_charges: 0,
};

const INIT_ITEM = {
  item_name: "",
  serial_no: "",
  quantity:  "",
  price:     "",
  hsn:       "",
  uom:       "",
};

const PurchaseEntry = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // ── core state ────────────────────────────────────────────────────────
  const [billNo, setBillNo]               = useState("");
  const [loadedBillNo, setLoadedBillNo]   = useState("");
  const [form, setForm]                   = useState(INIT_FORM);
  const [orderType, setOrderType]         = useState("");
  const [tabledata, setTabledata]         = useState([]);
  const [currentItem, setCurrentItem]     = useState(INIT_ITEM);
  const [editIndex, setEditIndex]         = useState(-1);
  const [gstPct, setGstPct]               = useState(18);
  const [supplierState, setSupplierState] = useState("");
  const [supplierGst, setSupplierGst]     = useState("");

  // ── dropdown data ─────────────────────────────────────────────────────
  const [suppliers, setSuppliers]   = useState([]);
  const [items, setItems]           = useState([]);
  const [billList, setBillList]     = useState([]);

  // ── search display values ─────────────────────────────────────────────
  const [supplierSearch, setSupplierSearch] = useState("");
  const [itemSearch, setItemSearch]         = useState("");
  const [loadSearch, setLoadSearch]         = useState("");

  // ── open flags ────────────────────────────────────────────────────────
  const [open, setOpen] = useState({
    supplier: false, item: false, uom: false,
    despatch: false, other: false, loadBill: false,
  });

  const [busy, setBusy] = useState({ save: false });

  // ── success modal ─────────────────────────────────────────────────────
  const [savedBill, setSavedBill]         = useState(null);
  const [showWindow, setShowWindow]       = useState(false);
  const [isMinimized, setIsMinimized]     = useState(false);

  // ── refs ──────────────────────────────────────────────────────────────
  const supplierRef = useRef(null);
  const itemRef     = useRef(null);
  const uomRef      = useRef(null);
  const despRef     = useRef(null);
  const otherRef    = useRef(null);
  const loadRef     = useRef(null);
  const billDateRef = useRef(null);
  const billDateFp  = useRef(null);
  const dueDateRef  = useRef(null);
  const dueDateFp   = useRef(null);

  // ── shared CSS (matches Sales Invoice exactly) ────────────────────────
  const labelCls    = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputCls    = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const roInputCls  = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const disInputCls = "w-full p-2.5 border border-gray-100 rounded-lg text-[13px] font-semibold text-gray-300 bg-gray-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  // ════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════
  useOutsideClick([
    { ref: supplierRef, onClose: () => closeAll("supplier") },
    { ref: itemRef,     onClose: () => closeAll("item") },
    { ref: uomRef,      onClose: () => closeAll("uom") },
    { ref: despRef,     onClose: () => closeAll("despatch") },
    { ref: otherRef,    onClose: () => closeAll("other") },
    { ref: loadRef,     onClose: () => closeAll("loadBill") },
  ]);

  useEffect(() => {
    billDateFp.current = flatpickr(billDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: form.bill_date ? toDmy(form.bill_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setForm(p => ({ ...p, bill_date: toYmd(dateStr) }));
      },
    });
    return () => billDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (billDateFp.current && form.bill_date) {
      billDateFp.current.setDate(toDmy(form.bill_date));
    }
  }, [form.bill_date]);

  useEffect(() => {
    dueDateFp.current = flatpickr(dueDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: form.due_date ? toDmy(form.due_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setForm(p => ({ ...p, due_date: toYmd(dateStr) }));
      },
    });
    return () => dueDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dueDateFp.current && form.due_date) {
      dueDateFp.current.setDate(toDmy(form.due_date));
    }
  }, [form.due_date]);

  const closeAll = (key) => setOpen((p) => ({ ...p, [key]: false }));
  const openDrop = (key) => setOpen((p) => ({ ...p, [key]: true }));

  // ════════════════════════════════════════════════════════════════════
  // API helpers
  // ════════════════════════════════════════════════════════════════════

  const searchSuppliers = async (q = "") => {
    try {
      const res  = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch { setSuppliers([]); }
  };

  const loadOrderTypeItems = async (type) => {
    setOrderType(type);
    setItems([]);
    try {
      const res  = await fetch(`${API}/items/${type}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
  };

  const searchItems = async (q, type) => {
    if (!type) return;
    try {
      const url = q.trim()
        ? `${API}/items/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`
        : `${API}/items/${type}`;
      const res  = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
  };

  const searchBills = async (q = "") => {
    if (!q.trim()) { setBillList([]); return; }
    try {
      const res  = await fetch(`${API}/billno/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setBillList(Array.isArray(data) ? data : []);
    } catch { setBillList([]); }
  };

  const loadBill = async (billNum) => {
    try {
      const res  = await fetch(`${API}/${billNum}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bill not found");

      setLoadedBillNo(billNum);
      setBillNo(data.bill_no || billNum);
      setSupplierSearch(data.supplier_name || "");
      setForm({
        supplier_name: data.supplier_name || "",
        bill_date:     data.bill_date     || TODAY,
        order_no:      data.order_no      || "",
        order_date:    data.order_date    || "",
        despatch:      data.despatch      || "",
        due_date:      data.due_date      || "",
        discount:      data.discount      || 0,
        other_name:    data.other_name    || "",
        other_charges: data.other_charges || 0,
      });
      setOrderType(data.order_type || "");
      setTabledata(
        (data.items || []).map((it) => ({
          item_name: it.item_name,
          serial_no: it.serial_no || "",
          quantity:  it.quantity,
          price:     it.price,
          hsn:       it.hsn,
          uom:       it.uom,
          amount:    Number(it.quantity) * Number(it.price),
        }))
      );
      closeAll("loadBill");
      setLoadSearch(billNum);
      toast.success("Bill loaded.");
    } catch (err) {
      toast.error(err.message || "Failed to load bill.");
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // Event handlers
  // ════════════════════════════════════════════════════════════════════
  const handleSupplierSelect = (sup) => {
    const name = sup.customer_name || sup.supplier_name;
    setSupplierState(sup.state || "");
    setSupplierGst(sup.gst_number || "");
    setForm((p) => ({ ...p, supplier_name: name }));
    setSupplierSearch(name);
    closeAll("supplier");
  };

  const handleItemSelect = (item) => {
    setCurrentItem((p) => ({
      ...p,
      item_name: item.item_name,
      hsn:       item.hsn_number || "",
    }));
    setItemSearch(item.item_name);
    closeAll("item");
  };

  const handleAddItem = () => {
    if (!currentItem.item_name.trim())                                { toast.error("Select an item.");      return; }
    if (!currentItem.quantity || parseFloat(currentItem.quantity) <= 0) { toast.error("Quantity must be > 0."); return; }
    if (!currentItem.price    || parseFloat(currentItem.price) <= 0)    { toast.error("Price is required.");   return; }
    const amount = (parseFloat(currentItem.quantity) * parseFloat(currentItem.price)).toFixed(2);
    const newRow = { ...currentItem, amount };
    if (editIndex >= 0) {
      setTabledata((p) => { const u = [...p]; u[editIndex] = newRow; return u; });
      setEditIndex(-1);
    } else {
      setTabledata((p) => [...p, newRow]);
    }
    setCurrentItem(INIT_ITEM);
    setItemSearch("");
  };

  const editItem = (idx) => {
    const it = tabledata[idx];
    setCurrentItem(it);
    setItemSearch(it.item_name);
    setEditIndex(idx);
  };

  const deleteItem = (idx) => setTabledata((p) => p.filter((_, i) => i !== idx));

  // ════════════════════════════════════════════════════════════════════
  // Calculations
  // ════════════════════════════════════════════════════════════════════
  const subtotal      = tabledata.reduce((s, it) => s + Number(it.quantity) * Number(it.price), 0);
  const otherCharges  = Number(form.other_charges || 0);
  const taxableValue  = parseFloat((subtotal + otherCharges).toFixed(2));
  const isIntrastate  = isTamilNadu(supplierState, supplierGst);
  const { cgst, sgst, igst, cgstPct, sgstPct, igstPct } = calcGstAmounts(taxableValue, gstPct, isIntrastate);
  const rawTotal      = taxableValue + cgst + sgst + igst;
  const roundOff      = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2));
  const grandTotal    = Math.round(rawTotal);

  // ════════════════════════════════════════════════════════════════════
  // CRUD
  // ════════════════════════════════════════════════════════════════════
  const buildPayload = () => ({
    ...form,
    bill_no:       billNo,
    order_type:    orderType,
    other_charges: otherCharges,
    subtotal:      parseFloat(subtotal.toFixed(2)),
    taxable_value: taxableValue,
    cgst:          parseFloat(cgst.toFixed(2)),
    sgst:          parseFloat(sgst.toFixed(2)),
    igst:          parseFloat(igst.toFixed(2)),
    grand_total:   grandTotal,
    round_off:     roundOff,
    items: tabledata.map((it) => ({
      item_name: it.item_name,
      serial_no: it.serial_no || "",
      price:     it.price,
      quantity:  it.quantity,
      hsn:       it.hsn,
      uom:       it.uom,
    })),
  });

  const handleSave = () => {
    saveTaxEntry();
  };

  const handleDelete = () => {
    deleteBill();
  };

  const saveTaxEntry = async () => {
    if (!form.supplier_name?.trim()) { toast.error("Supplier Name is required.");  return; }
    if (!form.bill_date)              { toast.error("Bill Date is required.");      return; }
    if (!form.despatch?.trim())       { toast.error("Despatch Through is required."); return; }
    if (!tabledata.length)            { toast.error("Add at least one item.");      return; }

    setBusy((p) => ({ ...p, save: true }));
    try {
      const method = loadedBillNo ? "PUT" : "POST";
      const url    = loadedBillNo
        ? `${API}/update/${loadedBillNo}`
        : `${API}/new`;
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setSavedBill(billNo);
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setBusy((p) => ({ ...p, save: false }));
    }
  };

  const deleteBill = async () => {
    if (!loadedBillNo) { toast.error("Load a bill first."); return; }
    if (!window.confirm(`Delete ${loadedBillNo}?`)) return;
    try {
      const res = await fetch(`${API}/delete/${loadedBillNo}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Bill deleted.");
      resetAll();
    } catch { toast.error("Failed to delete bill."); }
  };

  const resetAll = async () => {
    setForm(INIT_FORM);
    setSupplierSearch("");
    setItemSearch("");
    setLoadSearch("");
    setTabledata([]);
    setCurrentItem(INIT_ITEM);
    setItems([]);
    setBillList([]);
    setLoadedBillNo("");
    setOrderType("");
    setGstPct(18);
    setSupplierState("");
    setSupplierGst("");
  };

  const orderTypeSelected = !!orderType;

  // ════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">

      {/* ── Success Modal ─────────────────────────────────────────── */}
      {savedBill && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[22px] font-black text-gray-900 mb-1">
              Tax Purchase Entry Saved Successfully
            </h2>
            <p className="text-[13px] text-gray-400 mb-6">
              Bill No: <span className="font-bold text-gray-700">{savedBill}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWindow(true)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => { setSavedBill(null); resetAll(); }}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[14px] font-bold hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
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

        {/* ── Title + Buttons ────────────────────────────────── */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Tax Purchase Entry</h2>
            <p className="text-[12px] text-gray-400 mt-1">Supplier → Bill Header → Order Type → Items → Save</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetAll}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">
              NEW
            </button>
            <button onClick={handleSave} disabled={busy.save}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40">
              {busy.save ? "Saving…" : loadedBillNo ? "UPDATE" : "SAVE"}
            </button>
            <button onClick={handleDelete}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">
              DELETE
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Bill Header
        ══════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 1 — Bill Header
          </p>
          <div className="grid grid-cols-4 gap-5">

            {/* Supplier Name */}
            <div className="relative" ref={supplierRef}>
              <label className={labelCls}>
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setForm((p) => ({ ...p, supplier_name: e.target.value }));
                  searchSuppliers(e.target.value);
                  openDrop("supplier");
                }}
                onFocus={() => { openDrop("supplier"); searchSuppliers(supplierSearch); }}
                className={inputCls}
                placeholder="Type to search suppliers…"
              />
              {open.supplier && suppliers.length > 0 && (
                <div className={dropdownCls}>
                  {suppliers.map((s, i) => (
                    <div key={i} onClick={() => handleSupplierSelect(s)}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {s.customer_name || s.supplier_name}
                    </div>
                  ))}
                </div>
              )}
              {open.supplier && suppliers.length === 0 && supplierSearch && (
                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                  No suppliers found.
                </div>
              )}
            </div>

            {/* Bill Number (manual) */}
            <div>
              <label className={labelCls}>Bill No <span className="text-red-500">*</span></label>
              <input type="text" value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Enter bill number" className={inputCls} />
            </div>

            {/* Bill Date */}
            <div>
              <label className={labelCls}>Bill Date <span className="text-red-500">*</span></label>
              <input ref={billDateRef}
                className={inputCls} />
            </div>

            {/* Despatch Through */}
            <div className="relative" ref={despRef}>
              <label className={labelCls}>Despatch Through</label>
              <div
                onClick={() => setOpen((p) => ({ ...p, despatch: !p.despatch }))}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px]`}
              >
                <span className={form.despatch ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {form.despatch || "Select mode…"}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {open.despatch && (
                <div className={dropdownCls}>
                  {DESPATCH_OPTIONS.map((opt) => (
                    <div key={opt}
                      onClick={() => { setForm((p) => ({ ...p, despatch: opt })); closeAll("despatch"); }}
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
            STEP 2 — Additional Details
        ══════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-blue-50/40 to-white rounded-xl p-5 border border-blue-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 2 — Additional Details
          </p>
          <div className="grid grid-cols-4 gap-5">

            <div>
              <label className={labelCls}>Order No</label>
              <input type="text" value={form.order_no}
                onChange={(e) => setForm((p) => ({ ...p, order_no: e.target.value }))}
                className={inputCls} placeholder="Order number" />
            </div>

            <div>
              <label className={labelCls}>Order Date</label>
              <input type="text" placeholder="Enter Order Date(s)" value={form.order_date}
                onChange={(e) => setForm((p) => ({ ...p, order_date: e.target.value }))}
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Due Date</label>
              <input ref={dueDateRef}
                className={inputCls} />
            </div>

            <div></div>
          </div>

          {/* Order Type */}
          <div className="mt-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Type</p>
            <div className="flex gap-8">
              {[
                { label: "Service",       value: "service"       },
                { label: "Spare",         value: "spare"         },
                { label: "Purchase Item", value: "purchase_item" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tax-order-type"
                    checked={orderType === opt.value}
                    onChange={() => loadOrderTypeItems(opt.value)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-[13px] font-semibold text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Add Items
        ══════════════════════════════════════════════════════ */}
        <div className={`transition-all duration-200 mb-4 ${!orderTypeSelected ? "opacity-40 pointer-events-none" : ""}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Step 3 — Add Items &amp; Prices
          </p>

          <div className="grid grid-cols-10 gap-3 items-end">

            {/* Item Search */}
            <div className="col-span-2 relative" ref={itemRef}>
              <label className={labelCls}>Description <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  setCurrentItem((p) => ({ ...p, item_name: e.target.value }));
                  searchItems(e.target.value, orderType);
                  openDrop("item");
                }}
                onFocus={() => { openDrop("item"); searchItems(itemSearch, orderType); }}
                disabled={!orderTypeSelected}
                className={orderTypeSelected ? `${inputCls} bg-gray-50/60` : disInputCls}
                placeholder="Search items…"
              />
              {open.item && items.length > 0 && (
                <div className={dropdownCls}>
                  {items.map((it, i) => (
                    <div key={i} onClick={() => handleItemSelect(it)}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="text-[13px] font-bold text-gray-900">{it.item_name}</div>
                      {it.hsn_number && <div className="text-[11px] text-gray-400">HSN: {it.hsn_number}</div>}
                    </div>
                  ))}
                </div>
              )}
              {open.item && items.length === 0 && itemSearch && (
                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                  No items found.
                </div>
              )}
            </div>

            {/* Serial Number */}
            <div className="col-span-2">
              <label className={labelCls}>Serial Number</label>
              <input
                type="text"
                value={currentItem.serial_no || ""}
                onChange={(e) => setCurrentItem((p) => ({ ...p, serial_no: e.target.value }))}
                placeholder="Serial Number"
                className={`${inputCls} bg-gray-50/60`}
              />
            </div>

            {/* Price */}
            <div>
              <label className={labelCls}>
                Price <span className="text-red-500">*</span>
                <span className="ml-1.5 text-[10px] text-gray-400 font-black normal-case">Manual</span>
              </label>
              <input type="number" min="0" value={currentItem.price}
                onChange={(e) => setCurrentItem((p) => ({ ...p, price: e.target.value }))}
                placeholder="Enter price"
                className={`${inputCls} bg-gray-50/60`} />
            </div>

            {/* Quantity */}
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" value={currentItem.quantity || ""}
                onChange={(e) => setCurrentItem((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="0"
                className={`${inputCls} bg-gray-50/60`} />
            </div>

            {/* UOM */}
            <div className="relative" ref={uomRef}>
              <label className={labelCls}>
                UOM
                {currentItem.item_name && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
              </label>
              <div
                onClick={() => setOpen((p) => ({ ...p, uom: !p.uom }))}
                className={`${inputCls} ${currentItem.item_name ? "border-blue-100 bg-blue-50 text-blue-800" : "bg-gray-50/60"} flex justify-between items-center cursor-pointer`}
              >
                <span>{currentItem.uom || "Select"}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {open.uom && (
                <div className={dropdownCls}>
                  {UOM_LIST.map((u) => (
                    <div key={u}
                      onClick={() => { setCurrentItem((p) => ({ ...p, uom: u })); closeAll("uom"); }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] font-medium border-b border-gray-50 last:border-0">
                      {u}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HSN */}
            <div>
              <label className={labelCls}>
                HSN
                {currentItem.item_name && currentItem.hsn && (
                  <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                )}
              </label>
              <input type="text" value={currentItem.hsn}
                onChange={(e) => setCurrentItem((p) => ({ ...p, hsn: e.target.value }))}
                className={currentItem.hsn ? roInputCls : `${inputCls} bg-gray-50/60`}
                placeholder="HSN code" />
            </div>

            {/* Amount */}
            <div>
              <label className={labelCls}>Amount</label>
              <input type="text"
                value={currentItem.price && currentItem.quantity
                  ? (parseFloat(currentItem.quantity || 0) * parseFloat(currentItem.price || 0)).toFixed(2)
                  : ""}
                readOnly className={roInputCls} placeholder="Auto" />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={handleAddItem}
                className={`flex-1 py-2.5 text-white rounded-lg text-[13px] font-bold transition-colors ${editIndex >= 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}>
                {editIndex >= 0 ? "Update" : "Add"}
              </button>
              <button onClick={() => { setCurrentItem(INIT_ITEM); setItemSearch(""); setEditIndex(-1); }}
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
                {["#", "Description", "Serial Number", "Price", "Qty", "UOM", "HSN", "Amount", "Actions"].map((h, i) => (
                  <th key={i}
                    className={`px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wide ${
                      i === 0 ? "w-10 text-center" : i === 1 || i === 2 ? "text-left" : "text-center"
                    }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabledata.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="text-gray-300 text-4xl mb-3">🧾</div>
                    <p className="text-[13px] text-gray-400 font-medium">No items added yet.</p>
                    <p className="text-[12px] text-gray-300 mt-1">Select Order Type → search items to begin.</p>
                  </td>
                </tr>
              ) : (
                tabledata.map((it, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition-colors ${editIndex === idx ? "bg-blue-50" : "hover:bg-gray-50/70"}`}>
                    <td className="px-4 py-3 text-[12px] font-semibold text-gray-400 text-center">{idx + 1}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 uppercase">{it.item_name}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600 text-left">{it.serial_no || "—"}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-700 text-center">₹{it.price}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 text-center">{it.quantity}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{it.uom || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{it.hsn || "—"}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-gray-900 text-center">
                      ₹{(Number(it.quantity) * Number(it.price)).toFixed(2)}
                    </td>
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
            <tfoot className="sticky bottom-0 z-10">
              <tr>
                <td colSpan={9} className="px-4 py-3">
                  <div className="flex items-center ml-[37%] gap-2">
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

        {/* ── Totals + Load Bill ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 mt-8">

          {/* Load Existing Bill */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Load / Edit Existing Bill
            </p>
            <div className="relative w-64" ref={loadRef}>
              <label className={labelCls}>Bill No</label>
              <input
                type="text"
                value={loadSearch}
                onChange={(e) => { setLoadSearch(e.target.value); searchBills(e.target.value); openDrop("loadBill"); }}
                onFocus={() => { openDrop("loadBill"); searchBills(loadSearch); }}
                className={`${inputCls} w-64`}
                placeholder="BILL-2024-001"
              />
              {open.loadBill && billList.length > 0 && (
                <div className={`${dropdownCls} w-64`}>
                  {billList.map((b, i) => (
                    <div key={i}
                      onClick={() => requirePassword(() => loadBill(b.bill_no))}
                      className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {b.bill_no}
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

              {/* Other Charges (acts as transport/packing) */}
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1" ref={otherRef}>
                  <div
                    onClick={() => setOpen((p) => ({ ...p, other: !p.other }))}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <span className="text-[12px] font-black text-gray-500 uppercase truncate max-w-[120px]">
                      {form.other_name || "Other Charges (+)"}
                    </span>
                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {open.other && (
                    <div className="absolute bottom-full left-0 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 mb-1">
                      {OTHER_CHARGE_OPTIONS.map((opt) => (
                        <div key={opt}
                          onClick={() => { setForm((p) => ({ ...p, other_name: opt })); closeAll("other"); }}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" min="0" value={form.other_charges}
                  onChange={(e) => setForm((p) => ({ ...p, other_charges: e.target.value }))}
                  className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
              </div>

              <div className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded">
                <span className="text-[12px] font-black text-blue-700 uppercase">Taxable Value</span>
                <span className="text-[13px] font-black text-blue-900">₹{taxableValue.toFixed(2)}</span>
              </div>

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
                <span className="text-[24px] font-black text-indigo-700">₹{grandTotal || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── WindowModal for View ──────────────────────────── */}
        <SaleswindowModel
          title="Tax Purchase Entry Format"
          isOpen={showWindow}
          type="Tax Purchase"
          onClose={() => setShowWindow(false)}
          isMinimized={isMinimized}
          onMinimize={() => { setIsMinimized(true); setShowWindow(false); }}
          initialView="qt"
          filters={{ QtNumber: savedBill }}
        >
          <TaxPurchaseFormat billNo={savedBill} />
        </SaleswindowModel>

      </div>
      {showPasswordModal && (
        <Addpassword
          onSuccess={handlePasswordSuccess}
          onCancel={handlePasswordCancel}
        />
      )}
    </div>
  );
};

export default PurchaseEntry;
