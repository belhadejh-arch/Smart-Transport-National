import { Resend } from "resend";

const resend = process.env["RESEND_API_KEY"] ? new Resend(process.env["RESEND_API_KEY"]) : null;
const FROM = "NQL DZ <noreply@nqldz.xyz>";

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2C6B7F,#1a4d5e);padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:70px;height:70px;line-height:70px;font-size:28px;font-weight:900;color:#fff;letter-spacing:2px;">NQL</div>
            <p style="color:#D4A24E;font-size:13px;font-weight:700;margin:8px 0 0;letter-spacing:3px;">NATIONAL TRANSIT PLATFORM</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="color:#1a2e3a;font-size:24px;margin:0 0 12px;font-weight:700;">مرحباً، ${name} 👋</h1>
            <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">
              تلقّينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة <strong style="color:#2C6B7F;">NQL DZ</strong>.
              استخدم الرمز التالي لإتمام العملية:
            </p>
            <!-- OTP Box -->
            <div style="background:linear-gradient(135deg,#f0f8fb,#e8f4f7);border:2px solid #2C6B7F;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
              <p style="color:#666;font-size:13px;margin:0 0 10px;font-weight:600;">رمز التحقق</p>
              <div style="font-size:44px;font-weight:900;color:#2C6B7F;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</div>
              <p style="color:#e05a4a;font-size:12px;margin:14px 0 0;font-weight:600;">⏱ صالح لمدة 15 دقيقة فقط</p>
            </div>
            <p style="color:#888;font-size:13px;line-height:1.7;margin:0 0 12px;background:#fff8e1;border-right:4px solid #D4A24E;padding:12px 16px;border-radius:8px;">
              ⚠️ إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد الإلكتروني وحسابك بأمان تام.
            </p>
            <p style="color:#aaa;font-size:12px;margin:16px 0 0;">لأسباب أمنية، لا تشارك هذا الرمز مع أحد.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="color:#aaa;font-size:12px;margin:0;">© 2025 NQL DZ — المنصة الوطنية الذكية للنقل في الجزائر</p>
            <p style="color:#aaa;font-size:11px;margin:6px 0 0;"><a href="https://nqldz.xyz" style="color:#2C6B7F;text-decoration:none;">nqldz.xyz</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!resend) {
    // Log OTP if no email service configured (dev mode)
    console.warn(`[DEV] OTP for ${to}: ${otp}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `${otp} — رمز إعادة تعيين كلمة مرور NQL DZ`,
    html,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
}
