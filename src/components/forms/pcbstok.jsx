import React, { useState, useEffect, useRef } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useDropdownKeyNav } from "../../hooks/useDropdownKeyNav";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// Debounce helper
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const PCBStock = () => {
  const navigate = useNavigate();


  const Api_url = "http://localhost:3000/api/pcb-stock";

  // Form states
  const [pcbCode, setPcbCode] = useState("");
  const [pcbName, setPcbName] = useState("");
  const [pcbModel, setPcbModel] = useState("");
  const [pcbCategory, setPcbCategory] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [quantityReceived, setQuantityReceived] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [minimumStockLevel, setMinimumStockLevel] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [rackLocation, setRackLocation] = useState("");
  const [remarks, setRemarks] = useState("");

  // Search & Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [loadCodeVal, setLoadCodeVal] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchList, setSearchList] = useState([]);
  const [suppliersearch, setsuppliersearch] = useState("");
  const [clients, setclients] = useState([]);


  // Dropdown visibility
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [clientDropdown, setclientDropdown] = useState(false);
  const categoryRef = useRef(null);
  const searchRef = useRef(null);
  const clientRef = useRef(null);
  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPurchaseDate(today);
  }, []);

  // Fetch next generated PCB Code
  const fetchNextCode = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/pcb-stock/next-code");
      const data = await res.json();
      if (data.nextCode) {
        setPcbCode(data.nextCode);
      }
    } catch (err) {
      console.error("Error loading next PCB code:", err);
    }
  };

  useEffect(() => {
    fetchNextCode();
  }, []);

  // Auto-calculated variables
  const qty = parseFloat(availableQuantity) || 0;
  const cost = parseFloat(unitCost) || 0;
  const stockValue = (qty * cost).toFixed(2);

  const minStock = parseFloat(minimumStockLevel) || 0;
  let derivedStatus = "In Stock";
  if (qty === 0) {
    derivedStatus = "Out Of Stock";
  } else if (qty <= minStock) {
    derivedStatus = "Low Stock";
  }

  // Client load

  useEffect(() =>{
    const fetchClients = async () => {
     try{
      const url = suppliersearch
      ? `${Api_url}/clients/search?q=${encodeURIComponent(suppliersearch)}`
      : `${Api_url}/clients`;

      const res = await fetch(url);
      const data = await res.json();
      setclients(data);
     }catch(err){
      console.error("Error fetching clients:", err)
     }
    }
    fetchClients();
  },[suppliersearch]);

  // Reset / Clear Form
  const handleResetForm = () => {
    setPcbName("");
    setPcbModel("");
    setPcbCategory("");
    setSupplierName("");
    setPurchaseInvoiceNo("");
    const today = new Date().toISOString().split("T")[0];
    setPurchaseDate(today);
    setQuantityReceived("");
    setAvailableQuantity("");
    setMinimumStockLevel("");
    setUnitCost("");
    setRackLocation("");
    setRemarks("");
    setIsEditing(false);
    setLoadCodeVal("");
    fetchNextCode();
  };

  // Save or Update Entry
  const handleSaveEntry = async () => {
    if (!pcbName.trim()) return alert("PCB Name is required");
    if (!pcbModel.trim()) return alert("PCB Model is required");
    if (!pcbCategory) return alert("PCB Category is required");
    if (!supplierName.trim()) return alert("Supplier Name is required");
    if (!purchaseInvoiceNo.trim()) return alert("Purchase Invoice No is required");
    if (!purchaseDate) return alert("Purchase Date is required");
    if (quantityReceived === "" || isNaN(parseFloat(quantityReceived))) {
      return alert("Quantity Received is required");
    }
    if (availableQuantity === "" || isNaN(parseFloat(availableQuantity))) {
      return alert("Available Quantity is required");
    }
    if (minimumStockLevel === "" || isNaN(parseFloat(minimumStockLevel))) {
      return alert("Minimum Stock Level is required");
    }
    if (unitCost === "" || isNaN(parseFloat(unitCost))) {
      return alert("Unit Cost is required");
    }

    const payload = {
      pcb_name: pcbName,
      pcb_model: pcbModel,
      pcb_category: pcbCategory,
      supplier_name: supplierName,
      supplier_invoice_no: purchaseInvoiceNo,
      purchase_date: purchaseDate,
      quantity_received: parseFloat(quantityReceived),
      available_quantity: parseFloat(availableQuantity),
      minimum_stock_level: parseFloat(minimumStockLevel),
      unit_cost: parseFloat(unitCost),
      stock_value: parseFloat(stockValue),
      rack_number: rackLocation,
      status: derivedStatus,
      remarks: remarks,
    };

    const toastId = toast.loading(
      isEditing ? "Updating PCB Stock..." : "Saving PCB Stock..."
    );
    try {
      const url = isEditing
        ? `http://localhost:3000/api/pcb-stock/${pcbCode}`
        : "http://localhost:3000/api/pcb-stock/new";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save PCB Stock");
      }

      toast.success(
        isEditing
          ? "PCB Stock updated successfully!"
          : "PCB Stock saved successfully!",
        { id: toastId }
      );
      handleResetForm();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // Delete Entry
  const handleDeleteEntry = async () => {
    if (!isEditing || !pcbCode) {
      alert("Please load an existing entry to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete PCB Stock entry ${pcbCode}?`))
      return;

    const toastId = toast.loading("Deleting PCB Stock...");
    try {
      const res = await fetch(`http://localhost:3000/api/pcb-stock/${pcbCode}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Deleted successfully!", { id: toastId });
        handleResetForm();
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // Search Code database
  const handleSearchCode = async (val) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/pcb-stock/search?q=${encodeURIComponent(val)}`
      );
      const data = await res.json();
      setSearchList(data);
    } catch (err) {
      console.error("Error searching PCB Stock:", err);
    }
  };

  const debouncedSearch = useRef(debounce(handleSearchCode, 300)).current;

  // Load details for edit
  const handleLoadEntry = async (selectedCode) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/pcb-stock/${selectedCode}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");

      setPcbCode(data.pcb_code);
      setPcbName(data.pcb_name);
      setPcbModel(data.pcb_model);
      setPcbCategory(data.pcb_category);
      setSupplierName(data.supplier_name);
      setPurchaseInvoiceNo(data.supplier_invoice_no);
      setPurchaseDate(data.purchase_date?.split("T")[0] || "");
      setQuantityReceived(data.quantity_received);
      setAvailableQuantity(data.available_quantity);
      setMinimumStockLevel(data.minimum_stock_level);
      setUnitCost(data.unit_cost);
      setRackLocation(data.rack_location || "");
      setRemarks(data.remarks || "");

      setIsEditing(true);
      setLoadCodeVal(data.pcb_code);
      setShowSearchDropdown(false);
      alert("Loaded Successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  // Outside-click: close all dropdowns when clicking outside their containers
  useOutsideClick([
    { ref: categoryRef, onClose: () => setShowCategoryDropdown(false) },
    { ref: searchRef,   onClose: () => setShowSearchDropdown(false) },
    { ref: clientRef,   onClose: () => setclientDropdown(false) },
  ]);

  // Shared CSS class shortcuts matching sales invoice form
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 select-none";
  const inputCls = "w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors duration-150";
  const roInputCls = "w-full p-2.5 border border-blue-100 rounded-lg text-[13px] font-semibold text-blue-800 bg-blue-50 cursor-not-allowed focus:outline-none";
  const dropdownCls = "absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto";

  const CATEGORY_LIST = ["Main Board", "Power Board", "T-Con Board", "Control Board", "Driver Board", "Other"];

  const filteredClients = clients.filter((client) =>
    (client.customer_name || "").toLowerCase().includes((suppliersearch || "").toLowerCase())
  ).slice(0, 6);

  // Keyboard nav hooks
  const categoryNav = useDropdownKeyNav({
    items: CATEGORY_LIST,
    isOpen: showCategoryDropdown,
    onSelect: (opt) => { setPcbCategory(opt); setShowCategoryDropdown(false); },
    onClose: () => setShowCategoryDropdown(false),
    onOpen:  () => setShowCategoryDropdown(true),
  });
  const clientNav = useDropdownKeyNav({
    items: filteredClients,
    isOpen: clientDropdown,
    onSelect: (c) => { setSupplierName(c.customer_name); setclientDropdown(false); },
    onClose: () => setclientDropdown(false),
    onOpen:  () => setclientDropdown(true),
  });

  // Dynamic status text colors
  const statusColorCls =
    derivedStatus === "In Stock"
      ? "border-green-200 bg-green-50 text-green-700"
      : derivedStatus === "Low Stock"
      ? "border-orange-200 bg-orange-50 text-orange-700 font-bold"
      : "border-red-200 bg-red-50 text-red-700 font-black";

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 font-sans text-sm">
      {/* Back Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold w-fit mb-6 shadow-sm transition duration-150"
        onClick={() => navigate(-1)}
      >
        ← Go Back
      </button>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              PCB Stock Entry
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">
              Add details to create or update PCB Inventory records.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetForm}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-800 hover:text-white transition-colors"
            >
              NEW
            </button>
            <button
              onClick={handleSaveEntry}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-green-600 hover:text-white transition-colors"
            >
              {isEditing ? "UPDATE" : "SAVE"}
            </button>
            <button
              onClick={handleDeleteEntry}
              className="border border-gray-200 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-red-600 hover:text-white transition-colors"
            >
              DELETE
            </button>
          </div>
        </div>

        {/* HORIZONTAL FORM LAYOUT */}
        <div className="space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* PCB Code */}
            <div>
              <label className={labelCls}>PCB Code (Auto)</label>
              <input
                type="text"
                value={pcbCode}
                readOnly
                className={roInputCls}
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className={labelCls}>
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* PCB Name */}
            <div>
              <label className={labelCls}>
                PCB Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pcbName}
                onChange={(e) => setPcbName(e.target.value)}
                placeholder="e.g. Main Board Rev.B"
                className={inputCls}
              />
            </div>

            {/* PCB Model */}
            <div>
              <label className={labelCls}>
                PCB Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pcbModel}
                onChange={(e) => setPcbModel(e.target.value)}
                placeholder="e.g. MB-32-A1"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* PCB Category */}
            <div className="relative" ref={categoryRef}>
              <label className={labelCls}>
                PCB Category <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => setShowCategoryDropdown((p) => !p)}
                onKeyDown={categoryNav.handleKeyDown}
                tabIndex={0}
                className={`${inputCls} flex justify-between items-center cursor-pointer min-h-[42px]`}
              >
                <span className={pcbCategory ? "text-black" : "text-gray-400 font-medium text-[13px]"}>
                  {pcbCategory || "Select Category..."}
                </span>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showCategoryDropdown && (
                <div className={dropdownCls}>
                  {CATEGORY_LIST.map((opt, i) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setPcbCategory(opt);
                        setShowCategoryDropdown(false);
                      }}
                      className={`px-4 py-2.5 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0 ${i === categoryNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supplier Name */}
            <div className="relative z-10" ref={clientRef}>
              <label className={labelCls}>
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => {
                  setsuppliersearch(e.target.value);
                  setSupplierName(e.target.value);
                  setclientDropdown(true);
                }}
                onFocus={() => setclientDropdown(true)}
                onKeyDown={clientNav.handleKeyDown}
                placeholder="Supplier Company Name"
                className={inputCls}
              />

              {clientDropdown && filteredClients.length > 0 && (
  <div className={dropdownCls}>
    {filteredClients.map((client, i) => (
        <div
          key={i}
          onClick={() => {
            setSupplierName(client.customer_name);
            setclientDropdown(false);
          }}
          className={`px-4 py-2 cursor-pointer ${i === clientNav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
        >
          {client.customer_name}
        </div>
      ))}
  </div>
)}
            </div>

            {/* Purchase Invoice No */}
            <div>
              <label className={labelCls}>
                Purchase Invoice No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={purchaseInvoiceNo}
                onChange={(e) => setPurchaseInvoiceNo(e.target.value)}
                placeholder="e.g. INV-9988"
                className={inputCls}
              />
            </div>

            {/* Rack / Location */}
            <div>
              <label className={labelCls}>Rack / Location</label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="e.g. Rack A, Shelf 2"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Quantity Received */}
            <div>
              <label className={labelCls}>
                Quantity Received <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            {/* Available Quantity */}
            <div>
              <label className={labelCls}>
                Available Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            {/* Minimum Stock Level */}
            <div>
              <label className={labelCls}>
                Min Stock Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className={labelCls}>
                Unit Cost <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="₹0.00"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Stock Value (Calculated) */}
            <div>
              <label className={labelCls}>Stock Value (Auto)</label>
              <input
                type="text"
                value={`₹${stockValue}`}
                readOnly
                className={roInputCls}
              />
            </div>

            {/* Status (Auto-derived) */}
            <div>
              <label className={labelCls}>Status (Auto)</label>
              <input
                type="text"
                value={derivedStatus}
                readOnly
                className={`${roInputCls} ${statusColorCls} border text-center font-bold`}
              />
            </div>

            {/* Remarks (Spans 2 columns for symmetry) */}
            <div className="md:col-span-2">
              <label className={labelCls}>Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="PCB stock entry remarks..."
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: SEARCH/LOAD EXISTING PCB STOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col relative" ref={searchRef}>
            <label className={labelCls}>Load / Edit Existing PCB Stock</label>
            <input
              type="text"
              value={loadCodeVal}
              onFocus={() => {
                setShowSearchDropdown(true);
                handleSearchCode("");
              }}
              onChange={(e) => {
                const value = e.target.value;
                setLoadCodeVal(value);
                debouncedSearch(value);
                if (value) setShowSearchDropdown(true);
              }}
              placeholder="Enter / Search PCB Code or Name"
              className={`${inputCls} w-72`}
            />
            {showSearchDropdown && searchList.length > 0 && (
              <div className={`${dropdownCls} w-72 mt-1.5`}>
                {searchList.map((item) => (
                  <div
                    key={item.pcb_code}
                    onClick={() => handleLoadEntry(item.pcb_code)}
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-semibold border-b border-gray-50 last:border-0"
                  >
                    <span className="text-blue-800 font-bold">{item.pcb_code}</span> — {item.pcb_name}
                  </div>
                ))}
              </div>
            )}
            {showSearchDropdown && searchList.length === 0 && loadCodeVal && (
              <div className={`${dropdownCls} w-72 px-4 py-3 text-[13px] text-gray-400`}>
                No PCB stock found matching "{loadCodeVal}"
              </div>
            )}
          </div>

          {/* TOTALS VALUE REPORT BANNER */}
          <div className="flex justify-end items-center">
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl max-w-sm w-full space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                <span>Total Received Qty:</span>
                <span className="text-gray-700">{(parseFloat(quantityReceived) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                <span>Current Available Qty:</span>
                <span className="text-gray-700">{(parseFloat(availableQuantity) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-blue-100/70 pt-2 mt-2 font-black text-blue-700">
                <span>TOTAL STOCK VALUE:</span>
                <span className="text-lg">₹{stockValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCBStock;