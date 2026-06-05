import React, { useState, useEffect, useRef } from "react";
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

const StandbyStock = () => {
  const navigate = useNavigate();

  // Form states
  const [dcNo, setDcNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [dcDate, setDcDate] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [despatchThru, setDespatchThru] = useState("");
  const [entryType, setEntryType] = useState("spare"); // defaults to spare
  const [hsnCode, setHsnCode] = useState("");
  const [operations, setOperations] = useState("");

  // Row item entry states
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [uom, setUom] = useState("Nos");
  const [rowRemarks, setRowRemarks] = useState("");
  const [slno, setSlno] = useState("");

  // Loaded DB data
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [tableData, setTableData] = useState([]);

  // Calculate dynamic total quantity
  const totalQuantity = tableData.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  // Search & Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [loadDcVal, setLoadDcVal] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [dcSearchList, setDcSearchList] = useState([]);

  const handleEditClick = () => {
    if (!isEditing) {
      alert("Please select a DC No from the search field at the bottom to load for editing.");
    } else {
      alert(`Already editing DC No: ${dcNo}`);
    }
  };



  // Dropdown visibility flags
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showUomDropdown, setShowUomDropdown] = useState(false);

  const custRef = useRef(null);
  const itemRef = useRef(null);
  const uomRef = useRef(null);
  const searchRef = useRef(null);

  // Set default dates on load
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDcDate(today);
    setOrderDate(today);
  }, []);

  // Calculate Due Date based on DC Date & Payment Terms days
  useEffect(() => {
    if (!dcDate) return;
    const dateObj = new Date(dcDate);
    if (isNaN(dateObj.getTime())) return;
    const days = parseInt(paymentTerms) || 0;
    dateObj.setDate(dateObj.getDate() + days);
    setDueDate(dateObj.toISOString().split("T")[0]);
  }, [dcDate, paymentTerms]);

  // Fetch next generated DC number
  const fetchNextDcNo = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/standby/next-dc");
      const data = await res.json();
      setDcNo(data.nextDc);
    } catch (err) {
      console.error("Error loading next DC number:", err);
    }
  };

  useEffect(() => {
    fetchNextDcNo();
  }, []);

  // Load Customers
  useEffect(() => {
    fetch("http://localhost:3000/api/customers/all")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data);
        }
      })
      .catch((err) => console.error("Error loading customers:", err));
  }, []);

  // Load Items based on category choice
  useEffect(() => {
    const url =
      entryType === "service"
        ? "http://localhost:3000/api/Services/all"
        : "http://localhost:3000/api/Sparemodels/all";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
          setItemName("");
        }
      })
      .catch((err) => console.error("Error loading items:", err));
  }, [entryType]);

  // Add Item to table
  const handleAddItem = () => {
    if (!itemName) {
      alert("Please select or enter an Item Name");
      return;
    }
    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const newItem = {
      item_name: itemName,
      quantity: Number(quantity),
      uom: uom,
      remarks: rowRemarks,
      slno: slno,
    };

    setTableData([...tableData, newItem]);
    setItemName("");
    setQuantity(0);
    setUom("Nos");
    setRowRemarks("");
    setSlno("");
  };

  // Clear Row Inputs
  const handleClearRow = () => {
    setItemName("");
    setQuantity(0);
    setUom("Nos");
    setRowRemarks("");
    setSlno("");
  };

  // Edit row from table
  const handleEditRow = (index) => {
    const item = tableData[index];
    setItemName(item.item_name);
    setQuantity(item.quantity);
    setUom(item.uom);
    setRowRemarks(item.remarks || "");
    setSlno(item.slno || "");
    setTableData(tableData.filter((_, i) => i !== index));
  };

  // Delete row from table
  const handleDeleteRow = (index) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  // Reset / Clear Form
  const handleResetForm = () => {
    setCustomerName("");
    const today = new Date().toISOString().split("T")[0];
    setDcDate(today);
    setOrderNo("");
    setOrderDate(today);
    setPaymentTerms(30);
    setDespatchThru("");
    setEntryType("spare");
    setHsnCode("");
    setOperations("");
    setTableData([]);
    setIsEditing(false);
    setLoadDcVal("");
    fetchNextDcNo();
    handleClearRow();
  };

  // Save / Update Entry
  const handleSaveEntry = async () => {
    if (!customerName) {
      alert("Please select a Customer Name");
      return;
    }
    if (tableData.length === 0) {
      alert("Please add at least one item to the table");
      return;
    }

    const payload = {
      customer_name: customerName,
      dc_date: dcDate,
      order_no: orderNo,
      order_date: orderDate,
      payment_terms: paymentTerms,
      due_date: dueDate,
      despatch_thru: despatchThru,
      entry_type: entryType,
      hsn_code: hsnCode,
      operations: operations,
      items: tableData,
    };

    const toastId = toast.loading(
      isEditing ? "Updating entry..." : "Saving entry..."
    );
    try {
      const url = isEditing
        ? `http://localhost:3000/api/standby/${dcNo}`
        : "http://localhost:3000/api/standby/new";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save");
      }

      toast.success(
        isEditing
          ? "Standby DC updated successfully!"
          : "Standby DC saved successfully!",
        { id: toastId }
      );
      handleResetForm();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };


  // Search DC No database
  const handleSearchDc = async (val) => {
    try {
      let url = "";
      if (!val.trim()) {
        url = "http://localhost:3000/api/standby/search?q=";
      } else {
        url = `http://localhost:3000/api/standby/search?q=${encodeURIComponent(
          val
        )}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setDcSearchList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedDcSearch = useRef(debounce(handleSearchDc, 300)).current;

  // Load DC details for edit
  const handleLoadEntry = async (selectedDc) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/standby/${selectedDc}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");

      setDcNo(data.dc_no);
      setCustomerName(data.customer_name);
      setDcDate(data.dc_date?.split("T")[0] || "");
      setOrderNo(data.order_no || "");
      setOrderDate(data.order_date?.split("T")[0] || "");
      setPaymentTerms(data.payment_terms || 30);
      setDueDate(data.due_date?.split("T")[0] || "");
      setDespatchThru(data.despatch_thru || "");
      setEntryType(data.entry_type);
      setHsnCode(data.hsn_code || "");
      setOperations(data.operations || "");
      setTableData(data.items || []);
      setIsEditing(true);
      setLoadDcVal(data.dc_no);
      setShowSearchDropdown(false);
      alert("Loaded Successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (custRef.current && !custRef.current.contains(event.target)) {
        setShowCustDropdown(false);
      }
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
      if (uomRef.current && !uomRef.current.contains(event.target)) {
        setShowUomDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full min-h-screen text-sm md:text-base flex flex-col overflow-x-hidden p-6 bg-slate-50">
      
      {/* Back button */}
      <button
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit mb-6 shadow-sm transition"
        onClick={() => navigate(-1)}
      >
        Go Back
      </button>

      {/* MAIN CONTAINER */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col shadow-sm">
        
        {/* TOP MENU ACTION BUTTONS */}
        <div className="flex justify-between items-center pb-6 mb-5 border-b border-gray-100">
          <p className="text-xl font-bold text-gray-800">Stand By DC Entry</p>
          <div className="flex gap-2">
            <button
              onClick={handleResetForm}
              className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white"
            >
              NEW
            </button>
            <button
              onClick={handleEditClick}
              className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white"
            >
              EDIT
            </button>
            <button
              onClick={handleSaveEntry}
              className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white"
            >
              SAVE
            </button>
            <button
              onClick={handleResetForm}
              className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white"
            >
              RESET
            </button>
            
          </div>
        </div>

        {/* HEADER INPUT FIELD ROWS */}
        <div className="space-y-5">
          
          {/* ROW 1: CUSTOMER NAME, DC NO, DC DATE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Customer Name */}
            <div className="relative text-black" ref={custRef}>
              <label className="text-sm font-bold text-gray-700">CUSTOMER NAME:</label>
              <input
                value={customerName}
                onFocus={() => setShowCustDropdown(true)}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setShowCustDropdown(true);
                }}
                placeholder="Select / Enter Customer Name"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="text"
              />
              {showCustDropdown && (
                <div className="absolute top-full left-0 text-black w-full mt-1.5 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {customers.length > 0 ? (
                    customers
                      .filter((c) =>
                        (c.customer_name || "")
                          .toLowerCase()
                          .includes((customerName || "").toLowerCase())
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerName(c.customer_name);
                            setShowCustDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-medium"
                        >
                          {c.customer_name}
                        </div>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No customers found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DC NO (Read Only) */}
            <div>
              <label className="text-sm font-bold text-gray-700">DC NO:</label>
              <input
                value={dcNo}
                readOnly
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-gray-50 text-gray-500 font-bold"
                type="text"
              />
            </div>

            {/* DC Date */}
            <div>
              <label className="text-sm font-bold text-gray-700">DC DATE:</label>
              <input
                value={dcDate}
                onChange={(e) => setDcDate(e.target.value)}
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="date"
              />
            </div>

          </div>

          {/* ROW 2: ORDER NO, ORDER DATE, PAYMENT TERMS, DUE DATE, DESPATCH THRU */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            
            {/* Order No */}
            <div>
              <label className="text-sm font-bold text-gray-700">ORDER NO:</label>
              <input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="Order Number"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="text"
              />
            </div>

            {/* Order Date */}
            <div>
              <label className="text-sm font-bold text-gray-700">ORDER DATE:</label>
              <input
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="date"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="text-sm font-bold text-gray-700">PAYMENT TERMS (DAYS):</label>
              <input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 0)}
                placeholder="Days"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition text-center"
                type="number"
              />
            </div>

            {/* Calculated Due Date */}
            <div>
              <label className="text-sm font-bold text-gray-700">DUE DATE:</label>
              <input
                value={dueDate}
                readOnly
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-gray-50 text-gray-500 font-bold text-center"
                type="date"
              />
            </div>

            {/* Despatch Thru */}
            <div>
              <label className="text-sm font-bold text-gray-700">DESPATCH THRU:</label>
              <input
                value={despatchThru}
                onChange={(e) => setDespatchThru(e.target.value)}
                placeholder="Carrier / Dispatch details"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="text"
              />
            </div>

          </div>

          {/* ORDER CATEGORY & HSN */}
          <div className="flex gap-8 items-end flex-wrap bg-gray-50 p-3 rounded-lg border border-gray-200/50">
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">Order Category</p>
              <div className="flex gap-6 text-gray-800 font-medium h-[38px] items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="entryType"
                    checked={entryType === "spare"}
                    onChange={() => setEntryType("spare")}
                    className="w-4 h-4 accent-blue-600"
                  />
                  Spares
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="entryType"
                    checked={entryType === "service"}
                    onChange={() => setEntryType("service")}
                    className="w-4 h-4 accent-blue-600"
                  />
                  Service
                </label>
              </div>
            </div>

            <div className="w-[180px]">
              <label className="text-xs font-bold text-gray-700">HSN:</label>
              <input
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="HSN Code"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-1.5 mt-1 bg-white focus:border-blue-500 transition"
                type="text"
              />
            </div>
          </div>

          {/* ITEM ENTRY LINE */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200/50 mt-4 flex-wrap relative">
            
            {/* Item selector */}
            <div className="relative flex-1 min-w-[200px]" ref={itemRef}>
              <label className="text-xs font-bold text-gray-600">ITEM NAME</label>
              <input
                value={itemName}
                onFocus={() => setShowItemDropdown(true)}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setShowItemDropdown(true);
                }}
                placeholder="Select / Enter Item"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 transition"
                type="text"
              />
              {showItemDropdown && (
                <div className="absolute top-full left-0 text-black w-full mt-1.5 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {items.length > 0 ? (
                    items
                      .filter((it) =>
                        (it.item_name || it.spare_name || it.service_name || "")
                          .toLowerCase()
                          .includes((itemName || "").toLowerCase())
                      )
                      .map((it, idx) => {
                        const name =
                          it.item_name || it.spare_name || it.service_name;
                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemName(name);
                              setShowItemDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold uppercase"
                          >
                            {name}
                          </div>
                        );
                      })
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No items found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Qty */}
            <div className="w-[100px]">
              <label className="text-xs font-bold text-gray-600">QTY</label>
              <input
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 text-center transition"
                type="number"
              />
            </div>

            {/* UOM selector */}
            <div className="relative w-[100px]" ref={uomRef}>
              <label className="text-xs font-bold text-gray-600">UOM</label>
              <input
                value={uom}
                onFocus={() => setShowUomDropdown(true)}
                onChange={(e) => {
                  setUom(e.target.value);
                  setShowUomDropdown(true);
                }}
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 text-center transition"
                type="text"
              />
              {showUomDropdown && (
                <div className="absolute top-full left-0 w-full mt-1.5 rounded-lg bg-white shadow-lg z-50 border border-gray-200">
                  {["Nos", "Kg", "Ltr", "Mtr"].map((unit) => (
                    <div
                      key={unit}
                      onClick={(e) => {
                        e.stopPropagation();
                        setUom(unit);
                        setShowUomDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-center font-medium"
                    >
                      {unit}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remarks row input */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-gray-600">REMARKS</label>
              <input
                value={rowRemarks}
                onChange={(e) => setRowRemarks(e.target.value)}
                placeholder="Row Remarks"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 transition"
                type="text"
              />
            </div>

            {/* SLNO input */}
            <div className="w-[120px]">
              <label className="text-xs font-bold text-gray-600">SLNO</label>
              <input
                value={slno}
                onChange={(e) => setSlno(e.target.value)}
                placeholder="Serial No"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 text-center transition"
                type="text"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddItem}
                className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                ADD
              </button>
              <button
                onClick={handleClearRow}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                CLEAR
              </button>
            </div>

          </div>

          {/* TABLE CONTAINER */}
          <div className="w-full overflow-x-auto border border-gray-200 rounded-xl mt-4">
            <table className="w-full min-w-[850px] border-collapse text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 select-none">
                  <th className="px-5 py-3 border-r border-gray-200 text-center w-[60px]">
                    S.NO
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 w-[45%]">
                    ITEM NAME
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 text-center w-[10%]">
                    QTY
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 text-center w-[10%]">
                    UOM
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 w-[15%]">
                    REMARKS
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 w-[12%] text-center">
                    SLNO
                  </th>
                  <th className="px-5 py-3 text-center w-[8%]">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-10 text-gray-400 font-medium"
                    >
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  tableData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-150 hover:bg-gray-50 transition">
                      <td className="px-5 py-3 border-r border-gray-200 text-center font-semibold text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3 border-r border-gray-200 font-bold uppercase text-gray-800">
                        {item.item_name}
                      </td>
                      <td className="px-5 py-3 border-r border-gray-200 text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3 border-r border-gray-200 text-center text-gray-600 font-medium">
                        {item.uom}
                      </td>
                      <td className="px-5 py-3 border-r border-gray-200 text-gray-500 font-medium">
                        {item.remarks || "-"}
                      </td>
                      <td className="px-5 py-3 border-r border-gray-200 text-center text-gray-600 font-semibold">
                        {item.slno || "-"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-3 justify-center">
                          <SquarePen
                            onClick={() => handleEditRow(index)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer transition"
                            size={18}
                          />
                          <Trash2
                            onClick={() => handleDeleteRow(index)}
                            className="text-red-600 hover:text-red-800 cursor-pointer transition"
                            size={18}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER OPERATIONS & SEARCH */}
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Search / Load existing SBDC */}
            <div className="relative min-w-[250px] text-black" ref={searchRef}>
              <span className="font-bold text-gray-700 block text-xs mb-1">
                SELECT DC NO:
              </span>
              <input
                value={loadDcVal}
                onFocus={() => {
                  setShowSearchDropdown(true);
                  handleSearchDc("");
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setLoadDcVal(value);
                  debouncedDcSearch(value);
                  if (value) setShowSearchDropdown(true);
                }}
                placeholder="Enter / Search DC No"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 bg-white text-sm font-semibold transition"
              />
              {showSearchDropdown && (
                <div className="absolute bottom-full left-0 mb-1.5 w-full rounded-lg bg-white shadow-xl z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {dcSearchList.length > 0 ? (
                    dcSearchList.map((item) => (
                      <div
                        key={item.dc_no}
                        onClick={() => handleLoadEntry(item.dc_no)}
                        className="px-3 py-2.5 hover:bg-gray-100 cursor-pointer text-sm font-bold border-b border-gray-150 last:border-0"
                      >
                        {item.dc_no}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No entries found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OPERATIONS Remarks */}
            <div className="flex-1 max-w-lg">
              <label className="text-xs font-bold text-gray-700">OPERATIONS:</label>
              <input
                value={operations}
                onChange={(e) => setOperations(e.target.value)}
                placeholder="Production operations / notes"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="text"
              />
            </div>

            {/* Total Qty summary */}
            <div className="w-full max-w-xs text-sm space-y-2 border border-gray-200 rounded-xl bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-600">Total Quantity:</span>
                <span className="font-extrabold text-blue-600 text-lg">
                  {totalQuantity.toFixed(2)}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default StandbyStock;
