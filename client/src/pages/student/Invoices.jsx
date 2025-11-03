import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar';
import { 
  FaFileInvoiceDollar, 
  FaRupeeSign, 
  FaDownload, 
  FaSpinner, 
  FaCreditCard,
  FaExclamationCircle
} from 'react-icons/fa';
import { getStudentInvoices, payInvoice } from '../../services/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getStudentInvoices();
      console.log('Fetched invoices response:', response);
      
      // With axios, the actual response data is in response.data
      if (response && response.data && response.data.success) {
        // Access the invoices array from response.data.data
        const invoicesData = response.data.data || [];
        
        const processedInvoices = invoicesData.map(invoice => ({
          ...invoice,
          amount: invoice.amount || (invoice.items && invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0)),
          status: invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Pending'
        }));
        
        setInvoices(processedInvoices);
      } else {
        const errorMsg = response?.data?.message || 'Failed to load invoices. Please try again later.';
        console.error('Error in fetchInvoices:', errorMsg);
        setError(errorMsg);
        setInvoices([]);
      }
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices. Please try again later.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (id) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await payInvoice(id, {});
      console.log('Payment response:', response);
      
      // With axios, the actual response data is in response.data
      if (response && response.data && response.data.success) {
        const updatedInvoice = response.data.data || {};
        
        const updatedInvoices = invoices.map(inv => 
          inv._id === id ? {
            ...inv,
            status: 'Paid',
            paidDate: new Date().toISOString(),
            paymentMethod: 'Online',
            transactionId: updatedInvoice.transactionId || null
          } : inv
        );
        
        setInvoices(updatedInvoices);
        
        if (selectedInvoice?._id === id) {
          setSelectedInvoice({
            ...selectedInvoice,
            status: 'Paid',
            paidDate: new Date().toISOString(),
            paymentMethod: 'Online',
            transactionId: updatedInvoice.transactionId || null
          });
        }
      } else {
        const errorMsg = response?.data?.message || 'Payment failed. Please try again later.';
        console.error('Error in handlePayNow:', errorMsg);
        setError(errorMsg);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotal = (invoice) => {
    return invoice.amount || (invoice.items && invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0)) || 0;
  };

  const handleDownloadInvoice = (invoiceId) => {
    console.log('Downloading invoice:', invoiceId);
    alert(`Download functionality for invoice ${invoiceId} would be implemented here`);
  };

  return (
    <div className="dashboard-container d-flex">
      <Sidebar role="student" />
      
      <div className="main-content flex-grow-1">
        <Navbar />
        
        <div className="dashboard-content">
          <div className="container-fluid py-4">
            <h2 className="mb-4 d-flex align-items-center">
              <FaFileInvoiceDollar className="me-2" />
              Fee Invoices
            </h2>
            
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <FaExclamationCircle className="me-2" />
                <div>{error}</div>
              </div>
            )}
            
            <div className="row">
              <div className="col-md-7">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-0">
                    {loading ? (
                      <div className="text-center py-5">
                        <FaSpinner className="fa-spin me-2" />
                        Loading invoices...
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No invoices found</p>
                        <button 
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={fetchInvoices}
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Invoice #</th>
                              <th>Date</th>
                              <th>Due Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((invoice) => (
                              <tr 
                                key={invoice._id}
                                className={selectedInvoice?._id === invoice._id ? 'table-active' : ''}
                                onClick={() => setSelectedInvoice(invoice)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>{invoice.invoiceNumber}</td>
                                <td>{formatDate(invoice.issueDate)}</td>
                                <td>{formatDate(invoice.dueDate)}</td>
                                <td>{formatCurrency(calculateTotal(invoice))}</td>
                                <td>
                                  <span className={`badge ${
                                    invoice.status === 'Paid' ? 'bg-success' :
                                    invoice.status === 'Overdue' ? 'bg-danger' : 'bg-warning'
                                  }`}>
                                    {invoice.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedInvoice(invoice);
                                      }}
                                    >
                                      View
                                    </button>
                                    {invoice.status === 'Pending' && (
                                      <button 
                                        className="btn btn-sm btn-success"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePayNow(invoice._id);
                                        }}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing && selectedInvoice?._id === invoice._id ? (
                                          <FaSpinner className="fa-spin" />
                                        ) : (
                                          'Pay'
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-md-5">
                {selectedInvoice ? (
                  <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Invoice Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4>Invoice #{selectedInvoice.invoiceNumber}</h4>
                        <span className={`badge ${
                          selectedInvoice.status === 'Paid' ? 'bg-success' :
                          selectedInvoice.status === 'Overdue' ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <p className="text-muted mb-1">Issue Date</p>
                          <p className="fw-bold">{formatDate(selectedInvoice.issueDate)}</p>
                        </div>
                        <div className="col-6">
                          <p className="text-muted mb-1">Due Date</p>
                          <p className="fw-bold">{formatDate(selectedInvoice.dueDate)}</p>
                        </div>
                      </div>
                      
                      <div className="card bg-light mb-3">
                        <div className="card-body">
                          <h5 className="card-title">Fee Breakdown</h5>
                          <table className="table table-sm mb-0">
                            <tbody>
                              {selectedInvoice.items?.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.description}</td>
                                  <td className="text-end">{formatCurrency(item.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="fw-bold">
                                <td>Total Amount</td>
                                <td className="text-end">{formatCurrency(calculateTotal(selectedInvoice))}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                      
                      {selectedInvoice.status === 'Paid' ? (
                        <div className="alert alert-success mb-4">
                          <p className="mb-1 fw-bold">Payment Received</p>
                          <p className="mb-0">
                            Paid on {formatDate(selectedInvoice.paidDate)}
                            {selectedInvoice.paymentMethod && (
                              <span className="ms-2">via {selectedInvoice.paymentMethod}</span>
                            )}
                            {selectedInvoice.transactionId && (
                              <div className="mt-1 small">
                                Transaction ID: {selectedInvoice.transactionId}
                              </div>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center mb-4">
                          <button 
                            className="btn btn-success btn-lg w-100 py-3"
                            onClick={() => handlePayNow(selectedInvoice._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <FaSpinner className="fa-spin me-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <FaCreditCard className="me-2" />
                                Pay Now {formatCurrency(calculateTotal(selectedInvoice))}
                              </>
                            )}
                          </button>
                          <p className="text-muted mt-2 small">
                            Secure payment powered by Razorpay
                          </p>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => handleDownloadInvoice(selectedInvoice._id)}
                        >
                          <FaDownload className="me-2" />
                          Download Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-5">
                      <FaFileInvoiceDollar className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                      <h5>Select an invoice to view details</h5>
                      <p className="text-muted">Click on any invoice from the list to view its details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}