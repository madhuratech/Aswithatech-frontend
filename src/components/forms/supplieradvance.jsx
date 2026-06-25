import API_BASE_URL from "../../config/api";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { errorToast, successToast } from "../ui/nottifications";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import flatpickr from "flatpickr";
import { toDmy, toYmd } from "../../utils/dateFormat";

const DEFAULT_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Canara Bank",
  "Bank of Baroda",
  "Union Bank of India",
  "Indian Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Federal Bank",
  "IDBI Bank",
  "UCO Bank",
  "Indian Overseas Bank"
];

const Api_urls = `${API_BASE_URL}/suppliers`;

const Supplieradvance = () => {
  const navigate = useNavigate();
  const { showPasswordModal, requirePassword, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  const clientRef = useRef(null);
  const modeRef = useRef(null);
  const bankRef = useRef(null);
  const receiptRef = useRef(null);
  const suppAdvDateRef = useRef(null);
  const suppAdvDateFp = useRef(null);

  const [modeopen, setModeopen] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [receiptlist, setReceiptlist] = useState([]);
  const [clientname, setclientName] = useState([]);
  const [loadreceipt, setloadreceipt] = useState("");
  const [clientOpen, setClientopen] = useState(false);
  const [receiptsearch, setreceiptsearch] = useState(false);
  const [banks, setBanks] = useState([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  useOutsideClick([
    { ref: clientRef, onClose: () => setClientopen(false) },
    { ref: modeRef, onClose: () => setModeopen(false) },
    { ref: bankRef, onClose: () => { setBankOpen(false); setBankSearch(formData.bank_name || ""); } },
    { ref: receiptRef, onClose: () => setreceiptsearch(false) },
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setClientopen(false);
        setreceiptsearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [formData, setFormData] = useState({
    receipt_no: "",
    date: "",
    supplier_name: "",
    mode_of_payment: "",
    bank_name: "",
    ref_no: "",
    payment_type: "",
    remarks: "",
    received_by: "",
    paid_amount: "",
    tds: "",
    others: "",
  });

  // Load Receipt no;
  const loadReceiptData = async (receiptNo) => {
    const receiptLoad = receiptNo || loadreceipt;
    try {
      if (!receiptLoad.trim()) {
        return alert("Enter Receipt Number");
      }
      const res = await fetch(`${Api_urls}/search/${receiptLoad}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFormData({
        receipt_no: data.receipt_no || "",
        date: data.date || "",
        supplier_name: data.supplier_name || "",
        mode_of_payment: data.payment_mode || data.mode_of_payment || "",
        bank_name: data.bank_name || "",
        ref_no: data.ref_no || "",
        payment_type: data.payment_type || "",
        remarks: data.remarks || "",
        received_by: data.received_by || "",
        paid_amount: data.paid_amount || "",
        tds: data.tds || "",
        others: data.others || "",
      });
      setBankSearch(data.bank_name || "");

      setReceipt(receiptLoad);
      setloadreceipt(receiptLoad);
    } catch (error) {
      console.log("Error loading receipt", error);
      toast.error("Failed to load receipt");
    }
  };

  // Receipt Search
  const searchReceipts = async (value) => {
    try {
      const res = await fetch(`${Api_urls}/receipt_no`);
      const data = await res.json();
      setReceiptlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("receipt Failed");
    }
  };

  // Auto Generate receipt number next;
  useEffect(() => {
    fetch(`${Api_urls}/getrecipt`)
      .then((res) => res.json())
      .then((data) => {
        if (data.receiptNo) {
          setFormData((prevData) => ({
            ...prevData,
            receipt_no: data.receiptNo,
          }));
        }
      })
      .catch(console.error);

    // Bank List
    fetch(`${API_BASE_URL}/billpayment/banks`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data
          : Array.isArray(data.data) ? data.data
          : Array.isArray(data.banks) ? data.banks : [];
        setBanks(list.length > 0 ? list : DEFAULT_BANKS.map(name => ({ name })));
      })
      .catch((err) => {
        console.error("Error fetching banks:", err);
        setBanks(DEFAULT_BANKS.map(name => ({ name })));
      });
  }, []);

  // loadclients
  useEffect(() => {
    fetch(`${Api_urls}/clients`)
      .then((res) => res.json())
      .then((data) => {
        setclientName(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.warn("Retrying with backup client URL...");
        fetch(`${API_BASE_URL}/customers/all`)
          .then((res) => res.json())
          .then((data) => {
            setclientName(Array.isArray(data) ? data : []);
          });
      });
  }, []);

  const filteredSuppliers = (clientname || [])
    .filter((client) =>
      (client.customer_name || "")
        .toLowerCase()
        .includes((formData.supplier_name || "").toLowerCase())
    )
    .sort((a, b) =>
      (a.customer_name || "").localeCompare(b.customer_name || "")
    );

  // Save Supplier Advance
  const savesupplier = async () => {
    if (!formData.supplier_name?.trim()) {
      toast.error("Supplier Name is required");
      return;
    }
    if (!formData.date) {
      toast.error("Date is required");
      return;
    }
    if (!formData.paid_amount) {
      toast.error("Paid Amount is required");
      return;
    }
    const payload = {
      supplier_name: formData.supplier_name,
      receipt_no: formData.receipt_no,
      date: formData.date,
      payment_mode: formData.mode_of_payment,
      bank_name: formData.bank_name,
      ref_no: formData.ref_no,
      remarks: formData.remarks,
      received_by: formData.received_by,
      paid_amount: formData.paid_amount,
      tds: formData.tds,
      others: formData.others,
      payment_type: formData.payment_type,
    };

    try {
      const isEdit = receipt && receipt !== "";
      const url = isEdit
        ? `${Api_urls}/update/${receipt}`
        : `${Api_urls}/create`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.message || "Request failed");

      successToast(isEdit ? "Updated successfully" : "Created successfully");
      resestForm();
    } catch (error) {
      console.error(error);
      errorToast("Failed To Create");
    }
  };

  const handleSave = () => {
    savesupplier();
  };

  const handleDelete = () => {
    deleteReceipt();
  };

  // Today Date;
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, date: today }));
  }, []);

  useEffect(() => {
    suppAdvDateFp.current = flatpickr(suppAdvDateRef.current, {
      disableMobile: true,
      monthSelectorType: "static",
      dateFormat: "d-m-Y",
      defaultDate: formData.date ? toDmy(formData.date) : new Date(),
      onChange: (selectedDates, dateStr) => {
        setFormData((prev) => ({ ...prev, date: toYmd(dateStr) }));
      },
    });
    return () => suppAdvDateFp.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (suppAdvDateFp.current && formData.date) {
      suppAdvDateFp.current.setDate(toDmy(formData.date));
    }
  }, [formData.date]);

  // delete receipt number;
  const deleteReceipt = async () => {
    if (!receipt) {
      toast.error("Select receipt first");
      return;
    }
    if (!window.confirm(`Delete ${formData.receipt_no}?`)) return;

    try {
      const res = await fetch(`${Api_urls}/delete/${receipt}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Deleted successfully");
      resestForm();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // resetform
  const resestForm = async () => {
    setReceipt("");
    setloadreceipt("");
    setFormData({
      receipt_no: "",
      date: new Date().toISOString().split("T")[0],
      supplier_name: "",
      mode_of_payment: "",
      bank_name: "",
      ref_no: "",
      payment_type: "",
      remarks: "",
      received_by: "",
      paid_amount: "",
      tds: "",
      others: "",
    });
    setBankSearch("");
    setReceiptlist([]);
    setclientName([]);

    // Reload clients list
    fetch(`${Api_urls}/clients`)
      .then((res) => res.json())
      .then((data) => {
        setclientName(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    const res = await fetch(`${Api_urls}/getrecipt`);
    const data = await res.json();
    if (data.receiptNo) {
      setFormData((prev) => ({
        ...prev,
        receipt_no: data.receiptNo,
      }));
    }
  };

  const grandTotal =
    Number(formData.paid_amount || 0) +
    Number(formData.others || 0) -
    Number(formData.tds || 0);

  // Shared classes for visual consistency and outlines removal
  const labelCls = "text-[12px] font-bold text-gray-600 uppercase tracking-tight block mb-1";
  const inputCls = "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black focus:outline-none focus:ring-0 focus:border-blue-400 bg-white outline-none transition-all";
  const roInputCls = "mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-black focus:outline-none focus:ring-0 outline-none";
  const dropdownCls = "absolute top-full left-0 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-[180px] overflow-y-auto mt-1 outline-none";

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1200px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200 rounded-xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-black tracking-tight">Supplier Advance</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={resestForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-green-600 hover:text-white transition-colors outline-none focus:outline-none">NEW</button>
              <button onClick={handleSave} className="px-4 py-2 border rounded-lg text-sm hover:bg-green-600 hover:text-white transition-colors outline-none focus:outline-none">SAVE</button>
              <button onClick={() => loadReceiptData(loadreceipt)} className="px-4 py-2 border rounded-lg text-sm hover:bg-yellow-600 hover:text-white transition-colors outline-none focus:outline-none">EDIT</button>
              <button onClick={handleDelete} className="px-4 py-2 border rounded-lg text-sm hover:bg-red-600 hover:text-white transition-colors outline-none focus:outline-none">DELETE</button>
              <button onClick={() => window.print()} className="px-4 py-2 border rounded-lg text-sm hover:bg-purple-600 hover:text-white transition-colors outline-none focus:outline-none">PRINT</button>
              <button onClick={resestForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-600 hover:text-white transition-colors outline-none focus:outline-none">RESET</button>
              <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-800 hover:text-white transition-colors outline-none focus:outline-none">CLOSE</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="relative" ref={clientRef}>
                <label className={labelCls}>Supplier Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Search Supplier Name"
                  value={formData.supplier_name}
                  onFocus={() => setClientopen(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, supplier_name: e.target.value });
                    setClientopen(true);
                  }}
                  className={inputCls}
                />
                {clientOpen && filteredSuppliers.length > 0 && (
                  <div className={dropdownCls}>
                    {filteredSuppliers.map((c, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setFormData({ ...formData, supplier_name: c.customer_name });
                          setClientopen(false);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50"
                      >
                        {c.customer_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Payment Type</label>
                <input
                  type="text"
                  placeholder="Enter Payment Type"
                  value={formData.payment_type}
                  onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Paid Amount <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Receipt No</label>
                <input
                  type="text"
                  value={formData.receipt_no}
                  readOnly
                  className={roInputCls}
                />
              </div>

              <div className="relative" ref={modeRef}>
                <label className={labelCls}>Mode</label>
                <input
                  type="text"
                  placeholder="Select Mode"
                  value={formData.mode_of_payment}
                  onFocus={() => setModeopen(true)}
                  readOnly
                  className={`${inputCls} cursor-pointer`}
                />
                {modeopen && (
                  <div className={dropdownCls}>
                    {["Cash", "Bank", "Cheque", "By Hand"].map((m) => (
                      <div
                        key={m}
                        onMouseDown={() => {
                          setFormData({ ...formData, mode_of_payment: m, bank_name: m === "Cash" ? "" : formData.bank_name });
                          setModeopen(false);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 font-medium text-black"
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(formData.mode_of_payment === "Bank" || formData.mode_of_payment === "Cheque") && (
                <>
                  <div className="relative" ref={bankRef}>
                    <label className={labelCls}>Bank Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Select Bank"
                      value={bankSearch}
                      onFocus={() => {
                        setBankSearch("");
                        setBankOpen(true);
                      }}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className={inputCls}
                    />
                    {bankOpen && (
                      <div className={dropdownCls}>
                        {banks
                          .filter((b) => (b.name || b.bank_name || "").toLowerCase().includes(bankSearch.toLowerCase()))
                          .map((b, i) => (
                            <div
                              key={i}
                              onMouseDown={() => {
                                setFormData({ ...formData, bank_name: b.name || b.bank_name });
                                setBankSearch(b.name || b.bank_name);
                                setBankOpen(false);
                              }}
                              className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 text-black font-semibold"
                            >
                              {b.name || b.bank_name}
                            </div>
                          ))}
                        {banks.filter((b) => (b.name || b.bank_name || "").toLowerCase().includes(bankSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-400">No banks found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Reference Number</label>
                    <input
                      type="text"
                      placeholder="UTR / Txn ID / Cheque No"
                      value={formData.ref_no}
                      onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Date</label>
                <input
                  ref={suppAdvDateRef}
                  className={inputCls}
                  readOnly
                />
              </div>

              <div>
                <label className={labelCls}>TDS</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.tds}
                  onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Others</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.others}
                  onChange={(e) => setFormData({ ...formData, others: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Received By</label>
                <input
                  type="text"
                  placeholder="Received By"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={4}
                  placeholder="Enter remarks"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Grand Total</span>
                <span className="text-3xl font-black text-indigo-900">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Paid</span>
                  <span>₹{Number(formData.paid_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TDS</span>
                  <span>₹{Number(formData.tds || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Others</span>
                  <span>₹{Number(formData.others || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-3xl border border-dashed border-gray-300 bg-white">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-gray-500">
              Select Receipt No To Edit
            </div>
            <div className="relative max-w-md" ref={receiptRef}>
              <input
                type="text"
                value={loadreceipt}
                onFocus={() => {
                  setreceiptsearch(true);
                  searchReceipts(loadreceipt);
                }}
                onChange={(e) => {
                  setloadreceipt(e.target.value);
                  searchReceipts(e.target.value);
                }}
                placeholder="Search receipt..."
                className={inputCls}
              />
              {receiptsearch && (
                <div className="absolute top-[56px] left-0 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg outline-none">
                  {receiptlist.length > 0 ? (
                    receiptlist.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => requirePassword(() => loadReceiptData(item.receipt_no))}
                        className="cursor-pointer px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        {item.receipt_no}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400">No receipts found</div>
                  )}
                </div>
              )}
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

export default Supplieradvance;
