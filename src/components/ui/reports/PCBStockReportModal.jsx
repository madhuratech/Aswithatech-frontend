import API_BASE_URL from "../../../config/api";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReportModal from "../ReportModal";

const PCBStockReportModal = ({ isOpen, onClose }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierList, setSupplierList] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE_URL}/pcb-stock/suppliers`)
      .then((r) => r.json())
      .then((list) => setSupplierList(Array.isArray(list) ? list : []))
      .catch(() => setSupplierList([]));
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (supplierName) params.set("supplier_name", supplierName);
      const res = await fetch(`${API_BASE_URL}/pcb-stock/report?${params}`);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, supplierName]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const fmtNum = (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : "-");

  const columns = [
    { label: "PCB Code", accessor: "pcb_code" },
    { label: "PCB Name", accessor: "pcb_name" },
    { label: "Model", accessor: "pcb_model" },
    { label: "Category", accessor: "pcb_category" },
    { label: "Supplier", accessor: "supplier_name" },
    { label: "Qty Received", accessor: "quantity_received" },
    { label: "Available", accessor: "available_quantity" },
    { label: "Min Stock", accessor: "minimum_stock_level" },
    { label: "Unit Cost", accessor: "unit_cost" },
    { label: "Stock Value", accessor: "stock_value" },
    { label: "Rack", accessor: "rack_number" },
    { label: "Status", accessor: "status" },
  ];

  return (
    <ReportModal
      title="PCB Stock Report"
      isOpen={isOpen}
      onClose={onClose}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      clientList={supplierList}
      clientName={supplierName}
      onClientNameChange={setSupplierName}
      clientLabel="SUPPLIER NAME"
      showClientFilter={true}
      loading={loading}
      contentRef={contentRef}
      exportFileName="PCB_Stock_Report"
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
                <col style={{ width: "140px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "80px" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#c5d7e9", color: "#0d2340", position: "sticky", top: 0, zIndex: 10 }}>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 5px", textAlign: "center", fontWeight: "bold", whiteSpace: "nowrap" }}>#</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Code</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>PCB Name</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Model</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Category</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Supplier</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Qty Recv</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Available</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Min Stk</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Unit Cost</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }}>Stock Value</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Rack</th>
                  <th style={{ border: "1px solid #8ca8c5", padding: "5px 8px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#edf2f8" }}>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 5px", textAlign: "center", color: "#555" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#00008b", fontWeight: "600", whiteSpace: "nowrap" }}>{row.pcb_code}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#222" }}>{row.pcb_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.pcb_model}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.pcb_category}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.supplier_name}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{fmtNum(row.quantity_received)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#006400", fontWeight: "600" }}>{fmtNum(row.available_quantity)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{fmtNum(row.minimum_stock_level)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#333" }}>{fmtNum(row.unit_cost)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", textAlign: "right", color: "#8b0000", fontWeight: "600" }}>{fmtNum(row.stock_value)}</td>
                    <td style={{ border: "1px solid #d0d0d0", padding: "4px 8px", color: "#333" }}>{row.rack_number}</td>
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

export default PCBStockReportModal;
