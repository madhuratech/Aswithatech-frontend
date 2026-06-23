import API_BASE_URL from "../../../config/api";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReportModal from "../ReportModal";

const ScrapDamageReportModal = ({ isOpen, onClose }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pcbName, setPcbName] = useState("");
  const [pcbNameList, setPcbNameList] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE_URL}/scrappcb/pcb-names`)
      .then((r) => r.json())
      .then((list) => setPcbNameList(Array.isArray(list) ? list : []))
      .catch(() => setPcbNameList([]));
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (pcbName) params.set("pcbName", pcbName);
      const res = await fetch(`${API_BASE_URL}/scrappcb/report?${params}`);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, pcbName]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";
  const fmtNum = (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : "-");

  const columns = [
    { label: "Scrap No", accessor: "scrap_no" },
    { label: "PCB Code", accessor: "pcb_code" },
    { label: "PCB Name", accessor: "pcb_name" },
    { label: "Model", accessor: "pcb_model" },
    { label: "Quantity", accessor: "quantity" },
    { label: "Damage Date", accessor: "damage_date" },
    { label: "Damage Type", accessor: "damage_type" },
    { label: "Reason", accessor: "reason" },
    { label: "Source", accessor: "source" },
    { label: "Scrap Value", accessor: "scrap_value" },
    { label: "Approved By", accessor: "approved_by" },
  ];

  return (
    <ReportModal
      title="Scrap / Damaged PCB Report"
      isOpen={isOpen}
      onClose={onClose}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      showClientFilter={true}
      clientList={pcbNameList}
      clientName={pcbName}
      onClientNameChange={setPcbName}
      clientLabel="PCB NAME"
      loading={loading}
      contentRef={contentRef}
      exportFileName="Scrap_Damaged_PCB_Report"
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
                <col style={{ width: "140px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "50px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "110px" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 5px", textAlign: "center", fontWeight: "bold", whiteSpace: "nowrap" }}>#</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Scrap No</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Code</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Name</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Model</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Qty</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Damage Date</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Damage Type</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Reason</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Source</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Scrap Value</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", fontWeight: "600", whiteSpace: "nowrap" }}>{row.scrap_no}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#00008b", fontWeight: "600" }}>{row.pcb_code}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#222" }}>{row.pcb_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.pcb_model}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{row.quantity}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333", whiteSpace: "nowrap" }}>{fmtDate(row.damage_date)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.damage_type}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.reason}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.source}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#8b0000", fontWeight: "600" }}>{fmtNum(row.scrap_value)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.approved_by}</td>
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

export default ScrapDamageReportModal;
