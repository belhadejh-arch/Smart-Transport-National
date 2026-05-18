import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export interface ReceiptData {
  receiptNumber: string;
  driverName: string;
  driverLastName: string;
  driverEmail?: string;
  amount: number;
  note?: string | null;
  adminName?: string;
  createdAt: string | Date;
}

function formatDate(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("ar-DZ", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function buildReceiptHtml(r: ReceiptData): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f4f6f9; padding: 30px; direction: rtl; color: #1a2e3a; }
    .receipt { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg,#2C6B7F,#1a4d5e); padding: 30px; text-align: center; }
    .logo { display: inline-block; width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.15); line-height: 60px; font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 2px; }
    .brand { color: #D4A24E; font-size: 11px; font-weight: 700; margin: 6px 0 0; letter-spacing: 3px; }
    .receipt-title { color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 8px; }
    .receipt-number { color: #D4A24E; font-size: 18px; font-weight: 700; margin-top: 4px; font-family: monospace; letter-spacing: 2px; }
    .body { padding: 28px; }
    .amount-box { background: linear-gradient(135deg,#f0f8fb,#e8f4f7); border: 2px solid #2C6B7F; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .amount-label { color: #666; font-size: 13px; margin-bottom: 6px; }
    .amount-value { color: #2C6B7F; font-size: 38px; font-weight: 900; }
    .amount-currency { color: #D4A24E; font-size: 18px; font-weight: 700; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f0f0f0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #888; font-size: 13px; }
    .info-value { color: #1a2e3a; font-size: 13px; font-weight: 600; text-align: left; }
    .note-box { background: #fff8e1; border-right: 4px solid #D4A24E; border-radius: 8px; padding: 12px 14px; margin-top: 16px; }
    .note-label { color: #D4A24E; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
    .note-text { color: #555; font-size: 13px; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 18px 28px; border-top: 1px solid #eee; text-align: center; }
    .footer-text { color: #aaa; font-size: 11px; line-height: 1.7; }
    .footer-site { color: #2C6B7F; font-weight: 700; }
    .stamp { display: inline-block; border: 2px solid #22C55E; border-radius: 8px; padding: 4px 14px; color: #22C55E; font-size: 12px; font-weight: 700; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">NQL</div>
      <p class="brand">NATIONAL TRANSIT PLATFORM · DZ</p>
      <p class="receipt-title">وصل دفعة سائق</p>
      <p class="receipt-number">${r.receiptNumber}</p>
    </div>
    <div class="body">
      <div class="amount-box">
        <p class="amount-label">المبلغ المحوّل</p>
        <p class="amount-value">${r.amount.toLocaleString("ar-DZ")} <span class="amount-currency">دج</span></p>
      </div>
      <div class="info-row">
        <span class="info-label">السائق</span>
        <span class="info-value">${r.driverName} ${r.driverLastName}</span>
      </div>
      ${r.driverEmail ? `<div class="info-row"><span class="info-label">البريد الإلكتروني</span><span class="info-value">${r.driverEmail}</span></div>` : ""}
      ${r.adminName ? `<div class="info-row"><span class="info-label">بواسطة</span><span class="info-value">${r.adminName}</span></div>` : ""}
      <div class="info-row">
        <span class="info-label">التاريخ والوقت</span>
        <span class="info-value">${formatDate(r.createdAt)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">رقم الوصل</span>
        <span class="info-value" style="font-family:monospace;color:#2C6B7F;">${r.receiptNumber}</span>
      </div>
      ${r.note ? `<div class="note-box"><p class="note-label">ملاحظة</p><p class="note-text">${r.note}</p></div>` : ""}
      <div style="text-align:center;margin-top:18px;">
        <span class="stamp">✓ تم التحويل بنجاح</span>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">
        هذا الوصل صادر من المنصة الوطنية الذكية للنقل في الجزائر<br>
        <span class="footer-site">nqldz.xyz</span> · © ${new Date().getFullYear()} NQL DZ
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function printAndShareReceipt(data: ReceiptData) {
  try {
    const html = buildReceiptHtml(data);
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `وصل ${data.receiptNumber}`,
        UTI: "com.adobe.pdf",
      });
    } else {
      await Print.printAsync({ uri });
    }
  } catch (e: any) {
    Alert.alert("خطأ", "تعذّر إنشاء الوصل — " + (e?.message ?? ""));
  }
}
