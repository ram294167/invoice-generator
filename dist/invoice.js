
function addItem() {
  const tbody = document.getElementById("item-body");
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${tbody.rows.length + 1 - 1}</td>
    <td><input type="text" oninput="calcTotals(); saveToLocalStorage()"></td>
    <td><input type="text" value="" oninput="calcTotals(); saveToLocalStorage()"></td>
    <td><input type="number" value="" onchange="calcTotals(); saveToLocalStorage()"></td>
    <td><input type="number" value="" onchange="calcTotals(); saveToLocalStorage()"></td>
    <td><input type="number" value="" onchange="calcTotals(); saveToLocalStorage()"></td>
    <td><input type="number" readonly></td>
    <td><input type="number" value="18" onchange="calcTotals(); saveToLocalStorage()"></td>
    <td><input type="number" readonly></td>
    <td><input type="number" readonly></td>
  `;
  calcTotals();
  saveToLocalStorage();
}

function calcTotals() {
  let totalTaxable = 0;
  let totalGST = 0;
  let grandTotal = 0;

  document.querySelectorAll("#item-body tr").forEach(row => {
    const qty = parseFloat(row.cells[3]?.querySelector("input")?.value || 0);
    const rate = parseFloat(row.cells[4]?.querySelector("input")?.value || 0);
    const discount = parseFloat(row.cells[5]?.querySelector("input")?.value || 0);
    const gstPercent = parseFloat(row.cells[7]?.querySelector("input")?.value || 0);

    const taxable = qty * rate - discount;
    const gstAmt = (taxable * gstPercent) / 100;
    const total = taxable + gstAmt;

    // Update each row's calculated fields
    if (row.cells[6]) row.cells[6].querySelector("input").value = taxable.toFixed(2);
    if (row.cells[8]) row.cells[8].querySelector("input").value = gstAmt.toFixed(2);
    if (row.cells[9]) row.cells[9].querySelector("input").value = total.toFixed(2);

    totalTaxable += taxable;
    totalGST += gstAmt;
    grandTotal += total;
  });

  // Update footer inputs\
  document.getElementById("totalGST").innerText = totalGST.toFixed(2);
document.getElementById("grandTotal").innerText = grandTotal.toFixed(2);
document.getElementById("totalTaxable").innerText = totalTaxable.toFixed(2); // you must compute this too

}


function downloadPDF() {
  const fromText = document.getElementById("fromAddress").value;
  document.getElementById("fromAddressDisplay").innerText = fromText;

  const invoice = document.getElementById("invoice-content");
  invoice.classList.add("pdf-mode");

  const opt = {
    margin: 5,
    filename: "Invoice.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
  };

  // First: Save PDF to user's browser
  html2pdf()
    .set(opt)
    .from(invoice)
    .save()
    .then(() => {
      // Second: Send a copy to the server
      html2pdf()
        .set(opt)
        .from(invoice)
        .outputPdf("blob")
        .then((blob) => {
          savePDFToServer(blob); // 🔁 Save PDF to server
          invoice.classList.remove("pdf-mode");
        });
    });
}






function saveToLocalStorage() {
  const getVal = id => document.getElementById(id)?.value || "";

  const data = {
    companyName: getVal("companyName"),
    invoiceNo: getVal("invoiceNo"),
    invoiceDate: getVal("invoiceDate"),
    eventName: getVal("eventName"),
    placeOfSupply: getVal("placeOfSupply"),
    orderNo: getVal("orderNo"),
    phoneNumber: getVal("phoneNumber"),
    fromAddress: getVal("fromAddress"),
    items: []
  };

  document.querySelectorAll("#item-body tr").forEach(row => {
    const cells = row.querySelectorAll("td input");
    if (cells.length >= 7) {
      data.items.push({
        product: cells[0].value,
        hsn: cells[1].value,
        qty: cells[2].value,
        rate: cells[3].value,
        discount: cells[4].value,
        gst: cells[6].value
      });
    }
  });

  localStorage.setItem("invoiceData", JSON.stringify(data));
}


function loadFromLocalStorage() {
  const saved = localStorage.getItem("invoiceData");
  if (!saved) return;
  const data = JSON.parse(saved);
  document.getElementById("companyName").value = data.companyName || "";
  document.getElementById("invoiceNo").value = data.invoiceNo;
  document.getElementById("invoiceDate").value = data.invoiceDate;
  document.getElementById("eventName").value = data.eventName;
  document.getElementById("placeOfSupply").value = data.placeOfSupply;
  document.getElementById("orderNo").value = data.orderNo;
  document.getElementById("phoneNumber").value = data.phoneNumber;
  document.getElementById("fromAddress").value = data.fromAddress;
  document.getElementById("toAddress").value = data.toAddress;
  const tbody = document.getElementById("item-body");
  tbody.innerHTML = '';
  data.items.forEach((item, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><input type="text" value="${item.product}" oninput="calcTotals(); saveToLocalStorage()"></td>
      <td class="col-hsn"><input type="text" value="491110"></td>
      <td><input type="number" value="${item.qty}" onchange="calcTotals(); saveToLocalStorage()"></td>
      <td><input type="number" value="${item.rate}" onchange="calcTotals(); saveToLocalStorage()"></td>
       <td class="col-disc"><input type="number" value="0"></td>
        <td class="col-gst"><input type="number" value="18"></td>
       <td class="col-gstAmt"><input type="number" readonly></td>
      <td><input type="number" readonly></td>
    `;
  });
  calcTotals();
}

