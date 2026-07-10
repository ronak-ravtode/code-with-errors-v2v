/**
 * SafeSphere Auth — Local File-Based Storage
 * bcrypt + JWT, no external auth services needed
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DB_PATH = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_jwt_secret_2025';
const SALT = 10;

// ── File helpers ──────────────────────────────────────────────────
function readUsers() {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
    catch { return []; }
}
function writeUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
}
function findByEmail(email) {
    return readUsers().find(u => u.email === email.toLowerCase().trim());
}
function findById(id) {
    return readUsers().find(u => u.id === id);
}
function verifyToken(req) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return null;
    try { return jwt.verify(h.split(' ')[1], JWT_SECRET); }
    catch { return null; }
}

// ── POST /api/auth/register ───────────────────────────────────────
router.post('/register', async (req, res) => {
    const {
        email = '', password = '',
        full_name = '', phone = '',
        role = 'user', // Added role
        ward_email = '', // Link to a ward
        guardians = []           // [{name, phone}, {name, phone}, {name, phone}]
    } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    try {
        const users = readUsers();
        if (users.find(u => u.email === email.toLowerCase().trim()))
            return res.status(409).json({ error: 'An account with this email already exists.' });

        if (role === 'guardian') {
            const wardUser = users.find(u => u.email === ward_email.toLowerCase().trim());
            if (!wardUser) return res.status(404).json({ error: 'Ward not found. Please provide a valid User email to link.' });
        }

        const password_hash = await bcrypt.hash(password, SALT);
        // Sanitise guardians — keep max 3, strip blanks
        const sanitisedGuardians = guardians
            .filter(g => g && (g.name || g.phone))
            .slice(0, 3)
            .map(g => ({ name: (g.name || '').trim(), phone: (g.phone || '').trim() }));

        const newUser = {
            id: `usr_${Date.now()}`,
            email: email.toLowerCase().trim(),
            password_hash,
            full_name: full_name.trim(),
            phone: phone.trim(),
            role: role,
            ward_email: role === 'guardian' ? ward_email.toLowerCase().trim() : '',
            guardians: sanitisedGuardians,
            created_at: new Date().toISOString(),
        };

        users.push(newUser);
        writeUsers(users);

        console.log(`[AUTH] Registered: ${newUser.email} with ${sanitisedGuardians.length} guardians`);
        return res.status(201).json({ message: 'Account created successfully.', userId: newUser.id });

    } catch (err) {
        console.error('[AUTH] Register error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email = '', password = '' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    try {
        const user = findByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

        const token = jwt.sign(
            { userId: user.id, email: user.email, full_name: user.full_name, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`[AUTH] Login: ${user.email}`);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                role: user.role || 'user',
                ward_email: user.ward_email || '',
                guardians: user.guardians || [],
            },
        });
    } catch (err) {
        console.error('[AUTH] Login error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// ── GET /api/auth/me ──────────────────────────────────────────────
router.get('/me', (req, res) => {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token.' });
    const user = findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role || 'user',
            ward_email: user.ward_email || '',
            guardians: user.guardians || []
        }
    });
});

// ── PATCH /api/auth/guardians  (update guardian contacts) ────────
router.patch('/guardians', (req, res) => {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: 'Authentication required.' });

    const { guardians = [] } = req.body;
    const sanitised = guardians
        .filter(g => g && (g.name || g.phone))
        .slice(0, 3)
        .map(g => ({ name: (g.name || '').trim(), phone: (g.phone || '').trim() }));

    try {
        const users = readUsers();
        const idx = users.findIndex(u => u.id === decoded.userId);
        if (idx === -1) return res.status(404).json({ error: 'User not found.' });

        users[idx].guardians = sanitised;
        writeUsers(users);

        // Also update profile fields if provided
        const { full_name, phone } = req.body;
        if (full_name !== undefined) users[idx].full_name = full_name.trim();
        if (phone !== undefined) users[idx].phone = phone.trim();
        writeUsers(users);

        console.log(`[AUTH] Guardians updated for ${users[idx].email}`);
        return res.json({ message: 'Guardians updated.', guardians: sanitised, user: users[idx] });
    } catch (err) {
        console.error('[AUTH] Guardian update error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
