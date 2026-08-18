import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
}

export type ExportRow = Record<string, string | number | null | undefined>;

function pick(row: ExportRow, columns: ExportColumn[]): (string | number)[] {
  return columns.map((c) => {
    const v = row[c.key];
    return v === null || v === undefined ? '' : v;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv(
  filename: string,
  columns: ExportColumn[],
  rows: ExportRow[],
): void {
  const header = columns.map((c) => c.header);
  const body = rows.map((r) => pick(r, columns));
  const all = [header, ...body];

  const csv = all
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel(
  filename: string,
  sheets: { name: string; columns: ExportColumn[]; rows: ExportRow[] }[],
): void {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const data = [sheet.columns.map((c) => c.header), ...sheet.rows.map((r) => pick(r, sheet.columns))];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = sheet.columns.map((_, i) => ({
      wch: Math.max(
        sheet.columns[i].header.length + 4,
        ...sheet.rows
          .slice(0, 200)
          .map((r) => String(r[sheet.columns[i].key] ?? '').length + 2),
      ),
    }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`);
}

export function exportToPdf(
  filename: string,
  meta: { title: string; subtitle?: string; generatedAt: string },
  sections: { title: string; columns: string[]; rows: (string | number)[][] }[],
  orientation: 'portrait' | 'landscape' = 'portrait',
): void {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(meta.title, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  let y = 24;
  if (meta.subtitle) {
    doc.text(meta.subtitle, 14, y);
    y += 5;
  }
  doc.text(`Generated on ${meta.generatedAt}`, 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 3, pageWidth - 14, y + 3);

  let first = true;
  for (const section of sections) {
    if (!section.rows.length) continue;
    autoTable(doc, {
      startY: first ? y + 8 : undefined,
      head: [section.columns],
      body: section.rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.4, textColor: [51, 65, 85] },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        first = false;
      },
    });
    const last = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(section.title, 14, last.finalY + 9);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(meta.title, 14, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
}
