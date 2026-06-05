import React, { useState, useEffect } from "react";
import { X, Eye, Trash2 } from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { toast } from "react-hot-toast";
import { successToast, errorToast, loadingToast } from "../../ui/nottifications";

const AddEmployee = ({ onClose, refreshEmployees, employee }) => {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("");
  const [existingDocs, setExistingDocs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useScrollLock(true);

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

      if (employee.id) {
        fetch(`http://localhost:3000/api/employees/${employee.id}/documents`)
          .then(r => r.json())
          .then(d => setExistingDocs(d.documents || []))
          .catch(() => { });
      }
    }
  }, [employee]);

  const saveCustomer = async (e) => {
    e.preventDefault();

    const toastId = loadingToast("Saving employee...");

    try {
      const url = employee
        ? `http://localhost:3000/api/employees/edit/${employee.id}`
        : "http://localhost:3000/api/employees/new";

      const method = employee ? "PUT" : "POST";

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      selectedFiles.forEach(file => {
        data.append("documents", file);
      });

      const res = await fetch(url, {
        method,
        body: data,
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

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const viewDocument = (docId) => {
    window.open(`http://localhost:3000/api/employees/${employee.id}/document/${docId}`, "_blank");
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/employees/document/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setExistingDocs(prev => prev.filter(d => d.id !== docId));
        successToast("Document deleted");
      }
    } catch {
      errorToast("Failed to delete document");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white w-[650px] mt-[450px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
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

        <form onSubmit={saveCustomer}>
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

              <div className="relative">
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
              <label className="text-sm font-medium">Documents</label>
              <input
                onChange={handleFileChange}
                type="file" name="documents"
                multiple
                className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" />
              {selectedFiles.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {selectedFiles.map((f, i) => (
                    <span key={i} className="block">{i + 1}. {f.name}</span>
                  ))}
                </div>
              )}
              {employee && existingDocs.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-500">Uploaded documents:</p>
                  {existingDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs">
                      <button type="button" onClick={() => viewDocument(doc.id)}
                        className="text-blue-600 hover:underline flex items-center gap-1">
                        <Eye size={12} /> {doc.file_name}
                      </button>
                      <button type="button" onClick={() => deleteDocument(doc.id)}
                        className="text-red-500 hover:text-red-700">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative p-5 top-4 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button className="px-5 py-2 rounded-lg bg-black text-white text-sm">Submit</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