function clearData() {
  localStorage.removeItem("invoiceData");
  location.reload();
}

function previewLogo() {
  const input = document.getElementById('logoInput');
  const logo = document.getElementById('logo');
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = function (e) {
    logo.src = e.target.result;
    logo.style.display = 'block';
    input.style.display = 'none'; // ✅ Hide the file input
  };
  if (file) {
    reader.readAsDataURL(file);
  }
}

function previewQR() {
  const input = document.getElementById('qrInput');
  const img = document.getElementById('qrPreview');
  if (input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
      img.style.display = 'block';
      input.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function previewSignature() {
  const input = document.getElementById('signatureInput');
  const img = document.getElementById('signaturePreview');
  if (input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
      img.style.display = 'block';
       input.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }
}
function savePDFToServer(blob) {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result.split(',')[1];
    const filename = `invoice_${Date.now()}.pdf`;
    fetch('/api/save-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64 })
    }).then(res => {
      if (res.ok) alert('Invoice saved to your account.');
    });
  };
  reader.readAsDataURL(blob);
}

function handleMenuSelect() {
  const action = document.getElementById('userMenu').value;

  if (action === 'invoices') {
    loadInvoices();
  } else if (action === 'clear') {
    clearInvoiceUI();
  } else if (action === 'logout') {
    fetch('/api/logout').then(() => location.href = '/login.html');
  }

  // Reset to default menu label after selection
  document.getElementById('userMenu').value = '';
}

function loadInvoices() {
  fetch('/api/invoices')
    .then(res => res.json())
    .then(files => {
      const list = document.getElementById('invoiceList');
      list.style.display = 'block';
      list.innerHTML = '<option value="">-- Select Invoice --</option>';

      files.forEach(file => {
        const opt = document.createElement('option');
        opt.value = file;
        opt.textContent = file;
        list.appendChild(opt);
      });

      document.getElementById('invoiceButtons').style.display = 'none';
    });
}

function showInvoiceButtons() {
  const selected = document.getElementById('invoiceList').value;
  document.getElementById('invoiceButtons').style.display = selected ? 'block' : 'none';
}

function viewSelectedInvoice() {
  const selected = document.getElementById('invoiceList').value;
  if (selected) {
    window.open(`/api/view/${selected}`, '_blank');
  }
}

function downloadSelectedInvoice() {
  const selected = document.getElementById('invoiceList').value;
  if (selected) {
    const a = document.createElement('a');
    a.href = `/api/download/${selected}`;
    a.download = selected;
    a.click();
  } else {
    alert('Please select an invoice to download.');
  }
}

function deleteSelectedInvoice() {
  const selected = document.getElementById('invoiceList').value;
  if (!selected) {
    alert('Please select an invoice to delete.');
    return;
  }

  const confirmDelete = confirm(`Are you sure you want to delete "${selected}"?`);
  if (!confirmDelete) return;

  fetch(`/api/delete/${selected}`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Delete failed');
    alert(`"${selected}" has been deleted.`);
    loadInvoices(); // reload list
  })
  .catch(err => {
    console.error(err);
    alert('Error deleting invoice.');
  });
}
