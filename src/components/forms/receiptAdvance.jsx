import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const ReceiptAdvance = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();
  const Api_url = "http://localhost:3000/api/receipts";
  const clientDropdownRef = useRef(null);
  const loadReceiptDropdownRef = useRef(null);

  useOutsideClick([
    { ref: clientDropdownRef, onClose: () => setClientOpen(false) },
    { ref: loadReceiptDropdownRef, onClose: () => setLoadOpen(false) }
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
      received_amount: "",
      tds_amount: "",
      other_amount: "",
      received_by: "",
      remarks: "",
    });
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

    const payload = {
      receipt_no: formData.receipt_no,
      receipt_date: formData.receipt_date,
      customer_name: formData.customer_name,
      payment_mode: formData.payment_mode,
      bank_name: formData.bank_name,
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
        remarks: header.remarks || "",
      }));
      setLoadedId(header.id || null);
      setLoadReceipt(receiptNo);
      setLoadOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load receipt");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1200px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200 rounded-xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-black tracking-tight">Receipt Advance</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-green-600 hover:text-white">NEW</button>
              <button onClick={handleSave} className="px-4 py-2 border rounded-lg text-sm hover:bg-green-600 hover:text-white">SAVE</button>
              <button onClick={() => loadReceiptData(loadReceipt)} className="px-4 py-2 border rounded-lg text-sm hover:bg-yellow-600 hover:text-white">EDIT</button>
              <button onClick={handleDelete} className="px-4 py-2 border rounded-lg text-sm hover:bg-red-600 hover:text-white">DELETE</button>
              <button onClick={() => window.print()} className="px-4 py-2 border rounded-lg text-sm hover:bg-purple-600 hover:text-white">PRINT</button>
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-600 hover:text-white">RESET</button>
              <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-800 hover:text-white">CLOSE</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Receipt No</label>
                <input
                  type="text"
                  value={formData.receipt_no}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-black"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Date</label>
                <input ref={receiptDateRef}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
              <div className="relative" ref={clientDropdownRef}>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Customer Name</label>
                <input
                  type="text"
                  placeholder="Search Customer Name"
                  value={formData.customer_name}
                  onFocus={() => setClientOpen(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_name: e.target.value });
                    setClientOpen(true);
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
                {clientOpen && clientList.length > 0 && (
                  <div className="absolute top-full left-0 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-[180px] overflow-y-auto">
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
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment Type</label>
                <input
                  type="text"
                  placeholder="Enter Payment Type"
                  value={formData.payment_type}
                  onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Mode</label>
                <input
                  type="text"
                  placeholder="Enter Mode"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Bank Name</label>
                <input
                  type="text"
                  placeholder="Enter Bank Name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Received Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.received_amount}
                  onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">TDS</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.tds_amount}
                  onChange={(e) => setFormData({ ...formData, tds_amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Others</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.other_amount}
                  onChange={(e) => setFormData({ ...formData, other_amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Received By</label>
                <input
                  type="text"
                  placeholder="Received By"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={4}
                  placeholder="Enter remarks"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Grand Total</span>
                <span className="text-3xl font-black text-indigo-900">{grandTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Received</span>
                  <span>{Number(formData.received_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TDS</span>
                  <span>{Number(formData.tds_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Others</span>
                  <span>{Number(formData.other_amount || 0).toFixed(2)}</span>
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
              />
              {loadOpen && (
                <div className="absolute top-[56px] left-0 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
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
