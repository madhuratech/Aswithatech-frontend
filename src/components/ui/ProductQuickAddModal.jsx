import React, { useState, useRef, useEffect } from "react";
import { X, PackagePlus } from "lucide-react";
import { successToast, errorToast, loadingToast } from "./nottifications";
import toast from "react-hot-toast";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const DEFAULT_HSN = { spare: "853210", service: "998314" };

const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1";
const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm";

const ProductQuickAddModal = ({ onClose, onSuccess, defaultType = "spare" }) => {
  const [productType, setProductType] = useState(defaultType);
  const [productName, setProductName] = useState("");
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
  const [hsn, setHsn] = useState(DEFAULT_HSN[defaultType]);
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (type) => {
    setProductType(type);
    setHsn(DEFAULT_HSN[type]);
    setProductName("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      errorToast(`${productType === "spare" ? "Spare" : "Service"} name is required`);
      return;
    }

    setSaving(true);
    const toastId = loadingToast("Saving...");
    try {
      let url, body;
      if (productType === "spare") {
        url = "http://localhost:3000/api/Sparemodels/new";
        body = { spare_name: productName.trim(), hsn_number: hsn || null };
      } else {
        url = "http://localhost:3000/api/Services/new";
        body = { service_name: productName.trim(), hsn_number: hsn || null };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");

      toast.dismiss(toastId);
      successToast(`${productType === "spare" ? "Spare" : "Service"} saved successfully`);
      onSuccess({ item_name: productName.trim(), hsn_number: hsn, type: productType });
    } catch (err) {
      toast.dismiss(toastId);
      errorToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isSpare = productType === "spare";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="bg-white w-full max-w-[440px] rounded-xl shadow-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <PackagePlus size={18} className="text-gray-700" />
            <h2 className="text-base font-black text-gray-900">Quick Add Product</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Product Type */}
          <div>
            <label className={labelCls}>Product Type</label>
            <div className="flex gap-3 mt-1">
              {[["spare", "Spare"], ["service", "Service"]].map(([val, label]) => (
                <label
                  key={val}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer text-[13px] font-bold transition-colors ${
                    productType === val
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="productType"
                    value={val}
                    checked={productType === val}
                    onChange={() => handleTypeChange(val)}
                    className="hidden"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              {isSpare
                ? "e.g. PCB Board, Mother Board, IC Switch"
                : "e.g. Repair Charges, Testing Charges, Service Charges"}
            </p>
          </div>

          {/* Product Name */}
          <div>
            <label className={labelCls}>
              {isSpare ? "Spare Name" : "Service Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={isSpare ? "e.g. PCB Board" : "e.g. Repair Charges"}
              className={inputCls}
              autoFocus
            />
          </div>

          {/* HSN Code */}
          <div>
            <label className={labelCls}>HSN Code</label>
            <input
              type="text"
              value={hsn}
              onChange={(e) => setHsn(e.target.value)}
              placeholder={isSpare ? "853210" : "998314"}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Default: {isSpare ? "853210 (Electronic Components)" : "998314 (Repair & Maintenance Services)"}
            </p>
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
              {saving ? "Saving…" : `Save ${isSpare ? "Spare" : "Service"}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductQuickAddModal;
