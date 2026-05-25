'use strict';

const nodemailer = require("nodemailer");

// ── Transporter (Gmail + App Password) ───────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // 16-char Google App Password
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Password Reset Email
// ─────────────────────────────────────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"GYZPsych" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Reset your GYZPsych password",
    text: `You requested a password reset.\n\nClick the link below to set a new password (expires in 1 hour):\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;">GYZ<span style="color:#bbf7d0;">Psych</span></h1>
            <p style="margin:6px 0 0;color:#dcfce7;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Password Reset</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Hi there,</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              We received a request to reset the password for your GYZPsych account.
              Click the button below to choose a new password.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#22c55e;border-radius:10px;">
                  <a href="${resetLink}" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">
                    Reset My Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Or copy and paste this link:</p>
            <p style="margin:0 0 28px;word-break:break-all;">
              <a href="${resetLink}" style="color:#22c55e;font-size:12px;">${resetLink}</a>
            </p>
            <table cellpadding="0" cellspacing="0" width="100%"
              style="background:#fef9c3;border-left:4px solid #eab308;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;color:#854d0e;font-size:12px;line-height:1.5;">
                  ⚠️ This link expires in <strong>1 hour</strong>. If you did not request this, ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} GYZPsych · Psychometric Solutions</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Test Assignment Email  (credentials-based — no magic link)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string} opts.toEmail       - tester's email address
 * @param {string} opts.firstName     - tester's first name
 * @param {string} opts.testTitle     - name of the assigned test
 * @param {string} opts.testDuration  - e.g. "30 minutes"
 * @param {string|null} opts.dueDate  - formatted due date string or null
 * @param {string|null} opts.notes    - optional instructions from assigner
 * @param {string} opts.loginUrl      - e.g. http://localhost:5173/login
 * @param {string} opts.userEmail     - the tester's login email
 * @param {string} opts.tempPassword  - temporary plain-text password
 */
async function sendTestAssignmentEmail({
  toEmail, firstName, testTitle, testDuration,
  dueDate, notes, loginUrl, userEmail, tempPassword,
}) {
  const dueLine = dueDate
    ? `<tr>
         <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;">Due Date</td>
         <td style="padding:6px 0;font-size:13px;font-weight:700;color:#111827;">${dueDate}</td>
       </tr>`
    : '';

  const notesBlock = notes
    ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:6px;padding:12px 16px;margin-top:16px;color:#166534;font-size:13px;line-height:1.6;">
         <strong>Instructions:</strong> ${notes}
       </div>`
    : '';

  const textLines = [
    `Hi ${firstName},`,
    ``,
    `A psychometric test has been assigned to you on GYZ Psychometric.`,
    ``,
    `Test:     ${testTitle}`,
    `Duration: ${testDuration || 'Not specified'}`,
    dueDate ? `Due Date: ${dueDate}` : null,
    notes   ? `Notes:    ${notes}`   : null,
    ``,
    `── Your Login Credentials ──`,
    `Login URL: ${loginUrl}`,
    `Email:     ${userEmail}`,
    `Password:  ${tempPassword}`,
    ``,
    `Please log in and complete your test before the due date.`,
    `You can change your password after logging in via Profile → Change Password.`,
    ``,
    `© ${new Date().getFullYear()} GYZPsych · Psychometric Solutions`,
  ].filter(l => l !== null).join('\n');

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"GYZPsych" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `Test Assigned: ${testTitle}`,
    text: textLines,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;">GYZ<span style="color:#bbf7d0;">Psych</span></h1>
            <p style="margin:6px 0 0;color:#dcfce7;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Test Assignment</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 28px;">
            <p style="margin:0 0 6px;color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${firstName}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              A psychometric test has been assigned to you. Please review the details and log in to complete it.
            </p>

            <!-- Test details -->
            <table cellpadding="0" cellspacing="0" width="100%"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;">Test Details</p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;">Test</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">${testTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;">Duration</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#374151;">${testDuration || 'Not specified'}</td>
                    </tr>
                    ${dueLine}
                  </table>
                  ${notesBlock}
                </td>
              </tr>
            </table>

            <!-- Credentials -->
            <table cellpadding="0" cellspacing="0" width="100%"
              style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#3b82f6;">🔑 Your Login Credentials</p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding:5px 16px 5px 0;color:#6b7280;font-size:13px;white-space:nowrap;">Login URL</td>
                      <td style="padding:5px 0;">
                        <a href="${loginUrl}" style="color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">${loginUrl}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 16px 5px 0;color:#6b7280;font-size:13px;white-space:nowrap;">Email</td>
                      <td style="padding:5px 0;font-size:13px;font-weight:700;color:#111827;font-family:monospace;">${userEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 16px 5px 0;color:#6b7280;font-size:13px;white-space:nowrap;">Password</td>
                      <td style="padding:5px 0;">
                        <span style="display:inline-block;background:#1e3a5f;color:#fff;font-family:monospace;font-size:15px;font-weight:700;letter-spacing:2px;padding:6px 14px;border-radius:6px;">
                          ${tempPassword}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td style="background:#22c55e;border-radius:10px;">
                  <a href="${loginUrl}" style="display:inline-block;padding:14px 44px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">
                    Log In &amp; Take Test
                  </a>
                </td>
              </tr>
            </table>

            <!-- Warning -->
            <table cellpadding="0" cellspacing="0" width="100%"
              style="background:#fef9c3;border-left:4px solid #eab308;border-radius:6px;">
              <tr>
                <td style="padding:12px 16px;color:#854d0e;font-size:12px;line-height:1.6;">
                  🔒 This password was generated for this notification.
                  After logging in, change it via <strong>Profile → Change Password</strong>.
                  Do not share your credentials with anyone.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} GYZPsych · Psychometric Solutions</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

module.exports = { sendPasswordResetEmail, sendTestAssignmentEmail };
