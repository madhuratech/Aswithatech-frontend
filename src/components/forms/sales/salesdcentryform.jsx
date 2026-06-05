import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/salesdc";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const SalesDCEntry = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────
  const [dcNo, setDcNo] = useState("");
  const [loadDcNo, setLoadDcNo] = useState("");
  const [dcList, setDcList] = useState([]);
  const [showDcDrop, setShowDcDrop] = useState(false);
  const dcRef = useRef(null);

  const [form, setForm] = useState({
    customer_name: "",
    dc_date: new Date().toISOString().split("T")[0],
    order_no: "",
    order_date: "",
    payment_terms: "",
    Client_dc_date: "",
    despatch_through: "",
    status: "To Sell",
    ordertype: "service",
  });

  const [clients, setClients] = useState([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef(null);

  const [items, setItems] = useState([]);
  const [showItemDrop, setShowItemDrop] = useState(false);
  const itemRef = useRef(null);

  const [row, setRow] = useState({
    item_name: "",
    quantity: "",
    price: "",
    sl_no: "",
    hsn: "",
    uom: "",
  });

  const [tableData, setTableData] = useState([]);

  // ── Click-outside handler ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target))
        setShowClientDrop(false);
      if (itemRef.current && !itemRef.current.contains(e.target))
        setShowItemDrop(false);
      if (dcRef.current && !dcRef.current.contains(e.target))
        setShowDcDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load next DC number on mount ─────────────────────────────────────
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
  }, []);

  // ── Client search ────────────────────────────────────────────────────
  const searchClients = async (q) => {
    try {
      const res = await fetch(
        `${API}/clients/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Client search failed", e);
    }
  };
  const debouncedClient = useRef(debounce(searchClients, 300)).current;

  // ── Item search ──────────────────────────────────────────────────────
  const searchItems = async (q, type) => {
    if (!type) return;
    try {
      const res = await fetch(
        `${API}/items/search?q=${encodeURIComponent(q)}&type=${type}`
      );
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Item search failed", e);
    }
  };
  const debouncedItem = useRef(debounce(searchItems, 300)).current;

  // ── DC number search ─────────────────────────────────────────────────
  const searchDcs = async (q) => {
    try {
      const res = await fetch(
        `${API}/DC/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setDcList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("DC search failed", e);
    }
  };

  // ── Load existing DC for edit ────────────────────────────────────────
  const loadDc = async (num) => {
    const dcToLoad = num || loadDcNo;
    if (!dcToLoad.trim()) {
      toast.error("Enter DC number to load");
      return;
    }
    try {
      const res = await fetch(`${API}/edit/${encodeURIComponent(dcToLoad)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const h = data.header;
      setForm({
        customer_name: h.customer_name || "",
        dc_date: h.dc_date || "",
        order_no: h.order_no || "",
        order_date: h.order_date || "",
        payment_terms: h.payment_terms || "",
        Client_dc_date: h.Client_dc_date || "",
        despatch_through: h.despatch_through || "",
        status: h.status || "To Sell",
        ordertype: h.ordertype || "service",
      });
      setDcNo(h.dc_no || "");
      setLoadDcNo(h.dc_no || "");
      setTableData(
        (data.items || []).map((it) => ({
          item_name: it.item_name,
          quantity: it.quantity,
          price: it.price,
          sl_no: it.sl_no || "",
          hsn: it.hsn || "",
          uom: it.uom || "",
        }))
      );
      toast.success("DC loaded successfully");
    } catch (e) {
      toast.error("DC not found");
    }
  };

  // ── Add item to table ────────────────────────────────────────────────
  const addItem = () => {
    if (!row.item_name || !row.quantity) {
      toast.error("Item name and quantity are required");
      return;
    }
    setTableData([...tableData, { ...row }]);
    setRow({ item_name: "", quantity: "", price: "", sl_no: "", hsn: "", uom: "" });
  };

  const removeItem = (idx) =>
    setTableData(tableData.filter((_, i) => i !== idx));

  const editItem = (idx) => {
    setRow({ ...tableData[idx] });
    setTableData(tableData.filter((_, i) => i !== idx));
  };

  // ── Reset form ───────────────────────────────────────────────────────
  const resetForm = async () => {
    setForm({
      customer_name: "",
      dc_date: new Date().toISOString().split("T")[0],
      order_no: "",
      order_date: "",
      payment_terms: "",
      Client_dc_date: "",
      despatch_through: "",
      status: "To Sell",
      ordertype: "service",
    });
    setTableData([]);
    setRow({ item_name: "", quantity: "", price: "", sl_no: "", hsn: "", uom: "" });
    setLoadDcNo("");
    await loadNextDc();
  };

  // ── Save ─────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.customer_name || !form.payment_terms || tableData.length === 0) {
      toast.error("Customer name, payment terms and at least one item are required");
      return;
    }
    const payload = {
      ...form,
      dc_no: dcNo,
      items: tableData,
    };
    const toastId = toast.loading("Saving Sales DC...");
    try {
      const isEdit = Boolean(loadDcNo);
      const url = isEdit
        ? `${API}/update/${encodeURIComponent(loadDcNo)}`
        : `${API}/new`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(isEdit ? "Sales DC updated!" : "Sales DC saved!", { id: toastId });
      await resetForm();
    } catch (e) {
      toast.error(e.message || "Save failed", { id: toastId });
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const deleteDc = async () => {
    if (!loadDcNo) {
      toast.error("Load a DC first to delete it");
      return;
    }
    if (!window.confirm(`Delete Sales DC ${loadDcNo}?`)) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`${API}/delete/${encodeURIComponent(loadDcNo)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Sales DC deleted!", { id: toastId });
      await resetForm();
    } catch (e) {
      toast.error(e.message || "Delete failed", { id: toastId });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
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
          <h2 className="text-xl font-bold text-black tracking-tight">Sales DC Entry</h2>
          <div className="flex gap-1.5">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">NEW</button>
            <button onClick={save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">SAVE</button>
            <button onClick={deleteDc} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">CLOSE</button>
          </div>
        </div>

        {/* Row 1: Customer | DC No | DC Date | Load DC */}
        <div className="flex flex-row flex-wrap gap-6 border-b pb-6 mb-6 items-end">
          {/* Customer */}
          <div className="relative flex-1 min-w-[200px]" ref={clientRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Customer Name</label>
            <input
              type="text"
              value={form.customer_name}
              onFocus={() => { setShowClientDrop(true); searchClients(""); }}
              onChange={(e) => {
                setForm({ ...form, customer_name: e.target.value });
                debouncedClient(e.target.value);
                setShowClientDrop(true);
              }}
              placeholder="Enter Customer Name"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none bg-white"
            />
            {showClientDrop && clients.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {clients.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => { setForm({ ...form, customer_name: c.customer_name }); setShowClientDrop(false); }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {c.customer_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DC No */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">DC No</label>
            <input
              type="text"
              value={dcNo}
              readOnly
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none bg-gray-50"
            />
          </div>

          {/* DC Date */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">DC Date</label>
            <input
              type="date"
              value={form.dc_date}
              onChange={(e) => setForm({ ...form, dc_date: e.target.value })}
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none bg-white"
            />
          </div>

          {/* Load existing DC */}
          <div className="relative flex-1 min-w-[200px]" ref={dcRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Load / Search DC</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={loadDcNo}
                onFocus={() => { setShowDcDrop(true); searchDcs(""); }}
                onChange={(e) => {
                  setLoadDcNo(e.target.value);
                  searchDcs(e.target.value);
                  setShowDcDrop(true);
                }}
                placeholder="Select DC Number"
                className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none bg-white"
              />
              <button
                onClick={() => loadDc()}
                className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition"
              >
                Load
              </button>
            </div>
            {showDcDrop && dcList.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {dcList.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => { const n = d.dc_no || d; setLoadDcNo(n); loadDc(n); setShowDcDrop(false); }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {d.dc_no || d}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Order fields */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Order No</label>
            <input
              type="text"
              value={form.order_no}
              onChange={(e) => setForm({ ...form, order_no: e.target.value })}
              placeholder="Order No"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Order Date</label>
            <input
              type="date"
              value={form.order_date}
              onChange={(e) => setForm({ ...form, order_date: e.target.value })}
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment Terms</label>
            <input
              type="text"
              value={form.payment_terms}
              onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
              placeholder="e.g. 30 days"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Despatch Through</label>
            <input
              type="text"
              value={form.despatch_through}
              onChange={(e) => setForm({ ...form, despatch_through: e.target.value })}
              placeholder="Courier / Transport"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
        </div>

        {/* Row 3: Status + Order Type */}
        <div className="flex flex-row gap-16 mb-6">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight block mb-2">Status</label>
            <div className="flex gap-6">
              {["To Sell", "ReService"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-[12px] font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={form.status === s}
                    onChange={() => setForm({ ...form, status: s })}
                    className="w-4 h-4 accent-black"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight block mb-2">Order Type</label>
            <div className="flex gap-6">
              {[
                { label: "Service", value: "service" },
                { label: "Spare", value: "spare" },
                { label: "Purchase Item", value: "purchase_item" },
              ].map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-[12px] font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="ordertype"
                    checked={form.ordertype === t.value}
                    onChange={() => { setForm({ ...form, ordertype: t.value }); searchItems("", t.value); }}
                    className="w-4 h-4 accent-black"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Item Entry Row */}
        <div className="grid grid-cols-7 gap-3 mb-4 items-end" ref={itemRef}>
          <div className="col-span-2 relative">
            <label className="text-[11px] font-bold text-gray-500 uppercase">Item Name</label>
            <input
              type="text"
              value={row.item_name}
              onFocus={() => { setShowItemDrop(true); searchItems("", form.ordertype); }}
              onChange={(e) => {
                setRow({ ...row, item_name: e.target.value });
                debouncedItem(e.target.value, form.ordertype);
                setShowItemDrop(true);
              }}
              placeholder="Items"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
            {showItemDrop && items.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {items.map((it, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setRow({ ...row, item_name: it.item_name, hsn: it.hsn_number || "" });
                      setShowItemDrop(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {it.item_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Qty</label>
            <input
              type="number"
              value={row.quantity}
              onChange={(e) => setRow({ ...row, quantity: e.target.value })}
              placeholder="Qty"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Price</label>
            <input
              type="number"
              value={row.price}
              onChange={(e) => setRow({ ...row, price: e.target.value })}
              placeholder="Price"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">HSN</label>
            <input
              type="text"
              value={row.hsn}
              onChange={(e) => setRow({ ...row, hsn: e.target.value })}
              placeholder="HSN"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">UOM</label>
            <input
              type="text"
              value={row.uom}
              onChange={(e) => setRow({ ...row, uom: e.target.value })}
              placeholder="UOM"
              className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addItem}
              className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition"
            >
              Add
            </button>
            <button
              onClick={() => setRow({ item_name: "", quantity: "", price: "", sl_no: "", hsn: "", uom: "" })}
              className="flex-1 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition"
            >
              Clear
            </button>
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
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Price</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">HSN</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">UOM</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-6 text-gray-400 italic">
                    No items added yet
                  </td>
                </tr>
              ) : (
                tableData.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                    <td className="px-3 py-2 text-[13px]">{i + 1}</td>
                    <td className="px-3 py-2 text-[13px] text-left font-medium">{it.item_name}</td>
                    <td className="px-3 py-2 text-[13px]">{it.quantity}</td>
                    <td className="px-3 py-2 text-[13px]">₹{Number(it.price || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-[13px]">₹{(Number(it.quantity || 0) * Number(it.price || 0)).toFixed(2)}</td>
                    <td className="px-3 py-2 text-[13px]">{it.hsn}</td>
                    <td className="px-3 py-2 text-[13px]">{it.uom}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => editItem(i)}
                        className="text-blue-500 hover:text-blue-700 mr-2 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeItem(i)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Totals */}
        {tableData.length > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="text-right text-sm font-semibold text-gray-700">
              Total Items: {tableData.length} &nbsp;|&nbsp; Grand Qty:{" "}
              {tableData.reduce((s, r) => s + Number(r.quantity || 0), 0)} &nbsp;|&nbsp; Grand Amount: ₹
              {tableData
                .reduce((s, r) => s + Number(r.quantity || 0) * Number(r.price || 0), 0)
                .toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDCEntry;