import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import os from 'os';
import url from 'url';
import { execFile } from 'child_process';
import { DashboardService } from './dashboard.service';
import { ReportService } from './report.service';
import { logger } from '../config/logger.config';

export class PdfReportService {
  /**
   * Reads a file as a stream and accumulates it into a string
   */
  private static async readTemplateStream(templatePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(templatePath, { encoding: 'utf-8' });
      let data = '';
      stream.on('data', (chunk) => {
        data += chunk;
      });
      stream.on('end', () => resolve(data));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * Prepares and encodes the logo from frontend/public/logo.png as a base64 Data URL
   */
  private static getLogoDataUrl(): string {
    const candidates = [
      path.resolve(__dirname, '../../frontend/public/logo.png'),
      path.resolve(__dirname, '../../../frontend/public/logo.png'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logo.png'),
      path.join(process.cwd(), 'frontend', 'public', 'logo.png'),
      path.join(process.cwd(), 'public', 'logo.png'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const buf = fs.readFileSync(p);
          return `data:image/png;base64,${buf.toString('base64')}`;
        } catch {}
      }
    }
    return '/logo.png';
  }

  /**
   * Loads the HTML template at runtime as a stream and injects all dynamic report data
   */
  public static async generateRenderedHtml(userId: number, monthKey?: string): Promise<{ html: string; filename: string }> {
    const targetMonth = monthKey || dayjs().format('YYYY-MM');
    const targetDate = dayjs(`${targetMonth}-01`);
    const monthName = targetDate.format('MMMM YYYY');
    const startDateStr = `01 ${targetDate.format('MMM YYYY')}`;
    const endDateStr = `${targetDate.endOf('month').format('DD MMM YYYY')}`;
    const generatedAt = dayjs().format('DD-MMM-YYYY HH:mm:ss [IST]');

    // Fetch complete metrics & ledgers from DashboardService in month mode
    const metrics = await DashboardService.getDashboardMetrics(userId, {
      monthYear: targetMonth,
      budgetId: 'month',
    });

    let templatePath = path.join(process.cwd(), 'assets', 'reports', 'monthlyFinancialStatement.html');
    if (!templatePath) {
      throw new Error('Financial statement HTML template file not found on server.');
    }

    const templateContent = await this.readTemplateStream(templatePath);
    const logoUrl = this.getLogoDataUrl();

    const userProfile = metrics.userProfile || ({} as any);
    const userName = userProfile.name || 'Valued User';
    const userEmail = userProfile.email || 'N/A';
    const employmentType = userProfile.employment_type || 'Standard';

    const monthlyIncome = metrics.monthlyIncome || 0;
    const totalExpense = metrics.totalExpenseIncurred || 0;
    const moneyLeft = metrics.amountMoneyLeft !== undefined ? metrics.amountMoneyLeft : 0;
    const fixedTotal = metrics.fixedExpensesTotal || 0;
    const variableTotal = metrics.variableExpensesTotal || 0;

    const categoryBreakdown = metrics.categoryBreakdown || [];
    const expensesList = metrics.expensesList || [];
    const monthlyInflows = metrics.monthlyInflows || [];
    const debtsList = metrics.debtsList || [];
    const debtsSummary = metrics.debtsSummary || ({} as any);

    const budgetUsagePercent =
      metrics.analytics?.budgetUsagePercent ??
      (monthlyIncome > 0 ? parseFloat(((totalExpense / monthlyIncome) * 100).toFixed(1)) : 0);
    const savingsRate =
      metrics.analytics?.savingsRate ?? (monthlyIncome > 0 ? parseFloat(((moneyLeft / monthlyIncome) * 100).toFixed(1)) : 0);
    const dailyAverage = metrics.analytics?.dailyAverageExpense ?? (totalExpense / targetDate.daysInMonth()).toFixed(2);
    const daysInMonth = targetDate.daysInMonth();

    const totalLent = debtsSummary.totalLent || 0;
    const totalBorrowed = debtsSummary.totalBorrowed || 0;
    const pendingReceivables = debtsSummary.totalPendingReceivable || 0;
    const pendingPayables = debtsSummary.totalPendingPayable || 0;

    const docRefNumber = `CW-STMT-${targetMonth.replace('-', '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Build Inflows Table Rows
    const inflowsRows =
      monthlyInflows.length > 0
        ? monthlyInflows
            .map(
              (inf: any) => `
          <tr>
            <td><strong>${inf.source}</strong>${inf.notes ? ` <span style="color:#64748b">(${inf.notes})</span>` : ''}</td>
            <td>${dayjs(inf.received_date).format('DD-MMM-YYYY')}</td>
            <td class="num" style="color: #15803d; font-weight: 700;">+₹${inf.amount.toLocaleString('en-IN')}</td>
          </tr>
        `,
            )
            .join('')
        : `
          <tr>
            <td colspan="2">Standard Primary Monthly Budget Allocation</td>
            <td class="num" style="color: #15803d; font-weight: 700;">₹${monthlyIncome.toLocaleString('en-IN')}</td>
          </tr>
        `;

    // Build Category Table Rows
    const categoryRows =
      categoryBreakdown.length > 0
        ? categoryBreakdown
            .map(
              (c: any, idx: number) => `
          <tr>
            <td>${String(idx + 1).padStart(2, '0')}</td>
            <td><strong>${c.category}</strong></td>
            <td class="num" style="font-weight: 700;">₹${c.amount.toLocaleString('en-IN')}</td>
            <td class="num">${c.percentage}%</td>
            <td class="num">${monthlyIncome > 0 ? ((c.amount / monthlyIncome) * 100).toFixed(1) : 0}%</td>
            <td style="text-align: center;">
              <span class="pill ${c.percentage > 35 ? 'pill-orange' : 'pill-slate'}">
                ${c.percentage > 35 ? 'Major Driver' : 'Nominal'}
              </span>
            </td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:12px;">No categorized expenses recorded in this period.</td></tr>';

    // Build Itemized Expense Ledger Rows
    const expensesRows =
      expensesList.length > 0
        ? expensesList
            .map(
              (exp: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-weight: 600;">${dayjs(exp.expense_date).format('DD-MMM-YYYY')}</td>
            <td><strong>${exp.name}</strong></td>
            <td>${exp.category}</td>
            <td><span class="pill ${exp.type === 'Fixed' ? 'pill-purple' : 'pill-slate'}">${exp.type}</span></td>
            <td style="text-align: center;">
              ${exp.hasReceipt ? '<span class="pill pill-green">Verified</span>' : '<span style="color:#94a3b8;">—</span>'}
            </td>
            <td class="num" style="font-weight: 700; color: #b91c1c;">₹${exp.amount.toLocaleString('en-IN')}</td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="7" style="text-align:center; color:#64748b; padding: 14px;">No expense records found for this period.</td></tr>';

    // Build Debts Lent Rows
    const debtsLentRows =
      debtsList.filter((d: any) => d.type === 'LENT').length > 0
        ? debtsList
            .filter((d: any) => d.type === 'LENT')
            .map(
              (d: any) => `
          <tr>
            <td><strong>${d.person_name}</strong></td>
            <td class="num">₹${d.initial_amount.toLocaleString('en-IN')}</td>
            <td class="num" style="color: #15803d;">₹${d.settled_amount.toLocaleString('en-IN')}</td>
            <td class="num" style="font-weight: 700; color: #7c3aed;">₹${d.balance.toLocaleString('en-IN')}</td>
            <td>
              <span class="pill ${d.status === 'SETTLED' ? 'pill-green' : d.isOverdue ? 'pill-red' : 'pill-purple'}">
                ${d.status === 'SETTLED' ? 'Settled' : d.isOverdue ? 'Overdue' : 'Pending'}
              </span>
            </td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="5" style="text-align:center; color:#64748b;">No active lending records.</td></tr>';

    // Build Debts Borrowed Rows
    const debtsBorrowedRows =
      debtsList.filter((d: any) => d.type === 'BORROWED').length > 0
        ? debtsList
            .filter((d: any) => d.type === 'BORROWED')
            .map(
              (d: any) => `
          <tr>
            <td><strong>${d.person_name}</strong></td>
            <td class="num">₹${d.initial_amount.toLocaleString('en-IN')}</td>
            <td class="num" style="color: #15803d;">₹${d.settled_amount.toLocaleString('en-IN')}</td>
            <td class="num" style="font-weight: 700; color: #ea580c;">₹${d.balance.toLocaleString('en-IN')}</td>
            <td>
              <span class="pill ${d.status === 'SETTLED' ? 'pill-green' : 'pill-orange'}">
                ${d.status === 'SETTLED' ? 'Repaid' : 'Pending'}
              </span>
            </td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="5" style="text-align:center; color:#64748b;">No active borrowed debts.</td></tr>';

    // Build Audit Observations
    const auditObservations = `
      <li><strong>Budget Compliance:</strong> Account utilized <strong>${budgetUsagePercent}%</strong> of its allocated income of ₹${monthlyIncome.toLocaleString('en-IN')}, maintaining a net unspent margin of ₹${moneyLeft.toLocaleString('en-IN')} (${savingsRate}% savings rate).</li>
      <li><strong>Primary Spending Driver:</strong> ${
        categoryBreakdown.length > 0
          ? `Largest outflow was attributed to <strong>${categoryBreakdown[0].category}</strong> representing ₹${categoryBreakdown[0].amount.toLocaleString('en-IN')} (${categoryBreakdown[0].percentage}% of total expenses).`
          : 'No specific category concentration observed.'
      }</li>
      <li><strong>Fixed vs Variable Ratio:</strong> Fixed non-discretionary commitments formed <strong>${totalExpense > 0 ? ((fixedTotal / totalExpense) * 100).toFixed(1) : 0}%</strong> of monthly burn, while discretionary variable spend accounted for <strong>${totalExpense > 0 ? ((variableTotal / totalExpense) * 100).toFixed(1) : 0}%</strong>.</li>
      <li><strong>Credit &amp; Debt Exposure:</strong> Total net pending receivables to recover stand at <strong>₹${pendingReceivables.toLocaleString('en-IN')}</strong> against pending borrowed liabilities of <strong>₹${pendingPayables.toLocaleString('en-IN')}</strong>.</li>
    `;

    // Inject all variables into the template string
    const renderedHtml = templateContent
      .replace(/{{MONTH_NAME}}/g, monthName)
      .replace(/{{LOGO_URL}}/g, logoUrl)
      .replace(/{{DOC_REF}}/g, docRefNumber)
      .replace(/{{START_DATE}}/g, startDateStr)
      .replace(/{{END_DATE}}/g, endDateStr)
      .replace(/{{GENERATED_AT}}/g, generatedAt)
      .replace(/{{USER_NAME}}/g, userName)
      .replace(/{{USER_EMAIL}}/g, userEmail)
      .replace(/{{EMPLOYMENT_TYPE}}/g, employmentType)
      .replace(/{{MONTHLY_INCOME}}/g, monthlyIncome.toLocaleString('en-IN'))
      .replace(/{{TOTAL_EXPENSE}}/g, totalExpense.toLocaleString('en-IN'))
      .replace(/{{EXPENSE_COUNT}}/g, String(expensesList.length))
      .replace(/{{MONEY_LEFT}}/g, moneyLeft.toLocaleString('en-IN'))
      .replace(/{{SAVINGS_RATE}}/g, String(savingsRate))
      .replace(/{{BUDGET_USAGE_PERCENT}}/g, String(budgetUsagePercent))
      .replace(
        /{{UTILIZATION_PILL_CLASS}}/g,
        budgetUsagePercent > 90 ? 'pill-red' : budgetUsagePercent > 70 ? 'pill-orange' : 'pill-green',
      )
      .replace(
        /{{UTILIZATION_LABEL}}/g,
        budgetUsagePercent > 90 ? 'High Utilization' : budgetUsagePercent > 70 ? 'Normal Pace' : 'Economical',
      )
      .replace(/{{FIXED_EXPENSES_TOTAL}}/g, fixedTotal.toLocaleString('en-IN'))
      .replace(/{{FIXED_PERCENT}}/g, totalExpense > 0 ? String(((fixedTotal / totalExpense) * 100).toFixed(1)) : '0')
      .replace(/{{VARIABLE_EXPENSES_TOTAL}}/g, variableTotal.toLocaleString('en-IN'))
      .replace(/{{VARIABLE_PERCENT}}/g, totalExpense > 0 ? String(((variableTotal / totalExpense) * 100).toFixed(1)) : '0')
      .replace(/{{DAILY_AVERAGE}}/g, String(dailyAverage))
      .replace(/{{DAYS_IN_MONTH}}/g, String(daysInMonth))
      .replace(/{{INFLOWS_COUNT}}/g, String(monthlyInflows.length))
      .replace(/{{INFLOWS_ROWS}}/g, inflowsRows)
      .replace(/{{CATEGORY_COUNT}}/g, String(categoryBreakdown.length))
      .replace(/{{CATEGORY_ROWS}}/g, categoryRows)
      .replace(/{{TOTAL_CAT_PERCENT}}/g, totalExpense > 0 ? '100.0' : '0.0')
      .replace(
        /{{TOTAL_CAT_INCOME_PERCENT}}/g,
        monthlyIncome > 0 ? String(((totalExpense / monthlyIncome) * 100).toFixed(1)) : '0',
      )
      .replace(/{{EXPENSES_ROWS}}/g, expensesRows)
      .replace(/{{TOTAL_LENT}}/g, totalLent.toLocaleString('en-IN'))
      .replace(/{{DEBTS_LENT_ROWS}}/g, debtsLentRows)
      .replace(/{{TOTAL_BORROWED}}/g, totalBorrowed.toLocaleString('en-IN'))
      .replace(/{{DEBTS_BORROWED_ROWS}}/g, debtsBorrowedRows)
      .replace(/{{AUDIT_OBSERVATIONS}}/g, auditObservations);

    return {
      html: renderedHtml,
      filename: `CW-Financial-Statement-${targetMonth}.pdf`,
    };
  }

  /**
   * Discovers the browser executable across Windows, Linux / Alpine Docker, macOS, and env variables
   */
  private static findBrowserExecutable(): string | undefined {
    const envPaths = [process.env.PUPPETEER_EXECUTABLE_PATH, process.env.CHROME_BIN, process.env.EDGE_BIN].filter(
      Boolean,
    ) as string[];

    const linuxPaths = [
      '/usr/bin/chromium-browser', // Alpine Linux default
      '/usr/bin/chromium', // Debian / Ubuntu
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome-unstable',
      '/snap/bin/chromium',
    ];

    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

    const windowsPaths = [
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];

    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];

    const candidates = [...envPaths, ...windowsPaths, ...linuxPaths, ...macPaths];
    for (const p of candidates) {
      if (p && fs.existsSync(p)) {
        return p;
      }
    }
    return undefined;
  }

  /**
   * Generates a high-fidelity PDF buffer using Puppeteer or Puppeteer-core
   */
  private static async generateWithPuppeteer(html: string, chromePath?: string): Promise<Buffer | null> {
    let puppeteer: any = null;
    try {
      puppeteer = require('puppeteer');
    } catch {
      try {
        puppeteer = require('puppeteer-core');
      } catch {
        return null;
      }
    }

    if (!puppeteer) return null;

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ];

    const launchOptions: any = {
      headless: 'new',
      args: launchArgs,
    };

    const exe = chromePath || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
    if (exe && fs.existsSync(exe)) {
      launchOptions.executablePath = exe;
    }

    let browser: any = null;
    try {
      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      });
      return Buffer.from(pdfBuffer);
    } catch (err) {
      logger.warn(`Puppeteer generation error: ${(err as Error).message}`);
      return null;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * Generates a true PDF binary by directly invoking the system Chromium/Edge/Chrome process
   */
  private static async generateWithCliBrowser(html: string, browserExe: string): Promise<Buffer | null> {
    const tempDir = os.tmpdir();
    const uniqueId = `cw_stmt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempHtmlPath = path.join(tempDir, `${uniqueId}.html`);
    const tempPdfPath = path.join(tempDir, `${uniqueId}.pdf`);
    const tempUserDataDir = path.join(tempDir, `cw_browser_profile_${uniqueId}`);

    try {
      fs.writeFileSync(tempHtmlPath, html, 'utf-8');
      const fileUrl = url.pathToFileURL(tempHtmlPath).href;

      const runWithFlag = (headlessFlag: string) =>
        new Promise<void>((resolve, reject) => {
          execFile(
            browserExe,
            [
              headlessFlag,
              `--user-data-dir=${tempUserDataDir}`,
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--no-first-run',
              '--no-default-browser-check',
              '--disable-extensions',
              '--disable-background-networking',
              '--no-pdf-header-footer',
              '--run-all-compositor-stages-before-draw',
              `--print-to-pdf=${tempPdfPath}`,
              fileUrl,
            ],
            { timeout: 25000 },
            (err) => {
              if (err) reject(err);
              else resolve();
            },
          );
        });

      try {
        await runWithFlag('--headless=new');
      } catch (firstErr) {
        logger.warn(`Browser --headless=new failed: ${(firstErr as Error).message}. Retrying with --headless.`);
        try {
          await runWithFlag('--headless');
        } catch (secondErr) {
          logger.warn(`Browser --headless fallback failed: ${(secondErr as Error).message}`);
        }
      }

      if (fs.existsSync(tempPdfPath) && fs.statSync(tempPdfPath).size > 0) {
        const buffer = fs.readFileSync(tempPdfPath);
        return buffer;
      }
      return null;
    } finally {
      try {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        if (fs.existsSync(tempUserDataDir)) fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      } catch {}
    }
  }

  /**
   * Generates a genuine, standard-compliant PDF 1.4 binary buffer as a reliable fallback
   * guaranteeing that every PDF output is 100% valid and viewable in any browser.
   */
  private static generateStandardPdfBuffer(metrics: any, targetMonth: string): Buffer {
    const targetDate = dayjs(`${targetMonth}-01`);
    const monthName = targetDate.format('MMMM YYYY');
    const userProfile = metrics.userProfile || {};
    const userName = userProfile.name || 'Valued User';
    const userEmail = userProfile.email || 'N/A';
    const monthlyIncome = (metrics.monthlyIncome || 0).toLocaleString('en-IN');
    const totalExpense = (metrics.totalExpenseIncurred || 0).toLocaleString('en-IN');
    const moneyLeft = (metrics.amountMoneyLeft !== undefined ? metrics.amountMoneyLeft : 0).toLocaleString('en-IN');
    const generatedAt = dayjs().format('DD-MMM-YYYY HH:mm:ss');
    const docRef = `CW-STMT-${targetMonth.replace('-', '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const textLines = [
      `CW EXPENSE TRACKER - FINANCIAL STATEMENT`,
      `Document Reference: ${docRef}`,
      `Statement Month: ${monthName} | Generated: ${generatedAt}`,
      `--------------------------------------------------------------------------------`,
      `ACCOUNT HOLDER DETAILS:`,
      `Name: ${userName}  |  Email: ${userEmail}  |  Employment: ${userProfile.employment_type || 'Standard'}`,
      `--------------------------------------------------------------------------------`,
      `FINANCIAL SUMMARY:`,
      `Total Monthly Budget / Inflow: INR ${monthlyIncome}`,
      `Total Expenditures Incurred:   INR ${totalExpense}`,
      `Net Savings / Remaining Funds: INR ${moneyLeft}`,
      `Budget Utilization Rate:       ${metrics.analytics?.budgetUsagePercent ?? 'N/A'}%`,
      `--------------------------------------------------------------------------------`,
      `EXPENSE BREAKDOWN BY CATEGORY:`,
    ];

    const breakdown = metrics.categoryBreakdown || [];
    if (breakdown.length > 0) {
      breakdown.forEach((cat: any, idx: number) => {
        textLines.push(`${idx + 1}. ${cat.category}: INR ${(cat.amount || 0).toLocaleString('en-IN')} (${cat.percentage}%)`);
      });
    } else {
      textLines.push(`No expense records found for this period.`);
    }

    textLines.push(
      `--------------------------------------------------------------------------------`,
      `AUDIT VERIFICATION:`,
      `This document is an authentic financial audit record generated by CW Expense Tracker.`,
      `Confidential & Proprietary. All figures stated in Indian National Rupees (INR).`,
    );

    const sanitize = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    let streamOps = `BT\n/F1 14 Tf\n50 780 Td\n(${sanitize(textLines[0])}) Tj\nET\n`;
    let currentY = 760;
    for (let i = 1; i < textLines.length; i++) {
      currentY -= 16;
      if (currentY < 50) break;
      const line = sanitize(textLines[i]);
      streamOps += `BT\n/F2 10 Tf\n50 ${currentY} Td\n(${line}) Tj\nET\n`;
    }

    const streamLength = Buffer.byteLength(streamOps, 'utf-8');

    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 =
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamOps}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
    const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

    const offsets: number[] = [];
    let currentOffset = Buffer.byteLength(header, 'utf-8');

    const objs = [obj1, obj2, obj3, obj4, obj5, obj6];
    for (const obj of objs) {
      offsets.push(currentOffset);
      currentOffset += Buffer.byteLength(obj, 'utf-8');
    }

    const xrefOffset = currentOffset;
    let xref = `xref\n0 7\n0000000000 65535 f \n`;
    for (const off of offsets) {
      xref += `${String(off).padStart(10, '0')} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    const fullPdfString = header + objs.join('') + xref + trailer;

    return Buffer.from(fullPdfString, 'binary');
  }

  /**
   * Generates a true PDF binary using Puppeteer, Headless Browser, or standard PDF fallback.
   * Guarantees the output is ALWAYS a 100% valid PDF buffer viewable in any browser.
   */
  public static async generatePdfBuffer(
    userId: number,
    monthKey?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const targetMonth = monthKey || dayjs().format('YYYY-MM');
    const { html, filename } = await this.generateRenderedHtml(userId, targetMonth);
    const browserExe = this.findBrowserExecutable();

    // 1. Attempt Puppeteer generation
    try {
      const puppeteerPdf = await this.generateWithPuppeteer(html, browserExe);
      if (puppeteerPdf && puppeteerPdf.length > 0) {
        logger.info(`Statement PDF generated successfully using Puppeteer for user ${userId} (${targetMonth})`);
        return {
          buffer: puppeteerPdf,
          mimeType: 'application/pdf',
          filename,
        };
      }
    } catch (pupErr) {
      logger.warn(`Puppeteer generation attempt failed: ${(pupErr as Error).message}`);
    }

    // 2. Attempt Headless Browser CLI generation (Edge / Chrome / Chromium)
    if (browserExe) {
      try {
        const cliPdf = await this.generateWithCliBrowser(html, browserExe);
        if (cliPdf && cliPdf.length > 0) {
          logger.info(`Statement PDF generated successfully using Headless Browser (${browserExe}) for user ${userId}`);
          return {
            buffer: cliPdf,
            mimeType: 'application/pdf',
            filename,
          };
        }
      } catch (cliErr) {
        logger.warn(`Headless CLI generation attempt failed: ${(cliErr as Error).message}`);
      }
    }

    // 3. Guaranteed Fallback: Standard PDF 1.4 binary buffer
    logger.warn(`Rendering statement fallback standard PDF binary for user ${userId} (${targetMonth})`);
    const metrics = await DashboardService.getDashboardMetrics(userId, {
      monthYear: targetMonth,
      budgetId: 'month',
    });
    const fallbackPdf = this.generateStandardPdfBuffer(metrics, targetMonth);

    return {
      buffer: fallbackPdf,
      mimeType: 'application/pdf',
      filename,
    };
  }

  /**
   * Helper to determine pill styling based on payment mode
   */
  private static getPaymentModePillClass(mode: string): string {
    const m = (mode || '').toLowerCase();
    if (m.includes('upi')) return 'pill-blue';
    if (m.includes('credit')) return 'pill-purple';
    if (m.includes('cash')) return 'pill-green';
    if (m.includes('debit')) return 'pill-orange';
    if (m.includes('net') || m.includes('bank')) return 'pill-indigo';
    return 'pill-slate';
  }

  /**
   * Helper to determine visual progress bar color based on payment mode
   */
  private static getPaymentModeBarColor(mode: string): string {
    const m = (mode || '').toLowerCase();
    if (m.includes('upi')) return '#2563eb';
    if (m.includes('credit')) return '#9333ea';
    if (m.includes('cash')) return '#16a34a';
    if (m.includes('debit')) return '#ea580c';
    if (m.includes('net') || m.includes('bank')) return '#4f46e5';
    return '#64748b';
  }

  /**
   * Loads the Payment Mode HTML template and injects dynamic monthly data
   */
  public static async generatePaymentModesRenderedHtml(
    userId: number,
    monthKey?: string,
  ): Promise<{ html: string; filename: string }> {
    const targetMonth = monthKey || dayjs().format('YYYY-MM');
    const targetDate = dayjs(`${targetMonth}-01`);
    const monthName = targetDate.format('MMMM YYYY');
    const startDateStr = `01 ${targetDate.format('MMM YYYY')}`;
    const endDateStr = `${targetDate.endOf('month').format('DD MMM YYYY')}`;
    const generatedAt = dayjs().format('DD-MMM-YYYY HH:mm:ss [IST]');

    const metrics = await DashboardService.getDashboardMetrics(userId, {
      monthYear: targetMonth,
      budgetId: 'month',
    });
    const templatePath = path.join(process.cwd(), 'assets', 'reports', 'paymentModesReport.html');
    const templateContent = await this.readTemplateStream(templatePath);
    const logoUrl = this.getLogoDataUrl();

    const userProfile = metrics.userProfile || ({} as any);
    const userName = userProfile.name || 'Valued User';
    const userEmail = userProfile.email || 'N/A';
    const employmentType = userProfile.employment_type || 'Standard';

    const totalExpenseIncurred = metrics.totalExpenseIncurred || 0;
    const periodCreditCardExpense = metrics?.creditCardExpensesTotal || 0;
    const totalSpent = parseFloat((totalExpenseIncurred + periodCreditCardExpense).toFixed(2));
    const expensesList = metrics.expensesList || [];
    const totalTxns = expensesList.length;
    const paymentModeBreakdown = metrics.paymentModeBreakdown || [];

    const dominantMode =
      paymentModeBreakdown.length > 0 && paymentModeBreakdown[0].amount > 0
        ? paymentModeBreakdown[0]
        : { mode: 'None', amount: 0, count: 0, percentage: 0 };

    const avgTxnSize =
      totalTxns > 0
        ? (totalSpent / totalTxns).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';

    const docRefNumber = `CW-PAY-${targetMonth.replace('-', '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Build Payment Mode Rows
    const paymentModeRows =
      paymentModeBreakdown.length > 0
        ? paymentModeBreakdown
            .map(
              (b: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td><span class="pill ${this.getPaymentModePillClass(b.mode)}">${b.mode}</span></td>
            <td class="num">${b.count} Txns</td>
            <td class="num" style="font-weight: 700; color: #002060;">₹${(b.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="num" style="font-weight: 700;">${b.percentage}%</td>
            <td>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${Math.min(100, b.percentage)}%; background: ${this.getPaymentModeBarColor(b.mode)};"></div>
              </div>
            </td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 14px;">No payment modes recorded for this month.</td></tr>';

    // Build Transaction Rows
    const transactionRows =
      expensesList.length > 0
        ? expensesList
            .map(
              (exp: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-weight: 600;">${dayjs(exp.expense_date).format('DD-MMM-YYYY')}</td>
            <td><strong>${exp.name}</strong></td>
            <td>${exp.category}</td>
            <td><span class="pill ${this.getPaymentModePillClass(exp.payment_mode)}">${exp.payment_mode || 'Cash'}</span></td>
            <td class="num" style="font-weight: 700; color: #b91c1c;">₹${(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `,
            )
            .join('')
        : '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 14px;">No expense records cataloged for this period.</td></tr>';

    // Build Observations
    const digitalModes = ['upi', 'credit card', 'debit card', 'net banking'];
    const digitalTotal = paymentModeBreakdown
      .filter((b: any) => digitalModes.includes((b.mode || '').toLowerCase()))
      .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
    const digitalPercent = totalSpent > 0 ? ((digitalTotal / totalSpent) * 100).toFixed(1) : '0';

    const auditObservations = `
      <li><strong>Dominant Payment Channel:</strong> Primary outflow channel was <strong>${dominantMode.mode}</strong> accounting for <strong>₹${(dominantMode.amount || 0).toLocaleString('en-IN')}</strong> (${dominantMode.percentage}% of overall monthly expenditures).</li>
      <li><strong>Digital vs Offline Penetration:</strong> Digital payments accounted for <strong>${digitalPercent}%</strong> (₹${digitalTotal.toLocaleString('en-IN')}) of total burn during the period.</li>
      <li><strong>Credit Card Exposure:</strong> Spends charged to Credit Cards totaled <strong>₹${(periodCreditCardExpense || 0).toLocaleString('en-IN')}</strong> across ${paymentModeBreakdown.find((b: any) => (b.mode || '').toLowerCase().includes('credit'))?.count || 0} transactions.</li>
      <li><strong>Average Ticket Frequency:</strong> Total of <strong>${totalTxns} transactions</strong> were completed at an average velocity of ₹${avgTxnSize} per transaction.</li>
    `;

    const renderedHtml = templateContent
      .replace(/{{MONTH_NAME}}/g, monthName)
      .replace(/{{LOGO_URL}}/g, logoUrl)
      .replace(/{{DOC_REF}}/g, docRefNumber)
      .replace(/{{START_DATE}}/g, startDateStr)
      .replace(/{{END_DATE}}/g, endDateStr)
      .replace(/{{GENERATED_AT}}/g, generatedAt)
      .replace(/{{USER_NAME}}/g, userName)
      .replace(/{{USER_EMAIL}}/g, userEmail)
      .replace(/{{EMPLOYMENT_TYPE}}/g, employmentType)
      .replace(
        /{{TOTAL_SPENT}}/g,
        totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      )
      .replace(/{{TOTAL_TXNS}}/g, String(totalTxns))
      .replace(/{{DOMINANT_MODE}}/g, dominantMode.mode)
      .replace(/{{DOMINANT_MODE_PERCENT}}/g, String(dominantMode.percentage))
      .replace(/{{AVG_TXN_SIZE}}/g, avgTxnSize)
      .replace(/{{PAYMENT_MODE_ROWS}}/g, paymentModeRows)
      .replace(/{{TRANSACTION_ROWS}}/g, transactionRows)
      .replace(/{{AUDIT_OBSERVATIONS}}/g, auditObservations);

    const filename = `CW-Payment-Mode-Report-${targetMonth}.pdf`;
    return { html: renderedHtml, filename };
  }

  /**
   * Generates a standard PDF 1.4 binary buffer for Payment Modes as a 100% reliable fallback
   */
  private static generateStandardPdfBufferForPaymentModes(metrics: any, targetMonth: string): Buffer {
    const targetDate = dayjs(`${targetMonth}-01`);
    const monthName = targetDate.format('MMMM YYYY');
    const userProfile = metrics.userProfile || {};
    const userName = userProfile.name || 'Valued User';
    const userEmail = userProfile.email || 'N/A';
    const totalSpent = ((metrics.totalExpenseIncurred || 0) + (metrics.creditCardExpensesTotal || 0)).toLocaleString(
      'en-IN',
    );
    const totalTxns = (metrics.expensesList || []).length;
    const generatedAt = dayjs().format('DD-MMM-YYYY HH:mm:ss');
    const docRef = `CW-PAY-${targetMonth.replace('-', '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const textLines = [
      `CW EXPENSE TRACKER - ALL PAYMENT MODE REPORT`,
      `Document Reference: ${docRef}`,
      `Statement Month: ${monthName} | Generated: ${generatedAt}`,
      `--------------------------------------------------------------------------------`,
      `ACCOUNT HOLDER DETAILS:`,
      `Name: ${userName}  |  Email: ${userEmail}  |  Employment: ${userProfile.employment_type || 'Standard'}`,
      `--------------------------------------------------------------------------------`,
      `PAYMENT OUTFLOW SUMMARY:`,
      `Total Expenditures Incurred: INR ${totalSpent}`,
      `Total Transactions Recorded: ${totalTxns}`,
      `--------------------------------------------------------------------------------`,
      `BREAKDOWN BY PAYMENT MODE:`,
    ];

    const breakdown = metrics.paymentModeBreakdown || [];
    if (breakdown.length > 0) {
      breakdown.forEach((b: any, idx: number) => {
        textLines.push(
          `${idx + 1}. ${b.mode}: INR ${(b.amount || 0).toLocaleString('en-IN')} (${b.count} txns, ${b.percentage}%)`,
        );
      });
    } else {
      textLines.push(`No expense records found for this period.`);
    }

    textLines.push(
      `--------------------------------------------------------------------------------`,
      `AUDIT VERIFICATION:`,
      `This document is an authentic financial audit record generated by CW Expense Tracker.`,
      `Confidential & Proprietary. All figures stated in Indian National Rupees (INR).`,
    );

    const sanitize = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    let streamOps = `BT\n/F1 14 Tf\n50 780 Td\n(${sanitize(textLines[0])}) Tj\nET\n`;
    let currentY = 760;
    for (let i = 1; i < textLines.length; i++) {
      currentY -= 16;
      if (currentY < 50) break;
      const line = sanitize(textLines[i]);
      streamOps += `BT\n/F2 10 Tf\n50 ${currentY} Td\n(${line}) Tj\nET\n`;
    }

    const streamLength = Buffer.byteLength(streamOps, 'utf-8');

    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 =
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamOps}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
    const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

    const offsets: number[] = [];
    let currentOffset = Buffer.byteLength(header, 'utf-8');

    const objs = [obj1, obj2, obj3, obj4, obj5, obj6];
    for (const obj of objs) {
      offsets.push(currentOffset);
      currentOffset += Buffer.byteLength(obj, 'utf-8');
    }

    const xrefOffset = currentOffset;
    let xref = `xref\n0 7\n0000000000 65535 f \n`;
    for (const off of offsets) {
      xref += `${String(off).padStart(10, '0')} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    const fullPdfString = header + objs.join('') + xref + trailer;

    return Buffer.from(fullPdfString, 'binary');
  }

  /**
   * Generates a true PDF binary for Payment Modes using Puppeteer, Headless CLI, or standard PDF fallback
   */
  public static async generatePaymentModesPdfBuffer(
    userId: number,
    monthKey?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const targetMonth = monthKey || dayjs().format('YYYY-MM');
    const { html, filename } = await this.generatePaymentModesRenderedHtml(userId, targetMonth);
    const browserExe = this.findBrowserExecutable();

    // 1. Attempt Puppeteer generation
    try {
      const puppeteerPdf = await this.generateWithPuppeteer(html, browserExe);
      if (puppeteerPdf && puppeteerPdf.length > 0) {
        logger.info(`Payment Mode PDF generated successfully using Puppeteer for user ${userId} (${targetMonth})`);
        return {
          buffer: puppeteerPdf,
          mimeType: 'application/pdf',
          filename,
        };
      }
    } catch (pupErr) {
      logger.warn(`Puppeteer payment mode generation failed: ${(pupErr as Error).message}`);
    }

    // 2. Attempt Headless Browser CLI generation
    if (browserExe) {
      try {
        const cliPdf = await this.generateWithCliBrowser(html, browserExe);
        if (cliPdf && cliPdf.length > 0) {
          logger.info(`Payment Mode PDF generated successfully using CLI (${browserExe}) for user ${userId}`);
          return {
            buffer: cliPdf,
            mimeType: 'application/pdf',
            filename,
          };
        }
      } catch (cliErr) {
        logger.warn(`Headless CLI payment mode generation failed: ${(cliErr as Error).message}`);
      }
    }

    // 3. Fallback: Standard PDF 1.4 binary buffer
    logger.warn(`Rendering payment mode fallback standard PDF binary for user ${userId} (${targetMonth})`);
    const metrics = await DashboardService.getDashboardMetrics(userId, {
      monthYear: targetMonth,
      budgetId: 'month',
    });
    const fallbackPdf = this.generateStandardPdfBufferForPaymentModes(metrics, targetMonth);

    return {
      buffer: fallbackPdf,
      mimeType: 'application/pdf',
      filename,
    };
  }

  /**
   * Loads the Financial Year HTML template and injects dynamic annual fiscal data
   */
  public static async generateFinancialYearRenderedHtml(
    userId: number,
    fyKey?: string,
  ): Promise<{ html: string; filename: string }> {
    const summary = await ReportService.getFinancialYearSummary(userId, fyKey);

    const templatePath = path.join(process.cwd(), 'assets', 'reports', 'financialYearReport.html');
    const templateContent = await this.readTemplateStream(templatePath);
    const logoUrl = this.getLogoDataUrl();

    const userProfile = summary.userProfile || ({} as any);
    const userName = userProfile.name || 'Valued User';
    const userEmail = userProfile.email || 'N/A';
    const employmentType = userProfile.employment_type || 'Standard';

    const startDateStr = dayjs(summary.startDate).format('DD MMM YYYY');
    const endDateStr = dayjs(summary.endDate).format('DD MMM YYYY');
    const generatedAt = dayjs().format('DD-MMM-YYYY HH:mm:ss [IST]');
    const docRefNumber = `CW-FY-${summary.fyKey.replace('-', '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Monthly progression rows
    const monthlyRows = summary.monthlyBreakdown
      .map(
        (m: any, idx: number) => `
      <tr>
        <td><strong>M${idx + 1}</strong></td>
        <td>${m.monthName}</td>
        <td class="num">${m.count} Txns</td>
        <td class="num" style="font-weight: 700; color: #002060;">₹${(m.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="num" style="font-weight: 600;">${m.percentage}%</td>
      </tr>
    `,
      )
      .join('');

    // Category rows (Top 8)
    const categoryRows =
      summary.categoryBreakdown.length > 0
        ? summary.categoryBreakdown
            .slice(0, 8)
            .map(
              (c: any) => `
        <tr>
          <td><strong>${c.category}</strong></td>
          <td class="num" style="font-weight: 700; color: #002060;">₹${(c.amount || 0).toLocaleString('en-IN')}</td>
          <td class="num" style="font-weight: 600;">${c.percentage}%</td>
        </tr>
      `,
            )
            .join('')
        : '<tr><td colspan="3" style="text-align:center; color:#64748b;">No category spend recorded.</td></tr>';

    // Payment mode rows
    const paymentModeRows =
      summary.paymentModeBreakdown.length > 0
        ? summary.paymentModeBreakdown
            .map(
              (p: any) => `
        <tr>
          <td><span class="pill ${this.getPaymentModePillClass(p.mode)}">${p.mode}</span></td>
          <td class="num">${p.count} Txns</td>
          <td class="num" style="font-weight: 700; color: #002060;">₹${(p.amount || 0).toLocaleString('en-IN')}</td>
        </tr>
      `,
            )
            .join('')
        : '<tr><td colspan="3" style="text-align:center; color:#64748b;">No payment records recorded.</td></tr>';

    // Observations
    const auditObservations = `
      <li><strong>Annual Budget Compliance:</strong> The fiscal budget of <strong>₹${summary.totalBudget.toLocaleString('en-IN')}</strong> was utilized at <strong>${summary.budgetUsagePercent}%</strong>, resulting in net annual savings of <strong>₹${summary.netSavings.toLocaleString('en-IN')}</strong> (${summary.savingsRate}% savings margin).</li>
      <li><strong>Spending Velocity:</strong> A cumulative volume of <strong>${summary.totalTransactions} transactions</strong> occurred across the 12-month period.</li>
      <li><strong>Primary Outflow Driver:</strong> ${
        summary.categoryBreakdown.length > 0
          ? `Largest category burn was concentrated in <strong>${summary.categoryBreakdown[0].category}</strong> with ₹${summary.categoryBreakdown[0].amount.toLocaleString('en-IN')} (${summary.categoryBreakdown[0].percentage}% of total annual expenditure).`
          : 'No specific category concentration recorded.'
      }</li>
      <li><strong>Fiscal Year Cycle:</strong> This statement covers the full statutory period from <strong>${startDateStr}</strong> to <strong>${endDateStr}</strong>.</li>
    `;

    const renderedHtml = templateContent
      .replace(/{{FY_LABEL}}/g, summary.fyLabel)
      .replace(/{{LOGO_URL}}/g, logoUrl)
      .replace(/{{DOC_REF}}/g, docRefNumber)
      .replace(/{{START_DATE}}/g, startDateStr)
      .replace(/{{END_DATE}}/g, endDateStr)
      .replace(/{{GENERATED_AT}}/g, generatedAt)
      .replace(/{{USER_NAME}}/g, userName)
      .replace(/{{USER_EMAIL}}/g, userEmail)
      .replace(/{{EMPLOYMENT_TYPE}}/g, employmentType)
      .replace(
        /{{TOTAL_BUDGET}}/g,
        summary.totalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      )
      .replace(
        /{{TOTAL_EXPENSE}}/g,
        summary.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      )
      .replace(
        /{{NET_SAVINGS}}/g,
        summary.netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      )
      .replace(/{{TOTAL_TXNS}}/g, String(summary.totalTransactions))
      .replace(/{{BUDGET_USAGE_PERCENT}}/g, String(summary.budgetUsagePercent))
      .replace(/{{SAVINGS_RATE}}/g, String(summary.savingsRate))
      .replace(/{{MONTHLY_ROWS}}/g, monthlyRows)
      .replace(/{{CATEGORY_ROWS}}/g, categoryRows)
      .replace(/{{PAYMENT_MODE_ROWS}}/g, paymentModeRows)
      .replace(/{{AUDIT_OBSERVATIONS}}/g, auditObservations);

    const filename = `CW-Financial-Year-Statement-${summary.fyKey}.pdf`;
    return { html: renderedHtml, filename };
  }

  /**
   * Generates a standard PDF 1.4 binary buffer for Financial Year Report as a fallback
   */
  private static generateStandardPdfBufferForFinancialYear(summary: any): Buffer {
    const userProfile = summary.userProfile || {};
    const userName = userProfile.name || 'Valued User';
    const userEmail = userProfile.email || 'N/A';
    const totalBudget = (summary.totalBudget || 0).toLocaleString('en-IN');
    const totalSpent = (summary.totalSpent || 0).toLocaleString('en-IN');
    const netSavings = (summary.netSavings || 0).toLocaleString('en-IN');
    const generatedAt = dayjs().format('DD-MMM-YYYY HH:mm:ss');
    const docRef = `CW-FY-${summary.fyKey.replace('-', '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const textLines = [
      `CW EXPENSE TRACKER - ANNUAL FINANCIAL YEAR STATEMENT`,
      `Document Reference: ${docRef}`,
      `Financial Year: ${summary.fyLabel} | Generated: ${generatedAt}`,
      `--------------------------------------------------------------------------------`,
      `ACCOUNT HOLDER DETAILS:`,
      `Name: ${userName}  |  Email: ${userEmail}  |  Classification: ${userProfile.employment_type || 'Standard'}`,
      `Period: ${summary.startDate} to ${summary.endDate}`,
      `--------------------------------------------------------------------------------`,
      `ANNUAL FISCAL SUMMARY:`,
      `Total Annual Planned Budget: INR ${totalBudget}`,
      `Total Annual Outflow / Burn: INR ${totalSpent}`,
      `Net Annual Savings Retained: INR ${netSavings} (${summary.savingsRate}%)`,
      `Annual Budget Usage Pace:    ${summary.budgetUsagePercent}%`,
      `Total Transactions Recorded: ${summary.totalTransactions}`,
      `--------------------------------------------------------------------------------`,
      `TOP EXPENSE CATEGORIES:`,
    ];

    const cats = summary.categoryBreakdown || [];
    if (cats.length > 0) {
      cats.slice(0, 5).forEach((c: any, idx: number) => {
        textLines.push(
          `${idx + 1}. ${c.category}: INR ${(c.amount || 0).toLocaleString('en-IN')} (${c.percentage}%)`,
        );
      });
    } else {
      textLines.push(`No category expenses recorded.`);
    }

    textLines.push(
      `--------------------------------------------------------------------------------`,
      `AUDIT VERIFICATION:`,
      `This document is an authentic financial audit record generated by CW Expense Tracker.`,
      `Confidential & Proprietary. All figures stated in Indian National Rupees (INR).`,
    );

    const sanitize = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    let streamOps = `BT\n/F1 14 Tf\n50 780 Td\n(${sanitize(textLines[0])}) Tj\nET\n`;
    let currentY = 760;
    for (let i = 1; i < textLines.length; i++) {
      currentY -= 16;
      if (currentY < 50) break;
      const line = sanitize(textLines[i]);
      streamOps += `BT\n/F2 10 Tf\n50 ${currentY} Td\n(${line}) Tj\nET\n`;
    }

    const streamLength = Buffer.byteLength(streamOps, 'utf-8');

    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 =
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamOps}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
    const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

    const offsets: number[] = [];
    let currentOffset = Buffer.byteLength(header, 'utf-8');

    const objs = [obj1, obj2, obj3, obj4, obj5, obj6];
    for (const obj of objs) {
      offsets.push(currentOffset);
      currentOffset += Buffer.byteLength(obj, 'utf-8');
    }

    const xrefOffset = currentOffset;
    let xref = `xref\n0 7\n0000000000 65535 f \n`;
    for (const off of offsets) {
      xref += `${String(off).padStart(10, '0')} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    const fullPdfString = header + objs.join('') + xref + trailer;

    return Buffer.from(fullPdfString, 'binary');
  }

  /**
   * Generates a true PDF binary for Financial Year Report using Puppeteer, CLI browser, or standard PDF fallback
   */
  public static async generateFinancialYearPdfBuffer(
    userId: number,
    fyKey?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const { html, filename } = await this.generateFinancialYearRenderedHtml(userId, fyKey);
    const browserExe = this.findBrowserExecutable();

    // 1. Puppeteer
    try {
      const puppeteerPdf = await this.generateWithPuppeteer(html, browserExe);
      if (puppeteerPdf && puppeteerPdf.length > 0) {
        logger.info(`Financial Year PDF generated via Puppeteer for user ${userId} (${fyKey || 'Current FY'})`);
        return { buffer: puppeteerPdf, mimeType: 'application/pdf', filename };
      }
    } catch (pupErr) {
      logger.warn(`Puppeteer financial year generation failed: ${(pupErr as Error).message}`);
    }

    // 2. Headless CLI
    if (browserExe) {
      try {
        const cliPdf = await this.generateWithCliBrowser(html, browserExe);
        if (cliPdf && cliPdf.length > 0) {
          logger.info(`Financial Year PDF generated via CLI (${browserExe}) for user ${userId}`);
          return { buffer: cliPdf, mimeType: 'application/pdf', filename };
        }
      } catch (cliErr) {
        logger.warn(`Headless CLI financial year generation failed: ${(cliErr as Error).message}`);
      }
    }

    // 3. Fallback
    logger.warn(`Rendering financial year fallback standard PDF binary for user ${userId}`);
    const summary = await ReportService.getFinancialYearSummary(userId, fyKey);
    const fallbackPdf = this.generateStandardPdfBufferForFinancialYear(summary);

    return { buffer: fallbackPdf, mimeType: 'application/pdf', filename };
  }
}
