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


    // "id":1,
    // "type":"one_to_one",
    // "participants": ["John", "Jane"],
    // "messages": [{...}],
    // "title": "Cmaconversation",
    // "theme": "BLUE",
    // "updated_at": "1995-12-17T03:24:00",
    // "seen": {},
    // "typing": {}
}, { minimize: false });

module.exports = mongoose.model("Conversation", conversationSchema);
