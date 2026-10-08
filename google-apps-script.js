const SHEET_NAME = 'Orders';

/* ============ GET: Ambil Data ============ */
function doGet(e) {
  try {
    const sheet = getSheet();
    const rows  = sheet.getDataRange().getValues();
    const data  = [];

    for (let i = 1; i < rows.length; i++) {
      data.push({
        orderId: rows[i][0],
        tanggal: rows[i][1],
        nama:    rows[i][2],
        wa:      rows[i][3],
        alamat:  rows[i][4],
        produk:  rows[i][5],
        jumlah:  rows[i][6],
        total:   rows[i][7],
        bayar:   rows[i][8],
        status:  rows[i][9]
      });
    }

    return jsonResponse({
      status: 'success',
      data: data.reverse()
    });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/* ============ POST: Simpan / Update ============ */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'updateStatus') {
      return updateStatus(data.orderId, data.status);
    }

    return simpanOrder(data);

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/* ============ Simpan Order ============ */
function simpanOrder(data) {
  const sheet   = getSheet();
  const orderId = 'ORD-' + Date.now();

  sheet.appendRow([
    orderId,
    new Date(),
    data.nama,
    data.wa,
    data.alamat,
    data.produk,
    data.jumlah,
    data.total,
    data.bayar,
    'Pending'
  ]);

  return jsonResponse({ status: 'success', orderId: orderId });
}

/* ============ Update Status ============ */
function updateStatus(orderId, statusBaru) {
  const sheet = getSheet();
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === orderId) {
      sheet.getRange(i + 1, 10).setValue(statusBaru);
      return jsonResponse({ status: 'success', message: 'Status updated' });
    }
  }

  return jsonResponse({ status: 'error', message: 'Order tidak ditemukan' });
}

/* ============ Helper ============ */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Order ID', 'Tanggal', 'Nama', 'WA', 'Alamat',
      'Produk', 'Jumlah', 'Total', 'Pembayaran', 'Status'
    ]);
    sheet.getRange(1, 1, 1, 10)
      .setFontWeight('bold')
      .setBackground('#667eea')
      .setFontColor('#ffffff');
  }

  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
