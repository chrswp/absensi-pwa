export type PayrollEmployee = {
  id: number;
  name: string;
  role: string;
  monthly: number;
  holidayIncentive: number;
  workEnd: string;
  workDays: string[];
};

export type PayrollAttendance = {
  in?: string;
  out?: string;
};

export type PayrollSummary = {
  attendanceDays: number;
  basePay: number;
  overtimeHours: number;
  overtimePay: number;
  holidayIncentive: number;
  total: number;
};

export function calculateMonthlyPayroll(
  employee: PayrollEmployee,
  records: Record<string, PayrollAttendance>,
  month: string,
  nationalHolidays: string[],
): PayrollSummary {
  const dailyRate = employee.monthly / 26;
  const hourlyRate = employee.monthly / 173;
  let attendanceDays = 0;
  let basePay = 0;
  let overtimeHours = 0;
  let holidayIncentive = 0;

  Object.entries(records).forEach(([key, record]) => {
    const prefix = `${employee.id}-`;
    if (!key.startsWith(prefix) || !record.in) return;
    const date = key.slice(prefix.length);
    if (!date.startsWith(month)) return;

    attendanceDays += 1;
    basePay += dailyRate;
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const isHoliday = dayOfWeek === 0 || !employee.workDays.includes(weekdayNames[dayOfWeek]) || nationalHolidays.includes(date);
    if (isHoliday) holidayIncentive += employee.holidayIncentive;

    if (record.out) {
      const clockOut = Number(record.out.slice(0, 2)) * 60 + Number(record.out.slice(3, 5));
      const scheduledEnd = Number(employee.workEnd.slice(0, 2)) * 60 + Number(employee.workEnd.slice(3, 5));
      overtimeHours += Math.max(0, (clockOut - scheduledEnd) / 60);
    }
  });

  const overtimePay = Math.round(overtimeHours * hourlyRate);
  const roundedBasePay = Math.round(basePay);
  return {
    attendanceDays,
    basePay: roundedBasePay,
    overtimeHours,
    overtimePay,
    holidayIncentive,
    total: roundedBasePay + overtimePay + holidayIncentive,
  };
}

export function createPayrollSlipJpg(employee: PayrollEmployee, summary: PayrollSummary, month: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");

  ctx.fillStyle = "#f4f8f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f766e";
  ctx.fillRect(0, 0, canvas.width, 300);
  ctx.fillStyle = "#d1fae5";
  ctx.font = "700 28px Arial";
  ctx.fillText("HADIR-GSI  /  PEOPLE & PAYROLL", 70, 78);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 58px Arial";
  ctx.fillText("Slip Gaji", 70, 165);
  ctx.font = "400 28px Arial";
  ctx.fillText("Periode " + new Date(`${month}-01T12:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" }), 70, 220);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(54, 260, 972, 250);
  ctx.fillStyle = "#153330";
  ctx.font = "700 42px Arial";
  ctx.fillText(employee.name.slice(0, 34), 88, 330);
  ctx.fillStyle = "#536461";
  ctx.font = "400 26px Arial";
  ctx.fillText(employee.role.slice(0, 48), 88, 374);
  ctx.font = "600 23px Arial";
  ctx.fillText("Kehadiran tercatat: " + summary.attendanceDays + " hari", 88, 430);
  ctx.fillStyle = "#e6f4f1";
  ctx.fillRect(54, 540, 972, 188);
  ctx.fillStyle = "#47635f";
  ctx.font = "600 25px Arial";
  ctx.fillText("TOTAL ESTIMASI GAJI", 88, 594);
  ctx.fillStyle = "#0f766e";
  ctx.font = "700 62px Arial";
  ctx.fillText(new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.total), 88, 680);

  const rows = [
    ["Upah harian terakumulasi", summary.basePay],
    ["Total lembur (" + summary.overtimeHours.toFixed(1) + " jam)", summary.overtimePay],
    ["Insentif hari libur", summary.holidayIncentive],
  ];
  let y = 800;
  ctx.font = "500 28px Arial";
  rows.forEach(([label, amount]) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(54, y - 44, 972, 78);
    ctx.fillStyle = "#334642";
    ctx.fillText(String(label), 88, y + 4);
    ctx.textAlign = "right";
    ctx.font = "700 28px Arial";
    ctx.fillText(new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(amount)), 990, y + 4);
    ctx.textAlign = "left";
    ctx.font = "500 28px Arial";
    y += 92;
  });
  ctx.fillStyle = "#6b7d79";
  ctx.font = "400 21px Arial";
  ctx.fillText("Dihitung dari data absensi, upah harian, lembur, dan insentif yang tercatat.", 58, 1240);
  ctx.fillText("Hadir-GSI | Slip estimasi digital", 58, 1290);
  return canvas.toDataURL("image/jpeg", 0.92);
}
