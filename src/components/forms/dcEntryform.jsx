import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/servicedcentry";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const DcEntryForm = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────
  const [dcNo, setDcNo] = useState("");
  const [loadDcNo, setLoadDcNo] = useState("");
  const [dcList, setDcList] = useState([]);
  const [showDcDrop, setShowDcDrop] = useState(false);
  const dcRef = useRef(null);

  const [form, setForm] = useState({
    supplier_name: "",
    inward_dc_no: "",
    dc_date: new Date().toISOString().split("T")[0],
    party_dc_no: "",
    party_dc_date: "",
    payment_terms: "",
    despatch_through: "",
    status: "Service",
  });

  // Inward DC from existing inward entries
  const [inwardDcs, setInwardDcs] = useState([]);
  const [showInwardDrop, setShowInwardDrop] = useState(false);
  const inwardRef = useRef(null);

  const [clients, setClients] = useState([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef(null);

  const [items, setItems] = useState([]);
  const [showItemDrop, setShowItemDrop] = useState(false);
  const itemRef = useRef(null);

  const [row, setRow] = useState({
    item_name: "",
    quantity: "",
    serial_no: "",
    received_qty: "",
    uom: "",
    hsn: "",
    remarks: "",
  });

  const [tableData, setTableData] = useState([]);

  // ── Click-outside ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientDrop(false);
      if (itemRef.current && !itemRef.current.contains(e.target)) setShowItemDrop(false);
      if (dcRef.current && !dcRef.current.contains(e.target)) setShowDcDrop(false);
      if (inwardRef.current && !inwardRef.current.contains(e.target)) setShowInwardDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load next DC number ───────────────────────────────────────────────
  const loadNextDc = async () => {
    try {
      const res = await fetch(`${API}/next-dc-no`);
      const data = await res.json();
      setDcNo(data.dc_no || "");
    } catch (e) {
      console.error("DC number fetch failed", e);
    }
  };

  useEffect(() => {
    loadNextDc();
    loadClients();
  }, []);

  // ── Load clients (from inward_entry) ─────────────────────────────────
  const loadClients = async () => {
    try {
      const res = await fetch(`${API}/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Client load failed", e);
    }
  };

  const searchClients = async (q) => {
    try {
      const res = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Client search failed", e);
    }
  };
  const debouncedClient = useRef(debounce(searchClients, 300)).current;

  // ── Search inward DCs ─────────────────────────────────────────────────
  const searchInwardDcs = async (q, supplier) => {
    try {
      const res = await fetch(
        `${API}/IE/search?q=${encodeURIComponent(q)}&supplier=${encodeURIComponent(supplier || "")}`
      );
      const data = await res.json();
      setInwardDcs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Inward DC search failed", e);
    }
  };

  // Load inward DC details into form items
  const loadInwardDc = async (dcNum) => {
    if (!dcNum) return;
    try {
      const res = await fetch(`${API}/inward/${encodeURIComponent(dcNum)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Pre-fill items from inward entry
      if (data.items && data.items.length > 0) {
        setTableData(
          data.items.map((it) => ({
            item_name: it.item_name,
            quantity: it.quantity,
            serial_no: it.pcb_sl_no || "",
            received_qty: it.quantity,
            uom: it.unit || "",
            hsn: it.hsn || "",
            remarks: it.remarks || "",
          }))
        );
        toast.success("Inward DC items loaded");
      }
    } catch (e) {
      console.error("Inward DC load failed", e);
    }
  };

  // ── Search existing service DCs ───────────────────────────────────────
  const searchDcs = async (q) => {
    try {
      const res = await fetch(`${API}/DC/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setDcList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("DC search failed", e);
    }
  };

  // ── Load DC for edit ──────────────────────────────────────────────────
  const loadDc = async (num) => {
    const n = num || loadDcNo;
    if (!n.trim()) { toast.error("Enter DC number"); return; }
    try {
      const res = await fetch(`${API}/editdc/${encodeURIComponent(n)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const h = data.header;
      setForm({
        supplier_name: h.supplier_name || "",
        inward_dc_no: h.inward_dc_no || "",
        dc_date: h.dc_date || "",
        party_dc_no: h.party_dc_no || "",
        party_dc_date: h.party_dc_date || "",
        payment_terms: h.payment_terms || "",
        despatch_through: h.despatch_through || "",
        status: h.status || "Service",
      });
      setDcNo(h.inward_dc_no || "");
      setLoadDcNo(h.inward_dc_no || "");
      setTableData(
        (data.items || []).map((it) => ({
          item_name: it.item_name,
          quantity: it.quantity,
          serial_no: it.serial_no || "",
          received_qty: it.received_qty || "",
          uom: it.uom || "",
          hsn: it.hsn || "",
          remarks: it.remarks || "",
        }))
      );
      toast.success("DC loaded successfully");
    } catch (e) {
      toast.error("DC not found");
    }
  };

  // ── Item search ───────────────────────────────────────────────────────
  const searchItems = async (q) => {
    try {
      const res = await fetch(`${API}/items/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Item search failed", e);
    }
  };
  const debouncedItem = useRef(debounce(searchItems, 300)).current;

  // ── Row management ────────────────────────────────────────────────────
  const addItem = () => {
    if (!row.item_name || !row.quantity) {
      toast.error("Item name and quantity are required");
      return;
    }
    setTableData([...tableData, { ...row }]);
    setRow({ item_name: "", quantity: "", serial_no: "", received_qty: "", uom: "", hsn: "", remarks: "" });
  };

  const removeItem = (idx) => setTableData(tableData.filter((_, i) => i !== idx));
  const editItem = (idx) => {
    setRow({ ...tableData[idx] });
    setTableData(tableData.filter((_, i) => i !== idx));
  };

  // ── Reset ─────────────────────────────────────────────────────────────
  const resetForm = async () => {
    setForm({
      supplier_name: "",
      inward_dc_no: "",
      dc_date: new Date().toISOString().split("T")[0],
      party_dc_no: "",
      party_dc_date: "",
      payment_terms: "",
      despatch_through: "",
      status: "Service",
    });
    setTableData([]);
    setRow({ item_name: "", quantity: "", serial_no: "", received_qty: "", uom: "", hsn: "", remarks: "" });
    setLoadDcNo("");
    await loadNextDc();
  };

  // ── Save / Update ─────────────────────────────────────────────────────
  const save = async () => {
    if (!form.supplier_name || !form.inward_dc_no || tableData.length === 0) {
      toast.error("Supplier, Inward DC No and at least one item are required");
      return;
    }
    const payload = {
      supplier_name: form.supplier_name,
      inward_dc_no: form.inward_dc_no || dcNo,
      dc_date: form.dc_date,
      party_dc_no: form.party_dc_no,
      party_dc_date: form.party_dc_date,
      payment_terms: form.payment_terms,
      despatch_through: form.despatch_through,
      status: form.status,
      items: tableData,
    };
    const toastId = toast.loading("Saving Service DC...");
    try {
      const isEdit = Boolean(loadDcNo);
      // For edit we need the numeric id - search for it
      let url, method;
      if (isEdit) {
        // GET the entry to find id
        const searchRes = await fetch(`${API}/editdc/${encodeURIComponent(loadDcNo)}`);
        const searchData = await searchRes.json();
        const id = searchData.header?.id;
        url = `${API}/updatedc/${id}`;
        method = "PUT";
      } else {
        url = `${API}/createdc`;
        method = "POST";
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(isEdit ? "Service DC updated!" : "Service DC saved!", { id: toastId });
      await resetForm();
    } catch (e) {
      toast.error(e.message || "Save failed", { id: toastId });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const deleteDc = async () => {
    if (!loadDcNo) { toast.error("Load a DC first to delete it"); return; }
    if (!window.confirm(`Delete Service DC ${loadDcNo}?`)) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`${API}/deletedc/${encodeURIComponent(loadDcNo)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Service DC deleted!", { id: toastId });
      await resetForm();
    } catch (e) {
      toast.error(e.message || "Delete failed", { id: toastId });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit mb-4"
      >
        ← Go Back
      </button>

      <div className="max-w-[1500px] mx-auto bg-white p-6 shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black tracking-tight">Service DC Entry</h2>
          <div className="flex gap-1.5">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">NEW</button>
            <button onClick={save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">SAVE</button>
            <button onClick={deleteDc} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">CLOSE</button>
          </div>
        </div>

        {/* Row 1 */}
        <div className="flex flex-row flex-wrap gap-6 border-b pb-6 mb-6 items-end">
          {/* Supplier */}
          <div className="relative flex-1 min-w-[200px]" ref={clientRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Supplier Name</label>
            <input
              type="text"
              value={form.supplier_name}
              onFocus={() => { setShowClientDrop(true); }}
              onChange={(e) => {
                setForm({ ...form, supplier_name: e.target.value });
                debouncedClient(e.target.value);
                setShowClientDrop(true);
              }}
              placeholder="Enter Supplier Name"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none"
            />
            {showClientDrop && clients.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {clients.map((c, i) => (
                  <div key={i} onClick={() => {
                    setForm({ ...form, supplier_name: c.customer_name });
                    setShowClientDrop(false);
                    searchInwardDcs("", c.customer_name);
                  }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                    {c.customer_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inward DC No */}
          <div className="relative flex-1 min-w-[200px]" ref={inwardRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Inward DC No</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={form.inward_dc_no}
                onFocus={() => { setShowInwardDrop(true); searchInwardDcs("", form.supplier_name); }}
                onChange={(e) => {
                  setForm({ ...form, inward_dc_no: e.target.value });
                  searchInwardDcs(e.target.value, form.supplier_name);
                  setShowInwardDrop(true);
                }}
                placeholder="Select Inward DC"
                className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none"
              />
              <button onClick={() => loadInwardDc(form.inward_dc_no)} className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">Load</button>
            </div>
            {showInwardDrop && inwardDcs.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {inwardDcs.map((d, i) => (
                  <div key={i} onClick={() => {
                    const n = d.dc_number || d;
                    setForm({ ...form, inward_dc_no: n });
                    setShowInwardDrop(false);
                    loadInwardDc(n);
                  }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                    {d.dc_number || d}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service DC No (auto) */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Service DC No</label>
            <input type="text" value={dcNo} readOnly className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none bg-gray-50" />
          </div>

          {/* DC Date */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">DC Date</label>
            <input type="date" value={form.dc_date} onChange={(e) => setForm({ ...form, dc_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none" />
          </div>

          {/* Load existing service DC */}
          <div className="relative flex-1 min-w-[200px]" ref={dcRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Load Existing Service DC</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={loadDcNo}
                onFocus={() => { setShowDcDrop(true); searchDcs(""); }}
                onChange={(e) => { setLoadDcNo(e.target.value); searchDcs(e.target.value); setShowDcDrop(true); }}
                placeholder="Service DC number"
                className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none"
              />
              <button onClick={() => loadDc()} className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">Load</button>
            </div>
            {showDcDrop && dcList.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {dcList.map((d, i) => (
                  <div key={i} onClick={() => { const n = d.dc_number || d; setLoadDcNo(n); loadDc(n); setShowDcDrop(false); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                    {d.dc_number || d}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Party DC No</label>
            <input type="text" value={form.party_dc_no} onChange={(e) => setForm({ ...form, party_dc_no: e.target.value })} placeholder="Party DC No" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Party DC Date</label>
            <input type="date" value={form.party_dc_date} onChange={(e) => setForm({ ...form, party_dc_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment Terms</label>
            <input type="text" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="e.g. 30 days" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Despatch Through</label>
            <input type="text" value={form.despatch_through} onChange={(e) => setForm({ ...form, despatch_through: e.target.value })} placeholder="Courier / Transport" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight block mb-2">Status</label>
          <div className="flex gap-6">
            {["Service", "Repaired", "Returned"].map((s) => (
              <label key={s} className="flex items-center gap-2 text-[12px] font-bold text-gray-700 cursor-pointer">
                <input type="radio" name="svc_status" checked={form.status === s} onChange={() => setForm({ ...form, status: s })} className="w-4 h-4 accent-black" />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* Item Entry */}
        <div className="grid grid-cols-7 gap-3 mb-4 items-end" ref={itemRef}>
          <div className="col-span-2 relative">
            <label className="text-[11px] font-bold text-gray-500 uppercase">Item Name</label>
            <input
              type="text"
              value={row.item_name}
              onFocus={() => { setShowItemDrop(true); searchItems(""); }}
              onChange={(e) => {
                setRow({ ...row, item_name: e.target.value });
                debouncedItem(e.target.value);
                setShowItemDrop(true);
              }}
              placeholder="Items"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
            {showItemDrop && items.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {items.map((it, i) => (
                  <div key={i} onClick={() => { setRow({ ...row, item_name: it.item_name }); setShowItemDrop(false); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                    {it.item_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Qty</label>
            <input type="number" value={row.quantity} onChange={(e) => setRow({ ...row, quantity: e.target.value })} placeholder="Qty" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Serial No</label>
            <input type="text" value={row.serial_no} onChange={(e) => setRow({ ...row, serial_no: e.target.value })} placeholder="Serial" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">UOM</label>
            <input type="text" value={row.uom} onChange={(e) => setRow({ ...row, uom: e.target.value })} placeholder="UOM" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Remarks</label>
            <input type="text" value={row.remarks} onChange={(e) => setRow({ ...row, remarks: e.target.value })} placeholder="Remarks" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition">Add</button>
            <button onClick={() => setRow({ item_name: "", quantity: "", serial_no: "", received_qty: "", uom: "", hsn: "", remarks: "" })} className="flex-1 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition">Clear</button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-left w-8">Sl</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-left">Item Name</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Serial No</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">UOM</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Remarks</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400 italic">No items added yet</td></tr>
              ) : (
                tableData.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                    <td className="px-3 py-2 text-[13px]">{i + 1}</td>
                    <td className="px-3 py-2 text-[13px] text-left font-medium">{it.item_name}</td>
                    <td className="px-3 py-2 text-[13px]">{it.quantity}</td>
                    <td className="px-3 py-2 text-[13px]">{it.serial_no}</td>
                    <td className="px-3 py-2 text-[13px]">{it.uom}</td>
                    <td className="px-3 py-2 text-[13px]">{it.remarks}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => editItem(i)} className="text-blue-500 hover:text-blue-700 mr-2 text-xs font-semibold">Edit</button>
                      <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Del</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DcEntryForm;
