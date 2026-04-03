const { reclassifyItems } = require("./services/storage");

async function run() {
    try {
        const updated = await reclassifyItems();
        console.log(`Reclassified ${updated} items`);
    } catch (error) {
        console.error(error);
    }
}

run();