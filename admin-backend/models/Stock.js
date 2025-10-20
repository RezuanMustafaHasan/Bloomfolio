const mongoose = require('mongoose');

// Flexible Stock schema for admin operations, allowing full document writes
// Mirrors collection name and timestamps; accepts all fields (strict:false)
const stockSchema = new mongoose.Schema({}, {
  strict: false,
  timestamps: true,
  collection: 'stocks'
});

module.exports = mongoose.model('Stock', stockSchema);