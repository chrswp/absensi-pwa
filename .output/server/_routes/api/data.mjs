import { createError, defineHandler, getRequestHeader, readBody } from "../../_libs/h3.mjs";
import { getSessionFromCookie, sql } from "../../index.mjs";
//#region server/routes/api/data.post.ts
var data_post_default = defineHandler(async (event) => {
	const session = await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null);
	if (!session?.user) throw createError({
		statusCode: 401,
		statusMessage: "Unauthorized"
	});
	const body = await readBody(event);
	const isAdmin = (await sql`SELECT role FROM local_auth_users WHERE id = ${session.user.id}`)[0]?.role === "Admin";
	if (body.action === "create-employee") {
		if (!isAdmin || !body.employee) throw createError({
			statusCode: 403,
			statusMessage: "Admin access required"
		});
		const e = body.employee;
		const username = String(e.username ?? "").trim().toLowerCase();
		if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw createError({
			statusCode: 400,
			statusMessage: "Username harus 3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung."
		});
		if ((await sql`SELECT id FROM employees WHERE lower(username) = ${username} LIMIT 1`).length) throw createError({
			statusCode: 409,
			statusMessage: "Username sudah digunakan."
		});
		return { id: (await sql`INSERT INTO employees (username, name, phone, email, emergency_phone, bank_name, bank_account, job_title, monthly_salary, holiday_incentive, work_start, work_end, work_days, status) VALUES (${username}, ${String(e.name)}, ${String(e.phone ?? "")}, ${String(e.email ?? "")}, ${String(e.emergencyPhone ?? "")}, ${String(e.bankName ?? "")}, ${String(e.bankAccount ?? "")}, ${String(e.role)}, ${Number(e.monthly)}, ${Number(e.holidayIncentive ?? 0)}, ${String(e.workStart)}, ${String(e.workEnd)}, ${JSON.stringify(e.workDays)}, 'Aktif') RETURNING id`)[0].id };
	}
	if (body.action === "attendance") {
		const employeeId = isAdmin ? Number(body.employeeId) : Number((await sql`SELECT id FROM employees WHERE lower(username) = ${session.user.username}`)[0]?.id);
		if (!employeeId) throw createError({
			statusCode: 403,
			statusMessage: "Employee profile required"
		});
		const a = body.attendance ?? {};
		await sql`INSERT INTO attendance_records (employee_id, work_date, clock_in, clock_out, photo, location, coords) VALUES (${employeeId}, ${body.date}, ${String(a.in ?? "")}, ${String(a.out ?? "")}, ${String(a.photo ?? "")}, ${String(a.location ?? "")}, ${String(a.coords ?? "")}) ON CONFLICT (employee_id, work_date) DO UPDATE SET clock_in = EXCLUDED.clock_in, clock_out = EXCLUDED.clock_out, photo = EXCLUDED.photo, location = EXCLUDED.location, coords = EXCLUDED.coords`;
		return { ok: true };
	}
	if (body.action === "request") {
		const employeeId = Number((await sql`SELECT id FROM employees WHERE lower(username) = ${session.user.username}`)[0]?.id);
		if (!employeeId) throw createError({
			statusCode: 403,
			statusMessage: "Employee profile required"
		});
		await sql`INSERT INTO employee_requests (employee_id, kind, request_date, note) VALUES (${employeeId}, ${String(body.kind)}, ${body.date}, ${String(body.note ?? "")})`;
		return { ok: true };
	}
	if (body.action === "approve-request") {
		if (!isAdmin || !body.requestId || !["Disetujui", "Ditolak"].includes(String(body.status))) throw createError({
			statusCode: 403,
			statusMessage: "Admin access required"
		});
		await sql`UPDATE employee_requests SET status = ${String(body.status)} WHERE id = ${body.requestId}`;
		return { ok: true };
	}
	if (body.action === "payroll") {
		if (!isAdmin || !body.employeeId || !body.month || !body.options) throw createError({
			statusCode: 403,
			statusMessage: "Admin access required"
		});
		await sql`INSERT INTO payroll_adjustments (employee_id, payroll_month, options) VALUES (${body.employeeId}, ${body.month}, ${JSON.stringify(body.options)}) ON CONFLICT (employee_id, payroll_month) DO UPDATE SET options = EXCLUDED.options`;
		return { ok: true };
	}
	throw createError({
		statusCode: 400,
		statusMessage: "Unknown data action"
	});
});
//#endregion
export { data_post_default as default };
