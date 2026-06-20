import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, SquarePen } from "lucide-react";
import SaleswindowModel from "../ui/saleswindowModal";
import Billwiseformat from "../pages/Purchase/bilwisepaymentformat";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import API_BASE_URL from "../../config/api";

const API = `${API_BASE_URL}/billpayment`;
const TODAY = new Date().toISOString().split("T")[0];
const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online", "By Hand"];

const INIT_ROW = {
  bill_no: "",
  bill_date: "",
  bill_amount: "",
  previous_paid: "",
  paid_amount: "",
  tds_amount: "",
  delivery_charge: "",
  balance_amount: "",
  payment_mode: "",
};

const INIT_FORM = {
  entry_date: TODAY,
  supplier_name: "",
  bank_name: "",
  reference_no: "",
  remarks: "",
  bank_date: TODAY,
  grand_total: "",
  receipt_no: "",
};

const BillwisePayment = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  // ── core state ────────────────────────────────────────────────────────
  const [form, setForm] = useState(INIT_FORM);
  const [currentRow, setCurrentRow] = useState(INIT_ROW);
  const [tabledata, setTabledata] = useState([]);
  const [loadedId, setLoadedId] = useState("");

  // ── dropdown data ─────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState([]);
  const [supplierBills, setSupplierBills] = useState([]);
  const [banks, setBanks] = useState([]);
  const [allPayments, setAllPayments] = useState([]);

  // ── open flags ────────────────────────────────────────────────────────
  const [open, setOpen] = useState({
    supplier: false, bill: false, mode: false, bank: false, loadPay: false,
  });

  // ── success modal ─────────────────────────────────────────────────────
  const [savedBillNo, setSavedBillNo] = useState(null);
  const [showWindow, setShowWindow] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [busy, setBusy] = useState({ save: false });

  // ── refs ──────────────────────────────────────────────────────────────
  const supplierRef = useRef(null);
  const billRef = useRef(null);
  const modeRef = useRef(null);
  const bankRef = useRef(null);
  const loadRef = useRef(null);
  const payEntryDateRef = useRef(null);
  const payEntryDateFp = useRef(null);

  // ── shared CSS (matches Sales Invoice) ───────────────────────────────
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  // ════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════
  const fetchNextReceiptNo = async () => {
    try {
      const res = await fetch(`${API}/next-receipt-no`);
      const data = await res.json();
      if (data.receipt_no) {
        setForm((p) => ({ ...p, receipt_no: data.receipt_no }));
      }
    } catch (err) {
      console.error("Failed to fetch next receipt number:", err);
    }
  };

  useEffect(() => {
    fetchSuppliersWithBills();
    fetchBanks();
    fetchNextReceiptNo();
  }, []);

  useOutsideClick([
    { ref: supplierRef, onClose: () => closeAll("supplier") },
    { ref: billRef,     onClose: () => closeAll("bill") },
    { ref: modeRef,     onClose: () => closeAll("mode") },
    { ref: bankRef,     onClose: () => closeAll("bank") },
    { ref: loadRef,     onClose: () => closeAll("loadPay") },
  ]);

  useEffect(() => {
    payEntryDateFp.current = flatpickr(payEntryDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: form.entry_date ? toDmy(form.entry_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setForm(p => ({ ...p, entry_date: toYmd(dateStr) }));
      },
    });
    return () => payEntryDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (payEntryDateFp.current && form.entry_date) {
      payEntryDateFp.current.setDate(toDmy(form.entry_date));
    }
  }, [form.entry_date]);

  const closeAll = (key) => setOpen((p) => ({ ...p, [key]: false }));
  const openDrop = (key) => setOpen((p) => ({ ...p, [key]: true }));

  // ════════════════════════════════════════════════════════════════════
  // API helpers
  // ════════════════════════════════════════════════════════════════════
  const fetchSuppliersWithBills = async () => {
    try {
      const res = await fetch(`${API}/suppliers-with-bills`);
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch { setSuppliers([]); }
  };

  const fetchBillsForSupplier = async (name) => {
    try {
      const res = await fetch(`${API}/bills-by-supplier/${encodeURIComponent(name)}`);
      const data = await res.json();
      setSupplierBills(Array.isArray(data) ? data : []);
    } catch { setSupplierBills([]); }
  };

  const fetchPreviousPaid = async (billNo) => {
    try {
      const res = await fetch(`${API}/previous-paid/${encodeURIComponent(billNo)}`);
      const data = await res.json();
      return Number(data.total_paid || 0);
    } catch { return 0; }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("https://findmebank.com/api/v1/banks");
      const data = await res.json();
      const list = Array.isArray(data) ? data
        : Array.isArray(data.data) ? data.data
          : Array.isArray(data.banks) ? data.banks : [];
      setBanks(list);
    } catch { setBanks([]); }
  };

  const searchAllPayments = async (q = "") => {
    try {
      const res = await fetch(`${API}/allbills`);
      const data = await res.json();
      setAllPayments(Array.isArray(data) ? data : []);
    } catch { setAllPayments([]); }
  };

  const loadPayment = async (billNo) => {
    try {
      const res = await fetch(`${API}/getbillno/${encodeURIComponent(billNo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Not found");

      setLoadedId(data.id);
      setForm({
        entry_date: data.entry_date || TODAY,
        supplier_name: data.supplier_name || "",
        bank_name: data.bank_name || "",
        reference_no: data.reference_no || "",
        remarks: data.remarks || "",
        bank_date: data.bank_date || TODAY,
        grand_total: data.grand_total || "",
        receipt_no: data.receipt_no || "",
      });
      setTabledata(
        (data.items || []).map((it) => ({
          bill_no: it.bill_no,
          bill_date: it.bill_date,
          bill_amount: it.bill_amount,
          previous_paid: "",
          paid_amount: it.paid_amount,
          tds_amount: it.tds_amount || "",
          delivery_charge: it.delivery_charge || "",
          balance_amount: it.balance_amount,
          payment_mode: it.payment_mode,
        }))
      );
      closeAll("loadPay");
      toast.success("Payment loaded.");
    } catch (err) {
      toast.error(err.message || "Failed to load payment.");
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // Bill selection & auto-fill
  // ════════════════════════════════════════════════════════════════════
  const handleSupplierSelect = async (name) => {
    setForm((p) => ({ ...p, supplier_name: name }));
    setCurrentRow(INIT_ROW);
    setTabledata([]);
    closeAll("supplier");
    await fetchBillsForSupplier(name);
  };

  const handleBillSelect = async (bill) => {
    const prevPaid = await fetchPreviousPaid(bill.bill_no);
    const balance = Number(bill.bill_amount) - prevPaid;
    setCurrentRow({
      bill_no: bill.bill_no,
      bill_date: bill.bill_date || "",
      bill_amount: String(bill.bill_amount),
      previous_paid: String(prevPaid),
      paid_amount: "",
      tds_amount: "",
      delivery_charge: "",
      balance_amount: String(Math.max(0, balance).toFixed(2)),
      payment_mode: "",
    });
    closeAll("bill");
  };

  // ── Recalculate balance whenever payment fields change ──────────────
  const recalcBalance = (row) => {
    const bill = Number(row.bill_amount || 0);
    const paid = Number(row.paid_amount || 0);
    const tds = Number(row.tds_amount || 0);
    const delivery = Number(row.delivery_charge || 0);
    return Math.max(0, bill - paid - tds + delivery).toFixed(2);
  };

  const updateCurrentRow = (field, value) => {
    setCurrentRow((prev) => {
      const updated = { ...prev, [field]: value };
      updated.balance_amount = recalcBalance(updated);
      return updated;
    });
  };

  // ════════════════════════════════════════════════════════════════════
  // Table operations
  // ════════════════════════════════════════════════════════════════════
  const addRow = () => {
    if (!currentRow.bill_no) { toast.error("Select a Bill Number."); return; }
    if (!currentRow.paid_amount || parseFloat(currentRow.paid_amount) < 0) {
      toast.error("Enter a valid Paid Amount."); return;
    }
    if (!currentRow.payment_mode) { toast.error("Select Payment Mode."); return; }
    setTabledata((p) => [...p, { ...currentRow }]);
    setCurrentRow(INIT_ROW);
  };

  const editRow = (idx) => {
    setCurrentRow(tabledata[idx]);
    setTabledata((p) => p.filter((_, i) => i !== idx));
  };

  const deleteRow = (idx) => setTabledata((p) => p.filter((_, i) => i !== idx));

  // ── Auto grand total ─────────────────────────────────────────────────
  const derivedGrandTotal = tabledata
    .reduce((s, r) => s + Number(r.paid_amount || 0), 0)
    .toFixed(2);

  // ════════════════════════════════════════════════════════════════════
  // Save
  // ════════════════════════════════════════════════════════════════════
  const savePayment = async () => {
    if (!form.supplier_name?.trim()) { toast.error("Supplier Name is required."); return; }
    if (!tabledata.length) { toast.error("Add at least one bill payment."); return; }

    setBusy((p) => ({ ...p, save: true }));
    try {
      const payload = {
        ...form,
        grand_total: derivedGrandTotal,
        items: tabledata.map((r) => ({
          bill_no: r.bill_no,
          bill_date: r.bill_date,
          bill_amount: r.bill_amount,
          paid_amount: r.paid_amount,
          balance_amount: r.balance_amount,
          payment_mode: r.payment_mode,
          tds_amount: r.tds_amount || 0,
          delivery_charge: r.delivery_charge || 0,
        })),
      };

      const method = loadedId ? "PUT" : "POST";
      const url = loadedId ? `${API}/update/${loadedId}` : `${API}/new`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      setSavedBillNo(data.bill_no || tabledata[0]?.bill_no || "");
    } catch (err) {
      toast.error(err.message || "Failed to save payment.");
    } finally {
      setBusy((p) => ({ ...p, save: false }));
    }
  };

  const handleSave = () => {
    savePayment();
  };

  const handleDelete = () => {
    deletePayment();
  };

  const deletePayment = async () => {
    if (!loadedId) { toast.error("Load a payment first."); return; }
    if (!window.confirm("Delete this payment?")) return;
    try {
      const res = await fetch(`${API}/delete/${loadedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Payment deleted.");
      resetAll();
    } catch { toast.error("Failed to delete payment."); }
  };

  const resetAll = () => {
    setForm({
      ...INIT_FORM,
      entry_date: TODAY,
      bank_date: TODAY,
    });
    setCurrentRow(INIT_ROW);
    setTabledata([]);
    setLoadedId("");
    setSupplierBills([]);
    fetchNextReceiptNo();
  };

  // ── Filtered banks ────────────────────────────────────────────────────
  const filteredBanks = banks.filter((b) =>
    (b.name || b.bank_name || "").toLowerCase().includes((form.bank_name || "").toLowerCase())
  );

  // ════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans">

      {/* ── Success Modal ─────────────────────────────────────────── */}
      {savedBillNo !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[22px] font-black text-gray-900 mb-1">
              Payment Saved Successfully
            </h2>
            <div className="text-[13px] text-gray-400 mb-6 flex flex-col gap-1">
              {form.receipt_no && (
                <div>
                  Receipt No: <span className="font-bold text-gray-700">{form.receipt_no}</span>
                </div>
              )}
              <div>
                Bill No: <span className="font-bold text-gray-700">{savedBillNo}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWindow(true)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => { setSavedBillNo(null); resetAll(); }}
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
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Billwise Payment</h2>
            <p className="text-[12px] text-gray-400 mt-1">Supplier → Select Bills → Enter Payment → Save</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetAll}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors">
              NEW
            </button>
            <button onClick={handleSave} disabled={busy.save}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40">
              {busy.save ? "Saving…" : loadedId ? "UPDATE" : "SAVE"}
            </button>
            <button onClick={handleDelete}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors">
              DELETE
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Payment Header
        ══════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 1 — Payment Header
          </p>
          <div className="grid grid-cols-5 gap-4">
            {/* Supplier Name — loads from purchase_entry only */}
            <div className="relative" ref={supplierRef}>
              <label className={labelCls}>
                Supplier Name <span className="text-red-500">*</span>
                <span className="ml-1.5 text-[10px] text-blue-500 font-black normal-case">Bills only</span>
              </label>
              <input
                type="text"
                value={form.supplier_name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, supplier_name: e.target.value }));
                  openDrop("supplier");
                }}
                onFocus={() => openDrop("supplier")}
                className={inputCls}
                placeholder="Select supplier with bills…"
              />
              {open.supplier && (
                <div className={dropdownCls}>
                  {suppliers
                    .filter((s) =>
                      (s.supplier_name || "").toLowerCase().includes(form.supplier_name.toLowerCase())
                    )
                    .map((s, i) => (
                      <div key={i} onClick={() => handleSupplierSelect(s.supplier_name)}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                        {s.supplier_name}
                      </div>
                    ))}
                  {suppliers.filter((s) =>
                    (s.supplier_name || "").toLowerCase().includes(form.supplier_name.toLowerCase())
                  ).length === 0 && (
                      <div className="px-4 py-3 text-[13px] text-gray-400">
                        No suppliers with bills found.
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Receipt No */}
            <div>
              <label className={labelCls}>Receipt No</label>
              <input
                type="text"
                value={form.receipt_no}
                readOnly
                className={roInputCls}
                placeholder="Auto-generated"
              />
            </div>

            {/* Entry Date */}
            <div>
              <label className={labelCls}>Entry Date</label>
              <input ref={payEntryDateRef}
                className={inputCls} />
            </div>

            {/* Bank Name */}
            <div className="relative" ref={bankRef}>
              <label className={labelCls}>Bank Name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => { setForm((p) => ({ ...p, bank_name: e.target.value })); openDrop("bank"); }}
                onFocus={() => openDrop("bank")}
                className={inputCls}
                placeholder="Type to search bank…"
              />
              {open.bank && (
                <div className={dropdownCls}>
                  {filteredBanks.slice(0, 30).map((b, i) => (
                    <div key={i}
                      onClick={() => { setForm((p) => ({ ...p, bank_name: b.name || b.bank_name })); closeAll("bank"); }}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {b.name || b.bank_name}
                    </div>
                  ))}
                  {filteredBanks.length === 0 && (
                    <div className="px-4 py-3 text-[13px] text-gray-400">No banks found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Reference No */}
            <div>
              <label className={labelCls}>Bank Reference No</label>
              <input type="text" value={form.reference_no}
                onChange={(e) => setForm((p) => ({ ...p, reference_no: e.target.value }))}
                className={inputCls} placeholder="Reference number" />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Bill Entry
        ══════════════════════════════════════════════════════ */}
        <div className={`bg-gradient-to-br from-blue-50/40 to-white rounded-xl p-5 border border-blue-100 mb-5 transition-all duration-200 ${!form.supplier_name ? "opacity-40 pointer-events-none" : ""}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Step 2 — Bill Selection &amp; Payment Entry
          </p>

          {/* Row 1: Bill No + Auto-filled read-only fields */}
          <div className="grid grid-cols-6 gap-4 mb-4">

            {/* Bill No */}
            <div className="relative" ref={billRef}>
              <label className={labelCls}>
                Bill No <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => form.supplier_name && openDrop("bill")}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px]`}
              >
                <span className={currentRow.bill_no ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {currentRow.bill_no || (supplierBills.length === 0 ? "No bills found" : "Select bill…")}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {open.bill && supplierBills.length > 0 && (
                <div className={dropdownCls}>
                  {supplierBills.map((b, i) => (
                    <div key={i} onClick={() => handleBillSelect(b)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="text-[13px] font-bold text-gray-900">{b.bill_no}</div>
                      <div className="flex gap-4 text-[11px] text-gray-400 mt-0.5">
                        <span>Amount: ₹{Number(b.bill_amount).toFixed(2)}</span>
                        <span className="text-orange-500 font-semibold">
                          Paid: ₹{Number(b.total_paid).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {open.bill && supplierBills.length === 0 && (
                <div className={`${dropdownCls} px-4 py-3 text-[13px] text-gray-400`}>
                  No pending bills for this supplier.
                </div>
              )}
            </div>

            {/* Bill Date — auto-filled */}
            <div>
              <label className={labelCls}>
                Bill Date
                {currentRow.bill_no && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
              </label>
              <input type="text" value={currentRow.bill_date ? new Date(currentRow.bill_date).toLocaleDateString("en-IN") : ""}
                readOnly className={roInputCls} placeholder="Auto-filled" />
            </div>

            {/* Bill Amount — auto-filled */}
            <div>
              <label className={labelCls}>
                Bill Amount
                {currentRow.bill_no && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
              </label>
              <input type="text"
                value={currentRow.bill_amount ? `₹${Number(currentRow.bill_amount).toFixed(2)}` : ""}
                readOnly className={roInputCls} placeholder="Auto-filled" />
            </div>

            {/* Supplier Name — auto from header */}
            <div>
              <label className={labelCls}>
                Supplier
                {currentRow.bill_no && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
              </label>
              <input type="text" value={form.supplier_name}
                readOnly className={roInputCls} placeholder="Auto-filled" />
            </div>

            {/* Previous Paid — auto-filled */}
            <div>
              <label className={labelCls}>
                Prev. Paid
                {currentRow.bill_no && <span className="ml-1 text-[10px] text-blue-500 font-black normal-case">Auto</span>}
              </label>
              <input type="text"
                value={currentRow.previous_paid !== "" ? `₹${Number(currentRow.previous_paid).toFixed(2)}` : ""}
                readOnly className={roInputCls} placeholder="Auto-filled" />
            </div>

            {/* Balance Amount — calculated */}
            <div>
              <label className={labelCls}>
                Balance
                <span className="ml-1 text-[10px] text-orange-500 font-black normal-case">Calc.</span>
              </label>
              <input type="text"
                value={currentRow.balance_amount !== "" ? `₹${Number(currentRow.balance_amount).toFixed(2)}` : ""}
                readOnly
                className="w-full p-2.5 border border-orange-200 rounded-lg text-[13px] font-bold text-orange-700 bg-orange-50 cursor-not-allowed focus:outline-none"
                placeholder="Calculated" />
            </div>
          </div>

          {/* Row 2: Editable payment fields */}
          <div className="grid grid-cols-6 gap-4 items-end">

            {/* Paid Amount — manual */}
            <div>
              <label className={labelCls}>
                Paid Amount <span className="text-red-500">*</span>
                <span className="ml-1 text-[10px] text-gray-400 font-black normal-case">Manual</span>
              </label>
              <input type="number" min="0"
                value={currentRow.paid_amount}
                onChange={(e) => updateCurrentRow("paid_amount", e.target.value)}
                className="w-full p-2.5 border border-green-300 rounded-lg text-[13px] font-semibold text-green-800 bg-green-50 focus:outline-none focus:border-green-500 shadow-sm"
                placeholder="Enter amount" />
            </div>

            {/* TDS Amount — new manual field */}
            <div>
              <label className={labelCls}>
                TDS Amount
                <span className="ml-1 text-[10px] text-gray-400 font-black normal-case">Manual</span>
              </label>
              <input type="number" min="0"
                value={currentRow.tds_amount}
                onChange={(e) => updateCurrentRow("tds_amount", e.target.value)}
                className="w-full p-2.5 border border-purple-200 rounded-lg text-[13px] font-semibold text-purple-800 bg-purple-50 focus:outline-none focus:border-purple-400 shadow-sm"
                placeholder="0.00" />
            </div>

            {/* Delivery Charge — new manual field */}
            <div>
              <label className={labelCls}>
                Delivery Charge
                <span className="ml-1 text-[10px] text-gray-400 font-black normal-case">Manual</span>
              </label>
              <input type="number" min="0"
                value={currentRow.delivery_charge}
                onChange={(e) => updateCurrentRow("delivery_charge", e.target.value)}
                className="w-full p-2.5 border border-blue-200 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 focus:outline-none focus:border-blue-400 shadow-sm"
                placeholder="0.00" />
            </div>

            {/* Remarks — manual */}
            <div>
              <label className={labelCls}>
                Remarks
                <span className="ml-1 text-[10px] text-gray-400 font-black normal-case">Manual</span>
              </label>
              <input type="text"
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                placeholder="Optional note" />
            </div>

            {/* Payment Mode */}
            <div className="relative" ref={modeRef}>
              <label className={labelCls}>Payment Mode <span className="text-red-500">*</span></label>
              <div
                onClick={() => openDrop("mode")}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[43px]`}
              >
                <span className={currentRow.payment_mode ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {currentRow.payment_mode || "Select mode…"}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {open.mode && (
                <div className={dropdownCls}>
                  {PAYMENT_MODES.map((m) => (
                    <div key={m}
                      onClick={() => { setCurrentRow((p) => ({ ...p, payment_mode: m })); closeAll("mode"); }}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={addRow}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[13px] font-bold transition-colors">
                Add
              </button>
              <button onClick={() => setCurrentRow(INIT_ROW)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold transition-colors">
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ── Items Table ──────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm min-h-[180px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Bill No", "Bill Date", "Bill Amt", "Prev Paid", "Paid Amt", "TDS", "Delivery", "Balance", "Mode", "Actions"].map((h, i) => (
                  <th key={i}
                    className={`px-3 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wide ${i === 0 ? "w-8 text-center" : i === 1 ? "text-left" : "text-center"
                      }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabledata.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center">
                    <div className="text-gray-300 text-4xl mb-3">💳</div>
                    <p className="text-[13px] text-gray-400 font-medium">No bills added yet.</p>
                    <p className="text-[12px] text-gray-300 mt-1">Select a supplier → pick a bill → enter payment.</p>
                  </td>
                </tr>
              ) : (
                tabledata.map((r, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                    <td className="px-3 py-3 text-[11px] font-semibold text-gray-400 text-center">{idx + 1}</td>
                    <td className="px-3 py-3 text-[12px] font-bold text-gray-800">{r.bill_no}</td>
                    <td className="px-3 py-3 text-[12px] text-gray-600 text-center">
                      {r.bill_date ? new Date(r.bill_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold text-gray-800 text-center">
                      ₹{Number(r.bill_amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-gray-500 text-center">
                      ₹{Number(r.previous_paid || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-bold text-green-700 text-center">
                      ₹{Number(r.paid_amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-purple-700 text-center">
                      ₹{Number(r.tds_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-blue-700 text-center">
                      ₹{Number(r.delivery_charge || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-bold text-orange-700 text-center">
                      ₹{Number(r.balance_amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-gray-600 text-center">{r.payment_mode}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => editRow(idx)} title="Edit">
                          <SquarePen size={15} className="text-blue-500 hover:text-blue-700 transition-colors" />
                        </button>
                        <button onClick={() => deleteRow(idx)} title="Delete">
                          <Trash2 size={15} className="text-red-400 hover:text-red-600 transition-colors" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer: Load Payment + Grand Total ───────────────── */}
        <div className="grid grid-cols-2 gap-10 mt-8">

          {/* Load Existing Payment */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Load / Edit Existing Payment
            </p>
            <div className="relative w-64" ref={loadRef}>
              <label className={labelCls}>Bill No</label>
              <input
                type="text"
                placeholder="Select a saved bill no…"
                onFocus={() => { openDrop("loadPay"); searchAllPayments(); }}
                className={`${inputCls} w-64`}
                readOnly
              />
              {open.loadPay && allPayments.length > 0 && (
                <div className={`${dropdownCls} w-64`}>
                  {allPayments.map((b, i) => (
                    <div key={i}
                      onClick={() => requirePassword(() => loadPayment(b.bill_no))}
                      className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0">
                      {b.bill_no}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-6 border-t border-gray-100">
            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3 max-w-sm ml-auto">

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Total Bills</span>
                <span className="text-[13px] font-bold text-gray-900">{tabledata.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Total TDS</span>
                <span className="text-[13px] font-bold text-purple-700">
                  ₹{tabledata.reduce((s, r) => s + Number(r.tds_amount || 0), 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-500 uppercase">Total Delivery</span>
                <span className="text-[13px] font-bold text-blue-700">
                  ₹{tabledata.reduce((s, r) => s + Number(r.delivery_charge || 0), 0).toFixed(2)}
                </span>
              </div>

              {form.remarks && (
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-black text-gray-500 uppercase">Remarks</span>
                  <span className="text-[12px] font-semibold text-gray-700 text-right max-w-[144px] truncate">{form.remarks}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                <span className="text-[15px] font-black text-black uppercase">Total Paid</span>
                <span className="text-[24px] font-black text-indigo-700">₹{derivedGrandTotal}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── WindowModal for View ──────────────────────────── */}
      <SaleswindowModel
        title="Payment Format"
        isOpen={showWindow}
        type="billwise"
        onClose={() => setShowWindow(false)}
        isMinimized={isMinimized}
        onMinimize={() => { setIsMinimized(true); setShowWindow(false); }}
        initialView="qt"
        filters={{ QtNumber: savedBillNo }}
      >
        <Billwiseformat billNo={savedBillNo} />
      </SaleswindowModel>
      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};

export default BillwisePayment;
