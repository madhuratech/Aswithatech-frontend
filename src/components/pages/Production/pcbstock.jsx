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

const PCBStock = () => {
  const navigate = useNavigate();

  // Form states
  const [sno, setSno] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryType, setEntryType] = useState("service");
  const [remarks, setRemarks] = useState("");

  // Row entry states
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [uom, setUom] = useState("Nos");
  const [rowRemarks, setRowRemarks] = useState("");

  // Live stock count and selections
  const [liveStock, setLiveStock] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [tableData, setTableData] = useState([]);

  // Search & Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [loadSnoVal, setLoadSnoVal] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [snoList, setSnoList] = useState([]);

  // Dropdown visibility
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showUomDropdown, setShowUomDropdown] = useState(false);

  const empRef = useRef(null);
  const itemRef = useRef(null);
  const uomRef = useRef(null);
  const searchRef = useRef(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setEntryDate(today);
  }, []);

  // Fetch next generated SNO
  const fetchNextSno = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/production/next-sno");
      const data = await res.json();
      setSno(data.nextSno);
    } catch (err) {
      console.error("Error loading next SNO:", err);
    }
  };

  useEffect(() => {
    fetchNextSno();
  }, []);

  // Load Employees
  useEffect(() => {
    fetch("http://localhost:3000/api/employees/all")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      })
      .catch((err) => console.error("Error loading employees:", err));
  }, []);

  // Load Items based on entry type (Service / Spares)
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

  // Load Stock count for selected Item Name
  useEffect(() => {
    if (!itemName) {
      setLiveStock(0);
      return;
    }
    fetch(
      `http://localhost:3000/api/production/stock-count/${entryType}/${encodeURIComponent(
        itemName
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        setLiveStock(data.stock || 0);
      })
      .catch((err) => {
        console.error("Error loading stock count:", err);
        setLiveStock(0);
      });
  }, [itemName, entryType]);

  // Add Item row to grid
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
    };

    setTableData([...tableData, newItem]);
    setItemName("");
    setQuantity(0);
    setUom("Nos");
    setRowRemarks("");
  };

  // Clear Row Fields
  const handleClearRow = () => {
    setItemName("");
    setQuantity(0);
    setUom("Nos");
    setRowRemarks("");
  };

  // Edit item inside table
  const handleEditRow = (index) => {
    const item = tableData[index];
    setItemName(item.item_name);
    setQuantity(item.quantity);
    setUom(item.uom);
    setRowRemarks(item.remarks || "");
    setTableData(tableData.filter((_, i) => i !== index));
  };

  // Delete item from table
  const handleDeleteRow = (index) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  // Calculate Total Quantity
  const totalQuantity = tableData.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  // Reset / Clear Form
  const handleResetForm = () => {
    setEmployeeName("");
    const today = new Date().toISOString().split("T")[0];
    setEntryDate(today);
    setEntryType("service");
    setRemarks("");
    setTableData([]);
    setIsEditing(false);
    setLoadSnoVal("");
    fetchNextSno();
    handleClearRow();
  };

  // Save or Update Entry
  const handleSaveEntry = async () => {
    if (!employeeName) {
      alert("Please select an Employee Name");
      return;
    }
    if (tableData.length === 0) {
      alert("Please add at least one item to the table");
      return;
    }

    const payload = {
      employee_name: employeeName,
      entry_date: entryDate,
      entry_type: entryType,
      remarks: remarks,
      total_qty: totalQuantity,
      items: tableData,
    };

    const toastId = toast.loading(
      isEditing ? "Updating entry..." : "Saving entry..."
    );
    try {
      const url = isEditing
        ? `http://localhost:3000/api/production/${sno}`
        : "http://localhost:3000/api/production/new";
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
        isEditing ? "Entry updated successfully!" : "Entry saved successfully!",
        { id: toastId }
      );
      handleResetForm();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // Delete Entry
  const handleDeleteEntry = async () => {
    if (!isEditing || !sno) {
      alert("Please load an existing entry to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete entry ${sno}?`))
      return;

    const toastId = toast.loading("Deleting entry...");
    try {
      const res = await fetch(`http://localhost:3000/api/production/${sno}`, {
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

  // Search SNO database
  const handleSearchSno = async (val) => {
    try {
      let url = "";
      if (!val.trim()) {
        url = "http://localhost:3000/api/production/search?q=";
      } else {
        url = `http://localhost:3000/api/production/search?q=${encodeURIComponent(
          val
        )}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSnoList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedSnoSearch = useRef(debounce(handleSearchSno, 300)).current;

  // Load SNO details for edit
  const handleLoadEntry = async (selectedSno) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/production/${selectedSno}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");

      setSno(data.sno);
      setEmployeeName(data.employee_name);
      setEntryDate(data.entry_date?.split("T")[0] || "");
      setEntryType(data.entry_type);
      setRemarks(data.remarks || "");
      setTableData(data.items || []);
      setIsEditing(true);
      setLoadSnoVal(data.sno);
      setShowSearchDropdown(false);
      alert("Loaded Successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (empRef.current && !empRef.current.contains(event.target)) {
        setShowEmpDropdown(false);
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
          <p className="text-xl font-bold text-gray-800">Production Entry</p>
          <div className="flex gap-2">
            <button
              onClick={handleResetForm}
              className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white"
            >
              NEW
            </button>
            <button
              onClick={handleSaveEntry}
              className="border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white"
            >
              SAVE
            </button>
            <button
              onClick={handleDeleteEntry}
              className="border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white"
            >
              DELETE
            </button>
            <button
              onClick={() => navigate(-1)}
              className="border px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* HEADER INPUT FIELD ROWS */}
        <div className="space-y-5">
          
          {/* ROW 1: EMPLOYEE NAME, SNO, DATE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Employee Name */}
            <div className="relative text-black" ref={empRef}>
              <label className="text-sm font-bold text-gray-700">EMPLOYEE NAME:</label>
              <input
                value={employeeName}
                onFocus={() => setShowEmpDropdown(true)}
                onChange={(e) => {
                  setEmployeeName(e.target.value);
                  setShowEmpDropdown(true);
                }}
                placeholder="Select / Enter Employee Name"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="text"
              />
              {showEmpDropdown && (
                <div className="absolute top-full left-0 text-black w-full mt-1.5 rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {employees.length > 0 ? (
                    employees
                      .filter((emp) =>
                        (emp.employee_name || "")
                          .toLowerCase()
                          .includes((employeeName || "").toLowerCase())
                      )
                      .map((emp) => (
                        <div
                          key={emp.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeName(emp.employee_name);
                            setShowEmpDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-medium"
                        >
                          {emp.employee_name}
                        </div>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No employees found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SNO (Read Only like DN NO) */}
            <div>
              <label className="text-sm font-bold text-gray-700">SNO:</label>
              <input
                value={sno}
                readOnly
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-gray-50 text-gray-500 font-bold"
                type="text"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-bold text-gray-700">DATE:</label>
              <input
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="date"
              />
            </div>

          </div>

          {/* ROW 2: REMARKS */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-sm font-bold text-gray-700">REMARKS:</label>
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter Overall Production Remarks"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:border-blue-500 bg-white transition"
                type="text"
              />
            </div>
          </div>

          {/* ORDER TYPE CHOICE */}
          <div className="pt-2">
            <p className="text-sm font-bold text-gray-700 mb-2">Order Type</p>
            <div className="flex gap-6 text-gray-800 font-medium">
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="entryType"
                  checked={entryType === "spare"}
                  onChange={() => setEntryType("spare")}
                  className="w-4 h-4 accent-blue-600"
                />
                Spare
              </label>
            </div>
          </div>

          {/* ITEM ENTRY ROW */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200/50 mt-4 flex-wrap relative">
            
            {/* Item dropdown / input */}
            <div className="relative flex-1 min-w-[200px]" ref={itemRef}>
              <label className="text-xs font-bold text-gray-600">ITEM</label>
              <input
                value={itemName}
                onFocus={() => setShowItemDropdown(true)}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setShowItemDropdown(true);
                }}
                placeholder="Enter / Select Item"
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

            {/* Quantity */}
            <div className="w-[120px]">
              <label className="text-xs font-bold text-gray-600">QTY</label>
              <input
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(0, parseInt(e.target.value) || 0))
                }
                placeholder="Quantity"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 text-center transition"
                type="number"
              />
            </div>

            {/* Uom selector */}
            <div className="relative w-[120px]" ref={uomRef}>
              <label className="text-xs font-bold text-gray-600">UOM</label>
              <input
                value={uom}
                onFocus={() => setShowUomDropdown(true)}
                onChange={(e) => {
                  setUom(e.target.value);
                  setShowUomDropdown(true);
                }}
                placeholder="Unit"
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
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-600">REMARKS</label>
              <input
                value={rowRemarks}
                onChange={(e) => setRowRemarks(e.target.value)}
                placeholder="Remarks if any"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-white focus:border-blue-500 transition"
                type="text"
              />
            </div>

            {/* Live Stock info label */}
            <div className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-2 mt-4 select-none">
              STOCK: {liveStock}
            </div>

            {/* Row Actions */}
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
            <table className="w-full min-w-[800px] border-collapse text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 select-none">
                  <th className="px-5 py-3 border-r border-gray-200 text-center w-[60px]">
                    S.NO
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 w-[50%]">
                    ITEM NAME
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 text-center w-[12%]">
                    QTY
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 text-center w-[12%]">
                    UOM
                  </th>
                  <th className="px-5 py-3 border-r border-gray-200 w-[20%]">
                    REMARKS
                  </th>
                  <th className="px-5 py-3 text-center w-[10%]">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
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

          {/* FOOTER TOTALS & SNO SEARCH */}
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Search / Load existing SNO */}
            <div className="relative min-w-[250px] text-black" ref={searchRef}>
              <span className="font-bold text-gray-700 block text-xs mb-1">
                SELECT SNO:
              </span>
              <input
                value={loadSnoVal}
                onFocus={() => {
                  setShowSearchDropdown(true);
                  handleSearchSno("");
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setLoadSnoVal(value);
                  debouncedSnoSearch(value);
                  if (value) setShowSearchDropdown(true);
                }}
                placeholder="Enter / Search SNO"
                className="w-full outline-none border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 bg-white text-sm font-semibold transition"
              />
              {showSearchDropdown && (
                <div className="absolute bottom-full left-0 mb-1.5 w-full rounded-lg bg-white shadow-xl z-50 max-h-40 overflow-y-auto border border-gray-200">
                  {snoList.length > 0 ? (
                    snoList.map((item) => (
                      <div
                        key={item.sno}
                        onClick={() => handleLoadEntry(item.sno)}
                        className="px-3 py-2.5 hover:bg-gray-100 cursor-pointer text-sm font-bold border-b border-gray-150 last:border-0"
                      >
                        {item.sno}
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

            {/* Total Quantity */}
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

export default PCBStock;
