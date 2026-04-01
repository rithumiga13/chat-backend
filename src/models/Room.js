const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name:        { type: String, trim: true },
    type:        { type: String, enum: ['group', 'dm'], default: 'group' },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    // for DMs: sorted pair of user IDs to guarantee uniqueness
    dmKey:       { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// find or create a DM room between two users
roomSchema.statics.findOrCreateDM = async function (userAId, userBId) {
  const sorted = [userAId.toString(), userBId.toString()].sort();
  const dmKey = `dm:${sorted[0]}:${sorted[1]}`;
  let room = await this.findOne({ dmKey });
  if (!room) {
    room = await this.create({
      type: 'dm',
      dmKey,
      members: sorted,
      name: `DM:${sorted[0]}:${sorted[1]}`,
    });
  }
  return room;
};

module.exports = mongoose.model('Room', roomSchema);
