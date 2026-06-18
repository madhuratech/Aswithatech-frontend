import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { SquarePen, Trash2 } from "lucide-react";
import SaleswindowModel from "../ui/saleswindowModal";
import POLayout from "../pages/Purchase/purchaseorderview";
import { isTamilNadu, calcGstAmounts } from "../../utils/gstUtils";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";

const API = "http://localhost:3000/api/purchaseorders";
const TODAY = new Date().toISOString().split("T")[0];
const UOM_LIST = ["Nos", "Set", "Pkt", "Kg", "Mtr", "Ltr", "Box", "Unit"];

const INIT_FORM = {
  client_name: "",
  po_date: TODAY,
  narration: "",
  delivery_charges: 0,
  tds: 0,
};

const INIT_ITEM = {
  item_name: "",
  serial_no: "",
  quantity: "",
  price: "",
  hsn_number: "",
  unit: "",
};

export default function PurchaseOrder() {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // ── core state ────────────────────────────────────────────────────────
  const [poNumber, setPoNumber]           = useState("");
  const [loadedPoNumber, setLoadedPoNumber] = useState("");
  const [form, setForm]                   = useState(INIT_FORM);
  const [orderType, setOrderType]         = useState("");
  const [tabledata, setTabledata]         = useState([]);
  const [currentItem, setCurrentItem]     = useState(INIT_ITEM);
  const [editIndex, setEditIndex]         = useState(-1);
  const [gstPct, setGstPct]               = useState(18);
  const [clientState, setClientState]     = useState("");
  const [clientGst, setClientGst]         = useState("");

  // ── dropdown data ─────────────────────────────────────────────────────
  const [clients, setClients]   = useState([]);
  const [items, setItems]       = useState([]);
  const [poList, setPoList]     = useState([]);

  // ── search display values ─────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState("");
  const [itemSearch, setItemSearch]     = useState("");
  const [loadSearch, setLoadSearch]     = useState("");

  // ── open flags ────────────────────────────────────────────────────────
  const [open, setOpen] = useState({
    client: false, item: false, unit: false, loadPo: false,
  });

  const [busy, setBusy]       = useState({ save: false });

  // ── success modal ─────────────────────────────────────────────────────
  const [savedPo, setSavedPo]           = useState(null);
  const [showWindow, setShowWindow]     = useState(false);
  const [isMinimized, setIsMinimized]   = useState(false);

  // ── refs ──────────────────────────────────────────────────────────────
  const clientRef = useRef(null);
  const itemRef   = useRef(null);
  const unitRef   = useRef(null);
  const loadRef   = useRef(null);
  const poDateRef = useRef(null);
  const poDateFp  = useRef(null);

  // ── shared CSS ────────────────────────────────────────────────────────
  const labelCls    = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputCls    = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const roInputCls  = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const disInputCls = "w-full p-2.5 border border-gray-100 rounded-lg text-[13px] font-semibold text-gray-300 bg-gray-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  // ════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    fetchNextPoNumber();
  }, []);

  useEffect(() => {
    poDateFp.current = flatpickr(poDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: form.po_date ? toDmy(form.po_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setForm(p => ({ ...p, po_date: toYmd(dateStr) }));
      },
    });
    return () => poDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (poDateFp.current && form.po_date) {
      poDateFp.current.setDate(toDmy(form.po_date));
    }
  }, [form.po_date]);

  useOutsideClick([
    { ref: clientRef, onClose: () => closeAll("client") },
    { ref: itemRef,   onClose: () => closeAll("item") },
    { ref: unitRef,   onClose: () => closeAll("unit") },
    { ref: loadRef,   onClose: () => closeAll("loadPo") },
  ]);

  const closeAll = (key) => setOpen((p) => ({ ...p, [key]: false }));
  const openDrop = (key) => setOpen((p) => ({ ...p, [key]: true }));

  // ════════════════════════════════════════════════════════════════════
  // API helpers
  // ════════════════════════════════════════════════════════════════════
  const fetchNextPoNumber = async () => {
    try {
      const res  = await fetch(`${API}/next-po-number`);
      const data = await res.json();
      if (data?.po_number) setPoNumber(data.po_number);
    } catch { console.error("Could not fetch PO number"); }
  };

  const searchClients = async (q = "") => {
    try {
      const res  = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { setClients([]); }
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
        ? `${API}/items/search?q=${encodeURIComponent(q)}&type=${type}`
        : `${API}/items/${type}`;
      const res  = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
  };

  const searchPos = async (q = "") => {
    try {
      const res  = await fetch(`${API}/po/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPoList(Array.isArray(data) ? data : []);
    } catch { setPoList([]); }
  };

  const loadPo = async (poNum) => {
    try {
      const res  = await fetch(`${API}/${poNum}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Not found");

      setLoadedPoNumber(poNum);
      setPoNumber(data.po_number || poNum);
      setClientSearch(data.client_name || "");
      setForm({
        client_name:      data.client_name       || "",
        po_date:          data.po_date?.split("T")[0] || TODAY,
        narration:        data.narration          || "",
        delivery_charges: data.delivery_charges   || 0,
        tds:              data.tds               || 0,
      });
      setOrderType(data.order_type || "");
      setTabledata(
        (data.items || []).map((it) => ({
          item_name:  it.item_name,
          serial_no:  it.serial_no || "",
          quantity:   it.quantity,
          price:      it.price,
          hsn_number: it.hsn_code,
          unit:       it.unit,
          amount:     it.amount,
        }))
      );
      closeAll("loadPo");
      setLoadSearch(poNum);
      toast.success("PO loaded.");
    } catch (err) {
      toast.error(err.message || "Failed to load PO.");
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // Event handlers
  // ════════════════════════════════════════════════════════════════════
  const handleClientSelect = (client) => {
    setClientState(client.state || "");
    setClientGst(client.gst_number || "");
    setForm((p) => ({ ...p, client_name: client.customer_name }));
    setClientSearch(client.customer_name);
    closeAll("client");
  };

  const handleItemSelect = (item) => {
    setCurrentItem((p) => ({
      ...p,
      item_name:  item.item_name,
      hsn_number: item.hsn_number || "",
    }));
    setItemSearch(item.item_name);
    closeAll("item");
  };

  const handleAddItem = () => {
    if (!currentItem.item_name)                           { toast.error("Select an item."); return; }
    if (!currentItem.quantity || parseFloat(currentItem.quantity) <= 0) { toast.error("Quantity must be > 0."); return; }
    if (!currentItem.price    || parseFloat(currentItem.price) <= 0)    { toast.error("Price is required."); return; }
    if (!currentItem.unit)                                { toast.error("Unit is required."); return; }
    if (editIndex < 0 && tabledata.some((r) => r.item_name === currentItem.item_name)) { toast.error("Duplicate item."); return; }
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
  const subtotal   = tabledata.reduce((s, it) => s + Number(it.amount || 0), 0);
  const delivery   = Number(form.delivery_charges || 0);
  const tds        = Number(form.tds || 0);
  const isIntrastate = isTamilNadu(clientState, clientGst);
  const { cgst, sgst, igst, cgstPct, sgstPct, igstPct } = calcGstAmounts(subtotal, gstPct, isIntrastate);
  const rawTotal   = subtotal + cgst + sgst + igst + delivery - tds;
  const roundOff   = Math.round(rawTotal) - rawTotal;
  const grandTotal = Math.round(rawTotal);

  // ════════════════════════════════════════════════════════════════════
  // CRUD
  // ════════════════════════════════════════════════════════════════════
  const buildPayload = () => ({
    client_name:      form.client_name,
    po_number:        poNumber,
    order_type:       orderType,
    po_date:          form.po_date,
    narration:        form.narration,
    delivery_charges: delivery,
    tds:              tds,
    subtotal,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal,
    items: tabledata.map((it) => ({
      item_name: it.item_name,
      serial_no: it.serial_no || "",
      price:     it.price,
      quantity:  it.quantity,
      hsn_code:  it.hsn_number,
      unit:      it.unit,
    })),
  });

  const handleSavePurchaseOrder = () => {
    savePO();
  };

  const handleDeletePurchaseOrder = () => {
    deletePO();
  };

  const savePO = async () => {
    if (!form.client_name?.trim()) { toast.error("Supplier is required.");    return; }
    if (!orderType)                 { toast.error("Order Type is required.");  return; }
    if (!tabledata.length)          { toast.error("Add at least one item.");   return; }

    setBusy((p) => ({ ...p, save: true }));
    try {
      const method = loadedPoNumber ? "PUT" : "POST";
      const url    = loadedPoNumber ? `${API}/${loadedPoNumber}` : `${API}/new`;
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setSavedPo(data.po_number || poNumber);
    } catch (err) {
      toast.error(err.message || "Failed to save PO.");
    } finally {
      setBusy((p) => ({ ...p, save: false }));
    }
  };

  const deletePO = async () => {
    if (!loadedPoNumber) { toast.error("Load a PO first."); return; }
    if (!window.confirm(`Delete ${loadedPoNumber}?`)) return;
    try {
      const res = await fetch(`${API}/${loadedPoNumber}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("PO deleted.");
      resetAll();
    } catch { toast.error("Failed to delete PO."); }
  };

  const resetAll = () => {
    setForm(INIT_FORM);
    setClientSearch("");
    setItemSearch("");
    setLoadSearch("");
    setTabledata([]);
    setCurrentItem(INIT_ITEM);
    setItems([]);
    setPoList([]);
    setLoadedPoNumber("");
    setOrderType("");
    setGstPct(18);
    setClientState("");
    setClientGst("");
    fetchNextPoNumber();
  };

  const orderTypeSelected = !!orderType;

  // ════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">

      {/* ── Success Modal ─────────────────────────────────────────── */}
      {savedPo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[22px] font-black text-gray-900 mb-1">
              Purchase Order Created Successfully
            </h2>
            <p className="text-[13px] text-gray-400 mb-6">
              PO No: <span className="font-bold text-gray-700">{savedPo}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWindow(true)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => { setSavedPo(null); resetAll(); }}
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

        {/* ── Title + Buttons ──────────────────────────────────── */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Purchase Order</h2>
            <p className="text-[12px] text-gray-400 mt-1">Supplier → Order Type → Items → Save</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetAll}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">
              NEW
            </button>
            <button onClick={handleSavePurchaseOrder} disabled={busy.save}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40">
              {busy.save ? "Saving…" : loadedPoNumber ? "UPDATE" : "SAVE"}
            </button>
            <button onClick={handleDeletePurchaseOrder}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">
              DELETE
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — PO Header
        ══════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 1 — Purchase Order Header
          </p>

          <div className="grid grid-cols-4 gap-5">

            {/* Supplier Name */}
            <div className="relative" ref={clientRef}>
              <label className={labelCls}>
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setForm((p) => ({ ...p, client_name: e.target.value }));
                  searchClients(e.target.value);
                  openDrop("client");
                }}
                onFocus={() => { openDrop("client"); searchClients(clientSearch); }}
                className={inputCls}
                placeholder="Type to search suppliers…"
              />
              {open.client && clients.length > 0 && (
                <div className={dropdownCls}>
                  {clients.map((c, i) => (
                    <div key={i} onClick={() => handleClientSelect(c)}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {c.customer_name}
                    </div>
                  ))}
                </div>
              )}
              {open.client && clients.length === 0 && clientSearch && (
                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                  No suppliers found matching "{clientSearch}"
                </div>
              )}
            </div>

            {/* PO Number (auto) */}
            <div>
              <label className={labelCls}>PO Number (Auto)</label>
              <input type="text" value={poNumber} readOnly className={roInputCls} />
            </div>

            {/* PO Date */}
            <div>
              <label className={labelCls}>PO Date</label>
              <input ref={poDateRef}
                className={inputCls} />
            </div>

            {/* Narration */}
            <div>
              <label className={labelCls}>Narration</label>
              <input type="text" value={form.narration}
                onChange={(e) => setForm((p) => ({ ...p, narration: e.target.value }))}
                className={inputCls}
                placeholder="Additional notes…" />
            </div>
          </div>

          {/* Order Type */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Type <span className="text-red-500">*</span></p>
            <div className="flex gap-8">
              {[
                { label: "Service",       value: "service"       },
                { label: "Spare",         value: "spare"         },
                { label: "Purchase Item", value: "purchase_item" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="po-order-type"
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
            STEP 2 — Add Items
        ══════════════════════════════════════════════════════ */}
        <div className={`transition-all duration-200 mb-4 ${!orderTypeSelected ? "opacity-40 pointer-events-none" : ""}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Step 2 — Add Items
          </p>

          <div className="grid grid-cols-10 gap-3 items-end">

            {/* Item Search */}
            <div className="col-span-2 relative" ref={itemRef}>
              <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
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

            {/* Quantity */}
            <div>
              <label className={labelCls}>Qty</label>
              <input type="number" value={currentItem.quantity || ""}
                onChange={(e) => setCurrentItem((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="0"
                className={`${inputCls} bg-gray-50/60`} />
            </div>

            {/* Price */}
            <div>
              <label className={labelCls}>
                Rate <span className="text-red-500">*</span>
                <span className="ml-1.5 text-[10px] text-gray-400 font-black normal-case">Manual</span>
              </label>
              <input type="number" min="0" value={currentItem.price}
                onChange={(e) => {
                  const price = e.target.value;
                  setCurrentItem((p) => ({ ...p, price }));
                }}
                placeholder="Enter price"
                className={`${inputCls} bg-gray-50/60`} />
            </div>

            {/* HSN */}
            <div>
              <label className={labelCls}>
                HSN
                {currentItem.item_name && currentItem.hsn_number && (
                  <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>
                )}
              </label>
              <input type="text" value={currentItem.hsn_number}
                onChange={(e) => setCurrentItem((p) => ({ ...p, hsn_number: e.target.value }))}
                className={currentItem.hsn_number ? roInputCls : `${inputCls} bg-gray-50/60`}
                placeholder="HSN code" />
            </div>

            {/* Unit */}
            <div className="relative" ref={unitRef}>
              <label className={labelCls}>Unit</label>
              <div
                onClick={() => setOpen((p) => ({ ...p, unit: !p.unit }))}
                className={`${inputCls} bg-gray-50/60 flex justify-between items-center cursor-pointer`}
              >
                <span className={currentItem.unit ? "text-black" : "text-gray-400 font-medium"}>
                  {currentItem.unit || "Select"}
                </span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {open.unit && (
                <div className={dropdownCls}>
                  {UOM_LIST.map((u) => (
                    <div key={u}
                      onClick={() => { setCurrentItem((p) => ({ ...p, unit: u })); closeAll("unit"); }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] font-medium border-b border-gray-50 last:border-0">
                      {u}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amount (calculated) */}
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
                {["#", "Item Name", "Serial Number", "Qty", "Rate", "Amount", "HSN", "Unit", "Actions"].map((h, i) => (
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
                    <div className="text-gray-300 text-4xl mb-3">📦</div>
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
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 text-center">{it.quantity}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-700 text-center">₹{it.price}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-gray-900 text-center">₹{Number(it.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600 text-center">{it.hsn_number || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600 text-center uppercase">{it.unit}</td>
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
                  <div className="flex items-center ml-[22%] gap-2">
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

        {/* ── Totals + Load PO ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 mt-8">

          {/* Load Existing PO */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Load / Edit Existing PO
            </p>
            <div className="relative w-64" ref={loadRef}>
              <label className={labelCls}>PO Number</label>
              <input
                type="text"
                value={loadSearch}
                onChange={(e) => { setLoadSearch(e.target.value); searchPos(e.target.value); openDrop("loadPo"); }}
                onFocus={() => { openDrop("loadPo"); searchPos(loadSearch); }}
                className={`${inputCls} w-64`}
                placeholder="PO-2024-001"
              />
              {open.loadPo && poList.length > 0 && (
                <div className={`${dropdownCls} w-64`}>
                  {poList.map((po, i) => (
                    <div key={i}
                      onClick={() => requirePassword(() => loadPo(po.po_number))}
                      className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {po.po_number}
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
                <span className="text-[12px] font-black text-gray-500 uppercase">Subtotal</span>
                <span className="text-[13px] font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
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
                <span className="text-[12px] font-black text-gray-500 uppercase">Delivery Charges (+)</span>
                <input type="number" min="0" value={form.delivery_charges}
                  onChange={(e) => setForm((p) => ({ ...p, delivery_charges: e.target.value }))}
                  className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">TDS (−)</span>
                <input type="number" min="0" value={form.tds}
                  onChange={(e) => setForm((p) => ({ ...p, tds: e.target.value }))}
                  className="w-28 p-1.5 border-b border-gray-300 bg-transparent text-right font-bold text-black outline-none focus:border-black text-[13px]" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Round Off</span>
                <span className="text-[13px] font-bold text-gray-700">{roundOff.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                <span className="text-[15px] font-black text-black uppercase">Grand Total</span>
                <span className="text-[24px] font-black text-indigo-700">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── WindowModal for View ──────────────────────────── */}
        <SaleswindowModel
          title="Purchase Order Format"
          isOpen={showWindow}
          type="Purchase Order"
          onClose={() => setShowWindow(false)}
          isMinimized={isMinimized}
          onMinimize={() => { setIsMinimized(true); setShowWindow(false); }}
          initialView="qt"
          filters={{ QtNumber: savedPo }}
        >
          <POLayout poNumber={savedPo} />
        </SaleswindowModel>

        {showPasswordModal && (
          <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
        )}

      </div>
    </div>
  );
}
