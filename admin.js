/* ================= DASHBOARD ADMIN ================= */

// ✅ URL Google Apps Script Anda
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzkAmzKtY4v2ZHPK0T8MD14eNdWSxQR9QifgweARkxWEZk4l4wmlGKcKix5ZoBZkUtN/exec';

// Password login admin
const ADMIN_PASSWORD = 'admin123';

let semuaOrder = [];

/* ---------- LOGIN ---------- */
function login() {
  const input = document.getElementById('passwordInput').value;
  const err   = document.getElementById('loginErr');

  if (input === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    tampilDashboard();
  } else {
    err.textContent = '❌ Password salah!';
  }
}

function logout() {
  sessionStorage.removeItem('adminLoggedIn');
  location.reload();
}

function tampilDashboard() {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadOrders();
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    tampilDashboard();
  }

  document.getElementById('passwordInput')
    .addEventListener('keypress', e => {
      if (e.key === 'Enter') login();
    });

  document.getElementById('searchInput')
    .addEventListener('input', renderTabel);
  document.getElementById('filterStatus')
    .addEventListener('change', renderTabel);
});

/* ---------- LOAD ORDERS ---------- */
async function loadOrders() {
  const tbody = document.getElementById('orderBody');
  tbody.innerHTML = '<tr><td colspan="10" class="empty">Memuat data...</td></tr>';

  try {
    const res  = await fetch(GAS_URL + '?t=' + Date.now());
    const json = await res.json();

    if (json.status === 'success') {
      semuaOrder = json.data;
      renderTabel();
      updateStats();
    } else {
      tbody.innerHTML = `<tr><td colspan="10" class="empty">❌ ${json.message}</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="10" class="empty">❌ Gagal memuat data. Cek URL GAS.</td></tr>';
  }
}

/* ---------- RENDER TABEL ---------- */
function renderTabel() {
  const tbody  = document.getElementById('orderBody');
  const cari   = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;

  const filtered = semuaOrder.filter(o => {
    const cocokCari =
      (o.nama || '').toLowerCase().includes(cari) ||
      (o.produk || '').toLowerCase().includes(cari) ||
      (o.orderId || '').toLowerCase().includes(cari);

    const cocokStatus = !status || o.status === status;

    return cocokCari && cocokStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty">Tidak ada data order.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    let tgl = '-';
    try {
      tgl = new Date(o.tanggal).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {}

    const waLink = `https://wa.me/${(o.wa || '').replace(/^0/, '62')}`;

    return `
      <tr>
        <td><strong>${o.orderId || '-'}</strong></td>
        <td>${tgl}</td>
        <td>${o.nama || '-'}</td>
        <td>${o.wa || '-'}</td>
        <td>${o.produk || '-'}</td>
        <td>${o.jumlah || 0}</td>
        <td>Rp ${Number(o.total || 0).toLocaleString('id-ID')}</td>
        <td>${o.bayar || '-'}</td>
        <td><span class="badge ${o.status}">${o.status || 'Pending'}</span></td>
        <td>
          <button class="action-btn wa" onclick="window.open('${waLink}', '_blank')">💬</button>
          <button class="action-btn status" onclick="ubahStatus('${o.orderId}')">✏️</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ---------- STATISTIK ---------- */
function updateStats() {
  const total      = semuaOrder.length;
  const pending    = semuaOrder.filter(o => o.status === 'Pending').length;
  const selesai    = semuaOrder.filter(o => o.status === 'Selesai').length;
  const pendapatan = semuaOrder
    .filter(o => o.status === 'Selesai')
    .reduce((a, b) => a + Number(b.total || 0), 0);

  document.getElementById('statTotal').textContent      = total;
  document.getElementById('statPending').textContent    = pending;
  document.getElementById('statSelesai').textContent    = selesai;
  document.getElementById('statPendapatan').textContent = 'Rp ' + pendapatan.toLocaleString('id-ID');
}

/* ---------- UBAH STATUS ---------- */
async function ubahStatus(orderId) {
  const order = semuaOrder.find(o => o.orderId === orderId);
  if (!order) return;

  const pilihan = prompt(
    `Ubah status untuk ${orderId}\n\nPilihan:\n1. Pending\n2. Diproses\n3. Selesai\n4. Dibatalkan\n\nMasukkan nomor:`,
    '1'
  );

  const map = { '1': 'Pending', '2': 'Diproses', '3': 'Selesai', '4': 'Dibatalkan' };
  const baru = map[pilihan];

  if (!baru) return;

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        orderId: orderId,
        status: baru
      })
    });

    // Update lokal
    order.status = baru;
    renderTabel();
    updateStats();

    alert(`✅ Status ${orderId} diubah menjadi: ${baru}`);
  } catch (err) {
    alert('❌ Gagal update status. Coba lagi.');
    console.error(err);
  }
}
