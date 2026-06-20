import API_BASE_URL from "../../../config/api";
import React from "react";
import { X, Eye } from "lucide-react";
const ViewEmployee = ({ onClose, employee }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white w-[650px] mt-[450px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">View Employee</h2>
          </div>
          <div>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Employee ID</label>
            <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
              {employee.emp_id || 'N/A'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium">Employee Name</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
                {employee.employee_name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Designation</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
                {employee.designation || 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium">Contact</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
                {employee.contact || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
                {employee.department || 'N/A'}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
              {employee.address || 'N/A'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium">Pincode</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
                {employee.pincode || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Identification</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
                {employee.identification || 'N/A'}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Pan Number</label>
            <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-not-allowed">
              {employee.pannumber || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Documents</label>
            {employee.documents && employee.documents.length > 0 ? (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-gray-500">Uploaded documents:</p>
                {employee.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => window.open(`${API_BASE_URL}/employees/${employee.id}/document/${doc.id}`, "_blank")}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye size={12} /> {doc.file_name}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-gray-400">No documents uploaded</p>
            )}
          </div>
          <div className="relative p-5 top-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;