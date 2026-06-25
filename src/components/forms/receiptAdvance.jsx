import API_BASE_URL from "../../config/api";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const DEFAULT_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Canara Bank",
  "Bank of Baroda",
  "Union Bank of India",
  "Indian Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Federal Bank",
  "IDBI Bank",
  "UCO Bank",
  "Indian Overseas Bank"
];

const Api_url = `${API_BASE_URL}/receipts`;

const ReceiptAdvance = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();
  const clientDropdownRef = useRef(null);
  const loadReceiptDropdownRef = useRef(null);
  const modeRef = useRef(null);
  const bankRef = useRef(null);

  const [modeOpen, setModeOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [bankSearch, setBankSearch] = useState("");

  useOutsideClick([
    { ref: clientDropdownRef, onClose: () => setClientOpen(false) },
    { ref: loadReceiptDropdownRef, onClose: () => setLoadOpen(false) },
    { ref: modeRef, onClose: () => setModeOpen(false) },
    { ref: bankRef, onClose: () => { setBankOpen(false); setBankSearch(formData.bank_name || ""); } },
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setClientOpen(false);
        setLoadOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [formData, setFormData] = useState({
    receipt_no: "",
    receipt_date: "",
    customer_name: "",
    payment_type: "",
    payment_mode: "",
    bank_name: "",
    reference_number: "",
    received_amount: "",
    tds_amount: "",
    other_amount: "",
    received_by: "",
    remarks: "",
  });

  const [loadReceipt, setLoadReceipt] = useState("");
  const [loadOpen, setLoadOpen] = useState(false);
  const [receiptList, setReceiptList] = useState([]);
  const [loadedId, setLoadedId] = useState(null);

  const [clientList, setClientList] = useState([]);
  const [clientOpen, setClientOpen] = useState(false);

  const receiptDateRef = useRef(null);
  const receiptDateFp = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, receipt_date: today }));
    fetch(`${Api_url}/next-advance-no`)
      .then((r) => r.json())
      .then((d) => setFormData((prev) => ({ ...prev, receipt_no: d.receipt_no || "" })))
      .catch(console.error);

    fetch(`${API_BASE_URL}/billpayment/banks`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data
          : Array.isArray(data.data) ? data.data
          : Array.isArray(data.banks) ? data.banks : [];
        setBanks(list.length > 0 ? list : DEFAULT_BANKS.map(name => ({ name })));
      })
      .catch(() => {
        setBanks(DEFAULT_BANKS.map(name => ({ name })));
      });
  }, []);

  useEffect(() => {
    const q = formData.customer_name;
    const url = q
      ? `${Api_url}/clients/search?q=${encodeURIComponent(q)}`
      : `${Api_url}/clients`;
    fetch(url)
      .then((r) => r.json())
      .then(setClientList)
      .catch(console.error);
  }, [formData.customer_name]);

  useEffect(() => {
    receiptDateFp.current = flatpickr(receiptDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: formData.receipt_date ? toDmy(formData.receipt_date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setFormData(p => ({ ...p, receipt_date: toYmd(dateStr) }));
      },
    });
    return () => receiptDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (receiptDateFp.current && formData.receipt_date) {
      receiptDateFp.current.setDate(toDmy(formData.receipt_date));
    }
  }, [formData.receipt_date]);

  const grandTotal =
    Number(formData.received_amount || 0) +
    Number(formData.other_amount || 0) -
    Number(formData.tds_amount || 0);

  const resetForm = async () => {
    const today = new Date().toISOString().split("T")[0];
    let nextNo = "";
    try {
      const r = await fetch(`${Api_url}/next-advance-no`);
      const d = await r.json();
      nextNo = d.receipt_no || "";
    } catch { /* keep empty */ }
    setFormData({
      receipt_no: nextNo,
      receipt_date: today,
      customer_name: "",
      payment_type: "",
      payment_mode: "",
      bank_name: "",
      reference_number: "",
      received_amount: "",
      tds_amount: "",
      other_amount: "",
      received_by: "",
      remarks: "",
    });
    setBankSearch("");
    setLoadedId(null);
    setLoadReceipt("");
    setReceiptList([]);
    setClientList([]);
  };

  const saveReceipt = async () => {
    if (!formData.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!formData.payment_mode) {
      toast.error("Payment mode is required");
      return;
    }
    if ((formData.payment_mode === "Bank" || formData.payment_mode === "Cheque") && !formData.bank_name?.trim()) {
      toast.error("Bank Name is required for Bank/Cheque payments");
      return;
    }

    const payload = {
      receipt_no: formData.receipt_no,
      receipt_date: formData.receipt_date,
      customer_name: formData.customer_name,
      payment_mode: formData.payment_mode,
      bank_name: formData.bank_name,
      reference_number: formData.reference_number,
      total: Number(formData.received_amount || 0),
      force_amount: Number(formData.other_amount || 0),
      other_deductions: Number(formData.tds_amount || 0),
      grand_total: grandTotal,
      remarks: formData.remarks,
      items: [],
      payment_type: formData.payment_type,
      received_by: formData.received_by,
    };

    try {
      const method = loadedId ? "PUT" : "POST";
      const url = loadedId
        ? `${Api_url}/update/${loadedId}`
        : `${Api_url}/new`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save receipt");

      toast.success(loadedId ? "Receipt updated" : "Receipt saved");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Could not save receipt");
    }
  };

  const handleSave = () => {
    saveReceipt();
  };

  const handleDelete = () => {
    deleteReceipt();
  };

  const deleteReceipt = async () => {
    if (!loadedId) {
      toast.error("Load a receipt before deleting");
      return;
    }
    if (!window.confirm(`Delete ${formData.receipt_no}?`)) return;

    try {
      const res = await fetch(`${Api_url}/delete/${loadedId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Receipt deleted");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete receipt");
    }
  };

  const searchReceipts = async (q) => {
    try {
      const res = await fetch(`${Api_url}/search?q=${encodeURIComponent(q || "")}`);
      const data = await res.json();
      setReceiptList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadReceiptData = async (receiptNo) => {
    try {
      const res = await fetch(`${Api_url}/${encodeURIComponent(receiptNo)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Receipt not found");
        return;
      }
      const header = data.header || {};
      setFormData((prev) => ({
        ...prev,
        receipt_no: header.receipt_no || prev.receipt_no,
        receipt_date: header.receipt_date ? header.receipt_date.split("T")[0] : prev.receipt_date,
        customer_name: header.customer_name || "",
        payment_mode: header.payment_mode || "",
        bank_name: header.bank_name || "",
        reference_number: header.reference_number || "",
        remarks: header.remarks || "",
        payment_type: header.payment_type || "",
        received_amount: header.total || "",
        tds_amount: header.other_deductions || "",
        other_amount: header.force_amount || "",
        received_by: header.received_by || "",
      }));
      setBankSearch(header.bank_name || "");
      setLoadedId(header.id || null);
      setLoadReceipt(receiptNo);
      setLoadOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load receipt");
    }
  };

  // Shared classes for visual consistency and outlines removal
  const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight block mb-1";
  const inputCls = "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black focus:outline-none focus:ring-0 focus:border-blue-400 bg-white outline-none transition-all";
  const roInputCls = "mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-black focus:outline-none focus:ring-0 outline-none";
  const dropdownCls = "absolute top-full left-0 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-[180px] overflow-y-auto mt-1 outline-none";

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1200px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200 rounded-xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-black tracking-tight">Receipt Advance</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-green-600 hover:text-white transition-colors outline-none focus:outline-none">NEW</button>
              <button onClick={handleSave} className="px-4 py-2 border rounded-lg text-sm hover:bg-green-600 hover:text-white transition-colors outline-none focus:outline-none">SAVE</button>
              <button onClick={() => loadReceiptData(loadReceipt)} className="px-4 py-2 border rounded-lg text-sm hover:bg-yellow-600 hover:text-white transition-colors outline-none focus:outline-none">EDIT</button>
              <button onClick={handleDelete} className="px-4 py-2 border rounded-lg text-sm hover:bg-red-600 hover:text-white transition-colors outline-none focus:outline-none">DELETE</button>
              <button onClick={() => window.print()} className="px-4 py-2 border rounded-lg text-sm hover:bg-purple-600 hover:text-white transition-colors outline-none focus:outline-none">PRINT</button>
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-600 hover:text-white transition-colors outline-none focus:outline-none">RESET</button>
              <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-800 hover:text-white transition-colors outline-none focus:outline-none">CLOSE</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="relative" ref={clientDropdownRef}>
                <label className={labelCls}>Customer Name</label>
                <input
                  type="text"
                  placeholder="Search Customer Name"
                  value={formData.customer_name}
                  onFocus={() => setClientOpen(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_name: e.target.value });
                    setClientOpen(true);
                  }}
                  className={inputCls}
                />
                {clientOpen && clientList.length > 0 && (
                  <div className={dropdownCls}>
                    {clientList.map((c, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setFormData({ ...formData, customer_name: c.customer_name });
                          setClientOpen(false);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50"
                      >
                        {c.customer_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Payment Type</label>
                <input
                  type="text"
                  placeholder="Enter Payment Type"
                  value={formData.payment_type}
                  onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Received Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.received_amount}
                  onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Receipt No</label>
                <input
                  type="text"
                  value={formData.receipt_no}
                  readOnly
                  className={roInputCls}
                />
              </div>

              <div className="relative" ref={modeRef}>
                <label className={labelCls}>Mode</label>
                <input
                  type="text"
                  placeholder="Select Mode"
                  value={formData.payment_mode}
                  onFocus={() => setModeOpen(true)}
                  readOnly
                  className={`${inputCls} cursor-pointer`}
                />
                {modeOpen && (
                  <div className={dropdownCls}>
                    {["Cash", "Bank", "Cheque"].map((m) => (
                      <div
                        key={m}
                        onMouseDown={() => {
                          setFormData({ ...formData, payment_mode: m, bank_name: m === "Cash" ? "" : formData.bank_name });
                          setModeOpen(false);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50"
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(formData.payment_mode === "Bank" || formData.payment_mode === "Cheque") && (
                <>
                  <div className="relative" ref={bankRef}>
                    <label className={labelCls}>Bank Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Select Bank"
                      value={bankSearch}
                      onFocus={() => {
                        setBankSearch("");
                        setBankOpen(true);
                      }}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className={inputCls}
                    />
                    {bankOpen && (
                      <div className={dropdownCls}>
                        {banks
                          .filter((b) => (b.name || b.bank_name || "").toLowerCase().includes(bankSearch.toLowerCase()))
                          .map((b, i) => (
                            <div
                              key={i}
                              onMouseDown={() => {
                                setFormData({ ...formData, bank_name: b.name || b.bank_name });
                                setBankSearch(b.name || b.bank_name);
                                setBankOpen(false);
                              }}
                              className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 text-black font-semibold"
                            >
                              {b.name || b.bank_name}
                            </div>
                          ))}
                        {banks.filter((b) => (b.name || b.bank_name || "").toLowerCase().includes(bankSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-400">No banks found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Reference Number</label>
                    <input
                      type="text"
                      placeholder="UTR / Txn ID / Cheque No"
                      value={formData.reference_number}
                      onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Date</label>
                <input
                  ref={receiptDateRef}
                  className={inputCls}
                  readOnly
                />
              </div>

              <div>
                <label className={labelCls}>TDS</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.tds_amount}
                  onChange={(e) => setFormData({ ...formData, tds_amount: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Others</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.other_amount}
                  onChange={(e) => setFormData({ ...formData, other_amount: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Received By</label>
                <input
                  type="text"
                  placeholder="Received By"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={4}
                  placeholder="Enter remarks"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Grand Total</span>
                <span className="text-3xl font-black text-indigo-900">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Received</span>
                  <span>₹{Number(formData.received_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TDS</span>
                  <span>₹{Number(formData.tds_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Others</span>
                  <span>₹{Number(formData.other_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-3xl border border-dashed border-gray-300 bg-white">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-gray-500">
              Select Receipt No To Edit
            </div>
            <div className="relative max-w-md" ref={loadReceiptDropdownRef}>
              <input
                type="text"
                value={loadReceipt}
                onFocus={() => {
                  setLoadOpen(true);
                  searchReceipts(loadReceipt);
                }}
                onChange={(e) => {
                  setLoadReceipt(e.target.value);
                  searchReceipts(e.target.value);
                }}
                placeholder="Search receipt..."
                className={inputCls}
              />
              {loadOpen && (
                <div className="absolute top-[56px] left-0 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg outline-none">
                  {receiptList.length > 0 ? (
                    receiptList.map((receipt) => (
                      <div
                        key={receipt.id}
                        onClick={() => requirePassword(() => loadReceiptData(receipt.receipt_no))}
                        className="cursor-pointer px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        {receipt.receipt_no}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400">No receipts found</div>
                  )}
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

export default ReceiptAdvance;
