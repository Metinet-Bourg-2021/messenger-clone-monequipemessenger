const mongoose = require("mongoose");
const Message = require("./Message");
const User = require("./User");

const conversationSchema = mongoose.Schema(
  {
    type: { type: String },
    participants: { type: [String] },
    messages: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    },
    title: { type: String },
    theme: { type: String },
    updated_at: { type: Date },
    seen: { type: Object },
    typing: { type: Object },
  },
  { minimize: false }
);

module.exports = mongoose.model("Conversation", conversationSchema);
