import * as XLSX from 'xlsx';
import { periods, weekDays } from './periods';

/**
 * Export timetable data to Excel
 */
export const exportToExcel = (data, fileName = 'timetable_archive') => {
    // Header Row
    const rows = [['Day', ...periods.map(p => `${p.name} (${p.start}-${p.end})`)]];

    weekDays.forEach(day => {
        const row = [day];
        periods.forEach((p) => {
            const slot = data[day]?.[p.id];
            if (p.type === "break" || (slot && slot.type === "break")) {
                row.push(`[${p.name}]`);
            } else {
                row.push(slot ? `${slot.subject} (${slot.teacher})` : '-');
            }
        });
        rows.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export timetable data to CSV
 */
export const exportToCSV = (data, fileName = 'timetable_archive') => {
    const header = ['Day', ...periods.map(p => `"${p.name} (${p.start}-${p.end})"` )];
    const rows = [header.join(',')];

    weekDays.forEach(day => {
        const row = [`"${day}"`];
        periods.forEach((p) => {
            const slot = data[day]?.[p.id];
            if (p.type === "break" || (slot && slot.type === "break")) {
                row.push(`"[${p.name}]"`);
            } else {
                const content = slot ? `"${slot.subject} (${slot.teacher})"` : '-';
                row.push(content);
            }
        });
        rows.push(row.join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};