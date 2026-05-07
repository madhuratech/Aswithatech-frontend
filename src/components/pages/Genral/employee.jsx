import React, { useState } from "react";
import EmployeeForm from "../../forms/addemployee";
import { Plus, SquarePen, Eye } from "lucide-react";
import Addpassword from "../../forms/addeditpassword";

const Employee = () => {
  const [open, setOpen] = React.useState(false);
  const [employeeData, setEmployeeData] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);


  // All Employees data fetch
  const fetchEmployees = async () => {
    const res = await fetch("http://localhost:3000/api/employees/all");
    const data = await res.json();
    setEmployeeData(data.employees || []);
  };
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // Pasword Validation;
  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setVerifyOpen(true);
  }

  // Search functionality
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
      ));
  }

//  Get Image
 // MIME type detection to fix binary text viewing error
const getMimeType = (data) => {
  if (!data) return "application/octet-stream";
  const arr = (new Uint8Array(data)).subarray(0, 4);
  let header = "";
  for(let i = 0; i < arr.length; i++) {
     header += arr[i].toString(16).padStart(2, '0');
  }
  switch (header.toUpperCase()) {
      case "89504E47": return "image/png";
      case "47494638": return "image/gif";
      case "25504446": return "application/pdf";
      case "FFD8FFDB":
      case "FFD8FFE0":
      case "FFD8FFE1":
      case "FFD8FFEE": return "image/jpeg";
      default: return "application/octet-stream";
  }
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

        {verifyOpen && (<Addpassword onClose={() => setVerifyOpen(false)} onSuccess={() => {
          setVerifyOpen(false); setEditOpen(true);
        }} />)}

        {editOpen && selectedEmployee && (<EmployeeForm
          employee={selectedEmployee}
          onClose={() => setEditOpen(false)}
          refreshEmployees={fetchEmployees} />)}
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
              <th>DOCUMENT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(employeeData) && employeeData.map((e, index) => (
              <tr key={e.id} className="border-b text-[#101828] font-[Arial] text-[14px] font-[400] text-sm hover:bg-gray-50">
                <td className="p-2"> EMP{String(index + 1).padStart(3, "0")}</td>
                <td>{highlightText(e.employee_name)}</td>
                <td>{highlightText(e.designation)}</td>
                <td>{highlightText(e.department)}</td>
                <td>{e.contact}</td>
                <td>{e.doucment?.data ? (
                  <button
                    onClick={() => {
                      const mimeType = getMimeType(e.doucment.data);
                      const blob = new Blob([new Uint8Array(e.doucment.data)], { type: mimeType });
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                    }}
                    className="text-blue-500 hover:text-blue-700 ml-[15px] flex items-center gap-1 font-medium underline"
                  >
                    <Eye size={14} />
                  </button>
                ) : (
                  <span className="text-gray-400">No File</span>
                )}
                </td>

                <td className="pl-5">
                  <SquarePen size={16} className="cursor-pointer text-gray-600 hover:text-black" onClick={() => handleEditClick(e)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

}
export default Employee;