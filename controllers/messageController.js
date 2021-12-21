const res = require("express/lib/response");
const jwt = require("jsonwebtoken");
const { SUCCESS, NOT_FOUND_USER } = require("../codes");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const saveMessage = async ({ token, conversation_id, content }, callback) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userOfToken = await User.findById(decodedToken.userId);
    if (!userOfToken) return callback({ code: NOT_FOUND_USER });

    const conversation = await Conversation.findOne({ _id: conversation_id });
    if (conversation) {
      const createdMessage = await Message.create({
        from: userOfToken.username,
        content: content,
        posted_at: Date.now(),
        delivered_to: [],
        reply_to: null,
        edited: false,
        deleted: false,
        reactions: {},
      });

      const newMessagesOfConversation = [
        ...conversation.messages,
        createdMessage._id,
      ];
      await Conversation.updateOne(
        { _id: conversation_id },
        { messages: newMessagesOfConversation }
      );

      return callback({
        code: SUCCESS,
        data: { message: { ...createdMessage._doc, id: createdMessage._id } },
      });
    }
  } catch (err) {
    console.error(err);
  }
};

const deleteMessage = async (
  { token, conversation_id, message_id },
  callback
) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userOfToken = await User.findById(decodedToken.userId);

    //REAL DELETE
    const deletedMessage = await Message.findOneAndDelete({
      _id: message_id,
      from: userOfToken.username,
    });

    Conversation.findOneAndUpdate(
      { _id: conversation_id },
      { $pull: { messages: message_id } }
    ).exec();

    //FAKE DELETE
    // const updatedMessage = await Message.findOneAndUpdate(
    //   { _id: message_id },
    //   { deleted: true }
    // );

    return callback({
      code: SUCCESS,
      data: {},
    });
  } catch (error) {
    console.error(error);
  }
};

const editMessage = async (
  { token, conversation_id, message_id, content },
  callback
) => {
  const message = await Message.findById(message_id);

  if (message) {

    const UpdtMessage = await Message.findOneAndUpdate(
      { _id: message_id },
      { content: content }
    );

    console.log(UpdtMessage);

    return callback({
      code: SUCCESS,
      data: {conversation_id: conversation_id, message: {...UpdtMessage, id: message_id }},
    });
  }
};

const replyMessage = async (
    { token, conversation_id, message_id, content },
    callback
) => {
  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userOfToken = await User.findById(decodedToken.userId);
  if (!userOfToken) return callback({ code: NOT_FOUND_USER });

  try {
    const conversation = await Conversation.findOne({ _id: conversation_id });
    if (conversation) {
      const message = await Message.findById(message_id);

      if (message) {
        const createdMessage = await Message.create({
          from: userOfToken.username,
          content: content,
          posted_at: Date.now(),
          delivered_to: [],
          reply_to: message,
          edited: false,
          deleted: false,
          reactions: {},
        });

        const newMessagesOfConversation = [
          ...conversation.messages,
          createdMessage._id,
        ];
        await Conversation.updateOne(
            { _id: conversation_id },
            { messages: newMessagesOfConversation }
        );

        return callback({
          code: SUCCESS,
          data: {conversation_id: conversation_id, message: {...createdMessage._doc, id: createdMessage._id }},
        });
      }



    }
  } catch (err) {
    console.error(err);
  }


};

module.exports = { saveMessage, deleteMessage, editMessage, replyMessage };
