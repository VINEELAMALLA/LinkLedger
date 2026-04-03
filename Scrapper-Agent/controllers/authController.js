const { findUserByEmail, registerUser } = require("../services/userStore");

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

async function registerController(req, res) {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, error: "Valid email is required" });
        }

        const result = await registerUser(email);
        return res.json({
            success: true,
            user: result.user,
            created: result.created
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function loginController(req, res) {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, error: "Valid email is required" });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, error: "No account found for this email. Please register first." });
        }

        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    registerController,
    loginController
};
