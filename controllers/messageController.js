const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const saveMessage = ({ token, conversation_id, content }) => {
  console.log(content, conversation_id);
  const newMessage = new Message({
    from: "LeStan2",
    content: content,
    posted_at: Date.now(),
    delivered_to: [],
    reply_to: null,
    edited: false,
    deleted: false,
    reactions: {},
  });

  newMessage.save().then((message) =>
    Conversation.findOne({ _id: conversation_id }).then((conversation) => {
      const newMessages = [...conversation.messages, message._id];
      Conversation.updateOne(
        { _id: conversation._id },
        {
          messages: newMessages,
        }
      ).then((conv) => ""); // whaaaat
    })
  );

  //   newMessage
  //     .save()
  //     .then((message) =>
  //       Message.populate(newMessage, { path: "conversation" }).then((mess) =>
  //         console.log(mess)
  //       )
  //     );
};

module.exports = { saveMessage };
