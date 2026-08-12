// frontend/ucc/assets/js/receipt.js

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const API_BASE_URL = 'http://localhost:5002/api';

  // Format currency
  function fmtBDT(val) {
    return '৳' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Paper Size Toggle
  window.changePaperSize = function(size) {
    const container = document.getElementById('receiptContainer');
    const buttons = document.querySelectorAll('.size-btn');

    buttons.forEach(btn => {
      if (btn.getAttribute('data-size') === size) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (container) {
      if (size === 'a4') {
        container.classList.remove('a5-paper');
        container.classList.add('a4-paper');
      } else {
        container.classList.remove('a4-paper');
        container.classList.add('a5-paper');
      }
    }
    document.body.dataset.paperSize = size;
  };

  // Dedicated Print Receipt function
  window.printReceipt = function() {
    try {
      window.focus();
      setTimeout(() => {
        window.print();
      }, 50);
    } catch (err) {
      console.error('Print failed:', err);
      window.print();
    }
  };

  // Download PDF
  window.downloadPDF = function() {
    const element = document.getElementById('receiptContainer');
    if (!element) return;

    const receiptNo = document.getElementById('receiptNo').textContent || 'UCC-Receipt';
    const opt = {
      margin:       0.2,
      filename:     `${receiptNo}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a5', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  // Populate Receipt Data
  async function loadReceipt() {
    const urlParams = new URLSearchParams(window.location.search);
    const receiptNo = urlParams.get('receipt') || urlParams.get('id') || 'UCC-R-10001';
    const roll = urlParams.get('roll') || '101';

    let paymentData = null;
    let studentData = null;

    // Try API fetch
    try {
      const res = await fetch(`${API_BASE_URL}/payments/receipt/${encodeURIComponent(receiptNo)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.payment) {
          paymentData = json.payment;
          studentData = json.student;
        }
      }
    } catch (err) {
      console.warn('Receipt API unavailable, using local mock data:', err);
    }

    // Mock fallback data if not fetched from API
    if (!paymentData) {
      paymentData = {
        receiptNo: receiptNo,
        date: new Date().toISOString(),
        paymentMethod: 'bKash / Online',
        amount: 15000,
        admissionFee: 5000,
        monthlyFee: 10000,
        totalFee: 15000,
        discount: 0,
        paid: 15000,
        due: 0,
        status: 'Paid'
      };
    }

    if (!studentData) {
      studentData = {
        roll: roll,
        name: 'Md. Tanvir Hossain',
        father: 'Md. Abdul Karim',
        batch: 'Medical Special-01',
        unit: 'Medical & Varsity A',
        phone: '01712345678',
        status: 'Active'
      };
    }

    // Update Student UI
    document.getElementById('receiptNo').textContent = paymentData.receiptNo || receiptNo;
    document.getElementById('receiptDate').textContent = formatDate(paymentData.date);
    document.getElementById('studentId').textContent = studentData.roll || roll;
    document.getElementById('studentName').textContent = studentData.name || 'Student Name';
    document.getElementById('fatherName').textContent = studentData.father || studentData.guardian || 'N/A';
    document.getElementById('batch').textContent = studentData.batch || 'General Batch';
    document.getElementById('className').textContent = studentData.unit || 'Medical Special';
    document.getElementById('phone').textContent = studentData.phone || 'N/A';

    // Update Payment UI
    document.getElementById('transactionId').textContent = 'TXN' + (paymentData.receiptNo || receiptNo).replace(/[^0-9]/g, '');
    document.getElementById('paymentMethod').textContent = paymentData.paymentMethod || 'Cash';
    document.getElementById('paymentMonth').textContent = formatDate(paymentData.date);
    document.getElementById('paymentTime').textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const paidVal = paymentData.paid || paymentData.amount || 15000;
    const dueVal = paymentData.due !== undefined ? paymentData.due : 0;
    const totalFeeVal = paymentData.totalFee || 15000;
    const discountVal = paymentData.discount || 0;
    const discountRefText = urlParams.get('discountRef') || paymentData.discountRef || paymentData.reference || '';

    // Description = Student's Batch Course Fee
    const feeDescEl = document.getElementById('feeDescription');
    if (feeDescEl) {
      feeDescEl.textContent = `${studentData.batch || 'Course'} Fee`;
    }
    const feeItemEl = document.getElementById('totalCourseFeeItem');
    if (feeItemEl) {
      feeItemEl.textContent = fmtBDT(totalFeeVal).replace('৳', '');
    }

    document.getElementById('totalFee').textContent = fmtBDT(totalFeeVal);
    document.getElementById('totalDiscount').textContent = fmtBDT(discountVal);
    
    // Discount Reference Display
    const discountRefRow = document.getElementById('discountRefRow');
    const discountRefName = document.getElementById('discountRefName');
    if (discountRefRow && discountRefName) {
      if (discountVal > 0 || discountRefText) {
        discountRefName.textContent = discountRefText || 'Special Discount';
        discountRefRow.style.display = 'block';
      } else {
        discountRefRow.style.display = 'none';
      }
    }

    document.getElementById('paidAmount').textContent = fmtBDT(paidVal);
    document.getElementById('dueAmount').textContent = fmtBDT(dueVal);

    // Dynamic Top-Right QR Code Generation
    const qrImgEl = document.getElementById('receiptQrCode');
    if (qrImgEl) {
      const qrDataText = `UCC PABNA RECEIPT\nReceipt: ${paymentData.receiptNo || receiptNo}\nStudent: ${studentData.name} (Roll: ${studentData.roll || roll})\nPaid: BDT ${paidVal}\nStatus: ${paymentData.status || 'Paid'}`;
      qrImgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrDataText)}`;
    }
  }

  loadReceipt();
});
