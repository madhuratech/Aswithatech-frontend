import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = "http://localhost:3000/api/serviceinvoice";

function debounce(fn, d) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
}

const ServiceInvoiceForm = () => {
  const navigate = useNavigate();

  const [invoiceNo, setInvoiceNo] = useState("");
  const [loadInvNo, setLoadInvNo] = useState("");
  const [invList, setInvList] = useState([]);
  const [showInvDrop, setShowInvDrop] = useState(false);
  const invRef = useRef(null);

  const [form, setForm] = useState({
    customer_name: "",
    invoice_date: new Date().toISOString().split("T")[0],
    dc_no: "",
    dc_date: "",
    order_no: "",
    order_date: "",
    payment_terms: "",
    dispatch_through: "",
    discount: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
    transport: 0,
    round_off: 0,
    grand_total: 0,
  });

  const [clients, setClients] = useState([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef(null);

  const [serviceDcs, setServiceDcs] = useState([]);
  const [showDcDrop, setShowDcDrop] = useState(false);
  const dcRef = useRef(null);

  const [row, setRow] = useState({ item_name: "", quantity: "", price: "", discount: 0, amount: 0, uom: "", hsn_number: "" });
  const [tableData, setTableData] = useState([]);

  const [totals, setTotals] = useState({ subtotal: 0, cgst: 0, sgst: 0, igst: 0, transport: 0, round_off: 0, grand_total: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientDrop(false);
      if (dcRef.current && !dcRef.current.contains(e.target)) setShowDcDrop(false);
      if (invRef.current && !invRef.current.contains(e.target)) setShowInvDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load next invoice number
  const loadNextNo = async () => {
    try {
      const res = await fetch(`${API}/next-SV-no`);
      const data = await res.json();
      setInvoiceNo(data.invoice_no || "");
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadNextNo(); }, []);

  // Client search (from service DC entries with status='Service')
  const searchClients = async (q) => {
    try {
      const res = await fetch(`${API}/clients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };
  const debouncedClient = useRef(debounce(searchClients, 300)).current;

  // Service DC search
  const searchDcs = async (q, supplier) => {
    try {
      const res = await fetch(`${API}/service-dc/search?q=${encodeURIComponent(q)}&supplier=${encodeURIComponent(supplier || "")}`);
      const data = await res.json();
      setServiceDcs(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // Load service DC items into invoice
  const loadServiceDc = async (dcNo) => {
    if (!dcNo) return;
    try {
      const res = await fetch(`${API}/service-dc/${encodeURIComponent(dcNo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const h = data.header;
      setForm(prev => ({
        ...prev,
        customer_name: h.supplier_name || prev.customer_name,
        dc_date: h.dc_date || "",
        order_no: h.party_dc_no || "",
        payment_terms: h.payment_terms || "",
      }));
      setTableData(
        (data.items || []).map(it => ({
          item_name: it.item_name,
          quantity: it.quantity || 1,
          price: 0,
          discount: 0,
          amount: 0,
          uom: it.uom || "",
          hsn_number: it.hsn_number || "",
        }))
      );
      toast.success("Service DC items loaded");
    } catch (e) { toast.error("DC not found"); }
  };

  // Invoice search
  const searchInvoices = async (q) => {
    try {
      const res = await fetch(`${API}/search-invoice?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setInvList(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // Load invoice for edit
  const loadInvoice = async (num) => {
    const n = num || loadInvNo;
    if (!n) { toast.error("Enter invoice number"); return; }
    try {
      const res = await fetch(`${API}/invoice/${encodeURIComponent(n)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const h = data.header;
      setForm({
        customer_name: h.customer_name || "",
        invoice_date: h.invoice_date || "",
        dc_no: h.dc_no || "",
        dc_date: h.dc_date || "",
        order_no: h.order_no || "",
        order_date: h.order_date || "",
        payment_terms: h.payment_terms || "",
        dispatch_through: h.dispatch_through || "",
        discount: h.discount || 0,
        cgst: h.cgst ? ((h.cgst / 0.09) * 9) : 9,
        sgst: h.sgst ? ((h.sgst / 0.09) * 9) : 9,
        igst: h.igst || 0,
        transport: h.transport || 0,
        round_off: h.round_off || 0,
        grand_total: h.grand_total || 0,
      });
      setInvoiceNo(h.invoice_no || "");
      setLoadInvNo(h.invoice_no || "");
      setTableData(
        (data.items || []).map(it => ({
          item_name: it.item_name,
          quantity: it.quantity,
          price: it.price,
          discount: it.discount || 0,
          amount: it.amount,
          uom: it.uom || "",
          hsn_number: it.hsn_number || "",
        }))
      );
      toast.success("Invoice loaded");
    } catch (e) { toast.error("Invoice not found"); }
  };

  // Row amount calculation
  const calcRowAmount = (r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.price) || 0;
    const disc = Number(r.discount) || 0;
    return qty * price - disc;
  };

  const updateRow = (field, value) => {
    const updated = { ...row, [field]: value };
    updated.amount = calcRowAmount(updated);
    setRow(updated);
  };

  const addItem = () => {
    if (!row.item_name || !row.quantity || !row.price) {
      toast.error("Item name, quantity and price are required");
      return;
    }
    const newRow = { ...row, amount: calcRowAmount(row) };
    const newTable = [...tableData, newRow];
    setTableData(newTable);
    recalcTotals(newTable);
    setRow({ item_name: "", quantity: "", price: "", discount: 0, amount: 0, uom: "", hsn_number: "" });
  };

  const removeItem = (i) => {
    const newTable = tableData.filter((_, idx) => idx !== i);
    setTableData(newTable);
    recalcTotals(newTable);
  };

  const editItem = (i) => {
    setRow({ ...tableData[i] });
    const newTable = tableData.filter((_, idx) => idx !== i);
    setTableData(newTable);
    recalcTotals(newTable);
  };

  const recalcTotals = (rows) => {
    const subtotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const cgstPct = Number(form.cgst) || 9;
    const sgstPct = Number(form.sgst) || 9;
    const igstPct = Number(form.igst) || 0;
    const cgst = subtotal * (cgstPct / 100);
    const sgst = subtotal * (sgstPct / 100);
    const igst = subtotal * (igstPct / 100);
    const transport = Number(form.transport) || 0;
    const raw = subtotal + cgst + sgst + igst + transport;
    const rounded = Math.round(raw);
    const round_off = rounded - raw;
    setTotals({ subtotal, cgst, sgst, igst, transport, round_off, grand_total: rounded });
    setForm(prev => ({ ...prev, round_off, grand_total: rounded }));
  };

  useEffect(() => { recalcTotals(tableData); }, [form.cgst, form.sgst, form.igst, form.transport]);

  // Reset
  const resetForm = async () => {
    setForm({ customer_name: "", invoice_date: new Date().toISOString().split("T")[0], dc_no: "", dc_date: "", order_no: "", order_date: "", payment_terms: "", dispatch_through: "", discount: 0, cgst: 9, sgst: 9, igst: 0, transport: 0, round_off: 0, grand_total: 0 });
    setTableData([]);
    setRow({ item_name: "", quantity: "", price: "", discount: 0, amount: 0, uom: "", hsn_number: "" });
    setLoadInvNo("");
    await loadNextNo();
  };

  // Save
  const save = async () => {
    if (!form.customer_name || !form.invoice_date || tableData.length === 0) {
      toast.error("Customer, invoice date and at least one item are required");
      return;
    }
    const payload = { ...form, ...totals, invoice_no: invoiceNo, items: tableData };
    const toastId = toast.loading("Saving invoice...");
    try {
      const isEdit = Boolean(loadInvNo);
      const url = isEdit ? `${API}/update/${encodeURIComponent(loadInvNo)}` : `${API}/create`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(isEdit ? "Invoice updated!" : "Invoice saved!", { id: toastId });
      await resetForm();
    } catch (e) { toast.error(e.message || "Save failed", { id: toastId }); }
  };

  // Delete
  const deleteInvoice = async () => {
    if (!loadInvNo) { toast.error("Load an invoice first"); return; }
    if (!window.confirm(`Delete invoice ${loadInvNo}?`)) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(`${API}/delete/${encodeURIComponent(loadInvNo)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Invoice deleted!", { id: toastId });
      await resetForm();
    } catch (e) { toast.error(e.message || "Delete failed", { id: toastId }); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit mb-4">
        ← Go Back
      </button>

      <div className="max-w-[1400px] mx-auto bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black tracking-tight">Service Invoice</h2>
          <div className="flex gap-1.5">
            <button onClick={resetForm} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">NEW</button>
            <button onClick={save} className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition">SAVE</button>
            <button onClick={deleteInvoice} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">DELETE</button>
            <button onClick={() => navigate(-1)} className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">CLOSE</button>
          </div>
        </div>

        {/* Row 1 */}
        <div className="flex flex-wrap gap-6 border-b pb-6 mb-6 items-end">
          {/* Invoice No */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase">Invoice No</label>
            <input type="text" value={invoiceNo} readOnly className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] bg-gray-50 font-semibold outline-none" />
          </div>

          {/* Invoice Date */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[12px] font-bold text-gray-600 uppercase">Invoice Date</label>
            <input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>

          {/* Customer */}
          <div className="relative flex-1 min-w-[220px]" ref={clientRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Customer</label>
            <input type="text" value={form.customer_name}
              onFocus={() => { setShowClientDrop(true); searchClients(""); }}
              onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); debouncedClient(e.target.value); setShowClientDrop(true); }}
              placeholder="Customer name" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none" />
            {showClientDrop && clients.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {clients.map((c, i) => (
                  <div key={i} onClick={() => { setForm({ ...form, customer_name: c.customer_name }); setShowClientDrop(false); searchDcs("", c.customer_name); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{c.customer_name}</div>
                ))}
              </div>
            )}
          </div>

          {/* Service DC */}
          <div className="relative flex-1 min-w-[220px]" ref={dcRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Service DC No</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={form.dc_no}
                onFocus={() => { setShowDcDrop(true); searchDcs("", form.customer_name); }}
                onChange={(e) => { setForm({ ...form, dc_no: e.target.value }); searchDcs(e.target.value, form.customer_name); setShowDcDrop(true); }}
                placeholder="Service DC No" className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none" />
              <button onClick={() => loadServiceDc(form.dc_no)} className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">Load</button>
            </div>
            {showDcDrop && serviceDcs.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {serviceDcs.map((d, i) => (
                  <div key={i} onClick={() => { const n = d.inward_dc_no || d; setForm({ ...form, dc_no: n }); setShowDcDrop(false); loadServiceDc(n); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{d.inward_dc_no || d}</div>
                ))}
              </div>
            )}
          </div>

          {/* Load existing Invoice */}
          <div className="relative flex-1 min-w-[220px]" ref={invRef}>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Load Invoice</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={loadInvNo}
                onFocus={() => { setShowInvDrop(true); searchInvoices(""); }}
                onChange={(e) => { setLoadInvNo(e.target.value); searchInvoices(e.target.value); setShowInvDrop(true); }}
                placeholder="AT/INV-..." className="flex-1 p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold outline-none" />
              <button onClick={() => loadInvoice()} className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">Load</button>
            </div>
            {showInvDrop && invList.length > 0 && (
              <div className="absolute z-50 top-full left-0 w-full bg-white shadow-lg border rounded-lg max-h-40 overflow-y-auto mt-1">
                {invList.map((inv, i) => (
                  <div key={i} onClick={() => { const n = inv.invoice_no || inv; setLoadInvNo(n); loadInvoice(n); setShowInvDrop(false); }} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">{inv.invoice_no || inv}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Order No</label>
            <input type="text" value={form.order_no} onChange={(e) => setForm({ ...form, order_no: e.target.value })} placeholder="Order No" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Order Date</label>
            <input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Payment Terms</label>
            <input type="text" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="e.g. 30 days" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-600 uppercase">Dispatch Through</label>
            <input type="text" value={form.dispatch_through} onChange={(e) => setForm({ ...form, dispatch_through: e.target.value })} placeholder="Courier" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
        </div>

        {/* Item Entry */}
        <div className="grid grid-cols-7 gap-3 mb-4 items-end">
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase">Item Name</label>
            <input type="text" value={row.item_name} onChange={(e) => updateRow("item_name", e.target.value)} placeholder="Item" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Qty</label>
            <input type="number" value={row.quantity} onChange={(e) => updateRow("quantity", e.target.value)} placeholder="Qty" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Price</label>
            <input type="number" value={row.price} onChange={(e) => updateRow("price", e.target.value)} placeholder="Price" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Discount</label>
            <input type="number" value={row.discount} onChange={(e) => updateRow("discount", e.target.value)} placeholder="Disc" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">HSN / UOM</label>
            <input type="text" value={row.hsn_number} onChange={(e) => updateRow("hsn_number", e.target.value)} placeholder="HSN" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition">Add</button>
            <button onClick={() => setRow({ item_name: "", quantity: "", price: "", discount: 0, amount: 0, uom: "", hsn_number: "" })} className="flex-1 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition">Clr</button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-left w-8">Sl</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase text-left">Item Name</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">HSN</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Price</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Disc</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-[11px] font-black text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-6 text-gray-400 italic">No items added yet</td></tr>
              ) : (
                tableData.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                    <td className="px-3 py-2 text-[13px]">{i + 1}</td>
                    <td className="px-3 py-2 text-[13px] text-left font-medium">{it.item_name}</td>
                    <td className="px-3 py-2 text-[13px]">{it.hsn_number}</td>
                    <td className="px-3 py-2 text-[13px]">{it.quantity}</td>
                    <td className="px-3 py-2 text-[13px]">₹{Number(it.price || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-[13px]">₹{Number(it.discount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-[13px] font-semibold">₹{Number(it.amount || 0).toFixed(2)}</td>
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

        {/* GST + Totals */}
        <div className="flex flex-wrap gap-12 items-start justify-between">
          <div className="grid grid-cols-2 gap-4 min-w-[280px]">
            <div>
              <label className="text-[12px] font-bold text-gray-600 uppercase">CGST %</label>
              <input type="number" value={form.cgst} onChange={(e) => setForm({ ...form, cgst: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-600 uppercase">SGST %</label>
              <input type="number" value={form.sgst} onChange={(e) => setForm({ ...form, sgst: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-600 uppercase">IGST %</label>
              <input type="number" value={form.igst} onChange={(e) => setForm({ ...form, igst: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-600 uppercase">Transport (₹)</label>
              <input type="number" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg text-[13px] outline-none" />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 min-w-[260px] text-right">
            <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Subtotal:</span><span className="font-bold text-black">₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-600 mb-1"><span>CGST ({form.cgst}%):</span><span>₹{totals.cgst.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-600 mb-1"><span>SGST ({form.sgst}%):</span><span>₹{totals.sgst.toFixed(2)}</span></div>
            {Number(form.igst) > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>IGST ({form.igst}%):</span><span>₹{totals.igst.toFixed(2)}</span></div>}
            {Number(form.transport) > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Transport:</span><span>₹{Number(form.transport).toFixed(2)}</span></div>}
            <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Round Off:</span><span>{totals.round_off.toFixed(2)}</span></div>
            <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-black text-gray-900"><span>Grand Total:</span><span>₹{totals.grand_total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceInvoiceForm;
