import React, { useState, useRef, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import { successToast, errorToast, loadingToast } from "./nottifications";
import toast from "react-hot-toast";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const GST_STATE_CODE = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "25": "Daman and Diu", "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra", "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh (New)",
};

const EMPTY_FORM = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  gst_number: "",
  state: "",
  pincode: "",
  contact_person: "",
};

const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1";
const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";

const CustomerQuickAddModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  useOutsideClick([{ ref: modalRef, onClose }]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleGstChange = (e) => {
    const gst = e.target.value.toUpperCase();
    const code = gst.substring(0, 2);
    const state = gst.length >= 2 ? (GST_STATE_CODE[code] || "") : "";
    setForm(p => ({ ...p, gst_number: gst, state }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { errorToast("Customer Name is required"); return; }
    if (!form.phone.trim()) { errorToast("Phone is required"); return; }
    if (!form.address.trim()) { errorToast("Address is required"); return; }

    setSaving(true);
    const toastId = loadingToast("Saving customer...");
    try {
      const payload = Object.fromEntries(
        Object.entries({ ...form, customer_type: "new" }).map(([k, v]) => [k, v === "" ? null : v])
      );
      const res = await fetch("http://localhost:3000/api/customers/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save customer");
      toast.dismiss(toastId);
      successToast("Customer saved successfully");
      onSuccess({ ...form, customer_type: "new", id: data.id });
    } catch (err) {
      toast.dismiss(toastId);
      errorToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="bg-white w-full max-w-[560px] rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-gray-700" />
            <h2 className="text-base font-black text-gray-900">Quick Add Customer</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Customer Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                placeholder="Enter customer name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className={inputCls}
              />
            </div>
          </div>

          {/* Email + Contact Person */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="customer@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Contact Person</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => set("contact_person", e.target.value)}
                placeholder="Contact person name"
                className={inputCls}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelCls}>Address <span className="text-red-500">*</span></label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Format: Door No, Street Name, Area, Locality/Landmark, City (e.g., 156, Allimalar 4th Street, Vasan Nagar, Pothumbur, Madurai)"
              rows={2}
              className={`${inputCls} resize-none`}
            />
            <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-normal">
              * Note: Use commas to separate parts for correct layout spacing on printed vouchers.
            </p>
          </div>

          {/* GST */}
          <div>
            <label className={labelCls}>GST Number</label>
            <input
              type="text"
              value={form.gst_number}
              onChange={handleGstChange}
              placeholder="22AAAAA0000A1Z5"
              className={inputCls}
            />
          </div>

          {/* State + Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>State</label>
              <input
                type="text"
                value={form.state}
                readOnly
                placeholder="Auto-detected from GSTIN"
                className={`${inputCls} bg-blue-50 text-blue-800 border-blue-100 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={labelCls}>Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => set("pincode", e.target.value)}
                placeholder="6 digit pincode"
                className={inputCls}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Customer"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CustomerQuickAddModal;
