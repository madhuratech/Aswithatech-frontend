import API_BASE_URL from "../../../config/api";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReportModal from "../ReportModal";

const StandbyPCBStockReportModal = ({ isOpen, onClose }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerList, setCustomerList] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE_URL}/taxpurchases/clients`)
      .then((r) => r.json())
      .then((list) => setCustomerList(Array.isArray(list) ? list : []))
      .catch(() => setCustomerList([]));
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (customerName) params.set("customerName", customerName);
      const res = await fetch(`${API_BASE_URL}/standby-pcb/report/filters?${params}`);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, customerName]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "-";

  const columns = [
    { label: "Standby No", accessor: "standby_no" },
    { label: "PCB Code", accessor: "pcb_code" },
    { label: "PCB Name", accessor: "pcb_name" },
    { label: "Model", accessor: "pcb_model" },
    { label: "Quantity", accessor: "quantity" },
    { label: "Customer", accessor: "customer_name" },
    { label: "Allocated Date", accessor: "allocated_date" },
    { label: "Expected Return", accessor: "expected_return_date" },
    { label: "Status", accessor: "status" },
  ];

  return (
    <ReportModal
      title="Standby PCB Stock Report"
      isOpen={isOpen}
      onClose={onClose}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      clientList={customerList}
      clientName={customerName}
      onClientNameChange={setCustomerName}
      clientLabel="CUSTOMER NAME"
      showClientFilter={true}
      loading={loading}
      contentRef={contentRef}
      exportFileName="Standby_PCB_Stock_Report"
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
                <col style={{ width: "110px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "100px" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 5px", textAlign: "center", fontWeight: "bold", whiteSpace: "nowrap" }}>#</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Standby No</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Code</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Name</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Model</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Qty</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Customer</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Allocated Date</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Exp Return</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", fontWeight: "600", whiteSpace: "nowrap" }}>{row.standby_no}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#00008b", fontWeight: "600" }}>{row.pcb_code}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#222" }}>{row.pcb_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.pcb_model}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{row.quantity}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.customer_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333", whiteSpace: "nowrap" }}>{fmtDate(row.allocated_date)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333", whiteSpace: "nowrap" }}>{fmtDate(row.expected_return_date)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.status}</td>
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

export default StandbyPCBStockReportModal;
