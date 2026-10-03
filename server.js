const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.SECRET_KEY || 'default_jwt_secret';

// ==========================================
// IN-MEMORY DATA STORE
// ==========================================
const db = {
    candidates: [],
    voters: [],
    votes: [],
    _candidateId: 1,
    _voterId: 1,
    _voteId: 1
};

// ==========================================
// CSV / XLSX IMPORTER
// ==========================================
const loadCandidatesCSV = () => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'database', 'candidates_dataset.csv');
        if (!fs.existsSync(filePath)) { console.log('candidates_dataset.csv not found'); return resolve(); }
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => {
                for (const row of results) {
                    if (row.name && !db.candidates.find(c => c.name === row.name && c.party === row.party)) {
                        db.candidates.push({
                            _id: String(db._candidateId++),
                            name: row.name.trim(),
                            party: row.party.trim(),
                            vote_count: parseInt(row.vote_count) || 0
                        });
                    }
                }
                console.log(`Loaded ${db.candidates.length} candidates from CSV`);
                resolve();
            })
            .on('error', reject);
    });
};

const loadVotersData = async () => {
    // Try CSV first
    const csvPath = path.join(__dirname, 'database', 'voters_dataset.csv');
    const xlsxPath = path.join(__dirname, 'database', 'voters_datasets.xlsx');

    let voterRows = [];

    if (fs.existsSync(csvPath)) {
        voterRows = await new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => results.push(row))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    } else if (fs.existsSync(xlsxPath)) {
        try {
            const xlsx = require('xlsx');
            const workbook = xlsx.readFile(xlsxPath);
            const sheetName = workbook.SheetNames[0];
            voterRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } catch (e) {
            console.log('xlsx module not available, skipping xlsx import');
        }
    }

    for (const row of voterRows) {
        if (row.name && !db.voters.find(v => v.name === row.name)) {
            const hashedPw = await bcrypt.hash(String(row.password), 10);
            db.voters.push({
                _id: String(db._voterId++),
                name: row.name.trim(),
                password: hashedPw,
                vote_given_to_party: row.vote_given_to_party || null,
                hasVoted: false,
                role: 'voter'
            });
        }
    }

    // Ensure admin always exists
    if (!db.voters.find(v => v.role === 'admin')) {
        const adminPw = await bcrypt.hash('admin', 10);
        db.voters.push({
            _id: String(db._voterId++),
            name: 'admin',
            password: adminPw,
            vote_given_to_party: null,
            hasVoted: false,
            role: 'admin'
        });
    }
    console.log(`Loaded ${db.voters.length} voters (including admin)`);
};

// ==========================================
// MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid Token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Requires admin role' });
};

// ==========================================
// API ROUTES
// ==========================================

// AUTH - Login
app.post('/api/login', async (req, res) => {
    const { name, password } = req.body;
    try {
        const user = db.voters.find(v => v.name === name);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, name: user.name, hasVoted: user.hasVoted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CANDIDATES - CRUD
app.get('/api/candidates', (req, res) => {
    res.json(db.candidates);
});

app.post('/api/candidates', authenticate, isAdmin, (req, res) => {
    const candidate = {
        _id: String(db._candidateId++),
        name: req.body.name,
        party: req.body.party,
        vote_count: parseInt(req.body.vote_count) || 0
    };
    db.candidates.push(candidate);
    res.json(candidate);
});

app.put('/api/candidates/:id', authenticate, isAdmin, (req, res) => {
    const idx = db.candidates.findIndex(c => c._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    db.candidates[idx] = { ...db.candidates[idx], ...req.body };
    res.json(db.candidates[idx]);
});

app.delete('/api/candidates/:id', authenticate, isAdmin, (req, res) => {
    db.candidates = db.candidates.filter(c => c._id !== req.params.id);
    res.json({ message: 'Deleted' });
});

// VOTING
app.post('/api/vote', authenticate, async (req, res) => {
    try {
        const { candidateId, transactionHash } = req.body;
        const voter = db.voters.find(v => v._id === req.user.id);
        if (!voter) return res.status(404).json({ message: 'Voter not found' });
        if (voter.hasVoted) return res.status(400).json({ message: 'You have already voted!' });

        const candidate = db.candidates.find(c => c._id === candidateId);
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

        // Record the vote
        db.votes.push({
            _id: String(db._voteId++),
            voterId: voter._id,
            candidateId: candidate._id,
            transactionHash,
            timestamp: new Date().toISOString()
        });

        voter.hasVoted = true;
        voter.vote_given_to_party = candidate.party;
        candidate.vote_count += 1;

        res.json({ message: 'Vote recorded successfully!', transactionHash, hasVoted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// USER INFO
app.get('/api/me', authenticate, (req, res) => {
    const user = db.voters.find(v => v._id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safe } = user;
    res.json(safe);
});

// RESULTS
app.get('/api/results', (req, res) => {
    const sorted = [...db.candidates].sort((a, b) => b.vote_count - a.vote_count);
    res.json(sorted);
});

// ==========================================
// START SERVER
// ==========================================
const startServer = async () => {
    try {
        await loadCandidatesCSV();
        await loadVotersData();
        console.log('All data imported successfully!');
    } catch (err) {
        console.error('Data import error:', err);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`\nServer running at http://localhost:${PORT}`);
        console.log(`API endpoints available:`);
        console.log(`  POST /api/login`);
        console.log(`  GET  /api/candidates`);
        console.log(`  POST /api/vote`);
        console.log(`  GET  /api/results`);
        console.log(`  GET  /api/me\n`);
    });
};

startServer();
