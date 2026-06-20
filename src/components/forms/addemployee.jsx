import React, { useState, useEffect, useRef } from "react";
import { X, Eye, Trash2 } from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { toast } from "react-hot-toast";
import { successToast, errorToast, loadingToast } from "../ui/nottifications";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain"
];

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1] || "";
      resolve({ name: file.name, mime: file.type, data: base64 });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

const AddEmployee = ({ onClose, refreshEmployees, employee }) => {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("");
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);
  const departmentRef = useRef(null);

  useOutsideClick([
    { ref: cardRef, onClose },
    { ref: departmentRef, onClose: () => setOpen(false) }
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useScrollLock(true);
  const { showPasswordModal, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

  const [formData, setFormData] = useState({
    emp_id: "",
    employee_name: "",
    designation: "",
    department: "",
    contact: "",
    address: "",
    pincode: "",
    identification: "",
    pannumber: ""
  });

  useEffect(() => {
    if (!employee) {
      fetch("http://localhost:3000/api/employees/next-id")
        .then(r => r.json())
        .then(data => {
          if (data.empId) {
            setFormData(prev => ({ ...prev, emp_id: data.empId }));
          }
        })
        .catch(() => {});
    }
  }, [employee]);

  useEffect(() => {
    if (employee) {
      setFormData({
        emp_id: employee.emp_id || "",
        employee_name: employee.employee_name || "",
        designation: employee.designation || "",
        department: employee.department || "",
        contact: employee.contact || "",
        address: employee.address || "",
        pincode: employee.pincode || "",
        identification: employee.identification || "",
        pannumber: employee.pannumber || ""
      });
      setCategory(employee.department || "");
      const existing = Array.isArray(employee.documents) ? employee.documents : [];
      setDocuments(existing);
    }
  }, [employee]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (documents.length + files.length > MAX_FILES) {
      errorToast(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setBusy(true);
    try {
      const newDocs = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          errorToast(`"${file.name}" exceeds 5MB limit`);
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          errorToast(`"${file.name}" type not allowed`);
          continue;
        }
        const doc = await readFileAsBase64(file);
        newDocs.push(doc);
      }
      if (newDocs.length > 0) {
        setDocuments(prev => [...prev, ...newDocs]);
        successToast(`${newDocs.length} file(s) added`);
      }
    } catch (err) {
      errorToast(err.message || "Failed to read file(s)");
    } finally {
      setBusy(false);
    }
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const viewDocument = (doc) => {
    const dataUrl = `data:${doc.mime};base64,${doc.data}`;
    const win = window.open();
    if (!win) {
      errorToast("Pop-up blocked. Please allow pop-ups to view documents.");
      return;
    }
    if (doc.mime.startsWith("image/")) {
      win.document.write(`<title>${doc.name}</title><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#222;"><img src="${dataUrl}" style="max-width:100%;max-height:100vh;"/></body>`);
    } else {
      win.document.write(`<title>${doc.name}</title><iframe src="${dataUrl}" style="border:none;width:100%;height:100vh;"></iframe>`);
    }
  };

  const saveCustomer = async (e) => {
    e.preventDefault();

    const toastId = loadingToast("Saving employee...");

    try {
      const url = employee
        ? `http://localhost:3000/api/employees/edit/${employee.id}`
        : `http://localhost:3000/api/employees/new`;

      const method = employee ? "PUT" : "POST";

      const nullified = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === "" ? null : v])
      );

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nullified, documents }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.dismiss(toastId);
      successToast("Employee saved successfully");

      refreshEmployees();
      onClose();

    } catch (err) {
      toast.dismiss(toastId);
      errorToast(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveCustomer(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      <div ref={cardRef} className="bg-white w-[650px] mt-[450px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{employee ? "Edit Employee" : "Add New Employee"}</h2>
          </div>
          <div>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium">Employee ID</label>
              <input type="text" name="emp_id"
                value={formData.emp_id}
                readOnly
                className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed"
                placeholder="Auto-generated" />
            </div>
            <div className="grid grid-cols-2 gap-7">
              <div>
                <label className="text-sm font-medium">Employee Name</label>
                <input type="text" name="employee_name"
                  value={formData.employee_name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                  placeholder="Eg: John Doe" required />
              </div>

              <div>
                <label className="text-sm font-medium">Designation</label>
                <input type="text" name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                  placeholder="Eg: Software Engineer" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-7">
              <div>
                <label className="text-sm font-medium">Contact</label>
                <input type="text" name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                  placeholder="Eg: 9876543210" />
              </div>

              <div className="relative" ref={departmentRef}>
                <label className="text-sm font-medium">Department</label>
                <input
                  value={category || formData.department}
                  onClick={() => setOpen(true)}
                  type="text" name="department"
                  className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                  placeholder="Select Department" required
                  readOnly
                />

                {open && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white shadow p-3 rounded-lg border z-10">
                    <ul className="leading-8 cursor-pointer">
                      <li onClick={() => { setCategory("Sales"); setFormData(prev => ({ ...prev, department: "Sales" })); setOpen(false); }} className="hover:bg-gray-100 px-2 rounded">Sales</li>
                      <li onClick={() => { setCategory("Services"); setFormData(prev => ({ ...prev, department: "Services" })); setOpen(false); }} className="hover:bg-gray-100 px-2 rounded">Services</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Address</label>
              <input
                value={formData.address}
                onChange={handleChange}
                type="text" name="address"
                className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                placeholder="Eg: 123 Main Street, City, State" />
            </div>

            <div className="grid grid-cols-2 gap-7">
              <div>
                <label className="text-sm font-medium">Pincode</label>
                <input
                  value={formData.pincode}
                  onChange={handleChange}
                  type="text" name="pincode"
                  className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                  placeholder="Eg: 123456" />
              </div>

              <div>
                <label className="text-sm font-medium">Identification</label>
                <input
                  value={formData.identification}
                  onChange={handleChange}
                  type="text" name="identification"
                  className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                  placeholder="Eg: Aadhar Number" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Pan Number</label>
              <input
                value={formData.pannumber}
                onChange={handleChange}
                type="text" name="pannumber"
                className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                placeholder="Eg: ABCDE1234F" />
            </div>

            <div>
              <label className="text-sm font-medium">
                Documents <span className="text-gray-400 text-xs">(max {MAX_FILES} files, 5MB each)</span>
              </label>
              <input
                onChange={handleFileChange}
                type="file"
                multiple
                disabled={busy || documents.length >= MAX_FILES}
                className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer file:mr-3 file:bg-black file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:text-xs disabled:opacity-50"
              />
              {documents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                      <button type="button" onClick={() => viewDocument(doc)}
                        className="text-blue-600 hover:underline flex items-center gap-1 flex-1 text-left truncate">
                        <Eye size={12} />
                        <span className="truncate">{i + 1}. {doc.name}</span>
                        <span className="text-gray-400 ml-1">({(doc.data.length * 0.75 / 1024).toFixed(1)} KB)</span>
                      </button>
                      <button type="button" onClick={() => removeDocument(i)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative p-5 top-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-black text-white text-sm">Submit</button>
            </div>
          </div>
        </form>
      </div>
      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};

export default AddEmployee;