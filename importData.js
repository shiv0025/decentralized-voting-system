const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const bcrypt = require('bcrypt');
const Candidate = require('./models/Candidate');
const Voter = require('./models/Voter');

const importData = async () => {
    try {
        console.log("Starting data import process...");

        // Import Candidates (CSV)
        const candidatesFile = path.join(__dirname, 'database', 'candidates_dataset.csv');
        if (fs.existsSync(candidatesFile)) {
            const candidates = [];
            await new Promise((resolve, reject) => {
                fs.createReadStream(candidatesFile)
                    .pipe(csv())
                    .on('data', (data) => candidates.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            for (const c of candidates) {
                if (c.name) {
                    const exists = await Candidate.findOne({ name: c.name, party: c.party });
                    if (!exists) {
                        await Candidate.create({
                            name: c.name,
                            party: c.party,
                            vote_count: parseInt(c.vote_count) || 0
                        });
                    }
                }
            }
            console.log("Candidates checked/imported successfully.");
        }

        // Import Voters (xlsx)
        const votersFileXlsx = path.join(__dirname, 'database', 'voters_datasets.xlsx');
        const votersFileCsv = path.join(__dirname, 'database', 'voters_dataset.csv');

        let voters = [];
        if (fs.existsSync(votersFileCsv)) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(votersFileCsv)
                    .pipe(csv())
                    .on('data', (data) => voters.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else if (fs.existsSync(votersFileXlsx)) {
            const workbook = xlsx.readFile(votersFileXlsx);
            const sheetName = workbook.SheetNames[0];
            voters = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        for (const v of voters) {
            if (v.name) {
                const exists = await Voter.findOne({ name: v.name });
                if (!exists) {
                    const hashedPassword = await bcrypt.hash(v.password.toString(), 10);
                    await Voter.create({
                        name: v.name,
                        password: hashedPassword,
                        vote_given_to_party: v.vote_given_to_party || null
                    });
                }
            }
        }

        // Ensure an admin exists
        const adminExists = await Voter.findOne({ role: 'admin' });
        if (!adminExists) {
            const adminHashedPassword = await bcrypt.hash('admin', 10);
            await Voter.create({
                name: 'admin',
                password: adminHashedPassword,
                role: 'admin'
            });
        }

        console.log("Voters checked/imported successfully.");
    } catch (error) {
        console.error("Error during data import:", error);
    }
};

module.exports = importData;
