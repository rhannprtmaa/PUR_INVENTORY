import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ReportingRecord, StockSummary, TransactionHistoryItem, Activity } from '../types';

interface ExportMeta {
  period?: string;
  generatedBy?: string;
}

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/** Helper to draw official PDF header */
const drawOfficialPDFHeader = (doc: jsPDF, title: string, subtitle: string, meta: ExportMeta = {}) => {
  const printDate = formatDateIndo(new Date().toISOString().split('T')[0]);

  // Header Banner
  doc.setFillColor(4, 69, 126); // #04457e
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEM MONITORING & INVENTORY SOUVENIR', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Bank Indonesia • Dashboard Pengelolaan & Audit Mutasi Persediaan', 14, 18);

  // Subtitle / Info block
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 34);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 40);

  doc.text(`Periode: ${meta.period || 'Semua Waktu'}`, 14, 46);
  doc.text(`Tanggal Cetak: ${printDate} | Petugas: ${meta.generatedBy || 'Administrator'}`, 120, 46);

  // Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 50, 196, 50);
};

/** Helper for PDF page footer */
const drawPDFFooter = (doc: jsPDF, data: any) => {
  const pageNumber = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen Resmi • Sistem Monitoring Inventory Souvenir', 14, doc.internal.pageSize.height - 8);
  doc.text(
    `Halaman ${data.pageNumber} dari ${pageNumber}`,
    doc.internal.pageSize.width - 35,
    doc.internal.pageSize.height - 8
  );
};

