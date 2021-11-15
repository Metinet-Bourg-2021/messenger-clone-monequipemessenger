const mongoose = require("mongoose");
const Message = require('./Message');
const User = require('./User')

const conversationSchema = mongoose.Schema({
    type_conv: {
        type: String
    },
    participants: {
        type: [User]
    },
    messages: {
        type: [Message]
    },
    title: {
        type: String
    },
    theme: {
        type: String
    },
    updated_at: {
        type: Date
    },
    seen: {
        type: [User]
    },
    typing: {
        type: [User]
    }
}, { minimize: false });

module.exports = mongoose.model("Conversation", conversationSchema);
