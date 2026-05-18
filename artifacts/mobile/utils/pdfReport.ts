import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export interface ReportRow {
  date: string;
  description: string;
  amount: string;
  type: "credit" | "debit" | "neutral";
}

export interface ReportData {
  title: string;
  subtitle: string;
  userName: string;
  generatedAt: string;
  summary: { label: string; value: string }[];
  rows: ReportRow[];
}

export async function generateAndSharePDF(data: ReportData): Promise<void> {
  const html = buildHTML(data);

  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: data.title,
      UTI: "com.adobe.pdf",
    });
  }
}

function row(r: ReportRow): string {
  const color =
    r.type === "credit" ? "#059669" : r.type === "debit" ? "#DC2626" : "#2C6B7F";
  return `<tr>
    <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:12px;color:#666;">${r.date}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:13px;color:#222;">${r.description}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:bold;color:${color};text-align:left;">${r.amount}</td>
  </tr>`;
}

function summaryItem(s: { label: string; value: string }): string {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #f3f3f3;">
    <span style="font-size:13px;color:#666;">${s.label}</span>
    <span style="font-size:14px;font-weight:bold;color:#2C6B7F;">${s.value}</span>
  </div>`;
}

function buildHTML(data: ReportData): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${data.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f6f7; font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; color: #222; }
    @media print { body { background: white; padding: 0; } }
  </style>
</head>
<body>
  <!-- Header card -->
  <div style="background:linear-gradient(135deg,#2C6B7F 0%,#1a4d5e 100%);border-radius:16px;padding:28px;color:white;margin-bottom:18px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:30px;font-weight:900;letter-spacing:3px;">NQL DZ</div>
        <div style="font-size:11px;opacity:0.7;margin-top:2px;">منصة النقل الذكي الوطني • الجزائر</div>
      </div>
      <div style="text-align:left;font-size:12px;opacity:0.8;">${data.generatedAt}</div>
    </div>
    <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;">
      <div style="font-size:22px;font-weight:bold;">${data.title}</div>
      <div style="font-size:14px;opacity:0.85;margin-top:4px;">${data.subtitle}</div>
      <div style="font-size:13px;opacity:0.7;margin-top:4px;">👤 ${data.userName}</div>
    </div>
  </div>

  <!-- Summary -->
  <div style="background:white;border-radius:12px;padding:18px;margin-bottom:18px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="font-size:15px;font-weight:bold;color:#2C6B7F;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e8f4f7;">📊 ملخص الحساب</div>
    ${data.summary.map(summaryItem).join("")}
  </div>

  <!-- Transactions table -->
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#2C6B7F;padding:14px 18px;">
      <span style="color:white;font-size:15px;font-weight:bold;">📋 سجل العمليات</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #eee;">التاريخ</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #eee;">البيان</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #eee;">المبلغ</th>
        </tr>
      </thead>
      <tbody>
        ${data.rows.length ? data.rows.map(row).join("") : `<tr><td colspan="3" style="padding:28px;text-align:center;color:#aaa;font-size:13px;">لا توجد عمليات مسجلة</td></tr>`}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:20px;color:#bbb;font-size:11px;">
    تم إنشاء هذا التقرير تلقائياً بواسطة نظام NQL DZ
  </div>
</body>
</html>`;
}
