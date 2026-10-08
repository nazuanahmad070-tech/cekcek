/* ================= AUTO ORDER SCRIPT ================= */

// ✅ URL Google Apps Script Anda
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzkAmzKtY4v2ZHPK0T8MD14eNdWSxQR9QifgweARkxWEZk4l4wmlGKcKix5ZoBZkUtN/exec';

// Ganti dengan nomor WhatsApp admin (format 62xxxx)
const NOMOR_ADMIN = '6281234567890';

document.addEventListener('DOMContentLoaded', () => {

  const produkItems  = document.querySelectorAll('.produk-item');
  const jumlahInput  = document.getElementById('jumlah');
  const totalHargaEl = document.getElementById('totalHarga');
  const notif        = document.getElementById('notif');
  const form         = document.getElementById('orderForm');
  const btnSubmit    = document.getElementById('btnSubmit');

  let produkTerpilih = null;

  /* ---------- PILIH PRODUK ---------- */
  produkItems.forEach(item => {
    item.addEventListener('click', () => {
      produkItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      produkTerpilih = {
        nama: item.dataset.nama,
        harga: parseInt(item.dataset.harga)
      };
      hitungTotal();
    });
  });

  /* ---------- HITUNG TOTAL ---------- */
  function hitungTotal() {
    if (!produkTerpilih) {
      totalHargaEl.textContent = 'Rp 0';
      return;
    }
    const jumlah = parseInt(jumlahInput.value) || 1;
    const total  = produkTerpilih.harga * jumlah;
    totalHargaEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
  }

  jumlahInput.addEventListener('input', hitungTotal);

  /* ---------- SUBMIT FORM ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!produkTerpilih) {
      tampilNotif('Silakan pilih produk terlebih dahulu!', true);
      return;
    }

    const nama   = document.getElementById('nama').value.trim();
    const wa     = document.getElementById('wa').value.trim();
    const alamat = document.getElementById('alamat').value.trim();
    const jumlah = parseInt(jumlahInput.value) || 1;
    const bayar  = document.getElementById('bayar').value;
    const total  = produkTerpilih.harga * jumlah;

    if (!nama || !wa || !alamat || !bayar) {
      tampilNotif('Mohon lengkapi semua data!', true);
      return;
    }

    const orderData = {
      nama, wa, alamat,
      produk: produkTerpilih.nama,
      jumlah, total, bayar
    };

    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Mengirim...';

    try {
      /* Kirim ke Google Sheets */
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      /* Buka WhatsApp */
      const pesan =
`🛒 *PESANAN BARU*
━━━━━━━━━━━━━━━
👤 Nama: ${nama}
📱 WA: ${wa}
📍 Alamat: ${alamat}
━━━━━━━━━━━━━━━
📦 Produk: ${produkTerpilih.nama}
🔢 Jumlah: ${jumlah}
💰 Total: Rp ${total.toLocaleString('id-ID')}
💳 Pembayaran: ${bayar}
━━━━━━━━━━━━━━━
Mohon diproses ya 🙏`;

      window.open(
        `https://wa.me/${NOMOR_ADMIN}?text=${encodeURIComponent(pesan)}`,
        '_blank'
      );

      tampilNotif('✅ Pesanan berhasil dikirim!');

      form.reset();
      produkItems.forEach(i => i.classList.remove('active'));
      produkTerpilih = null;
      totalHargaEl.textContent = 'Rp 0';

    } catch (err) {
      console.error(err);
      tampilNotif('❌ Gagal mengirim pesanan. Coba lagi.', true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = '🚀 Pesan Sekarang';
    }
  });

  /* ---------- NOTIFIKASI ---------- */
  function tampilNotif(msg, isError = false) {
    notif.textContent = msg;
    notif.classList.toggle('error', isError);
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, 3000);
  }

});
