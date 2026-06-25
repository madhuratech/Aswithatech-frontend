import API_BASE_URL from "../../config/api";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, SquarePen, CheckCircle, Eye } from "lucide-react";
import SaleswindowModel from "../ui/saleswindowModal";
import Billwiseformat from "../pages/Purchase/bilwisepaymentformat";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const API = `${API_BASE_URL}/billpayment`;
const TODAY = new Date().toISOString().split("T")[0];
const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online", "By Hand"];
const fmt = (v) => Number(v || 0).toFixed(2);


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
    { ref: billRef, onClose: () => closeAll("bill") },
    { ref: modeRef, onClose: () => closeAll("mode") },
    { ref: bankRef, onClose: () => closeAll("bank") },
    { ref: loadRef, onClose: () => closeAll("loadPay") },
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
    <div className="p-6 min-h-screen bg-gray-50 font-sans">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
      >
        Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200">

        {/* ── Title + Action Buttons ── */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-black tracking-tight">Billwise Payment</h2>
          <div className="flex gap-1.5">
            <button onClick={resetAll} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white text-sm">NEW</button>
            <button onClick={handleSave} disabled={busy.save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white text-sm">{busy.save ? "Saving…" : loadedId ? "UPDATE" : "SAVE"}</button>
            <button onClick={handleDelete} className="border px-3 py-1.5 rounded-lg hover:bg-red-600   hover:text-white text-sm">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white text-sm">CLOSE</button>
          </div>
        </div>

        {/* ── Row 1: Supplier Name | Receipt No | Date ── */}
        <div className="grid grid-cols-12 gap-7 border-b border-gray-100 pb-6 mb-6">
          {/* Supplier Name — auto-loads bills on selection */}
          <div className="col-span-4 flex flex-col relative" ref={supplierRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Supplier Name</label>
            <input
              type="text"
              placeholder="Enter Supplier Name"
              value={form.supplier_name}
              onFocus={() => openDrop("supplier")}
              onChange={(e) => {
                setForm((p) => ({ ...p, supplier_name: e.target.value }));
                openDrop("supplier");
              }}
              className="w-full max-w-[350px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm mt-2"
            />
            {open.supplier && (
              <div className="absolute top-[66px] left-0 w-full max-w-[380px] bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                {suppliers
                  .filter((s) =>
                    (s.supplier_name || "").toLowerCase().includes(form.supplier_name.toLowerCase())
                  )
                  .map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleSupplierSelect(s.supplier_name)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {s.supplier_name}
                    </div>
                  ))}
                {suppliers.filter((s) =>
                  (s.supplier_name || "").toLowerCase().includes(form.supplier_name.toLowerCase())
                ).length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-sm">No suppliers with bills found</div>
                  )}
              </div>
            )}
          </div>

          <div className="flex flex-col col-span-3 gap-2">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Receipt No</label>
            <input
              readOnly
              value={form.receipt_no}
              className="w-full max-w-[250px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-50 outline-none shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Date</label>
            <input
              ref={payEntryDateRef}
              type="text"
              readOnly
              value={form.entry_date}
              className="w-[180px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Entry Form ── */}
        <div className={`border border-gray-200 p-5 mb-6 bg-gray-50 transition-all duration-200 ${!form.supplier_name ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">

            {/* Bill Number */}
            <div className="flex flex-col gap-1 relative" ref={billRef}>
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bill Number</label>
              <input
                type="text"
                placeholder="Select Bill No"
                value={currentRow.bill_no}
                onFocus={() => { if (supplierBills.length) openDrop("bill"); }}
                readOnly
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm cursor-pointer"
              />
              {open.bill && supplierBills.length > 0 && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {supplierBills.map((b, i) => (
                    <div
                      key={i}
                      onClick={() => handleBillSelect(b)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between"
                    >
                      <span className="font-semibold">{b.bill_no}</span>
                      <span className="text-gray-500">{Number(b.bill_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              {open.bill && supplierBills.length === 0 && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded px-3 py-2 text-gray-400 text-sm">
                  No pending bills for this supplier.
                </div>
              )}
            </div>

            {/* Bill Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bill Date</label>
              <input
                readOnly
                value={currentRow.bill_date ? new Date(currentRow.bill_date).toLocaleDateString("en-IN") : ""}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-100 outline-none shadow-sm"
                placeholder="Auto-filled"
              />
            </div>

            {/* Bill Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bill Amount</label>
              <input
                readOnly
                value={currentRow.bill_amount ? `₹${Number(currentRow.bill_amount).toFixed(2)}` : ""}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-100 outline-none shadow-sm"
                placeholder="Auto-filled"
              />
            </div>

            {/* Prev. Paid */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Prev. Paid</label>
              <input
                readOnly
                value={currentRow.previous_paid !== "" ? `₹${Number(currentRow.previous_paid).toFixed(2)}` : ""}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-100 outline-none shadow-sm"
                placeholder="Auto-filled"
              />
            </div>

            {/* Paid Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Paid Amount</label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={currentRow.paid_amount}
                onChange={(e) => updateCurrentRow("paid_amount", e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* TDS Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">TDS Amount</label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={currentRow.tds_amount}
                onChange={(e) => updateCurrentRow("tds_amount", e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* Delivery Charge */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Delivery Charge</label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={currentRow.delivery_charge}
                onChange={(e) => updateCurrentRow("delivery_charge", e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* Balance Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Balance Amount</label>
              <input
                readOnly
                value={currentRow.balance_amount !== "" ? `₹${Number(currentRow.balance_amount).toFixed(2)}` : ""}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-red-600 bg-gray-100 outline-none shadow-sm"
                placeholder="Calculated"
              />
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-1 relative" ref={modeRef}>
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment Mode</label>
              <input
                type="text"
                placeholder="Select Mode"
                value={currentRow.payment_mode}
                onFocus={() => openDrop("mode")}
                readOnly
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm cursor-pointer"
              />
              {open.mode && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded">
                  {PAYMENT_MODES.map((m) => (
                    <div
                      key={m}
                      onClick={() => { setCurrentRow((p) => ({ ...p, payment_mode: m })); closeAll("mode"); }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Name (Dropdown) */}
            <div className="flex flex-col gap-1 relative" ref={bankRef}>
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bank Name</label>
              <input
                type="text"
                placeholder="Type to search bank..."
                value={form.bank_name}
                onFocus={() => openDrop("bank")}
                onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
              {open.bank && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {filteredBanks.slice(0, 30).map((b, i) => (
                    <div
                      key={i}
                      onClick={() => { setForm((p) => ({ ...p, bank_name: b.name || b.bank_name })); closeAll("bank"); }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {b.name || b.bank_name}
                    </div>
                  ))}
                  {filteredBanks.length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-sm">No banks found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Bank Reference No */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Reference Number</label>
              <input
                type="text"
                placeholder="Reference number"
                value={form.reference_no}
                onChange={(e) => setForm((p) => ({ ...p, reference_no: e.target.value }))}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Remarks</label>
              <input
                type="text"
                placeholder="Remarks"
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>
          </div>

          {/* ADD / CLEAR buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={addRow}
              className="border px-5 py-1.5 rounded-lg hover:bg-green-600 hover:text-white text-sm font-semibold"
            >
              ADD
            </button>
            <button
              onClick={() => setCurrentRow(INIT_ROW)}
              className="border px-5 py-1.5 rounded-lg hover:bg-gray-400 hover:text-white text-sm font-semibold"
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* ── Bills Table ── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white min-h-[200px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                {["Bill No", "Bill Date", "Bill Amount", "Prev Paid", "TDS Amount", "Delivery Charge", "Paid Amount", "Balance", "Payment Mode", "Del"].map((h) => (
                  <th key={h} className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 uppercase text-center whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabledata.length > 0 ? (
                tabledata.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-[12px] font-bold text-black border-r border-gray-100 text-center">{row.bill_no}</td>
                    <td className="p-3 text-[12px] text-gray-700 border-r border-gray-100 text-center">
                      {row.bill_date ? new Date(row.bill_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="p-3 text-[12px] font-bold text-blue-700 border-r border-gray-100 text-center">₹{Number(row.bill_amount).toFixed(2)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">
                      {row.previous_paid !== "" && row.previous_paid !== undefined ? `₹${Number(row.previous_paid).toFixed(2)}` : "—"}
                    </td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">₹{Number(row.tds_amount || 0).toFixed(2)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">₹{Number(row.delivery_charge || 0).toFixed(2)}</td>
                    <td className="p-3 text-[12px] font-bold text-green-700 border-r border-gray-100 text-center">₹{Number(row.paid_amount).toFixed(2)}</td>
                    <td className="p-3 text-[12px] font-bold text-red-600 border-r border-gray-100 text-center">₹{Number(row.balance_amount).toFixed(2)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{row.payment_mode}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => editRow(index)} title="Edit">
                          <SquarePen size={15} className="text-blue-500 hover:text-blue-700 cursor-pointer" />
                        </button>
                        <button onClick={() => deleteRow(index)} title="Delete">
                          <Trash2 size={15} className="text-red-500 hover:text-red-700 cursor-pointer" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="p-10 text-center text-gray-400 text-sm">
                    Select a supplier, choose a bill and click <strong>ADD</strong>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals footer */}
            {tabledata.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-[12px]">
                  <td className="p-3 text-center text-gray-600 border-r border-gray-100">TOTAL</td>
                  <td className="p-3 border-r border-gray-100"></td>
                  <td className="p-3 text-center text-blue-700 border-r border-gray-100">₹{fmt(tabledata.reduce((s, r) => s + Number(r.bill_amount || 0), 0))}</td>
                  <td className="p-3 text-center text-gray-700 border-r border-gray-100">₹{fmt(tabledata.reduce((s, r) => s + Number(r.previous_paid || 0), 0))}</td>
                  <td className="p-3 text-center text-gray-700 border-r border-gray-100">₹{fmt(tabledata.reduce((s, r) => s + Number(r.tds_amount || 0), 0))}</td>
                  <td className="p-3 text-center text-gray-700 border-r border-gray-100">₹{fmt(tabledata.reduce((s, r) => s + Number(r.delivery_charge || 0), 0))}</td>
                  <td className="p-3 text-center text-green-700 border-r border-gray-100">₹{fmt(derivedGrandTotal)}</td>
                  <td className="p-3 text-center text-red-600 border-r border-gray-100">₹{fmt(tabledata.reduce((s, r) => s + Number(r.balance_amount || 0), 0))}</td>
                  <td className="p-3 border-r border-gray-100"></td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Footer: Load Payment + Grand Total ───────────────── */}
        <div className="grid grid-cols-2 gap-10 mt-8">

          {/* Load Existing Payment */}
          <div className="mt-8 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center gap-6 self-start">
            <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic whitespace-nowrap">
              Select Bill No To View / Modify :
            </label>
            <div className="relative" ref={loadRef}>
              <input
                type="text"
                readOnly
                placeholder="Select a saved bill no…"
                onFocus={() => { openDrop("loadPay"); searchAllPayments(); }}
                className="p-2.5 border w-full max-w-[200px] rounded-lg outline-none w-56 bg-white cursor-pointer"
              />
              {open.loadPay && allPayments.length > 0 && (
                <div className="absolute top-[46px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {allPayments.map((b, i) => (
                    <div key={i}
                      onClick={() => requirePassword(() => loadPayment(b.bill_no))}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
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
                <span className="text-[24px] font-black text-green-700">₹{derivedGrandTotal}</span>
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

      {/* ── Minimized bar ── */}
      {showWindow && isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
          >
            <div className="w-3 h-3 border border-white/50"></div>
            Payment Format
          </button>
        </div>
      )}

      {/* ── Success Modal ── */}
      {savedBillNo !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-1">Billwise Payment Saved Successfully!</h2>
            <p className="text-sm text-gray-500 mb-1">Payment has been created.</p>
            {form.receipt_no && (
              <p className="text-sm font-semibold text-gray-600">Receipt No : {form.receipt_no}</p>
            )}
            <p className="text-sm font-black text-blue-600 mb-6">Bill No : {savedBillNo}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowWindow(true); setSavedBillNo(null); }}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button
                onClick={() => { setSavedBillNo(null); resetAll(); }}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};

export default BillwisePayment;
