import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import './InvoicePage.css'

const emptyItem = {
  product: '',
  qty: 1,
  rate: 0,
  discount: 0,
  gst: 18,
}

const initialInvoiceData = {
  companyName: '',
  fromAddress: '',
  invoiceNo: '',
  invoiceDate: '',
  eventName: '',
  placeOfSupply: '',
  orderNo: '',
  phoneNumber: '',
  items: [{ ...emptyItem }],
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  noteText: '',
  logoSrc: '',
  qrSrc: '',
  signatureSrc: '',
}

function formatNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

function InvoicePage() {
  const invoiceRef = useRef(null)
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData)

  const totals = useMemo(() => {
    let totalTaxable = 0
    let totalGST = 0
    let grandTotal = 0

    invoiceData.items.forEach((item) => {
      const qty = Number(item.qty) || 0
      const rate = Number(item.rate) || 0
      const discount = Number(item.discount) || 0
      const gst = Number(item.gst) || 0
      const taxable = Math.max(0, qty * rate - discount)
      const gstAmt = (taxable * gst) / 100
      const total = taxable + gstAmt

      totalTaxable += taxable
      totalGST += gstAmt
      grandTotal += total
    })

    return {
      totalTaxable,
      totalGST,
      grandTotal,
    }
  }, [invoiceData.items])

  useEffect(() => {
    const saved = localStorage.getItem('invoiceData')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setInvoiceData((current) => ({ ...current, ...parsed, items: parsed.items?.length ? parsed.items : [{ ...emptyItem }] }))
      } catch (error) {
        console.error('Failed to parse saved invoice data', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('invoiceData', JSON.stringify(invoiceData))
  }, [invoiceData])

  function updateField(field, value) {
    setInvoiceData((current) => ({ ...current, [field]: value }))
  }

  function updateItem(index, field, value) {
    setInvoiceData((current) => ({
      ...current,
      items: current.items.map((item, idx) =>
        idx === index ? { ...item, [field]: field === 'product' || field === 'hsn' ? value : Number(value) } : item
      ),
    }))
  }

  function addItem() {
    setInvoiceData((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem }],
    }))
  }

  function clearData() {
    setInvoiceData(initialInvoiceData)
    localStorage.removeItem('invoiceData')
  }

  function handleFilePreview(field, file) {
    if (!file) {
      updateField(field, '')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      updateField(field, event.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function downloadPDF() {
    if (!invoiceRef.current) return
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'pt', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 16
    const scale = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height)
    const imgWidth = canvas.width * scale
    const imgHeight = canvas.height * scale
    const x = Math.max(margin, (pageWidth - imgWidth) / 2)
    const y = Math.max(margin, (pageHeight - imgHeight) / 2)
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
    pdf.save(`${invoiceData.invoiceNo || 'invoice'}.pdf`)
  }

  return (
    <div className="invoice-page-shell">
      <header className="invoice-app-header">
        <div>
          <h1>Invoice Builder</h1>

        </div>
      </header>

      <div className="invoice-body">
        <section className="invoice-form-panel">
          <div className="card invoice-form-card">
            <h2>Invoice Details</h2>
            <div className="field-grid">
              <label>
                Company Name
                <input
                  type="text"
                  value={invoiceData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                />
              </label>
              <label>
                Invoice No
                <input
                  type="text"
                  value={invoiceData.invoiceNo}
                  onChange={(e) => updateField('invoiceNo', e.target.value)}
                />
              </label>
              <label>
                Invoice Date
                <input
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                />
              </label>
              <label>
                Event Name
                <input
                  type="text"
                  value={invoiceData.eventName}
                  onChange={(e) => updateField('eventName', e.target.value)}
                />
              </label>
              <label>
                Place of Supply
                <input
                  type="text"
                  value={invoiceData.placeOfSupply}
                  onChange={(e) => updateField('placeOfSupply', e.target.value)}
                />
              </label>
              <label>
                Order No
                <input
                  type="text"
                  value={invoiceData.orderNo}
                  onChange={(e) => updateField('orderNo', e.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  type="text"
                  value={invoiceData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="card invoice-form-card">
            <h2>Provider Details</h2>
            <label>
              From Address
              <textarea
                value={invoiceData.fromAddress}
                onChange={(e) => updateField('fromAddress', e.target.value)}
                rows={5}
              />
            </label>
          </div>

          <div className="card invoice-form-card">
            <h2>Item lines</h2>
            <div className="table-wrap">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Sr</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Disc</th>
                    <th>Tax</th>
                    <th>GST%</th>
                    <th>GST Amt</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => {
                    const qty = Number(item.qty) || 0
                    const rate = Number(item.rate) || 0
                    const discount = Number(item.discount) || 0
                    const gst = Number(item.gst) || 0
                    const taxable = Math.max(0, qty * rate - discount)
                    const gstAmt = (taxable * gst) / 100
                    const total = taxable + gstAmt

                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={item.product}
                            onChange={(e) => updateItem(index, 'product', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.qty}
                            onChange={(e) => updateItem(index, 'qty', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateItem(index, 'discount', e.target.value)}
                          />
                        </td>
                        <td>
                          <input type="text" value={formatNumber(taxable)} readOnly />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.gst}
                            onChange={(e) => updateItem(index, 'gst', e.target.value)}
                          />
                        </td>
                        <td>
                          <input type="text" value={formatNumber(gstAmt)} readOnly />
                        </td>
                        <td>
                          <input type="text" value={formatNumber(total)} readOnly />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button className="btn btn-secondary add-item-btn" onClick={addItem}>Add Item</button>
          </div>

          <div className="card invoice-form-card">
            <h2>Additional details</h2>
            <div className="field-grid field-grid-2">
              <label>
                Bank Name
                <input
                  type="text"
                  value={invoiceData.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                />
              </label>
              <label>
                Account Number
                <input
                  type="text"
                  value={invoiceData.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                />
              </label>
              <label>
                IFSC Code
                <input
                  type="text"
                  value={invoiceData.ifscCode}
                  onChange={(e) => updateField('ifscCode', e.target.value)}
                />
              </label>
              <label>
                Notes
                <textarea
                  rows={3}
                  value={invoiceData.noteText}
                  onChange={(e) => updateField('noteText', e.target.value)}
                />
              </label>
            </div>

            <div className="upload-grid">
              <label className="upload-block">
                Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFilePreview('logoSrc', e.target.files?.[0])}
                />
              </label>
              <label className="upload-block">
                QR Code
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFilePreview('qrSrc', e.target.files?.[0])}
                />
              </label>
              <label className="upload-block">
                Signature
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFilePreview('signatureSrc', e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="invoice-preview-panel">
          <div className="invoice-container" ref={invoiceRef}>
            <div className="top-bar">
              <div className="logo-box">
                {invoiceData.logoSrc ? (
                  <img src={invoiceData.logoSrc} alt="Logo" className="logo-img" />
                ) : (
                  <div className="logo-placeholder">Upload logo above</div>
                )}
              </div>
              <div className="company-name-display">
                <h2>{invoiceData.companyName || 'Company Name'}</h2>
              </div>
            </div>

            <div className="address-section">
              <div className="from-box">
                <h4>From</h4>
                <pre>{invoiceData.fromAddress || 'Provider address goes here'}</pre>
              </div>
              <div className="invoice-info-box">
                <h4>Invoice Details</h4>
                <div className="invoice-data-row">
                  <span>Invoice No:</span>
                  <strong>{invoiceData.invoiceNo || '-'}</strong>
                </div>
                <div className="invoice-data-row">
                  <span>Date:</span>
                  <strong>{invoiceData.invoiceDate || '-'}</strong>
                </div>
                <div className="invoice-data-row">
                  <span>Event Name:</span>
                  <strong>{invoiceData.eventName || '-'}</strong>
                </div>
                <div className="invoice-data-row">
                  <span>Place of Supply:</span>
                  <strong>{invoiceData.placeOfSupply || '-'}</strong>
                </div>
                <div className="invoice-data-row">
                  <span>Order No:</span>
                  <strong>{invoiceData.orderNo || '-'}</strong>
                </div>
                <div className="invoice-data-row">
                  <span>Phone:</span>
                  <strong>{invoiceData.phoneNumber || '-'}</strong>
                </div>
              </div>
            </div>

            <table className="preview-items-table">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Disc</th>
                  <th>Tax</th>
                  <th>GST%</th>
                  <th>GST Amt</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => {
                  const qty = Number(item.qty) || 0
                  const rate = Number(item.rate) || 0
                  const discount = Number(item.discount) || 0
                  const gst = Number(item.gst) || 0
                  const taxable = Math.max(0, qty * rate - discount)
                  const gstAmt = (taxable * gst) / 100
                  const total = taxable + gstAmt

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.product || '-'}</td>
                      <td>{qty}</td>
                      <td>{formatNumber(rate)}</td>
                      <td>{formatNumber(discount)}</td>
                      <td>{formatNumber(taxable)}</td>
                      <td>{formatNumber(gst)}</td>
                      <td>{formatNumber(gstAmt)}</td>
                      <td>{formatNumber(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Total</td>
                  <td>{formatNumber(totals.totalTaxable)}</td>
                  <td />
                  <td>{formatNumber(totals.totalGST)}</td>
                  <td>{formatNumber(totals.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="matrix-container">
              <div className="matrix-row">
                <label>Bank Name:</label>
                <span>{invoiceData.bankName || '-'}</span>
              </div>
              <div className="matrix-row">
                <label>Account Number:</label>
                <span>{invoiceData.accountNumber || '-'}</span>
              </div>
              <div className="matrix-row">
                <label>IFSC Code:</label>
                <span>{invoiceData.ifscCode || '-'}</span>
              </div>
              <div className="matrix-row">
                <label>Note:</label>
                <span>{invoiceData.noteText || '-'}</span>
              </div>
              <div className="matrix-row">
                <label>QR Code:</label>
                {invoiceData.qrSrc ? <img src={invoiceData.qrSrc} alt="QR" className="qr-img" /> : <span>-</span>}
              </div>
              <div className="matrix-row">
                <label>Signature:</label>
                {invoiceData.signatureSrc ? <img src={invoiceData.signatureSrc} alt="Signature" className="signature-img" /> : <span>-</span>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default InvoicePage
