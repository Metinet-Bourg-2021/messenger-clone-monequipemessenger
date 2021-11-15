const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    from: {
        type: String
    },
    content: {
        type: String
    },
    posted_at: {
        type: Date
    },
    delivered_to:{
        type: Array
    },
    reply_to: {
        type: this
    },
    edited: {
        type: Boolean
    },
    deleted: {
        type: Boolean
    },
    reactions: {
        type: Array
    }

    // "id":1,
    // "from":"John",
    // "content": "Comment est votre blanquette ?",
    // "posted_at": "1995-12-17T03:24:00",
    // "delivered_to": ["John": "1995-12-17T03:24:00", ...],
    // "reply_to": null,
    // "edited": false,
    // "deleted": false,
    // "reactions": {}
}, { minimize: false });

module.exports = mongoose.model("Message", messageSchema);
