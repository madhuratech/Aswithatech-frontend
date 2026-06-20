import API_BASE_URL from "../../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
const API_URL = `${API_BASE_URL}/pendings`;

const ITEM_TYPE_ENDPOINTS = {
  Spare:    { url: `${API_BASE_URL}/Sparemodels/all`,   field: "spare_name"   },
  Service:  { url: `${API_BASE_URL}/Services/all`,      field: "service_name" },
  Purchase: { url: `${API_BASE_URL}/purchaseitems/all`, field: "item_name"    },
  Product:  null,
};

const EMPTY_FIELDS = {
  customer_name: "", dc_no: "", dc_date: "",
  item_type: "", item_name: "",
  order_qty: "", despatch_qty: "", pending_qty: "",
};

const PendingForm = () => {
  const navigate = useNavigate();
  const { showPasswordModal, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  const [clientList,      setClientList]      = useState([]);
  const [clientOpen,      setClientOpen]      = useState(false);
  const clientRef = useRef(null);

  const [itemOptions,  setItemOptions]  = useState([]);
  const [itemDropOpen, setItemDropOpen] = useState(false);
  const itemRef = useRef(null);

  const [allData,     setAllData]     = useState([]);
  const [stagedRows,  setStagedRows]  = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [fields,      setFields]      = useState(EMPTY_FIELDS);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/calculated`);
      const data = await res.json();
      setAllData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Pending list fetch failed:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/customers/all`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d.length > 0) setClientList(d); })
      .catch(console.error);

    loadPending();
  }, []);

  useOutsideClick([
    { ref: clientRef, onClose: () => setClientOpen(false) },
    { ref: itemRef,   onClose: () => setItemDropOpen(false) },
  ]);

  useEffect(() => {
    const config = ITEM_TYPE_ENDPOINTS[fields.item_type];
    if (!config) { setItemOptions([]); return; }
    fetch(config.url)
      .then((r) => r.json())
      .then((data) =>
        setItemOptions(
          Array.isArray(data)
            ? data.map((d) => d[config.field]).filter(Boolean).sort()
            : []
        )
      )
      .catch(console.error);
  }, [fields.item_type]);

  const dbRows = fields.customer_name
    ? allData.filter((r) =>
        r.customer_name?.toLowerCase().includes(fields.customer_name.toLowerCase())
      )
    : allData;

  const allDisplayRows = [
    ...stagedRows.map((it) => ({
      ...it,
      customer_name: fields.customer_name,
      dc_no:         fields.dc_no,
      dc_date:       fields.dc_date,
      _staged:       true,
    })),
    ...dbRows,
  ];

  const handleFieldChange = (key, value) => {
    setFields((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "item_type") updated.item_name = "";
      if (key === "customer_name") setSelectedRow(null);
      if (key === "order_qty" || key === "despatch_qty") {
        const o = Number(key === "order_qty"    ? value : prev.order_qty)    || 0;
        const d = Number(key === "despatch_qty" ? value : prev.despatch_qty) || 0;
        updated.pending_qty = o - d;
      }
      return updated;
    });
  };

  const handleAdd = () => {
    if (!fields.customer_name || !fields.dc_no || !fields.dc_date || !fields.item_name) {
      toast.error("Fill in Customer Name, DC No, DC Date and Item Name first.");
      return;
    }
    setStagedRows((prev) => [...prev, {
      item_name:    fields.item_name,
      order_qty:    fields.order_qty,
      despatch_qty: fields.despatch_qty,
      pending_qty:  fields.pending_qty,
    }]);
    setFields((prev) => ({ ...prev, item_name: "", order_qty: "", despatch_qty: "", pending_qty: "" }));
    setItemDropOpen(false);
  };

  const handleClear = () => {
    setFields(EMPTY_FIELDS);
    setStagedRows([]);
    setSelectedRow(null);
  };

  const handleNew = () => {
    setSelectedRow(null);
    setFields(EMPTY_FIELDS);
    setStagedRows([]);
    setItemOptions([]);
    loadPending();
  };

  const handleSave = async () => {

  if (stagedRows.length === 0) {
    toast.error("Add at least one item before saving.");
    return;
  }

  if (!fields.customer_name || !fields.dc_no || !fields.dc_date) {
    toast.error("Customer Name, DC No and DC Date are required.");
    return;
  }

  setSaving(true);

  try {

    const res = await fetch(`${API_URL}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customer_name: fields.customer_name,
        dc_no: fields.dc_no,
        dc_date: fields.dc_date,
        items: stagedRows,
      }),
    });

    // CHECK BACKEND RESPONSE
    if (!res.ok) {

      const errorText = await res.text();

      console.log("SAVE API ERROR:", errorText);

      toast.error("Backend API Error");

      throw new Error(errorText);
    }

    const data = await res.json();

    console.log("SAVE RESPONSE:", data);

    if (data.success) {

      setStagedRows([]);
      setFields(EMPTY_FIELDS);
      setSelectedRow(null);

      await loadPending();

      toast.success(`${data.saved} item(s) saved successfully!`);

    } else {

      toast.error(data.message || "Save failed");

    }

  } catch (err) {

    console.error("Save failed:", err);

    toast.error(err.message || "Save failed. Please check your connection.");

  } finally {

    setSaving(false);

  }

};

  const handleSaveWithPassword = () => {
    handleSave();
  };

  const handleRowClick = (row, index) => {
    setSelectedRow(index);
    setFields({
      customer_name: row.customer_name || "",
      dc_no:         row.dc_no         || "",
      dc_date:       row.dc_date       ? row.dc_date.split("T")[0] : "",
      item_type:     row.item_type     || "",
      item_name:     row.item_name     || "",
      order_qty:     row.order_qty     ?? "",
      despatch_qty:  row.despatch_qty  ?? "",
      pending_qty:   row.pending_qty   ?? "",
    });
  };

  const fmtDate = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
  };

  const totalOrders    = allDisplayRows.reduce((s, r) => s + Number(r.order_qty    || 0), 0);
  const totalDespatch  = allDisplayRows.reduce((s, r) => s + Number(r.despatch_qty || 0), 0);
  const totalPending   = allDisplayRows.reduce((s, r) => s + Number(r.pending_qty  || 0), 0);
  const totalCustomers = new Set(allDisplayRows.map((r) => r.customer_name)).size;

  const filteredClients = clientList.filter(
    (c) => !fields.customer_name || c.customer_name?.toLowerCase().includes(fields.customer_name.toLowerCase())
  );
  const filteredItemOptions = itemOptions.filter(
    (name) => !fields.item_name || name.toLowerCase().includes(fields.item_name.toLowerCase())
  );

  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";
  const labelCls = "text-[11px] font-black text-gray-500 uppercase tracking-tight";
  const dropCls  = "absolute top-full left-0 w-full bg-white shadow-xl z-50 border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto";
  const dropItemCls = "px-3 py-2 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-[13px] font-medium border-b border-gray-50 last:border-b-0";

  const TABLE_COLS = ["#", "CUSTOMER NAME", "DC NO", "DC DATE", "ITEM NAME", "ORDER QTY", "DESPATCH QTY", "PENDING QTY"];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
      >
        ← Go Back
      </button>

      <div className="max-w-[1500px] mx-auto bg-white p-8 mt-6 shadow-sm border border-gray-200 rounded-xl">

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-black tracking-tight">Pending Details</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Track pending order quantities by customer</p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {[
              { label: "NEW",   fn: handleNew,                          cls: "hover:bg-gray-700"   },
              { label: "CLEAR", fn: handleClear,                        cls: "hover:bg-yellow-500" },
              { label: saving ? "SAVING…" : "SAVE",
                fn: handleSaveWithPassword,
                cls: stagedRows.length > 0 ? "hover:bg-green-600 border-green-400 text-green-700 font-bold" : "hover:bg-green-600" },
              { label: "EDIT",   fn: () => {},           cls: "hover:bg-blue-600"  },
              { label: "DELETE", fn: () => {},           cls: "hover:bg-red-600"   },
              { label: "CLOSE",  fn: () => navigate(-1), cls: "hover:bg-red-600"   },
            ].map(({ label, fn, cls }) => (
              <button
                key={label}
                onClick={fn}
                disabled={saving && label.startsWith("SAV")}
                className={`border px-3 py-1.5 rounded-lg text-sm ${cls} hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Form Fields ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6 mb-2 border-b border-gray-100">

          {/* Customer Name */}
          <div className="flex flex-col gap-1.5 relative" ref={clientRef}>
            <label className={labelCls}>Customer Name</label>
            <input
              type="text"
              value={fields.customer_name}
              onFocus={() => setClientOpen(true)}
              onChange={(e) => { handleFieldChange("customer_name", e.target.value); setClientOpen(true); }}
              placeholder="Search customer..."
              autoComplete="off"
              className={inputCls}
            />
            {clientOpen && filteredClients.length > 0 && (
              <div className={dropCls}>
                {filteredClients.map((c, i) => (
                  <div
                    key={c.id ?? `${c.customer_name}-${i}`}
                    onMouseDown={(e) => { e.preventDefault(); handleFieldChange("customer_name", c.customer_name); setClientOpen(false); }}
                    className={dropItemCls}
                  >
                    {c.customer_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DC No */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>DC No</label>
            <input
              type="text"
              value={fields.dc_no}
              onChange={(e) => handleFieldChange("dc_no", e.target.value)}
              placeholder="DC Number"
              readOnly={true}
              disabled={true}
              className={inputCls}
            />
          </div>

          {/* DC Date */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>DC Date</label>
            <input
              type="date"
              value={fields.dc_date}
              disabled={true}
              onChange={(e) => handleFieldChange("dc_date", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Item Type */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Item Type</label>
            <select
              value={fields.item_type}
              onChange={(e) => handleFieldChange("item_type", e.target.value)}
              readOnly={true}
              disabled={true}
              className={inputCls}
            >
              <option value="">-- Select Type --</option>
              {Object.keys(ITEM_TYPE_ENDPOINTS).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Item Name */}
          <div className="flex flex-col gap-1.5 relative" ref={itemRef}>
            <label className={labelCls}>Item Name</label>
            {fields.item_type === "Product" || !fields.item_type ? (
              <input
                type="text"
                value={fields.item_name}
                onChange={(e) => handleFieldChange("item_name", e.target.value)}
                placeholder={fields.item_type ? "Enter product name" : "Select type first"}
                disabled={!fields.item_type}
                className={`${inputCls} ${!fields.item_type ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
              />
            ) : (
              <>
                <input
                  type="text"
                  value={fields.item_name}
                  onFocus={() => setItemDropOpen(true)}
                  onChange={(e) => { handleFieldChange("item_name", e.target.value); setItemDropOpen(true); }}
                  placeholder={`Search ${fields.item_type}...`}
                  autoComplete="off"
                  disabled={true}
                  className={inputCls}
                />
                {itemDropOpen && filteredItemOptions.length > 0 && (
                  <div className={dropCls}>
                    {filteredItemOptions.map((name) => (
                      <div
                        key={name}
                        onMouseDown={(e) => { e.preventDefault(); handleFieldChange("item_name", name); setItemDropOpen(false); }}
                        className={dropItemCls}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order Qty */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Order Qty</label>
            <input
              type="number"
              value={fields.order_qty}
              onChange={(e) => handleFieldChange("order_qty", e.target.value)}
              placeholder="0"
              min="0"
              disabled={true}
              className={inputCls}
            />
          </div>

          {/* Despatch Qty */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Despatch Qty</label>
            <input
              type="number"
              value={fields.despatch_qty}
              onChange={(e) => handleFieldChange("despatch_qty", e.target.value)}
              placeholder="0"
              min="0"
              disabled={true}
              className={inputCls}
            />
          </div>

          {/* Pending Qty — auto-calculated */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Pending Qty <span className="normal-case font-normal text-gray-400">(auto)</span></label>
            <input
              type="number"
              value={fields.pending_qty}
              readOnly
              disabled={true}
              placeholder="0"
              className={`${inputCls} bg-red-50 text-red-600 font-bold cursor-not-allowed`}
            />
          </div>
        </div>

        {/* ── ADD Row ── */}
        <div className="flex items-center gap-3 py-4 border-b border-gray-100 mb-6">
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
          >
            + ADD ITEM
          </button>
          {stagedRows.length > 0 && (
            <span className="text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              {stagedRows.length} item(s) pending save
            </span>
          )}
        </div>

        {/* ── Table + Summary ── */}
        <div className="flex gap-4 items-start">

          {/* Table */}
          <div className="flex-1 min-w-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-auto" style={{ maxHeight: "460px" }}>
              <table className="w-full border-collapse" style={{ minWidth: "780px" }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-800 text-white">
                    {TABLE_COLS.map((col) => (
                      <th
                        key={col}
                        className="p-3 text-[11px] font-black uppercase tracking-wide border-r border-gray-700 last:border-r-0 text-center whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-400 text-sm">
                        Loading pending records…
                      </td>
                    </tr>
                  ) : allDisplayRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-gray-400 text-sm">
                        No pending records found
                      </td>
                    </tr>
                  ) : (
                    allDisplayRows.map((row, index) => {
                      const isStaged   = !!row._staged;
                      const dbIndex    = index - stagedRows.length;
                      const isSelected = !isStaged && selectedRow === dbIndex;

                      const rowCls = isStaged
                        ? "bg-amber-50 border-l-4 border-l-amber-400"
                        : isSelected
                        ? "bg-blue-600"
                        : "hover:bg-gray-50 cursor-pointer";

                      const textCls = isSelected ? "text-white" : "text-gray-700";
                      const boldCls = isSelected ? "text-white font-bold" : "text-black font-bold";
                      const blueCls = isSelected ? "text-blue-200 font-semibold" : "text-blue-700 font-semibold";
                      const grnCls  = isSelected ? "text-green-200 font-semibold" : "text-green-700 font-semibold";
                      const redCls  = isSelected ? "text-red-200 font-black" : "text-red-600 font-black";

                      return (
                        <tr
                          key={index}
                          onClick={() => !isStaged && handleRowClick(row, dbIndex)}
                          className={`border-b border-gray-100 transition-colors ${rowCls}`}
                        >
                          <td className={`p-3 text-[12px] border-r border-gray-100 text-center ${textCls}`}>
                            {index + 1}
                          </td>
                          <td className={`p-3 text-[12px] border-r border-gray-100 whitespace-nowrap ${boldCls}`}>
                            {row.customer_name}
                            {isStaged && (
                              <span className="ml-2 text-[10px] font-semibold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                                unsaved
                              </span>
                            )}
                          </td>
                          <td className={`p-3 text-[12px] border-r border-gray-100 text-center ${textCls}`}>{row.dc_no}</td>
                          <td className={`p-3 text-[12px] border-r border-gray-100 text-center whitespace-nowrap ${textCls}`}>
                            {fmtDate(row.dc_date)}
                          </td>
                          <td className={`p-3 text-[12px] border-r border-gray-100 ${textCls}`}>{row.item_name}</td>
                          <td className={`p-3 text-[12px] border-r border-gray-100 text-center ${blueCls}`}>{Number(row.order_qty) || 0}</td>
                          <td className={`p-3 text-[12px] border-r border-gray-100 text-center ${grnCls}`}>{Number(row.despatch_qty) || 0}</td>
                          <td className={`p-3 text-[12px] text-center ${redCls}`}>{Number(row.pending_qty) || 0}</td>
                        </tr>
                      );
                    })
                  )}
                  {/* Filler rows to fill empty space */}
                  {!loading && allDisplayRows.length > 0 && allDisplayRows.length < 8 &&
                    Array(Math.max(0, 8 - allDisplayRows.length)).fill(0).map((_, i) => (
                      <tr key={`filler-${i}`} className="border-b border-gray-50">
                        <td colSpan={8} className="h-10" />
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* Table footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500">
              <span>{allDisplayRows.length} record(s)</span>
              {stagedRows.length > 0 && (
                <span className="text-amber-600 font-semibold">{stagedRows.length} unsaved</span>
              )}
            </div>
          </div>

          {/* Summary Panel */}
          <div className="w-[220px] flex-shrink-0 flex flex-col gap-3">
            {[
              { label: "Total Orders",    value: totalOrders,    bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-700"  },
              { label: "Total Despatch",  value: totalDespatch,  bg: "bg-green-50",  border: "border-green-200", text: "text-green-700" },
              { label: "Total Pending",   value: totalPending,   bg: "bg-red-50",    border: "border-red-200",   text: "text-red-600"   },
              { label: "Total Customers", value: totalCustomers, bg: "bg-gray-50",   border: "border-gray-200",  text: "text-gray-800"  },
            ].map(({ label, value, bg, border, text }) => (
              <div key={label} className={`flex flex-col gap-1 p-3 rounded-xl border ${bg} ${border}`}>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{label}</span>
                <span className={`text-[22px] font-black ${text}`}>{value}</span>
              </div>
            ))}

            <div className="mt-2 p-4 bg-red-600 rounded-xl text-white text-center shadow-md">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Pending Qty</div>
              <div className="text-[34px] font-black leading-none">{totalPending}</div>
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

export default PendingForm;
