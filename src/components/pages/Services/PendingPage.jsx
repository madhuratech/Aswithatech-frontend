import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/pendings";

function debounce(fn, d) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
}

const PendingPage = () => {
  const navigate = useNavigate();

  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    dc_no: "",
    dc_date: new Date().toISOString().split("T")[0],
  });

  const [row, setRow] = useState({
    item_name: "",
    order_qty: "",
    despatch_qty: "",
    pending_qty: "",
    remarks: "",
  });

  const [tableData, setTableData] = useState([]);

  // Load all pending list
  const loadList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/list`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Group by entry_id
      const map = new Map();
      for (const row of data) {
        if (!map.has(row.entry_id)) {
          map.set(row.entry_id, {
            id: row.entry_id,
            customer_name: row.customer_name,
            dc_no: row.dc_no,
            dc_date: row.dc_date,
            items: [],
          });
        }
        if (row.item_id) {
          map.get(row.entry_id).items.push({
            item_name: row.item_name,
            order_qty: row.order_qty,
            despatch_qty: row.despatch_qty,
            pending_qty: row.pending_qty,
            remarks: row.remarks,
          });
        }
      }
      setPendingList(Array.from(map.values()));
    } catch (e) {
      toast.error("Failed to load pending list");
    }
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);

  // Auto-calculate pending_qty
  const updateRow = (field, value) => {
    const updated = { ...row, [field]: value };
    if (field === "order_qty" || field === "despatch_qty") {
      const order = Number(field === "order_qty" ? value : row.order_qty) || 0;
      const despatch = Number(field === "despatch_qty" ? value : row.despatch_qty) || 0;
      updated.pending_qty = Math.max(0, order - despatch);
    }
    setRow(updated);
  };

  const addItem = () => {
    if (!row.item_name || !row.order_qty) {
      toast.error("Item name and order qty are required");
      return;
    }
    setTableData([...tableData, { ...row }]);
    setRow({ item_name: "", order_qty: "", despatch_qty: "", pending_qty: "", remarks: "" });
  };

  const removeItem = (i) => setTableData(tableData.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm({ customer_name: "", dc_no: "", dc_date: new Date().toISOString().split("T")[0] });
    setTableData([]);
    setRow({ item_name: "", order_qty: "", despatch_qty: "", pending_qty: "", remarks: "" });
  };

  const save = async () => {
    if (!form.customer_name || !form.dc_no || tableData.length === 0) {
      toast.error("Customer, DC number and at least one item are required");
      return;
    }
    const toastId = toast.loading("Saving...");
    try {
      const res = await fetch(`${API}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: tableData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Pending entry saved!", { id: toastId });
      resetForm();
      loadList();
    } catch (e) {
      toast.error(e.message || "Save failed", { id: toastId });
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this pending entry?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`${API}/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Deleted!", { id: toastId });
      loadList();
    } catch (e) {
      toast.error(e.message || "Delete failed", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit mb-4">
        ← Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black tracking-tight">Pending DC Entry</h2>
          <div className="flex gap-1.5">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">NEW</button>
            <button onClick={save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">SAVE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">CLOSE</button>
          </div>
        </div>

        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Customer Name</label>
            <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Customer Name" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">DC No</label>
            <input type="text" value={form.dc_no} onChange={(e) => setForm({ ...form, dc_no: e.target.value })} placeholder="DC Number" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">DC Date</label>
            <input type="date" value={form.dc_date} onChange={(e) => setForm({ ...form, dc_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
        </div>

        {/* Item Entry */}
        <div className="grid grid-cols-6 gap-3 mb-4 items-end">
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase">Item Name</label>
            <input type="text" value={row.item_name} onChange={(e) => updateRow("item_name", e.target.value)} placeholder="Item" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Order Qty</label>
            <input type="number" value={row.order_qty} onChange={(e) => updateRow("order_qty", e.target.value)} placeholder="Order Qty" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Despatch Qty</label>
            <input type="number" value={row.despatch_qty} onChange={(e) => updateRow("despatch_qty", e.target.value)} placeholder="Despatch Qty" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Pending Qty</label>
            <input type="number" value={row.pending_qty} readOnly placeholder="Auto" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none bg-gray-50 font-semibold text-red-600" />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition">Add</button>
            <button onClick={() => setRow({ item_name: "", order_qty: "", despatch_qty: "", pending_qty: "", remarks: "" })} className="flex-1 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition">Clear</button>
          </div>
        </div>

        {/* Item Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-left">Item</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Order Qty</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Despatch Qty</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-red-600">Pending Qty</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-6 text-gray-400 italic">No items added yet</td></tr>
              ) : (
                tableData.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                    <td className="px-3 py-2 text-[13px] text-left font-medium">{it.item_name}</td>
                    <td className="px-3 py-2 text-[13px]">{it.order_qty}</td>
                    <td className="px-3 py-2 text-[13px]">{it.despatch_qty}</td>
                    <td className="px-3 py-2 text-[13px] text-red-600 font-bold">{it.pending_qty}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Del</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Existing Pending Records */}
      <div className="max-w-[1400px] mx-auto bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="text-base font-bold text-gray-700 mb-4">All Pending Entries</h3>
        {loading ? (
          <p className="text-center text-gray-400 p-6 italic">Loading...</p>
        ) : pendingList.length === 0 ? (
          <p className="text-center text-gray-400 p-6 italic">No pending entries found</p>
        ) : (
          <div className="space-y-4">
            {pendingList.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex gap-6">
                    <span className="text-sm font-bold">{entry.customer_name}</span>
                    <span className="text-sm text-gray-500">DC: {entry.dc_no}</span>
                    <span className="text-sm text-gray-500">{entry.dc_date ? new Date(entry.dc_date).toLocaleDateString("en-IN") : "-"}</span>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold border border-red-200 px-2 py-1 rounded">Delete</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-1.5 text-[11px] text-gray-500 text-left">Item</th>
                      <th className="px-3 py-1.5 text-[11px] text-gray-500">Order</th>
                      <th className="px-3 py-1.5 text-[11px] text-gray-500">Despatch</th>
                      <th className="px-3 py-1.5 text-[11px] text-red-600">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.items.map((it, j) => (
                      <tr key={j} className="border-t border-gray-100 text-center">
                        <td className="px-3 py-2 text-left">{it.item_name}</td>
                        <td className="px-3 py-2">{it.order_qty}</td>
                        <td className="px-3 py-2">{it.despatch_qty}</td>
                        <td className="px-3 py-2 text-red-600 font-bold">{it.pending_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPage;
