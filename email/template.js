'use strict';

function bar(pct, color, height = 8) {
  const filled = Math.min(Math.round(pct), 100);
  const empty = 100 - filled;
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
      <tr>
        <td width="${filled}%" height="${height}" bgcolor="${color}" style="font-size:0;line-height:0;border-radius:4px 0 0 4px">&nbsp;</td>
        <td width="${empty}%" height="${height}" bgcolor="#e2e8f0" style="font-size:0;line-height:0;border-radius:0 4px 4px 0">&nbsp;</td>
      </tr>
    </table>`;
}

function healthColor(score) {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#6366f1';
  if (score >= 25) return '#f59e0b';
  return '#ef4444';
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function planBadge(plan) {
  const colors = {
    starter: ['#f1f5f9', '#475569'],
    growth: ['#eff6ff', '#3b82f6'],
    pro: ['#eef2ff', '#6366f1'],
    enterprise: ['#fdf4ff', '#9333ea'],
  };
  const [bg, fg] = colors[plan] || ['#f1f5f9', '#475569'];
  return `<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${bg};color:${fg}">${plan}</span>`;
}

module.exports = function emailTemplate(m) {
  const {
    period, churnRate, revenueChurnRate, stickiness,
    totalMrr, lostMrr, netMrrChange, atRiskMrr,
    activeCustomers, atRiskCount, churnedCount, newCount,
    topAtRisk, recentChurns, generatedAt,
  } = m;

  const netSign = netMrrChange >= 0 ? '+' : '';
  const netColor = netMrrChange >= 0 ? '#10b981' : '#ef4444';
  const churnFill = Math.min(churnRate * 5, 100);
  const revChurnFill = Math.min(revenueChurnRate * 5, 100);
  const stickFill = Math.min(stickiness, 100);

  const atRiskRows = (topAtRisk || []).map(c => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a">
        <strong>${c.name}</strong><br>
        <span style="font-size:11px;color:#94a3b8">${c.company}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px">${planBadge(c.plan)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#f59e0b">${fmt(c.mrr)}</td>
    </tr>`).join('');

  const churnRows = (recentChurns || []).map(c => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a">
        <strong>${c.name}</strong>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px">${planBadge(c.plan)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#ef4444">${fmt(c.mrr)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b">${c.churn_reason || '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Retention Audit Report — ${generatedAt}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#f8fafc">
<tr><td align="center" style="padding:32px 16px">

  <!-- Outer container -->
  <table border="0" cellpadding="0" cellspacing="0" width="640" style="border-collapse:collapse;max-width:640px;width:100%">

    <!-- ── HEADER ── -->
    <tr>
      <td style="background:linear-gradient(135deg,#1e1b4b 0%,#4f46e5 100%);border-radius:12px 12px 0 0;padding:28px 32px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:8px;padding:6px 12px;margin-bottom:12px">
                <span style="color:#c7d2fe;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Retention Audit Report</span>
              </div>
              <h1 style="margin:0 0 4px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2">Customer Retention Summary</h1>
              <p style="margin:0;color:#a5b4fc;font-size:13px">Last ${period} days &nbsp;·&nbsp; Generated ${generatedAt}</p>
            </td>
            <td align="right" valign="middle">
              <div style="background:rgba(255,255,255,.12);border-radius:50%;width:52px;height:52px;text-align:center;line-height:52px;font-size:24px">&#128202;</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── ALERT BANNER (if churn > 5%) ── -->
    ${parseFloat(churnRate) > 5 ? `
    <tr>
      <td style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 32px">
        <p style="margin:0;color:#991b1b;font-size:13px;font-weight:600">
          &#9888; Churn rate is above 5% threshold — immediate attention recommended.
        </p>
      </td>
    </tr>` : ''}

    <!-- ── KPI GRID ── -->
    <tr>
      <td style="background:#ffffff;padding:24px 24px 8px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <!-- Churn Rate -->
            <td width="25%" style="padding:8px;vertical-align:top">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                <tr><td style="padding:16px 16px 4px">
                  <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Churn Rate</p>
                  <p style="margin:0 0 4px;font-size:26px;font-weight:800;color:#ef4444;line-height:1">${churnRate}%</p>
                  <p style="margin:0 0 10px;font-size:11px;color:#64748b">${churnedCount} customers lost</p>
                  ${bar(churnFill, '#ef4444')}
                </td></tr>
              </table>
            </td>
            <!-- Revenue Churn -->
            <td width="25%" style="padding:8px;vertical-align:top">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                <tr><td style="padding:16px 16px 4px">
                  <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Revenue Churn</p>
                  <p style="margin:0 0 4px;font-size:26px;font-weight:800;color:#f59e0b;line-height:1">${revenueChurnRate}%</p>
                  <p style="margin:0 0 10px;font-size:11px;color:#64748b">${fmt(lostMrr)} MRR lost</p>
                  ${bar(revChurnFill, '#f59e0b')}
                </td></tr>
              </table>
            </td>
            <!-- Stickiness -->
            <td width="25%" style="padding:8px;vertical-align:top">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                <tr><td style="padding:16px 16px 4px">
                  <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Stickiness</p>
                  <p style="margin:0 0 4px;font-size:26px;font-weight:800;color:#10b981;line-height:1">${stickiness}%</p>
                  <p style="margin:0 0 10px;font-size:11px;color:#64748b">DAU/MAU ratio</p>
                  ${bar(stickFill, '#10b981')}
                </td></tr>
              </table>
            </td>
            <!-- MRR -->
            <td width="25%" style="padding:8px;vertical-align:top">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                <tr><td style="padding:16px 16px 4px">
                  <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Active MRR</p>
                  <p style="margin:0 0 4px;font-size:26px;font-weight:800;color:#0f172a;line-height:1">${fmt(totalMrr)}</p>
                  <p style="margin:0 0 10px;font-size:11px;color:${netColor};font-weight:600">${netSign}${fmt(netMrrChange)} net</p>
                  ${bar(70, '#6366f1')}
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── CUSTOMER SNAPSHOT ── -->
    <tr>
      <td style="background:#ffffff;padding:0 32px 16px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:8px;text-align:center">
              <div style="background:#f0fdf4;border-radius:8px;padding:14px;display:inline-block;width:100%">
                <span style="font-size:24px;font-weight:800;color:#10b981">${activeCustomers}</span>
                <span style="display:block;font-size:11px;color:#166534;font-weight:600;margin-top:2px">Active</span>
              </div>
            </td>
            <td align="center" style="padding:8px;text-align:center">
              <div style="background:#fffbeb;border-radius:8px;padding:14px;display:inline-block;width:100%">
                <span style="font-size:24px;font-weight:800;color:#f59e0b">${atRiskCount}</span>
                <span style="display:block;font-size:11px;color:#92400e;font-weight:600;margin-top:2px">At Risk</span>
              </div>
            </td>
            <td align="center" style="padding:8px;text-align:center">
              <div style="background:#fef2f2;border-radius:8px;padding:14px;display:inline-block;width:100%">
                <span style="font-size:24px;font-weight:800;color:#ef4444">${churnedCount}</span>
                <span style="display:block;font-size:11px;color:#991b1b;font-weight:600;margin-top:2px">Churned</span>
              </div>
            </td>
            <td align="center" style="padding:8px;text-align:center">
              <div style="background:#eef2ff;border-radius:8px;padding:14px;display:inline-block;width:100%">
                <span style="font-size:24px;font-weight:800;color:#6366f1">${newCount}</span>
                <span style="display:block;font-size:11px;color:#3730a3;font-weight:600;margin-top:2px">New</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── AT-RISK ACCOUNTS ── -->
    ${atRiskRows ? `
    <tr>
      <td style="background:#ffffff;padding:0 32px 24px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #fde68a;border-radius:10px;overflow:hidden">
          <tr>
            <td colspan="3" style="padding:12px 16px;background:#fffbeb;border-bottom:1px solid #fde68a">
              <span style="font-size:13px;font-weight:700;color:#92400e">&#9888;&nbsp; At-Risk Accounts — ${fmt(atRiskMrr)} in exposure</span>
            </td>
          </tr>
          <tr>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">Customer</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">Plan</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">MRR</th>
          </tr>
          ${atRiskRows}
        </table>
      </td>
    </tr>` : ''}

    <!-- ── RECENT CHURNS ── -->
    ${churnRows ? `
    <tr>
      <td style="background:#ffffff;padding:0 32px 24px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #fecaca;border-radius:10px;overflow:hidden">
          <tr>
            <td colspan="4" style="padding:12px 16px;background:#fef2f2;border-bottom:1px solid #fecaca">
              <span style="font-size:13px;font-weight:700;color:#991b1b">&#10060;&nbsp; Recent Churns — ${fmt(lostMrr)} MRR lost</span>
            </td>
          </tr>
          <tr>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">Customer</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">Plan</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">MRR</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc;text-align:left">Reason</th>
          </tr>
          ${churnRows}
        </table>
      </td>
    </tr>` : ''}

    <!-- ── STICKINESS HEALTH ── -->
    <tr>
      <td style="background:#ffffff;padding:0 32px 24px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e0e7ff;border-radius:10px;overflow:hidden">
          <tr>
            <td colspan="2" style="padding:12px 16px;background:#eef2ff;border-bottom:1px solid #e0e7ff">
              <span style="font-size:13px;font-weight:700;color:#3730a3">&#128200;&nbsp; Stickiness Health — ${stickiness}% DAU/MAU</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px">
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600">Overall engagement score</p>
              ${bar(stickFill, '#6366f1', 10)}
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
                <tr>
                  <td style="text-align:center;padding:4px">
                    <div style="background:#f0fdf4;border-radius:6px;padding:8px">
                      <div style="font-size:11px;font-weight:700;color:#10b981">POWER</div>
                      <div style="font-size:10px;color:#64748b">&#8805; 60%</div>
                    </div>
                  </td>
                  <td style="text-align:center;padding:4px">
                    <div style="background:#eef2ff;border-radius:6px;padding:8px">
                      <div style="font-size:11px;font-weight:700;color:#6366f1">ENGAGED</div>
                      <div style="font-size:10px;color:#64748b">35–60%</div>
                    </div>
                  </td>
                  <td style="text-align:center;padding:4px">
                    <div style="background:#fffbeb;border-radius:6px;padding:8px">
                      <div style="font-size:11px;font-weight:700;color:#f59e0b">CASUAL</div>
                      <div style="font-size:10px;color:#64748b">15–35%</div>
                    </div>
                  </td>
                  <td style="text-align:center;padding:4px">
                    <div style="background:#fef2f2;border-radius:6px;padding:8px">
                      <div style="font-size:11px;font-weight:700;color:#ef4444">DORMANT</div>
                      <div style="font-size:10px;color:#64748b">&lt; 15%</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── FOOTER ── -->
    <tr>
      <td style="background:#1e1b4b;border-radius:0 0 12px 12px;padding:20px 32px">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <p style="margin:0 0 4px;color:#a5b4fc;font-size:12px;font-weight:700">RetainIQ Audit Dashboard</p>
              <p style="margin:0;color:#6366f1;font-size:11px">This report was auto-generated for the last ${period} days ending ${generatedAt}</p>
            </td>
            <td align="right" valign="middle">
              <span style="display:inline-block;background:#4f46e5;color:#e0e7ff;font-size:11px;font-weight:600;padding:6px 14px;border-radius:6px">
                Operational Report
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`;
};
