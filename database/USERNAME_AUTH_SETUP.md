# Username/password authentication deployment

The app now authenticates usernames locally in Nitro and stores credential and session records in the PostgreSQL database configured by `DATABASE_URL`. Neon Auth is no longer called by the application.

## One-time database migration

Run `migrations/001_username_password_auth.sql` against the same Neon database used by the VPS before deploying the new server build. This creates the local account and session tables; it does not modify employee or attendance data.

## First Admin account

Temporarily add these variables to the VPS systemd environment file:

```dotenv
NITRO_ADMIN_USERNAME=admin
NITRO_ADMIN_SETUP_TOKEN=replace-with-a-long-random-secret
```

Choose a reserved username and generate a long secret on the VPS, for example with `openssl rand -hex 32`. Restart Nitro, open `/auth/sign-up`, and register that username with a password of at least 6 characters and the setup token. The server grants Admin only if no Admin account exists yet.

After the first Admin registers, remove both variables from the systemd environment file and restart the service. Do not add the token as a `VITE_*` build variable or commit it to Git.

## Employee accounts

The Admin must create an employee profile first and assign its login username. The employee can then register with that username and a password of at least 6 characters. Email on an employee profile is optional contact information and is not used for authentication.

Existing Neon Auth accounts are not imported because the app cannot read their passwords. Each employee must create a local username/password account. Existing employee, attendance, request, and payroll records remain in the database.

Password recovery by email is not available in this username-only setup. A password reset flow for Admins must be provided separately before relying on it operationally.
