import API_BASE_URL from "../../../config/api";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReportModal from "../ReportModal";

const SpareUsageReportModal = ({ isOpen, onClose }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [spareName, setSpareName] = useState("");
  const [spareNameList, setSpareNameList] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE_URL}/spareusage/spare-names`)
      .then((r) => r.json())
      .then((list) => setSpareNameList(Array.isArray(list) ? list : []))
      .catch(() => setSpareNameList([]));
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (spareName) params.set("spareName", spareName);
      const res = await fetch(`${API_BASE_URL}/spareusage/report?${params}`);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, spareName]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
  const fmtNum = (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : "-");

  const columns = [
    { label: "Usage No", accessor: "usage_no" },
    { label: "Usage Date", accessor: "usage_date" },
    { label: "PCB Model", accessor: "pcb_model" },
    { label: "Job Batch", accessor: "job_batch_no" },
    { label: "Spare Code", accessor: "spare_code" },
    { label: "Spare Name", accessor: "spare_name" },
    { label: "Qty Used", accessor: "quantity_used" },
    { label: "Unit Cost", accessor: "unit_cost" },
    { label: "Total Cost", accessor: "total_cost" },
    { label: "Employee", accessor: "employee_name" },
    { label: "Department", accessor: "department" },
    { label: "Usage Type", accessor: "usage_type" },
  ];

  return (
    <ReportModal
      title="Spare Usage Report"
      isOpen={isOpen}
      onClose={onClose}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      showClientFilter={true}
      clientList={spareNameList}
      clientName={spareName}
      onClientNameChange={setSpareName}
      clientLabel="SPARE NAME"
      loading={loading}
      contentRef={contentRef}
      exportFileName="Spare_Usage_Report"
      exportColumns={columns}
      exportData={data}
    >
      <div ref={contentRef}>
        {data.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8 italic">No data found. Set filters and click SEARCH.</p>
        ) : (
          <div className="w-full p-3" style={{ fontFamily: "'Tahoma','Arial',sans-serif" }}>
            <table className="w-full border-collapse table-auto" style={{ fontSize: "13px" }}>
              <colgroup>
                <col style={{ width: "40px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "65px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "100px" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 5px", textAlign: "center", fontWeight: "bold", whiteSpace: "nowrap" }}>#</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Usage No</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Usage Date</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Model</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Job Batch</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Spare Code</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Spare Name</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Qty Used</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Unit Cost</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Total Cost</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Employee</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Dept</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Usage Type</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", fontWeight: "600", whiteSpace: "nowrap" }}>{row.usage_no}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333", whiteSpace: "nowrap" }}>{fmtDate(row.usage_date)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#222" }}>{row.pcb_model}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.job_batch_no}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#00008b", fontWeight: "600" }}>{row.spare_code}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.spare_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{fmtNum(row.quantity_used)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{fmtNum(row.unit_cost)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#8b0000", fontWeight: "600" }}>{fmtNum(row.total_cost)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.employee_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.department}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.usage_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ReportModal>
  );
};

export default SpareUsageReportModal;
