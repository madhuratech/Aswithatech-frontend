import API_BASE_URL from "../../config/api";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, CheckCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import SaleswindowModel from "../ui/saleswindowModal";
import { ReceiptVoucher } from "../ui/receiptreport";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
const ReceiptEntry = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();
  const Api_url = `${API_BASE_URL}/receipts`;

  // ── header ────────────────────────────────────────────────────
  const [header, setHeader] = useState({
    receipt_no: "",
    receipt_date: "",
    customer_name: "",
  });

  // ── current entry row ─────────────────────────────────────────
  const [entry, setEntry] = useState({
    bill_no: "",
    bill_date: "",
    bill_amount: "",
    already_paid: "",
    advance_paid: "",
    tds_amt: "",
    paid_amount: "",
    other_deduction: "",
    balance: "",
    remarks: "",
    payment_mode: "",
    bank_name: "",
    reference_number: "",
  });

  // ── saved rows in table ────────────────────────────────────────
  const [tabledata, setTabledata] = useState([]);

  // ── pending bills for selected customer ───────────────────────
  const [pendingBills, setPendingBills] = useState([]);

  // ── dropdowns ─────────────────────────────────────────────────
  const [clientList, setClientList] = useState([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [bankOpen, setBankOpen] = useState(false);

  // ── load / edit ───────────────────────────────────────────────
  const [loadReceipt, setLoadReceipt] = useState("");
  const [loadOpen, setLoadOpen] = useState(false);
  const [receiptList, setReceiptList] = useState([]);
  const [loadedId, setLoadedId] = useState(null);

  // ── success modal & view modal ────────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedReceiptNo, setSavedReceiptNo] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalMin, setReceiptModalMin] = useState(false);
  const [, setViewReceiptNo] = useState("");
  const [viewReceiptData, setViewReceiptData] = useState(null);

  const rcptDateRef = useRef(null);
  const rcptDateFp = useRef(null);
  const clientRef = useRef(null);
  const billRef = useRef(null);
  const modeRef = useRef(null);
  const bankRef = useRef(null);
  const loadRef = useRef(null);

  // ── init: today + auto receipt no ────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setHeader((p) => ({ ...p, receipt_date: today }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`${Api_url}/next-receipt-no`)
      .then((r) => r.json())
      .then((d) => setHeader((p) => ({ ...p, receipt_no: d.receipt_no || "" })))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/billpayment/banks`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data
          : Array.isArray(data.data)  ? data.data
          : Array.isArray(data.banks) ? data.banks : [];
        setBanks(list);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── client search ─────────────────────────────────────────────
  useEffect(() => {
    const q = header.customer_name;
    const url = q
      ? `${Api_url}/clients/search?q=${encodeURIComponent(q)}`
      : `${Api_url}/clients`;
    fetch(url).then((r) => r.json()).then(setClientList).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.customer_name]);

  useEffect(() => {
    rcptDateFp.current = flatpickr(rcptDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: header.receipt_date ? toDmy(header.receipt_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setHeader(p => ({ ...p, receipt_date: toYmd(dateStr) }));
      },
    });
    return () => rcptDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rcptDateFp.current && header.receipt_date) {
      rcptDateFp.current.setDate(toDmy(header.receipt_date));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.receipt_date]);

  useOutsideClick([
    { ref: clientRef, onClose: () => setClientOpen(false) },
    { ref: billRef, onClose: () => setBillOpen(false) },
    { ref: modeRef, onClose: () => setModeOpen(false) },
    { ref: bankRef, onClose: () => setBankOpen(false) },
    { ref: loadRef, onClose: () => setLoadOpen(false) },
  ]);

  // ── load pending bills when customer is selected ──────────────
  const loadPendingBills = async (name) => {
    if (!name?.trim()) { setPendingBills([]); return; }
    try {
      const res  = await fetch(`${Api_url}/customer-bills/${encodeURIComponent(name)}`);
      const data = await res.json();
      setPendingBills(Array.isArray(data) ? data : []);
    } catch (e) { setPendingBills([]); }
  };

  // ── select a bill from dropdown → auto-fill bill amount ───────
  const selectBill = (bill) => {
    const ba  = Number(bill.bill_amount || 0);
    const ap  = Number(bill.already_paid || 0);
    const paid = Number(entry.paid_amount || 0);
    const tds = Number(entry.tds_amt || 0);
    const adv = Number(entry.advance_paid || 0);
    setEntry((p) => ({
      ...p,
      bill_no: bill.bill_no,
      bill_date: bill.bill_date ? String(bill.bill_date).split("T")[0] : "",
      bill_amount: ba,
      already_paid: ap,
      balance: (ba - ap - paid - tds - adv).toFixed(2),
    }));
    setBillOpen(false);
  };

  // ── recalculate balance whenever any amount field changes ─────
  const calcBalance = (updated) => {
    const ba   = Number(updated.bill_amount   || 0);
    const ap   = Number(updated.already_paid  || 0);
    const paid = Number(updated.paid_amount   || 0);
    const tds  = Number(updated.tds_amt       || 0);
    const adv  = Number(updated.advance_paid  || 0);
    return (ba - ap - paid - tds - adv).toFixed(2);
  };

  const updateEntry = (field, value) => {
    setEntry((prev) => {
      const updated = { ...prev, [field]: value };
      updated.balance = calcBalance(updated);
      return updated;
    });
  };

  const handlePaymentModeChange = (mode) => {
    const isBankMode = ["Bank Transfer", "Cheque", "UPI", "NEFT", "RTGS", "DD"].includes(mode);
    setEntry((prev) => {
      let bankName = prev.bank_name;
      if (isBankMode && !bankName?.trim()) {
        for (let i = tabledata.length - 1; i >= 0; i--) {
          if (tabledata[i].bank_name?.trim()) {
            bankName = tabledata[i].bank_name;
            break;
          }
        }
      }
      const updated = { ...prev, payment_mode: mode, bank_name: bankName };
      updated.balance = calcBalance(updated);
      return updated;
    });
  };

  // ── ADD row to table ──────────────────────────────────────────
  const addRow = () => {
    if (!entry.bill_no) { toast.error("Select a bill number"); return; }
    if (!entry.payment_mode) { toast.error("Select payment mode"); return; }
    
    // Validation:
    // If Payment Mode = Cash -> Bank Name and Reference Number optional.
    // If Payment Mode = Bank / Cheque / UPI / NEFT / RTGS -> Bank Name and Reference Number mandatory.
    const isBankMode = ["Bank Transfer", "Cheque", "UPI", "NEFT", "RTGS", "DD"].includes(entry.payment_mode);
    if (isBankMode) {
      if (!entry.bank_name?.trim()) { toast.error("Bank Name is required for " + entry.payment_mode); return; }
      if (!entry.reference_number?.trim()) { toast.error("Reference Number is required for " + entry.payment_mode); return; }
    }

    const lastBankName = entry.bank_name;
    setTabledata((prev) => [...prev, { ...entry }]);
    setEntry({
      bill_no: "", bill_date: "", bill_amount: "", already_paid: "",
      advance_paid: "", tds_amt: "", paid_amount: "",
      balance: "", remarks: "", payment_mode: "",
      bank_name: lastBankName, reference_number: "",
    });
  };

  // ── CLEAR current entry row ───────────────────────────────────
  const clearEntry = () =>
    setEntry({
      bill_no: "", bill_date: "", bill_amount: "", already_paid: "",
      advance_paid: "", tds_amt: "", paid_amount: "",
      balance: "", remarks: "", payment_mode: "",
      bank_name: "", reference_number: "",
    });

  const deleteRow = (index) =>
    setTabledata((prev) => prev.filter((_, i) => i !== index));

  // ── table totals ──────────────────────────────────────────────
  const totalBillAmt  = tabledata.reduce((s, r) => s + Number(r.bill_amount  || 0), 0);
  const totalAlreadyPaid = tabledata.reduce((s, r) => s + Number(r.already_paid || 0), 0);
  const totalTds      = tabledata.reduce((s, r) => s + Number(r.tds_amt      || 0), 0);
  const totalAdvance  = tabledata.reduce((s, r) => s + Number(r.advance_paid  || 0), 0);
  const totalPaid     = tabledata.reduce((s, r) => s + Number(r.paid_amount  || 0), 0);
  const totalBalance  = tabledata.reduce((s, r) => s + Number(r.balance      || 0), 0);

  const handleSaveReceipt = () => {
    saveReceipt();
  };

  const handleDeleteReceipt = () => {
    deleteReceipt();
  };

  // ── SAVE ──────────────────────────────────────────────────────
  const saveReceipt = async () => {
    if (!header.customer_name.trim()) { toast.error("Customer name is required"); return; }
    if (!header.receipt_date)         { toast.error("Date is required"); return; }
    if (!tabledata.length)            { toast.error("Add at least one bill"); return; }

    const payload = {
      ...header,
      grand_total: totalPaid,
      payment_mode: tabledata[0]?.payment_mode || "",
      bank_name: tabledata[0]?.bank_name || "",
      reference_number: tabledata[0]?.reference_number || "",
      items: tabledata.map((r) => ({
        bill_no:         r.bill_no,
        bill_date:       r.bill_date || null,
        bill_amount:     r.bill_amount,
        already_paid:    r.already_paid,
        advance_paid:    Number(r.advance_paid || 0),
        tds_amt:         Number(r.tds_amt || 0),
        paid_amount:     r.paid_amount,
        balance:         r.balance,
        remarks:         r.remarks,
        payment_mode:    r.payment_mode,
        bank_name:       r.bank_name,
        reference_number: r.reference_number,
      })),
    };

    try {
      const method = loadedId ? "PUT" : "POST";
      const url    = loadedId ? `${Api_url}/update/${loadedId}` : `${Api_url}/new`;
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(method === "PUT" ? "Receipt updated" : "Receipt saved");
      setSavedReceiptNo(header.receipt_no);
      setShowSuccessModal(true);
    } catch (e) { console.error(e); toast.error("Failed to save receipt"); }
  };

  const handleViewReceipt = async () => {
    try {
      const res = await fetch(`${Api_url}/${encodeURIComponent(savedReceiptNo)}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      setViewReceiptData({
        ...data.header,
        items: data.items,
      });
      setViewReceiptNo(savedReceiptNo);
      setShowSuccessModal(false);
      setShowReceiptModal(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load receipt details");
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetAll();
  };

  // ── DELETE ────────────────────────────────────────────────────
  const deleteReceipt = async () => {
    if (!loadedId) { toast.error("Load a receipt first"); return; }
    if (!window.confirm(`Delete ${header.receipt_no}?`)) return;
    try {
      await fetch(`${Api_url}/delete/${loadedId}`, { method: "DELETE" });
      toast.success("Receipt deleted");
      resetAll();
    } catch (e) { toast.error("Failed to delete"); }
  };

  // ── Load for edit ─────────────────────────────────────────────
  const searchReceipts = async (q) => {
    const res  = await fetch(`${Api_url}/search?q=${encodeURIComponent(q || "")}`);
    const data = await res.json();
    setReceiptList(Array.isArray(data) ? data : []);
  };

  const loadReceiptData = async (receiptNo) => {
    try {
      const res  = await fetch(`${Api_url}/${encodeURIComponent(receiptNo)}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      const h = data.header;
      setHeader({
        receipt_no:    h.receipt_no || "",
        receipt_date:  h.receipt_date ? h.receipt_date.split("T")[0] : "",
        customer_name: h.customer_name || "",
      });
      await loadPendingBills(h.customer_name);
      setTabledata((data.items || []).map((item) => ({
        bill_no:         item.bill_no         || "",
        bill_date:       item.bill_date ? item.bill_date.split("T")[0] : "",
        bill_amount:     item.bill_amount      || 0,
        already_paid:    item.already_paid     || 0,
        advance_paid:    item.advance_paid     || 0,
        tds_amt:         item.tds_amt          || 0,
        paid_amount:     item.paid_amount      || 0,
        balance:         item.balance          || 0,
        remarks:         item.remarks          || "",
        payment_mode:    item.payment_mode     || "",
        bank_name:       item.bank_name        || "",
        reference_number: item.reference_number || "",
      })));
      setLoadedId(h.id);
      setLoadReceipt(receiptNo);
      setLoadOpen(false);
    } catch (e) { toast.error("Failed to load receipt"); }
  };

  // ── Reset ─────────────────────────────────────────────────────
  const resetAll = async () => {
    const today = new Date().toISOString().split("T")[0];
    setHeader({ receipt_no: "", receipt_date: today, customer_name: "" });
    setEntry({ bill_no: "", bill_amount: "", already_paid: "", advance_paid: "", tds_amt: "", paid_amount: "", balance: "", remarks: "", payment_mode: "", bank_name: "", reference_number: "" });
    setTabledata([]);
    setPendingBills([]);
    setLoadedId(null);
    setLoadReceipt("");
    setReceiptList([]);
    try {
      const res = await fetch(`${Api_url}/next-receipt-no`);
      const d   = await res.json();
      setHeader((p) => ({ ...p, receipt_no: d.receipt_no || "", receipt_date: today }));
    } catch (_) {}
  };

  const fmt = (v) => Number(v || 0).toFixed(2);

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
          <h2 className="text-xl font-bold text-black tracking-tight">Receipt Entry</h2>
          <div className="flex gap-1.5">
            <button onClick={resetAll}       className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white text-sm">NEW</button>
            <button onClick={handleSaveReceipt}    className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white text-sm">SAVE</button>
            <button onClick={handleDeleteReceipt}  className="border px-3 py-1.5 rounded-lg hover:bg-red-600   hover:text-white text-sm">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white text-sm">CLOSE</button>
          </div>
        </div>

        {/* ── Row 1: Receipt No | Date | Customer Name ── */}
        <div className="grid grid-cols-12 gap-7   border-b border-gray-100 pb-6 mb-6">
          {/* Customer Name — auto-loads bills on selection */}
          <div className="col-span-4 flex flex-col relative" ref={clientRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Customer Name</label>
            <input
              type="text"
              placeholder="Enter Customer Name"
              value={header.customer_name}
              onFocus={() => setClientOpen(true)}
              onChange={(e) => setHeader({ ...header, customer_name: e.target.value })}
              className="w-full max-w-[350px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm mt-2"
            />
            {clientOpen && clientList.length > 0 && (
              <div className="absolute top-[66px] left-0 w-full max-w-[380px] bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                {clientList.map((c) => (
                  <div
                    key={c.customer_name}
                    onClick={() => {
                      setHeader({ ...header, customer_name: c.customer_name });
                      setTabledata([]);
                      setEntry((p) => ({ ...p, bill_no: "", bill_amount: "" }));
                      loadPendingBills(c.customer_name);
                      setClientOpen(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {c.customer_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col col-span-3 gap-2">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Receipt No</label>
            <input
              readOnly
              value={header.receipt_no}
              className="w-full max-w-[250px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-50 outline-none shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Date</label>
            <input
              ref={rcptDateRef}
              type="text"
              readOnly
              value={header.receipt_date}
              className="w-[180px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Entry Form ── */}
        <div className="border border-gray-200 p-5 mb-6 bg-gray-50">
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">

            {/* Bill No — dropdown of pending bills */}
            <div className="flex flex-col gap-1 relative" ref={billRef}>
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bill Number</label>
              <input
                type="text"
                placeholder="Select Bill No"
                value={entry.bill_no}
                onFocus={() => { if (pendingBills.length) setBillOpen(true); }}
                onChange={(e) => { setEntry((p) => ({ ...p, bill_no: e.target.value })); setBillOpen(true); }}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
              {billOpen && pendingBills.length > 0 && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {pendingBills
                    .filter((b) => !entry.bill_no || b.bill_no.toLowerCase().includes(entry.bill_no.toLowerCase()))
                    .map((b) => (
                      <div
                        key={b.bill_no}
                        onClick={() => selectBill(b)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between"
                      >
                        <span className="font-semibold">{b.bill_no}</span>
                        <span className="text-gray-500">{fmt(b.bill_amount)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Bill Amount — readonly, auto-filled */}
            {/* Bill Date — readonly, auto-filled */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bill Date</label>
              <input
                readOnly
                value={entry.bill_date}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-100 outline-none shadow-sm"
              />
            </div>

            {/* Bill Amount — readonly, auto-filled */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bill Amount</label>
              <input
                readOnly
                value={entry.bill_amount}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-100 outline-none shadow-sm"
              />
            </div>

            {/* Already Paid — readonly, auto-filled */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Already Paid</label>
              <input
                readOnly
                value={entry.already_paid}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black bg-gray-100 outline-none shadow-sm"
              />
            </div>

            {/* Paid Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Paid Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={entry.paid_amount}
                onChange={(e) => updateEntry("paid_amount", e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* TDS Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">TDS Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={entry.tds_amt}
                onChange={(e) => updateEntry("tds_amt", e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* Advance Paid */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Advance Paid</label>
              <input
                type="number"
                placeholder="0.00"
                value={entry.advance_paid}
                onChange={(e) => updateEntry("advance_paid", e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* Balance — readonly, auto-calculated */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Balance Amount</label>
              <input
                readOnly
                value={entry.balance}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-red-600 bg-gray-100 outline-none shadow-sm"
              />
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-1 relative" ref={modeRef}>
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment Mode</label>
              <input
                type="text"
                placeholder="Select Mode"
                value={entry.payment_mode}
                onFocus={() => setModeOpen(true)}
                onChange={(e) => handlePaymentModeChange(e.target.value)}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
              {modeOpen && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded">
                  {["Cash", "Bank Transfer", "UPI", "Cheque", "NEFT", "RTGS", "DD"].map((m) => (
                    <div
                      key={m}
                      onClick={() => { handlePaymentModeChange(m); setModeOpen(false); }}
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
                value={entry.bank_name}
                onFocus={() => setBankOpen(true)}
                onChange={(e) => setEntry((p) => ({ ...p, bank_name: e.target.value }))}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
              {bankOpen && (
                <div className="absolute top-[62px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {banks
                    .filter((b) =>
                      (b.name || b.bank_name || "").toLowerCase().includes((entry.bank_name || "").toLowerCase())
                    )
                    .map((b, i) => (
                      <div
                        key={i}
                        onClick={() => { setEntry((p) => ({ ...p, bank_name: b.name || b.bank_name })); setBankOpen(false); }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {b.name || b.bank_name}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Reference Number</label>
              <input
                type="text"
                placeholder="UTR No / Cheque No / NEFT No"
                value={entry.reference_number}
                onChange={(e) => setEntry((p) => ({ ...p, reference_number: e.target.value }))}
                className="p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black outline-none bg-white shadow-sm"
              />
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Remarks</label>
              <input
                type="text"
                placeholder="Remarks"
                value={entry.remarks}
                onChange={(e) => setEntry((p) => ({ ...p, remarks: e.target.value }))}
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
              onClick={clearEntry}
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
                {["Bill No","Bill Date","Bill Amount","Already Paid","TDS Amount","Advance Paid","Paid Amount","Balance","Payment Mode","Bank Name","Reference No","Remarks","Del"].map((h) => (
                  <th key={h} className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 uppercase text-center whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabledata.length > 0 ? (
                tabledata.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-[12px] font-bold text-black border-r border-gray-100 text-center">{row.bill_no}</td>
                    <td className="p-3 text-[12px] text-gray-700 border-r border-gray-100 text-center">{row.bill_date || ""}</td>
                    <td className="p-3 text-[12px] font-bold text-blue-700 border-r border-gray-100 text-center">{fmt(row.bill_amount)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{fmt(row.already_paid)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{fmt(row.tds_amt)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{fmt(row.advance_paid)}</td>
                    <td className="p-3 text-[12px] font-bold text-green-700 border-r border-gray-100 text-center">{fmt(row.paid_amount)}</td>
                    <td className="p-3 text-[12px] font-bold text-red-600 border-r border-gray-100 text-center">{fmt(row.balance)}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{row.payment_mode}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{row.bank_name || ""}</td>
                    <td className="p-3 text-[12px] font-semibold text-gray-700 border-r border-gray-100 text-center">{row.reference_number || ""}</td>
                    <td className="p-3 text-[12px] text-gray-600 border-r border-gray-100 text-center">{row.remarks}</td>
                    <td className="p-3 text-center">
                      <Trash2
                        onClick={() => deleteRow(index)}
                        className="text-red-500 hover:text-red-700 cursor-pointer mx-auto"
                        size={16}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="p-10 text-center text-gray-400 text-sm">
                    Select a customer, choose a bill and click <strong>ADD</strong>
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
                  <td className="p-3 text-center text-blue-700 border-r border-gray-100">{fmt(totalBillAmt)}</td>
                  <td className="p-3 text-center text-gray-700 border-r border-gray-100">{fmt(totalAlreadyPaid)}</td>
                  <td className="p-3 text-center text-gray-700 border-r border-gray-100">{fmt(totalTds)}</td>
                  <td className="p-3 text-center text-gray-700 border-r border-gray-100">{fmt(totalAdvance)}</td>
                  <td className="p-3 text-center text-green-700 border-r border-gray-100">{fmt(totalPaid)}</td>
                  <td className="p-3 text-center text-red-600 border-r border-gray-100">{fmt(totalBalance)}</td>
                  <td className="p-3 border-r border-gray-100"></td>
                  <td className="p-3 border-r border-gray-100"></td>
                  <td className="p-3 border-r border-gray-100"></td>
                  <td className="p-3 border-r border-gray-100"></td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Load / Edit panel ── */}
        <div className="mt-8 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center gap-6">
          <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic whitespace-nowrap">
            Select Receipt No To View / Modify :
          </label>
          <div className="relative" ref={loadRef}>
            <input
              type="text"
              value={loadReceipt}
              onFocus={() => { setLoadOpen(true); searchReceipts(loadReceipt); }}
              onChange={(e) => { setLoadReceipt(e.target.value); searchReceipts(e.target.value); }}
              className="p-2.5 border rounded-lg outline-none w-56"
              placeholder="Search receipt..."
            />
            {loadOpen && (
              <div className="absolute top-[46px] left-0 w-full bg-white shadow-lg z-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                {receiptList.length > 0 ? (
                  receiptList.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => { setLoadReceipt(r.receipt_no); requirePassword(() => loadReceiptData(r.receipt_no)); }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {r.receipt_no}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm">No receipts found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-1">Receipt Bill To Bill Saved Successfully!</h2>
            <p className="text-sm text-gray-500 mb-1">Receipt has been created.</p>
            <p className="text-sm font-black text-blue-600 mb-6">Receipt No : {savedReceiptNo}</p>
            <div className="flex gap-3">
              <button
                onClick={handleViewReceipt}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt View Modal ── */}
      <SaleswindowModel
        title="Receipt Voucher"
        isOpen={showReceiptModal}
        type="Receipt Format"
        isMinimized={receiptModalMin}
        onMinimize={() => setReceiptModalMin(true)}
        onClose={() => {
          setShowReceiptModal(false);
          setReceiptModalMin(false);
          resetAll();
        }}
      >
        {viewReceiptData && (
          <div className="flex justify-center p-4 bg-white">
            <ReceiptVoucher receipt={viewReceiptData} />
          </div>
        )}
      </SaleswindowModel>

      {/* ── Minimized bar ── */}
      {showReceiptModal && receiptModalMin && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setReceiptModalMin(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 transition-all"
          >
            <div className="w-3 h-3 border border-white/50"></div>
            Receipt Voucher
          </button>
        </div>
      )}

      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}

    </div>
  );
};

export default ReceiptEntry;
