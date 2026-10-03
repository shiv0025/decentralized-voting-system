const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    vote_given_to_party: { type: String, default: null },
    hasVoted: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'voter'], default: 'voter' }
});

module.exports = mongoose.model('Voter', VoterSchema);
