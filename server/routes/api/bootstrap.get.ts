import { defineHandler } from "nitro";
import { createError, getRequestHeader } from "nitro/h3";
import { sql } from "../../utils/db";
import { getSessionFromCookie } from "../../utils/local-auth";

export default defineHandler(async (event) => {
  const session = await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null);
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const { id, username, name, role } = session.user;
  if (role === "Admin") {
    const [employees, attendance, requests, payroll] = await Promise.all([
      sql`SELECT id, username, name, phone, email, emergency_phone AS "emergencyPhone", bank_name AS "bankName", bank_account AS "bankAccount", job_title AS role, monthly_salary AS monthly, holiday_incentive AS "holidayIncentive", work_start AS "workStart", work_end AS "workEnd", work_days AS "workDays", status FROM employees ORDER BY id`,
      sql`SELECT employee_id AS "employeeId", work_date AS date, clock_in AS "in", clock_out AS "out", photo, location, coords FROM attendance_records`,
      sql`SELECT r.id, e.name, r.kind, r.request_date AS date, r.note, r.status, r.employee_id AS "employeeId" FROM employee_requests r JOIN employees e ON e.id = r.employee_id ORDER BY r.created_at DESC`,
      sql`SELECT employee_id AS "employeeId", payroll_month AS month, options FROM payroll_adjustments`,
    ]);
    return { user: { id, username, name, role }, employees, attendance, requests, payroll };
  }
  const employees = await sql`SELECT id, username, name, phone, email, emergency_phone AS "emergencyPhone", bank_name AS "bankName", bank_account AS "bankAccount", job_title AS role, monthly_salary AS monthly, holiday_incentive AS "holidayIncentive", work_start AS "workStart", work_end AS "workEnd", work_days AS "workDays", status FROM employees WHERE lower(username) = ${username}`;
  const employee = employees[0];
  if (!employee) return { user: { id, username, name, role }, employees: [], attendance: [], requests: [], payroll: [] };
  const [attendance, requests, payroll] = await Promise.all([
    sql`SELECT employee_id AS "employeeId", work_date AS date, clock_in AS "in", clock_out AS "out", photo, location, coords FROM attendance_records WHERE employee_id = ${employee.id}`,
    sql`SELECT r.id, e.name, r.kind, r.request_date AS date, r.note, r.status, r.employee_id AS "employeeId" FROM employee_requests r JOIN employees e ON e.id = r.employee_id WHERE r.employee_id = ${employee.id} ORDER BY r.created_at DESC`,
    sql`SELECT employee_id AS "employeeId", payroll_month AS month, options FROM payroll_adjustments WHERE employee_id = ${employee.id}`,
  ]);
  return { user: { id, username, name, role }, employees: [employee], attendance, requests, payroll };
});