// ==========================================
// 1. STOCK SUMMARY EXPORTS
// ==========================================
export const exportStockSummaryPDF = (data: StockSummary[], meta: ExportMeta = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawOfficialPDFHeader(doc, 'Laporan Posisi Stok & Saldo Persediaan Souvenir', 'Rekapitulasi total penerimaan, pengeluaran, dan stok akhir real-time', meta);

  const tableRows = data.map((item, idx) => [
    idx + 1,
    item.souvenir.name,
    item.categoryName,
    item.souvenir.unit,
    `+${item.totalIn}`,
    `-${item.totalOut}`,
    item.currentStock,
    item.souvenir.minimumStock,
    item.status,
  ]);

  autoTable(doc, {
    startY: 53,
    head: [['No', 'Nama Souvenir', 'Kategori', 'Satuan', 'Masuk', 'Keluar', 'Stok Akhir', 'Batas Min', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [4, 69, 126], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 28 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 16, halign: 'right' },
      8: { cellWidth: 18, halign: 'center' },
    },
    didDrawPage: (d) => drawPDFFooter(doc, d),
  });

  doc.save(`Laporan_Posisi_Stok_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportStockSummaryExcel = (data: StockSummary[], meta: ExportMeta = {}) => {
  const rows = data.map((item, idx) => ({
    No: idx + 1,
    'Nama Souvenir': item.souvenir.name,
    Kategori: item.categoryName,
    Satuan: item.souvenir.unit,
    'Total Masuk (IN)': item.totalIn,
    'Total Keluar (OUT)': item.totalOut,
    'Stok Akhir': item.currentStock,
    'Batas Stok Minimum': item.souvenir.minimumStock,
    Status: item.status,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = [{ wch: 6 }, { wch: 32 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Posisi Stok');
  XLSX.writeFile(wb, `Laporan_Posisi_Stok_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ==========================================
// 2. ACTIVITY REPORT EXPORTS
// ==========================================
interface ActivityReportData {
  activity: Activity;
  items: {
    souvenirName: string;
    quantity: number;
    unit: string;
    description?: string;
  }[];
  totalQty: number;
}

export const exportActivityReportPDF = (data: ActivityReportData[], meta: ExportMeta = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawOfficialPDFHeader(doc, 'Laporan Penggunaan Souvenir per Kegiatan / Event', 'Rincian distribusi alokasi souvenir berdasarkan agenda kegiatan', meta);

  const tableRows: (string | number)[][] = [];
  let no = 1;

  data.forEach((row) => {
    if (row.items.length === 0) {
      tableRows.push([
        no++,
        row.activity.name,
        row.activity.pic,
        formatDateIndo(row.activity.activityDate),
        row.activity.location || '-',
        '(Belum ada souvenir)',
        0,
      ]);
    } else {
      const itemsList = row.items.map((it) => `• ${it.souvenirName}: ${it.quantity} ${it.unit}`).join('\n');
      tableRows.push([
        no++,
        row.activity.name,
        row.activity.pic,
        formatDateIndo(row.activity.activityDate),
        row.activity.location || '-',
        itemsList,
        `${row.totalQty} item`,
      ]);
    }
  });

  autoTable(doc, {
    startY: 53,
    head: [['No', 'Nama Kegiatan', 'PIC', 'Tanggal', 'Lokasi', 'Souvenir Terdistribusi', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [4, 69, 126], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 24 },
      4: { cellWidth: 26 },
      5: { cellWidth: 42 },
      6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    },
    didDrawPage: (d) => drawPDFFooter(doc, d),
  });

  doc.save(`Laporan_Penggunaan_Kegiatan_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportActivityReportExcel = (data: ActivityReportData[], meta: ExportMeta = {}) => {
  const rows: any[] = [];
  let no = 1;

  data.forEach((row) => {
    if (row.items.length === 0) {
      rows.push({
        No: no++,
        'Nama Kegiatan': row.activity.name,
        'PIC Kegiatan': row.activity.pic,
        'Tanggal Kegiatan': row.activity.activityDate,
        Lokasi: row.activity.location || '-',
        'Nama Souvenir': '-',
        'Jumlah Keluar': 0,
        Satuan: '-',
        Catatan: row.activity.description || '-',
      });
    } else {
      row.items.forEach((it) => {
        rows.push({
          No: no++,
          'Nama Kegiatan': row.activity.name,
          'PIC Kegiatan': row.activity.pic,
          'Tanggal Kegiatan': row.activity.activityDate,
          Lokasi: row.activity.location || '-',
          'Nama Souvenir': it.souvenirName,
          'Jumlah Keluar': it.quantity,
          Satuan: it.unit,
          Catatan: it.description || row.activity.description || '-',
        });
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 25 }, { wch: 14 }, { wch: 10 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Penggunaan per Kegiatan');
  XLSX.writeFile(wb, `Laporan_Penggunaan_Kegiatan_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ==========================================
// 3. TRANSACTION HISTORY EXPORTS
// ==========================================
export const exportTransactionHistoryPDF = (data: TransactionHistoryItem[], meta: ExportMeta = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawOfficialPDFHeader(doc, 'Laporan Riwayat Transaksi & Audit Mutasi Stok', 'Log seluruh transaksi barang masuk (IN) dan barang keluar (OUT)', meta);

  const tableRows = data.map((tx, idx) => [
    idx + 1,
    formatDateIndo(tx.date),
    tx.type === 'IN' ? 'MASUK' : 'KELUAR',
    tx.souvenirName,
    tx.categoryName,
    `${tx.type === 'IN' ? '+' : '-'}${tx.quantity} ${tx.unit}`,
    tx.activityName ? `${tx.activityName} (${tx.description || '-'})` : tx.description || '-',
    tx.user,
  ]);

  autoTable(doc, {
    startY: 53,
    head: [['No', 'Tanggal', 'Jenis', 'Nama Souvenir', 'Kategori', 'Jumlah', 'Kegiatan / Keterangan', 'Petugas']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [4, 69, 126], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 36 },
      4: { cellWidth: 24 },
      5: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 46 },
      7: { cellWidth: 18 },
    },
    didDrawPage: (d) => drawPDFFooter(doc, d),
  });

  doc.save(`Laporan_Riwayat_Transaksi_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportTransactionHistoryExcel = (data: TransactionHistoryItem[], meta: ExportMeta = {}) => {
  const rows = data.map((tx, idx) => ({
    No: idx + 1,
    Tanggal: tx.date,
    'Jenis Mutasi': tx.type === 'IN' ? 'BARANG MASUK' : 'BARANG KELUAR',
    'Nama Souvenir': tx.souvenirName,
    Kategori: tx.categoryName,
    'Jumlah Mutasi': tx.type === 'IN' ? tx.quantity : -tx.quantity,
    Satuan: tx.unit,
    Kegiatan: tx.activityName || '-',
    'Keterangan / Surat Jalan': tx.description || '-',
    Petugas: tx.user,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 26 }, { wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Transaksi');
  XLSX.writeFile(wb, `Laporan_Riwayat_Transaksi_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Legacy backward-compatibility exports
export interface ItemDisbursementData {
  souvenirId: string;
  souvenirName: string;
  categoryName: string;
  unit: string;
  totalOut: number;
  activitiesCount: number;
  activitiesList: {
    activityName: string;
    date: string;
    pic: string;
    quantity: number;
    description?: string;
  }[];
}

export const exportItemDisbursementPDF = (data: ItemDisbursementData[], meta: ExportMeta = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawOfficialPDFHeader(
    doc,
    'Laporan Rekapitulasi Barang Keluar',
    'Rincian volume barang/souvenir yang telah didistribusikan beserta agenda kegiatan penerimanya',
    meta
  );

  const tableRows: (string | number)[][] = [];
  let no = 1;

  data.forEach((row) => {
    if (row.activitiesList.length === 0) {
      tableRows.push([
        no++,
        row.souvenirName,
        row.categoryName,
        `${row.totalOut} ${row.unit}`,
        '-',
        0,
      ]);
    } else {
      const actDetail = row.activitiesList
        .map((a) => `• ${a.activityName} (${formatDateIndo(a.date)}): ${a.quantity} ${row.unit}`)
        .join('\n');
      tableRows.push([
        no++,
        row.souvenirName,
        row.categoryName,
        `${row.totalOut} ${row.unit}`,
        actDetail,
        `${row.activitiesCount} kegiatan`,
      ]);
    }
  });

  autoTable(doc, {
    startY: 53,
    head: [['No', 'Nama Barang / Souvenir', 'Kategori', 'Total Keluar', 'Distribusi Kegiatan (Tanggal & Jumlah)', 'Jumlah Kegiatan']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [4, 69, 126], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 22 },
      3: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 72 },
      5: { cellWidth: 22, halign: 'center' },
    },
    didDrawPage: (d) => drawPDFFooter(doc, d),
  });

  doc.save(`Laporan_Barang_Keluar_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportItemDisbursementExcel = (data: ItemDisbursementData[], meta: ExportMeta = {}) => {
  const rows: any[] = [];
  let no = 1;

  data.forEach((row) => {
    if (row.activitiesList.length === 0) {
      rows.push({
        No: no++,
        'Nama Barang / Souvenir': row.souvenirName,
        Kategori: row.categoryName,
        Satuan: row.unit,
        'Total Keluar': row.totalOut,
        'Nama Kegiatan': '-',
        'Tanggal Kegiatan': '-',
        'PIC Kegiatan': '-',
        'Jumlah Keluar Kegiatan': 0,
        Keterangan: '-',
      });
    } else {
      row.activitiesList.forEach((act) => {
        rows.push({
          No: no++,
          'Nama Barang / Souvenir': row.souvenirName,
          Kategori: row.categoryName,
          Satuan: row.unit,
          'Total Keluar Barang': row.totalOut,
          'Nama Kegiatan': act.activityName,
          'Tanggal Kegiatan': act.date,
          'PIC Kegiatan': act.pic,
          'Jumlah Keluar di Kegiatan': act.quantity,
          Keterangan: act.description || '-',
        });
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 10 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Barang Keluar');
  XLSX.writeFile(wb, `Laporan_Barang_Keluar_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Legacy backward-compatibility exports
export const exportToPDF = (records: ReportingRecord[], filterOptions: any = {}) => {
  const mapped: ActivityReportData[] = records.map((r) => ({
    activity: {
      id: r.activityId,
      name: r.activityName,
      pic: r.pic,
      activityDate: r.activityDate,
      location: r.location,
      description: '',
      createdAt: '',
      updatedAt: '',
    },
    items: r.items.map((it) => ({
      souvenirName: it.souvenirName,
      quantity: it.quantity,
      unit: it.unit,
      description: it.description,
    })),
    totalQty: r.totalItems,
  }));
  exportActivityReportPDF(mapped, filterOptions);
};

export const exportToExcel = (records: ReportingRecord[]) => {
  const mapped: ActivityReportData[] = records.map((r) => ({
    activity: {
      id: r.activityId,
      name: r.activityName,
      pic: r.pic,
      activityDate: r.activityDate,
      location: r.location,
      description: '',
      createdAt: '',
      updatedAt: '',
    },
    items: r.items.map((it) => ({
      souvenirName: it.souvenirName,
      quantity: it.quantity,
      unit: it.unit,
      description: it.description,
    })),
    totalQty: r.totalItems,
  }));
  exportActivityReportExcel(mapped);
};
