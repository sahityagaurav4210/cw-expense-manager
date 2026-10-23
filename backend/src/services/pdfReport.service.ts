import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import os from "os";
import { execFile } from "child_process";
import { DashboardService } from "./dashboard.service";
import { logger } from "../config/logger.config";

export class PdfReportService {
  /**
   * Reads a file as a stream and accumulates it into a string
   */
  private static async readTemplateStream(templatePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(templatePath, { encoding: "utf-8" });
      let data = "";
      stream.on("data", (chunk) => {
        data += chunk;
      });
      stream.on("end", () => resolve(data));
      stream.on("error", (err) => reject(err));
    });
  }

  /**
   * Prepares and encodes the logo from frontend/public/logo.png as a base64 Data URL
   */
  private static getLogoDataUrl(): string {
    const candidates = [
      path.resolve(__dirname, "../../frontend/public/logo.png"),
      path.resolve(__dirname, "../../../frontend/public/logo.png"),
      path.join(process.cwd(), "..", "frontend", "public", "logo.png"),
      path.join(process.cwd(), "frontend", "public", "logo.png"),
      path.join(process.cwd(), "public", "logo.png"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const buf = fs.readFileSync(p);
          return `data:image/png;base64,${buf.toString("base64")}`;
        } catch {}
      }
    }
    return "/logo.png";
  }

  /**
   * Loads the HTML template at runtime as a stream and injects all dynamic report data
   */
  public static async generateRenderedHtml(userId: number, monthKey?: string): Promise<{ html: string; filename: string }> {
    const targetMonth = monthKey || dayjs().format("YYYY-MM");
    const targetDate = dayjs(`${targetMonth}-01`);
    const monthName = targetDate.format("MMMM YYYY");
    const startDateStr = `01 ${targetDate.format("MMM YYYY")}`;
    const endDateStr = `${targetDate.endOf("month").format("DD MMM YYYY")}`;
    const generatedAt = dayjs().format("DD-MMM-YYYY HH:mm:ss [IST]");

    // Fetch complete metrics & ledgers from DashboardService
    const metrics = await DashboardService.getDashboardMetrics(userId, targetMonth);

    // Locate and stream the HTML template
    const templateCandidates = [
      path.resolve(__dirname, "../templates/monthlyFinancialStatement.html"),
      path.join(process.cwd(), "src", "templates", "monthlyFinancialStatement.html"),
      path.join(process.cwd(), "templates", "monthlyFinancialStatement.html"),
    ];

    let templatePath = templateCandidates.find((p) => fs.existsSync(p));
    if (!templatePath) {
      throw new Error("Financial statement HTML template file not found on server.");
    }

    const templateContent = await this.readTemplateStream(templatePath);
    const logoUrl = this.getLogoDataUrl();

    const userProfile = metrics.userProfile || ({} as any);
    const userName = userProfile.name || "Valued User";
    const userEmail = userProfile.email || "N/A";
    const employmentType = userProfile.employment_type || "Standard";

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

    const budgetUsagePercent = metrics.analytics?.budgetUsagePercent ?? (monthlyIncome > 0 ? parseFloat(((totalExpense / monthlyIncome) * 100).toFixed(1)) : 0);
    const savingsRate = metrics.analytics?.savingsRate ?? (monthlyIncome > 0 ? parseFloat(((moneyLeft / monthlyIncome) * 100).toFixed(1)) : 0);
    const dailyAverage = metrics.analytics?.dailyAverageExpense ?? (totalExpense / targetDate.daysInMonth()).toFixed(2);
    const daysInMonth = targetDate.daysInMonth();

    const totalLent = debtsSummary.totalLent || 0;
    const totalBorrowed = debtsSummary.totalBorrowed || 0;
    const pendingReceivables = debtsSummary.totalPendingReceivable || 0;
    const pendingPayables = debtsSummary.totalPendingPayable || 0;

    const docRefNumber = `CW-STMT-${targetMonth.replace("-", "")}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Build Inflows Table Rows
    const inflowsRows =
      monthlyInflows.length > 0
        ? monthlyInflows
            .map(
              (inf: any) => `
          <tr>
            <td><strong>${inf.source}</strong>${inf.notes ? ` <span style="color:#64748b">(${inf.notes})</span>` : ""}</td>
            <td>${dayjs(inf.received_date).format("DD-MMM-YYYY")}</td>
            <td class="num" style="color: #15803d; font-weight: 700;">+₹${inf.amount.toLocaleString("en-IN")}</td>
          </tr>
        `
            )
            .join("")
        : `
          <tr>
            <td colspan="2">Standard Primary Monthly Budget Allocation</td>
            <td class="num" style="color: #15803d; font-weight: 700;">₹${monthlyIncome.toLocaleString("en-IN")}</td>
          </tr>
        `;

    // Build Category Table Rows
    const categoryRows =
      categoryBreakdown.length > 0
        ? categoryBreakdown
            .map(
              (c: any, idx: number) => `
          <tr>
            <td>${String(idx + 1).padStart(2, "0")}</td>
            <td><strong>${c.category}</strong></td>
            <td class="num" style="font-weight: 700;">₹${c.amount.toLocaleString("en-IN")}</td>
            <td class="num">${c.percentage}%</td>
            <td class="num">${monthlyIncome > 0 ? ((c.amount / monthlyIncome) * 100).toFixed(1) : 0}%</td>
            <td style="text-align: center;">
              <span class="pill ${c.percentage > 35 ? "pill-orange" : "pill-slate"}">
                ${c.percentage > 35 ? "Major Driver" : "Nominal"}
              </span>
            </td>
          </tr>
        `
            )
            .join("")
        : '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:12px;">No categorized expenses recorded in this period.</td></tr>';

    // Build Itemized Expense Ledger Rows
    const expensesRows =
      expensesList.length > 0
        ? expensesList
            .map(
              (exp: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-weight: 600;">${dayjs(exp.expense_date).format("DD-MMM-YYYY")}</td>
            <td><strong>${exp.name}</strong></td>
            <td>${exp.category}</td>
            <td><span class="pill ${exp.type === "Fixed" ? "pill-purple" : "pill-slate"}">${exp.type}</span></td>
            <td style="text-align: center;">
              ${exp.hasReceipt ? '<span class="pill pill-green">Verified</span>' : '<span style="color:#94a3b8;">—</span>'}
            </td>
            <td class="num" style="font-weight: 700; color: #b91c1c;">₹${exp.amount.toLocaleString("en-IN")}</td>
          </tr>
        `
            )
            .join("")
        : '<tr><td colspan="7" style="text-align:center; color:#64748b; padding: 14px;">No expense records found for this period.</td></tr>';

    // Build Debts Lent Rows
    const debtsLentRows =
      debtsList.filter((d: any) => d.type === "LENT").length > 0
        ? debtsList
            .filter((d: any) => d.type === "LENT")
            .map(
              (d: any) => `
          <tr>
            <td><strong>${d.person_name}</strong></td>
            <td class="num">₹${d.initial_amount.toLocaleString("en-IN")}</td>
            <td class="num" style="color: #15803d;">₹${d.settled_amount.toLocaleString("en-IN")}</td>
            <td class="num" style="font-weight: 700; color: #7c3aed;">₹${d.balance.toLocaleString("en-IN")}</td>
            <td>
              <span class="pill ${d.status === "SETTLED" ? "pill-green" : d.isOverdue ? "pill-red" : "pill-purple"}">
                ${d.status === "SETTLED" ? "Settled" : d.isOverdue ? "Overdue" : "Pending"}
              </span>
            </td>
          </tr>
        `
            )
            .join("")
        : '<tr><td colspan="5" style="text-align:center; color:#64748b;">No active lending records.</td></tr>';

    // Build Debts Borrowed Rows
    const debtsBorrowedRows =
      debtsList.filter((d: any) => d.type === "BORROWED").length > 0
        ? debtsList
            .filter((d: any) => d.type === "BORROWED")
            .map(
              (d: any) => `
          <tr>
            <td><strong>${d.person_name}</strong></td>
            <td class="num">₹${d.initial_amount.toLocaleString("en-IN")}</td>
            <td class="num" style="color: #15803d;">₹${d.settled_amount.toLocaleString("en-IN")}</td>
            <td class="num" style="font-weight: 700; color: #ea580c;">₹${d.balance.toLocaleString("en-IN")}</td>
            <td>
              <span class="pill ${d.status === "SETTLED" ? "pill-green" : "pill-orange"}">
                ${d.status === "SETTLED" ? "Repaid" : "Pending"}
              </span>
            </td>
          </tr>
        `
            )
            .join("")
        : '<tr><td colspan="5" style="text-align:center; color:#64748b;">No active borrowed debts.</td></tr>';

    // Build Audit Observations
    const auditObservations = `
      <li><strong>Budget Compliance:</strong> Account utilized <strong>${budgetUsagePercent}%</strong> of its allocated income of ₹${monthlyIncome.toLocaleString("en-IN")}, maintaining a net unspent margin of ₹${moneyLeft.toLocaleString("en-IN")} (${savingsRate}% savings rate).</li>
      <li><strong>Primary Spending Driver:</strong> ${
        categoryBreakdown.length > 0
          ? `Largest outflow was attributed to <strong>${categoryBreakdown[0].category}</strong> representing ₹${categoryBreakdown[0].amount.toLocaleString("en-IN")} (${categoryBreakdown[0].percentage}% of total expenses).`
          : "No specific category concentration observed."
      }</li>
      <li><strong>Fixed vs Variable Ratio:</strong> Fixed non-discretionary commitments formed <strong>${totalExpense > 0 ? ((fixedTotal / totalExpense) * 100).toFixed(1) : 0}%</strong> of monthly burn, while discretionary variable spend accounted for <strong>${totalExpense > 0 ? ((variableTotal / totalExpense) * 100).toFixed(1) : 0}%</strong>.</li>
      <li><strong>Credit &amp; Debt Exposure:</strong> Total net pending receivables to recover stand at <strong>₹${pendingReceivables.toLocaleString("en-IN")}</strong> against pending borrowed liabilities of <strong>₹${pendingPayables.toLocaleString("en-IN")}</strong>.</li>
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
      .replace(/{{MONTHLY_INCOME}}/g, monthlyIncome.toLocaleString("en-IN"))
      .replace(/{{TOTAL_EXPENSE}}/g, totalExpense.toLocaleString("en-IN"))
      .replace(/{{EXPENSE_COUNT}}/g, String(expensesList.length))
      .replace(/{{MONEY_LEFT}}/g, moneyLeft.toLocaleString("en-IN"))
      .replace(/{{SAVINGS_RATE}}/g, String(savingsRate))
      .replace(/{{BUDGET_USAGE_PERCENT}}/g, String(budgetUsagePercent))
      .replace(/{{UTILIZATION_PILL_CLASS}}/g, budgetUsagePercent > 90 ? "pill-red" : budgetUsagePercent > 70 ? "pill-orange" : "pill-green")
      .replace(/{{UTILIZATION_LABEL}}/g, budgetUsagePercent > 90 ? "High Utilization" : budgetUsagePercent > 70 ? "Normal Pace" : "Economical")
      .replace(/{{FIXED_EXPENSES_TOTAL}}/g, fixedTotal.toLocaleString("en-IN"))
      .replace(/{{FIXED_PERCENT}}/g, totalExpense > 0 ? String(((fixedTotal / totalExpense) * 100).toFixed(1)) : "0")
      .replace(/{{VARIABLE_EXPENSES_TOTAL}}/g, variableTotal.toLocaleString("en-IN"))
      .replace(/{{VARIABLE_PERCENT}}/g, totalExpense > 0 ? String(((variableTotal / totalExpense) * 100).toFixed(1)) : "0")
      .replace(/{{DAILY_AVERAGE}}/g, String(dailyAverage))
      .replace(/{{DAYS_IN_MONTH}}/g, String(daysInMonth))
      .replace(/{{INFLOWS_COUNT}}/g, String(monthlyInflows.length))
      .replace(/{{INFLOWS_ROWS}}/g, inflowsRows)
      .replace(/{{CATEGORY_COUNT}}/g, String(categoryBreakdown.length))
      .replace(/{{CATEGORY_ROWS}}/g, categoryRows)
      .replace(/{{TOTAL_CAT_PERCENT}}/g, totalExpense > 0 ? "100.0" : "0.0")
      .replace(/{{TOTAL_CAT_INCOME_PERCENT}}/g, monthlyIncome > 0 ? String(((totalExpense / monthlyIncome) * 100).toFixed(1)) : "0")
      .replace(/{{EXPENSES_ROWS}}/g, expensesRows)
      .replace(/{{TOTAL_LENT}}/g, totalLent.toLocaleString("en-IN"))
      .replace(/{{DEBTS_LENT_ROWS}}/g, debtsLentRows)
      .replace(/{{TOTAL_BORROWED}}/g, totalBorrowed.toLocaleString("en-IN"))
      .replace(/{{DEBTS_BORROWED_ROWS}}/g, debtsBorrowedRows)
      .replace(/{{AUDIT_OBSERVATIONS}}/g, auditObservations);

    return {
      html: renderedHtml,
      filename: `CW-Financial-Statement-${targetMonth}.pdf`,
    };
  }

  /**
   * Generates a true PDF binary using headless browser (Edge or Chrome),
   * falling back to the rendered HTML buffer if unavailable.
   */
  public static async generatePdfBuffer(userId: number, monthKey?: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const { html, filename } = await this.generateRenderedHtml(userId, monthKey);

    // Locate system headless browser (Edge or Chrome on Windows)
    const browserExecutables = [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];

    const browserExe = browserExecutables.find((p) => fs.existsSync(p));

    if (browserExe) {
      const tempDir = os.tmpdir();
      const tempHtmlPath = path.join(tempDir, `cw_stmt_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
      const tempPdfPath = path.join(tempDir, `cw_stmt_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);

      try {
        fs.writeFileSync(tempHtmlPath, html, "utf-8");

        await new Promise<void>((resolve, reject) => {
          execFile(
            browserExe,
            [
              "--headless",
              "--disable-gpu",
              "--no-pdf-header-footer",
              "--run-all-compositor-stages-before-draw",
              `--print-to-pdf=${tempPdfPath}`,
              tempHtmlPath,
            ],
            { timeout: 15000 },
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        if (fs.existsSync(tempPdfPath)) {
          const pdfBuffer = fs.readFileSync(tempPdfPath);
          try {
            fs.unlinkSync(tempHtmlPath);
            fs.unlinkSync(tempPdfPath);
          } catch {}
          return {
            buffer: pdfBuffer,
            mimeType: "application/pdf",
            filename,
          };
        }
      } catch (err) {
        logger.warn(`Headless browser PDF generation failed: ${(err as Error).message}. Falling back to HTML document.`);
        try {
          if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        } catch {}
      }
    }

    // Fallback: return rendered HTML buffer with attachment disposition
    return {
      buffer: Buffer.from(html, "utf-8"),
      mimeType: "text/html",
      filename: filename.replace(/\.pdf$/, ".html"),
    };
  }
}
