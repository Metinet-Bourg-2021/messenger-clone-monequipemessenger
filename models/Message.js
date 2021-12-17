const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    from: {
      type: String,
    },
    content: {
      type: String,
    },
    posted_at: {
      type: Date,
    },
    delivered_to: {
      type: Array,
    },
    reply_to: {
      type: this,
    },
    edited: {
      type: Boolean,
    },
    deleted: {
      type: Boolean,
    },
    reactions: {
      type: Object,
    },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  },
  { minimize: false }
);

module.exports = mongoose.model("Message", messageSchema);
