const cron = require("node-cron");
const sendDeadlineEmail = require("./mailer");
const { getDeadlineItemsForNotification, markNotified } = require("./storage");

async function notifyUpcomingDeadlines(userEmail) {
    let pending = await getDeadlineItemsForNotification();
    if (userEmail) {
        pending = pending.filter((item) => item.user_email === userEmail);
    }

    if (!pending.length) {
        return { sentCount: 0, groups: 0 };
    }

    const grouped = pending.reduce((acc, item) => {
        if (!acc[item.user_email]) acc[item.user_email] = [];
        acc[item.user_email].push(item);
        return acc;
    }, {});

    let sentCount = 0;
    const sentIds = [];

    for (const [email, items] of Object.entries(grouped)) {
        const result = await sendDeadlineEmail(email, items);
        if (result.sent) {
            sentCount += items.length;
            sentIds.push(...items.map((item) => item.id));
        }
    }

    await markNotified(sentIds);
    return { sentCount, groups: Object.keys(grouped).length };
}

function startDeadlineScheduler() {
    const expression = process.env.DEADLINE_CRON || "0 */4 * * *";
    cron.schedule(expression, async () => {
        try {
            await notifyUpcomingDeadlines();
        } catch (error) {
            console.error("Deadline scheduler error:", error.message);
        }
    });
}

module.exports = {
    startDeadlineScheduler,
    notifyUpcomingDeadlines
};
