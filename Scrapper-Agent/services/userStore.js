const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureUsersFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
    }
}

async function readUsersDb() {
    await ensureUsersFile();
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (!Array.isArray(parsed.users)) parsed.users = [];
    return parsed;
}

async function writeUsersDb(db) {
    await ensureUsersFile();
    await fs.writeFile(USERS_FILE, JSON.stringify(db, null, 2), "utf8");
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

async function findUserByEmail(email) {
    const db = await readUsersDb();
    const normalized = normalizeEmail(email);
    return db.users.find((user) => normalizeEmail(user.email) === normalized) || null;
}

async function registerUser(email) {
    const db = await readUsersDb();
    const normalized = normalizeEmail(email);
    const existing = db.users.find((user) => normalizeEmail(user.email) === normalized);

    if (existing) {
        return { user: existing, created: false };
    }

    const user = {
        email: normalized,
        created_at: new Date().toISOString()
    };

    db.users.push(user);
    await writeUsersDb(db);
    return { user, created: true };
}

module.exports = {
    findUserByEmail,
    registerUser
};
