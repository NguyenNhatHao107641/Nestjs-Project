/**
 * Các hàm tiện ích / helper functions (theo cấu trúc Bài 02)
 */

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  const diffDays = Math.round((outTime - inTime) / oneDay);
  return diffDays > 0 ? diffDays : 1;
}

export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
