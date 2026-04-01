const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true, maxlength: 4000 },
    status:   { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// compound index for paginated history queries
messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
