import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/receipts";

function debounce(fn, d) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
}

const ReceiptAdvance = () => {
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
    total: "",
    force_amount: 0,
    other_deductions: 0,
    grand_total: 0,
    remarks: "",
  });

  const [clients, setClients] = useState([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientDrop(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load next advance number
  const loadNextNo = async () => {
    try {
      const res = await fetch(`${API}/next-advance-no`);
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

  // Search existing receipts
  const searchReceipts = async (q) => {
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchList(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // Load advance receipt for edit
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
      toast.success("Receipt loaded");
    } catch (e) { toast.error("Receipt not found"); }
  };

  // Recalculate grand total
  useEffect(() => {
    const received = Number(form.total) || 0;
    const tds = Number(form.other_deductions) || 0;
    const force = Number(form.force_amount) || 0;
    setForm(prev => ({ ...prev, grand_total: received - tds - force }));
  // eslint-disable-next-line
  }, [form.total, form.other_deductions, form.force_amount]);

  // Reset
  const resetForm = async () => {
    setForm({ receipt_date: new Date().toISOString().split("T")[0], customer_name: "", payment_mode: "Cash", bank_name: "", cheque_no: "", cheque_date: "", total: "", force_amount: 0, other_deductions: 0, grand_total: 0, remarks: "" });
    setLoadReceiptNo("");
    await loadNextNo();
  };

  // Save
  const save = async () => {
    if (!form.customer_name || !form.payment_mode || !form.total) {
      toast.error("Customer, payment mode and received amount are required");
      return;
    }
    const payload = { ...form, receipt_no: receiptNo, items: [] };
    const toastId = toast.loading("Saving advance receipt...");
    try {
      const isEdit = Boolean(loadReceiptNo);
      const url = isEdit ? `${API}/new` : `${API}/new`;  // POST for both; edit uses id below
      if (isEdit) {
        // load id
        const r2 = await fetch(`${API}/${encodeURIComponent(loadReceiptNo)}`);
        const d2 = await r2.json();
        const id = d2.header?.id;
        const res = await fetch(`${API}/update/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success("Advance receipt updated!", { id: toastId });
      } else {
        const res = await fetch(`${API}/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success("Advance receipt saved!", { id: toastId });
      }
      await resetForm();
    } catch (e) { toast.error(e.message || "Save failed", { id: toastId }); }
  };

  // Delete
  const deleteReceipt = async () => {
    if (!loadReceiptNo) { toast.error("Load a receipt first"); return; }
    try {
      const res = await fetch(`${API}/${encodeURIComponent(loadReceiptNo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const id = data.header?.id;
      if (!id) throw new Error("ID not found");
      if (!window.confirm(`Delete advance receipt ${loadReceiptNo}?`)) return;
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

      <div className="max-w-[900px] mx-auto bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black tracking-tight">Advance Receipt</h2>
          <div className="flex gap-1.5">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">NEW</button>
            <button onClick={save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">SAVE</button>
            <button onClick={deleteReceipt} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">CLOSE</button>
          </div>
        </div>

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
            <input type="text" value={form.customer_name}
              onFocus={() => { setShowClientDrop(true); searchClients(""); }}
              onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); debouncedClient(e.target.value); setShowClientDrop(true); }}
              placeholder="Customer name" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none" />
            {showClientDrop && clients.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {clients.map((c, i) => (
                  <div key={i} onClick={() => { setForm({ ...form, customer_name: c.customer_name }); setShowClientDrop(false); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{c.customer_name}</div>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1 min-w-[220px]" ref={searchRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Load Receipt</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={loadReceiptNo}
                onFocus={() => { setShowSearchDrop(true); searchReceipts(""); }}
                onChange={(e) => { setLoadReceiptNo(e.target.value); searchReceipts(e.target.value); setShowSearchDrop(true); }}
                placeholder="AT/ADV-..." className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none" />
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Payment Mode</label>
            <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none bg-white">
              {["Cash", "Cheque", "NEFT", "RTGS", "UPI"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Bank Name</label>
            <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Bank" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Cheque No</label>
            <input type="text" value={form.cheque_no} onChange={(e) => setForm({ ...form, cheque_no: e.target.value })} placeholder="Cheque No" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Cheque Date</label>
            <input type="date" value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Received Amount (₹)</label>
            <input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} placeholder="Amount" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">TDS / Deductions (₹)</label>
            <input type="number" value={form.other_deductions} onChange={(e) => setForm({ ...form, other_deductions: e.target.value })} placeholder="0" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1">
            <label className="text-[12px] font-bold text-gray-600 uppercase">Remarks</label>
            <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Received: <span className="font-bold text-black">₹{Number(form.total || 0).toFixed(2)}</span></div>
            <div className="text-lg font-black text-green-700 mt-1">Grand Total: ₹{Number(form.grand_total || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptAdvance;
