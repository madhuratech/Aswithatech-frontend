import React, { useState } from "react";
import EmployeeForm from "../../forms/general/addemployee";
import ViewEmployee from "../../forms/general/ViewEmployee";
import Addpassword from "../../forms/general/addeditpassword";
import { Plus, SquarePen, Eye, Trash2 } from "lucide-react";
import { successToast, errorToast } from "../../ui/nottifications";
import toast from "react-hot-toast";

const Employee = () => {
  const [open, setOpen] = React.useState(false);
  const [employeeData, setEmployeeData] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [documentViewOpen, setDocumentViewOpen] = React.useState(false);
  const [viewingDocuments, setViewingDocuments] = React.useState([]);
  const [currentDocIndex, setCurrentDocIndex] = React.useState(0);
  const [viewingEmployeeId, setViewingEmployeeId] = React.useState(null);

  const fetchEmployees = async () => {
    const res = await fetch("http://localhost:3000/api/employees/all");
    const data = await res.json();
    setEmployeeData(data.employees || []);
  };
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle keyboard navigation for document viewer
  React.useEffect(() => {
    if (documentViewOpen && viewingDocuments.length > 0) {
      const handleKeyDown = (e) => {
        if (e.key === "ArrowRight") {
          setCurrentDocIndex(prev => Math.min(prev + 1, viewingDocuments.length - 1));
        } else if (e.key === "ArrowLeft") {
          setCurrentDocIndex(prev => Math.max(prev - 1, 0));
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [documentViewOpen, viewingDocuments.length]);

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setVerifyOpen(true);
  };

  const handleViewClick = (emp) => {
    setViewEmployee(emp);
    setViewOpen(true);
  };

  const handleDeleteClick = async (empId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Employee Deleted</span>
          <button className="text-blue-500 text-sm underline" onClick={() => {
            // Undo logic would need to refetch or keep snapshot; for simplicity we just refetch
            fetchEmployees();
            toast.dismiss(t.id);
            successToast("Delete undone");
          }}>
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    try {
      const res = await fetch(`http://localhost:3000/api/employees/delete/${empId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      // Remove from state optimistically
      setEmployeeData(prev => prev.filter(e => e.id !== empId));
      toast.dismiss(toastId);
      successToast("Employee deleted successfully");
    } catch (err) {
      toast.dismiss(toastId);
      errorToast("Failed to delete employee");
      // Optionally refetch to restore state
      fetchEmployees();
    }
  };

  const handleSearch = async (query) => {
    setSearchTerm(query);

    if (query.trim() === "") {
      fetchEmployees();
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/employees/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setEmployeeData(data);
      } else if (data.employees) {
        setEmployeeData(data.employees);
      } else {
        setEmployeeData([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setEmployeeData([]);
    }
  };

  const highlightText = (text) => {
    if (!text) return "";
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.toString().split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold">Employee Master</h1>
        </div>

        <div className="flex items-center gap-9">
          <div>
            <input type="text" className=" border border-gray-300 rounded-md px-4 py-2 w-full outline-none focus:border-[#98A2B3]     border border-[#D0D5DD]  transition-all duration-200 bg-[#F2F4F7]" placeholder="Search employees..."
              onChange={(e) => handleSearch(e.target.value)} />
          </div>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg">
            <Plus size={16} />
            Add Employee</button>
        </div>
      </div>

      <div>
        {open && <EmployeeForm onClose={() => setOpen(false)} refreshEmployees={fetchEmployees} />}

        {verifyOpen && (
          <Addpassword
            onClose={() => setVerifyOpen(false)}
            onSuccess={() => {
              setVerifyOpen(false);
              setEditOpen(true);
            }}
          />
        )}

        {editOpen && selectedEmployee && (
          <EmployeeForm
            employee={selectedEmployee}
            onClose={() => setEditOpen(false)}
            refreshEmployees={fetchEmployees}
          />
        )}

        {viewOpen && viewEmployee && (
          <ViewEmployee
            onClose={() => {
              setViewOpen(false);
              setViewEmployee(null);
            }}
            employee={viewEmployee}
          />
        )}
      </div>

      <div className="overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className=" text-left text-[12px] font-[400]  font-[Arial] text-[#6A7282] border-b ">
              <th className="py-2 pl-2">EMPLOYEE ID</th>
              <th className="pr-9">NAME</th>
              <th>DESIGNATION</th>
              <th>DEPARTMENT</th>
              <th>CONTACT</th>
              <th>DOCUMENTS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(employeeData) && employeeData.map((e, index) => (
              <tr key={e.id} className="border-b text-[#101828] font-[Arial] text-[14px] font-[400] text-sm hover:bg-gray-50">
                <td className="p-2">{e.emp_id || `EMP${String(index + 1).padStart(3, "0")}`}</td>
                <td>{highlightText(e.employee_name)}</td>
                <td>{highlightText(e.designation)}</td>
                <td>{highlightText(e.department)}</td>
                <td>{e.contact}</td>
                <td>
                  {e.documents && e.documents.length > 0 ? (
                    <button
                      onClick={() => {
                        setViewingDocuments(e.documents);
                        setViewingEmployeeId(e.id);
                        setCurrentDocIndex(0);
                        setDocumentViewOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1 font-medium underline text-xs"
                    >
                      <Eye size={14} />
                      {e.documents.length > 1 && (
                        <span className="ml-1 text-xs">({e.documents.length})</span>
                      )}
                    </button>
                  ) : (
                    <span className="text-gray-400">No Files</span>
                  )}
                </td>

                <td className="pl-5 flex gap-2">
                  <SquarePen size={16} className="cursor-pointer text-gray-600 hover:text-black" onClick={() => handleEditClick(e)} />
                  <Eye size={16} className="cursor-pointer text-gray-600 hover:text-black" onClick={() => handleViewClick(e)} />
                  <Trash2 size={16} className="cursor-pointer text-red-500" onClick={() => handleDeleteClick(e.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {documentViewOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] relative flex flex-col overflow-hidden">
            <div className="flex justify-between items-start p-4">
              <h2 className="text-lg font-semibold">Document View</h2>
              <button onClick={() => setDocumentViewOpen(false)} className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col flex-1 p-6 min-h-0">
              {viewingDocuments.length > 0 ? (
                <>
                  <div className="mb-4 text-center text-sm text-gray-500">
                    Document {currentDocIndex + 1} of {viewingDocuments.length}
                  </div>
                  <div className="flex-1 min-h-0 bg-gray-50 rounded border overflow-hidden flex items-center justify-center">
                    {viewingDocuments[currentDocIndex].mime_type?.startsWith("image/") ? (
                      <img
                        src={`http://localhost:3000/api/employees/${viewingEmployeeId}/document/${viewingDocuments[currentDocIndex].id}`}
                        alt={viewingDocuments[currentDocIndex].file_name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <iframe
                        title="Document viewer"
                        src={`http://localhost:3000/api/employees/${viewingEmployeeId}/document/${viewingDocuments[currentDocIndex].id}`}
                        className="w-full h-full border-none"
                      />
                    )}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setCurrentDocIndex(prev => Math.max(prev - 1, 0))}
                      disabled={currentDocIndex === 0}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentDocIndex(prev => Math.min(prev + 1, viewingDocuments.length - 1))}
                      disabled={currentDocIndex === viewingDocuments.length - 1}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 flex-1 flex items-center justify-center">No documents to display</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;