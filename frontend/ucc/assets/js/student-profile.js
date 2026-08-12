// frontend/ucc/assets/js/student-profile.js

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const API_BASE_URL = 'http://localhost:5002/api';

  // Format currency
  function fmt(amt) {
    return '৳' + Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Get roll parameter from URL
  function getRollFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('roll') || params.get('id');
  }

  // Switch tabs
  window.switchTab = function(tabName, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content-panel').forEach(panel => panel.classList.remove('active'));

    btnEl.classList.add('active');
    const targetPanel = document.getElementById(`tab-${tabName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  };

  async function loadStudentProfile() {
    const roll = getRollFromURL();

    if (!roll) {
      // No roll parameter - show error state
      document.getElementById('profileName').textContent = 'No Student Selected';
      document.getElementById('profileRoll').textContent = 'ROLL: ---';
      return;
    }

    try {
      // Fetch from UCC API
      const response = await fetch(`${API_BASE_URL}/ucc/students?search=${encodeURIComponent(roll)}`);
      const data = await response.json();

      if (!data.success || !data.students || data.students.length === 0) {
        document.getElementById('profileName').textContent = `No Student Found (Roll: ${roll})`;
        document.getElementById('profileRoll').textContent = 'ROLL: ---';
        return;
      }

      // Find exact roll match first
      const s = data.students.find(st => st.roll === roll) || data.students[0];

      // Map UCC data to display format
      const student = {
        _id: s._id,
        roll: s.roll,
        name: s.name,
        phone: s.phone || 'N/A',
        guardian: s.guardianName || 'N/A',
        guardianPhone: s.guardianPhone || 'N/A',
        batch: s.batchName || 'General',
        program: s.program || 'N/A',
        branch: s.branch || 'Pabna',
        totalFee: s.finalFee || s.courseFee || 0,
        courseFee: s.courseFee || 0,
        discount: s.discountAmount || 0,
        paid: s.totalPaid || 0,
        due: s.totalDue || 0,
        paymentStatus: s.paymentStatus || 'Unpaid',
        materials: s.distributionOverride ? 'Distributed' : (s.totalDue === 0 ? 'Distributed' : 'Pending'),
        status: s.status || 'Active',
        admissionDate: s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'
      };

      // Populate Page Header
      document.getElementById('avatarLetter').textContent = (student.name || 'S').charAt(0).toUpperCase();
      document.getElementById('profileName').textContent = student.name || 'Student Name';
      document.getElementById('profileRoll').textContent = `ROLL: ${student.roll || 'N/A'}`;
      document.getElementById('profileBatch').textContent = student.batch || 'General Batch';
      document.getElementById('profilePhone').textContent = student.phone || 'N/A';
      document.getElementById('profileGuardian').textContent = student.guardianPhone || student.guardian || 'N/A';

      // Status badge
      const statusBadge = document.getElementById('profileStatus');
      if (student.status === 'Active') {
        statusBadge.className = 'status-badge-custom status-active';
        statusBadge.textContent = 'ACTIVE';
      } else {
        statusBadge.className = 'status-badge-custom status-inactive';
        statusBadge.textContent = (student.status || 'INACTIVE').toUpperCase();
      }

      // Action Links
      document.getElementById('btnCollectPayment').href = `payment.html?roll=${encodeURIComponent(student.roll)}`;
      document.getElementById('btnIssueMaterials').href = `distribution.html?roll=${encodeURIComponent(student.roll)}`;

      // Populate Stat Cards
      const totalFee = student.totalFee || 0;
      const paid = student.paid || 0;
      const due = student.due !== undefined ? student.due : Math.max(0, totalFee - paid);

      document.getElementById('statTotalFee').textContent = fmt(totalFee);
      document.getElementById('statTotalPaid').textContent = fmt(paid);
      document.getElementById('statTotalDue').textContent = fmt(due);
      document.getElementById('statMaterialStatus').textContent = student.materials || 'Pending';

      // Payment status badge on stat
      if (due <= 0) {
        document.getElementById('statMaterialStatus').textContent = 'Full Paid';
      }

      // Tab 1: Overview
      document.getElementById('infoName').textContent = student.name || '---';
      document.getElementById('infoRoll').textContent = student.roll || '---';
      document.getElementById('infoPhone').textContent = student.phone || '---';
      document.getElementById('infoGuardian').textContent = student.guardian || '---';
      document.getElementById('infoGuardianPhone').textContent = student.guardianPhone || '---';
      document.getElementById('infoBatch').textContent = student.batch || '---';
      document.getElementById('infoUnit').textContent = student.program || '---';
      document.getElementById('infoBranch').textContent = student.branch || 'Pabna Branch';
      document.getElementById('infoAdmissionDate').textContent = student.admissionDate || '---';

      // Tab 2: Payments History - Fetch actual payment records
      try {
        const payRes = await fetch(`${API_BASE_URL}/ucc/students/${student._id}`);
        const payData = await payRes.json();
        if (payData.success && payData.payments && payData.payments.length > 0) {
          const paymentBody = document.getElementById('paymentHistoryBody');
          paymentBody.innerHTML = payData.payments.map(p => `
            <tr>
              <td style="font-weight:700;color:var(--ucc-primary);">${p.receiptNo}</td>
              <td>${new Date(p.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td>${p.paymentType || 'Installment'}${p.remarks ? ' - ' + p.remarks : ''}</td>
              <td>${p.paymentMethod || 'Cash'}</td>
              <td style="font-weight:800;color:var(--ucc-success);">${fmt(p.amount)}</td>
              <td>
                <a href="payment.html?receipt=${encodeURIComponent(p.receiptNo)}" class="ucc-btn ucc-btn-sm ucc-btn-outline" style="padding:4px 10px;font-size:12px;">
                  <i class="fas fa-print"></i> Receipt
                </a>
              </td>
            </tr>
          `).join('');
        } else {
          document.getElementById('paymentHistoryBody').innerHTML = `
            <tr>
              <td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">No payment records found.</td>
            </tr>
          `;
        }
      } catch (payErr) {
        console.warn('Failed to fetch payments:', payErr);
      }

      // Tab 3: Materials
      const matItemsEl = document.getElementById('materialItemsList');
      if (matItemsEl) {
        matItemsEl.textContent = student.materials === 'Distributed' 
          ? 'All books & lecture sheets issued. ✅'
          : `Pending due: ${fmt(due)}. Books & sheets will be issued after due cleared.`;
      }

    } catch (err) {
      console.error('Error loading student profile:', err);
      document.getElementById('profileName').textContent = 'Error Loading Student';
      document.getElementById('profileRoll').textContent = 'ROLL: ---';
    }
  }

  loadStudentProfile();
});
