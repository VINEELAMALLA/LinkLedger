const nodemailer = require("nodemailer");

function createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || "false") === "true";

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
}

function buildHtml(items) {
    const cards = items
        .map((item) => {
            const title = item.opportunity_title || `${item.organization_name || "Unknown"} ${item.category || "Opportunity"}`.trim();
            const platform = item.platform || "Post";
            const summary = String(item.summary || item.raw_description || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 180);

            return `
                <div style="margin: 0 0 16px; border: 1px solid #dbeafe; border-radius: 18px; padding: 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); box-shadow: 0 8px 24px rgba(10, 102, 194, 0.08);">
                    <div style="font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #4267B2; margin-bottom: 10px;">${platform}</div>
                    <div style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px;">${title}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">${item.organization_name || "Unknown"} • ${item.category || "Other"}</div>
                    <div style="display: inline-block; margin-bottom: 12px; padding: 6px 10px; border-radius: 999px; background: #dbeafe; color: #0A66C2; font-size: 12px; font-weight: 600;">
                        Deadline: ${item.deadline || "N/A"}
                    </div>
                    ${summary ? `<div style="font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 14px;">${summary}</div>` : ""}
                    <a href="${item.primary_link}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 10px 16px; border-radius: 999px; text-decoration: none; color: #ffffff; font-weight: 600; background: linear-gradient(90deg, #0A66C2, #1877F2, #E1306C);">
                        Open Post
                    </a>
                </div>
            `;
        })
        .join("");

    return `
        <div style="font-family: Arial, sans-serif; background: #f3f6fb; padding: 24px; color: #111827;">
            <div style="max-width: 720px; margin: 0 auto;">
                <div style="margin-bottom: 18px; padding: 24px; border-radius: 24px; background: linear-gradient(135deg, #0A66C2, #4267B2, #833AB4, #E1306C); color: #ffffff;">
                    <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.9;">Link Ledger Reminder</div>
                    <h2 style="margin: 10px 0 8px; font-size: 28px; line-height: 1.2;">3 upcoming deadlines need your attention</h2>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; opacity: 0.92;">These item cards were selected from your saved posts and are approaching their deadlines soon.</p>
                </div>
                ${cards}
            </div>
        </div>
    `;
}

async function sendDeadlineEmail(recipient, items) {
    const transporter = createTransporter();
    if (!transporter || !recipient || !items.length) {
        return { sent: false, reason: "mailer_not_configured_or_no_items" };
    }

    try {
        await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            subject: "Upcoming Internship/Course Deadlines",
            to: recipient,
            html: buildHtml(items)
        });
        return { sent: true };
    } catch (error) {
        return { sent: false, reason: error.message };
    }
}

module.exports = sendDeadlineEmail;
