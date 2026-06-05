import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/receipts";

function debounce(fn, d) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
}

const ReceiptBillToBill = () => {
  const navigate = useNavigate();

  const [receiptNo, setReceiptNo] = useState("");
  const [loadReceiptNo, setLoadReceiptNo] = useState("");
  const [searchList, setSearchList] = useState([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchRef = useRef(null);

  const [form, setForm] = useState({
    receipt_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    payment_mode: "Cash",
    bank_name: "",
    cheque_no: "",
    cheque_date: "",
    total: 0,
    force_amount: 0,
    other_deductions: 0,
    grand_total: 0,
    remarks: "",
  });

  const [clients, setClients] = useState([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef(null);

  const [billList, setBillList] = useState([]);  // bills loaded for customer

  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientDrop(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load next receipt number
  const loadNextNo = async () => {
    try {
      const res = await fetch(`${API}/next-receipt-no`);
      const data = await res.json();
      setReceiptNo(data.receipt_no || "");
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadNextNo(); }, []);

  // Client search
  const searchClients = async (q) => {
    try {
      const res = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };
  const debouncedClient = useRef(debounce(searchClients, 300)).current;

  // Load customer bills
  const loadCustomerBills = async (customerName) => {
    if (!customerName) return;
    try {
      const res = await fetch(`${API}/customer-bills/${encodeURIComponent(customerName)}`);
      const data = await res.json();
      setBillList(
        (Array.isArray(data) ? data : []).map((b) => ({
          ...b,
          paid_amount: 0,
          balance: b.bill_amount || 0,
          selected: false,
        }))
      );
    } catch (e) { console.error(e); }
  };

  // Search existing receipts
  const searchReceipts = async (q) => {
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchList(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // Load receipt for edit
  const loadReceipt = async (num) => {
    const n = num || loadReceiptNo;
    if (!n) { toast.error("Enter receipt number"); return; }
    try {
      const res = await fetch(`${API}/${encodeURIComponent(n)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const h = data.header;
      setForm({
        receipt_date: h.receipt_date || "",
        customer_name: h.customer_name || "",
        payment_mode: h.payment_mode || "Cash",
        bank_name: h.bank_name || "",
        cheque_no: h.cheque_no || "",
        cheque_date: h.cheque_date || "",
        total: h.total || 0,
        force_amount: h.force_amount || 0,
        other_deductions: h.other_deductions || 0,
        grand_total: h.grand_total || 0,
        remarks: h.remarks || "",
      });
      setReceiptNo(h.receipt_no || "");
      setLoadReceiptNo(h.receipt_no || "");
      setBillList(
        (data.items || []).map((it) => ({
          bill_no: it.bill_no,
          bill_date: it.bill_date,
          bill_amount: it.bill_amount,
          paid_amount: it.paid_amount,
          balance: it.balance,
          selected: true,
        }))
      );
      toast.success("Receipt loaded");
    } catch (e) { toast.error("Receipt not found"); }
  };

  // Bill row update
  const updateBillRow = (i, field, value) => {
    const updated = [...billList];
    updated[i][field] = Number(value) || 0;
    if (field === "paid_amount") {
      updated[i].balance = (updated[i].bill_amount || 0) - updated[i].paid_amount;
    }
    setBillList(updated);
    recalcTotals(updated);
  };

  const toggleBill = (i) => {
    const updated = [...billList];
    updated[i].selected = !updated[i].selected;
    setBillList(updated);
    recalcTotals(updated);
  };

  const recalcTotals = (bills) => {
    const total = bills.filter(b => b.selected).reduce((s, b) => s + Number(b.paid_amount || 0), 0);
    const force = Number(form.force_amount) || 0;
    const deductions = Number(form.other_deductions) || 0;
    const grand = total - deductions - force;
    setForm(prev => ({ ...prev, total, grand_total: grand }));
  };

  useEffect(() => {
    recalcTotals(billList);
  // eslint-disable-next-line
  }, [form.force_amount, form.other_deductions]);

  // Reset
  const resetForm = async () => {
    setForm({ receipt_date: new Date().toISOString().split("T")[0], customer_name: "", payment_mode: "Cash", bank_name: "", cheque_no: "", cheque_date: "", total: 0, force_amount: 0, other_deductions: 0, grand_total: 0, remarks: "" });
    setBillList([]);
    setLoadReceiptNo("");
    await loadNextNo();
  };

  // Save
  const save = async () => {
    const selectedBills = billList.filter(b => b.selected);
    if (!form.customer_name || !form.payment_mode || selectedBills.length === 0) {
      toast.error("Customer, payment mode and at least one bill are required");
      return;
    }
    const payload = { ...form, receipt_no: receiptNo, items: selectedBills };
    const toastId = toast.loading("Saving receipt...");
    try {
      const isEdit = Boolean(loadReceiptNo);
      // For edit, find the id from existing loaded header
      const url = isEdit
        ? `${API}/update/${encodeURIComponent(loadReceiptNo)}`
        : `${API}/new`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(isEdit ? "Receipt updated!" : "Receipt saved!", { id: toastId });
      await resetForm();
    } catch (e) { toast.error(e.message || "Save failed", { id: toastId }); }
  };

  // Delete
  const deleteReceipt = async () => {
    if (!loadReceiptNo) { toast.error("Load a receipt first"); return; }
    // Find the numeric ID
    try {
      const res = await fetch(`${API}/${encodeURIComponent(loadReceiptNo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const id = data.header?.id;
      if (!id) throw new Error("ID not found");
      if (!window.confirm(`Delete receipt ${loadReceiptNo}?`)) return;
      const toastId = toast.loading("Deleting...");
      const del = await fetch(`${API}/delete/${id}`, { method: "DELETE" });
      const delData = await del.json();
      if (!del.ok) throw new Error(delData.message);
      toast.success("Receipt deleted!", { id: toastId });
      await resetForm();
    } catch (e) { toast.error(e.message || "Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit mb-4">
        ← Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white p-6 shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black tracking-tight">Receipt — Bill-to-Bill</h2>
          <div className="flex gap-1.5">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">NEW</button>
            <button onClick={save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">SAVE</button>
            <button onClick={deleteReceipt} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">CLOSE</button>
          </div>
        </div>

        {/* Row 1: Receipt No, Date, Customer, Load */}
        <div className="flex flex-wrap gap-6 border-b pb-6 mb-6 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase">Receipt No</label>
            <input type="text" value={receiptNo} readOnly className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] bg-gray-50 font-semibold outline-none" />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase">Date</label>
            <input type="date" value={form.receipt_date} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>

          <div className="relative flex-1 min-w-[220px]" ref={clientRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Customer</label>
            <input
              type="text"
              value={form.customer_name}
              onFocus={() => { setShowClientDrop(true); searchClients(""); }}
              onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); debouncedClient(e.target.value); setShowClientDrop(true); }}
              placeholder="Customer name"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none"
            />
            {showClientDrop && clients.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {clients.map((c, i) => (
                  <div key={i} onClick={() => {
                    setForm({ ...form, customer_name: c.customer_name });
                    setShowClientDrop(false);
                    loadCustomerBills(c.customer_name);
                  }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{c.customer_name}</div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 min-w-[220px]" ref={searchRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Load Receipt</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={loadReceiptNo}
                onFocus={() => { setShowSearchDrop(true); searchReceipts(""); }}
                onChange={(e) => { setLoadReceiptNo(e.target.value); searchReceipts(e.target.value); setShowSearchDrop(true); }}
                placeholder="Receipt No"
                className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none"
              />
              <button onClick={() => loadReceipt()} className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">Load</button>
            </div>
            {showSearchDrop && searchList.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {searchList.map((r, i) => (
                  <div key={i} onClick={() => { const n = r.receipt_no || r; setLoadReceiptNo(n); loadReceipt(n); setShowSearchDrop(false); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{r.receipt_no || r}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Payment details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Payment Mode</label>
            <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none bg-white">
              {["Cash", "Cheque", "NEFT", "RTGS", "UPI"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Bank Name</label>
            <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Bank Name" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Cheque No</label>
            <input type="text" value={form.cheque_no} onChange={(e) => setForm({ ...form, cheque_no: e.target.value })} placeholder="Cheque No" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Cheque Date</label>
            <input type="date" value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
        </div>

        {/* Bill Table */}
        <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Bill-Wise Payment</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase w-8">✓</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-left">Bill No</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Bill Date</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Bill Amount</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Paid Amount</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody>
              {billList.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-gray-400 italic">Select a customer to load bills</td></tr>
              ) : (
                billList.map((b, i) => (
                  <tr key={i} className={`border-b border-gray-100 text-center ${b.selected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={b.selected} onChange={() => toggleBill(i)} className="w-4 h-4 accent-blue-600" />
                    </td>
                    <td className="px-3 py-2 text-left font-medium">{b.bill_no}</td>
                    <td className="px-3 py-2">{b.bill_date ? new Date(b.bill_date).toLocaleDateString("en-IN") : "-"}</td>
                    <td className="px-3 py-2">₹{Number(b.bill_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={b.paid_amount}
                        onChange={(e) => updateBillRow(i, "paid_amount", e.target.value)}
                        disabled={!b.selected}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-center outline-none text-[12px]"
                      />
                    </td>
                    <td className="px-3 py-2 font-semibold text-red-600">₹{Number(b.balance || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals + Remarks */}
        <div className="flex flex-wrap gap-8 items-end">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">TDS / Other Deductions (₹)</label>
            <input type="number" value={form.other_deductions} onChange={(e) => setForm({ ...form, other_deductions: Number(e.target.value) || 0 })} className="w-36 mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Remarks</label>
            <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="w-48 mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-600">Total Received: <span className="font-bold text-black text-base">₹{Number(form.total).toFixed(2)}</span></div>
            <div className="text-sm text-gray-600 mt-1">Less Deductions: <span className="font-bold text-red-600 text-base">₹{Number(form.other_deductions).toFixed(2)}</span></div>
            <div className="text-lg font-black text-gray-900 mt-2">Grand Total: ₹{Number(form.grand_total).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptBillToBill;
