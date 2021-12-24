const res = require("express/lib/response");
const jwt = require("jsonwebtoken");
const {
  SUCCESS,
  NOT_FOUND_MESSAGE,
  NOT_VALID_CONTENT,
  NOT_FOUND_CONVERSATION,
} = require("../codes");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const saveMessage = async (
    { token, conversation_id, content },
    callback,
    users
) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userOfToken = await User.findById(decodedToken.userId);

    const conversation = await Conversation.findOne({ _id: conversation_id });
    if (!conversation) return callback({ code: NOT_FOUND_CONVERSATION });

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

    await Conversation.updateOne(
        { _id: conversation_id },
        { messages: [...conversation.messages, createdMessage._id] }
    );

    conversation.participants.forEach((participant) => {
      users[participant]?.emit("@messageDelivered", {
        conversation_id,
        message: { ...createdMessage._doc, id: createdMessage._id },
      });
    });

    return callback({
      code: SUCCESS,
      data: { message: { ...createdMessage._doc, id: createdMessage._id } },
    });
  } catch (err) {
    console.error(err);
  }
};

const deleteMessage = async (
    { token, conversation_id, message_id },
    callback,
    users
) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userOfToken = await User.findById(decodedToken.userId);

    const conversation = await Conversation.findOne({ _id: conversation_id });
    if (!conversation) return callback({ code: NOT_FOUND_CONVERSATION });

    //REAL DELETE
    const deletedMessage = await Message.findOneAndDelete({
      _id: message_id,
      from: userOfToken.username,
    });

    await Conversation.findOneAndUpdate(
        { _id: conversation_id },
        { $pull: { messages: message_id } }
    ).exec();

    //FAKE DELETE
    // const updatedMessage = await Message.findOneAndUpdate(
    //   { _id: message_id },
    //   { deleted: true }
    // );

    conversation.participants.forEach((participant) => {
      users[participant]?.emit("@messageDeleted", {
        conversation_id,
        message_id,
      });
    });

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
    callback,
    users
) => {
  try {
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) return callback({ code: NOT_FOUND_CONVERSATION });

    const message = await Message.findById(message_id);
    if (!message) return callback({ code: NOT_FOUND_MESSAGE });

    const updatedMessage = await Message.findOneAndUpdate(
        { _id: message_id },
        { content: content },
        { new: true }
    );
    await Message.findById(message_id);

    conversation.participants.forEach((participant) => {
      users[participant]?.emit("@messageEdited", {
        conversation_id,
        message: { ...updatedMessage._doc, id: updatedMessage._id },
      });
    });

    return callback({
      code: SUCCESS,
      data: {
        conversation_id: conversation_id,
        message: { ...updatedMessage, id: message_id },
      },
    });
  } catch (err) {
    console.error(err);
  }
};

const reactMessage = async (
    { token, conversation_id, message_id, reaction },
    callback,
    users
) => {
  const possibleValues = ["HEART", "HAPPY", "SAD", "THUMB"];
  if (!possibleValues.find((value) => value === reaction))
    return callback({ code: NOT_VALID_CONTENT, data: {} });

  try {
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) return callback({ code: NOT_FOUND_CONVERSATION });

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userOfToken = await User.findById(decodedToken.userId);

    const message = await Message.findById(message_id);
    if (!message) return callback({ code: NOT_FOUND_MESSAGE });

    const updatedMessage = await Message.findOneAndUpdate(
        { _id: message_id },
        {
          $set: {
            [`reactions.${userOfToken.username}`]: reaction,
          },
        },
        { new: true }
    );

    conversation.participants.forEach((participant) => {
      users[participant]?.emit("@messageReacted", {
        conversation_id,
        message: { ...updatedMessage._doc, id: updatedMessage._id },
      });
    });

    return callback({
      code: SUCCESS,
      data: {},
    });
  } catch (error) {
    console.error(error);
  }
};

const replyMessage = async (
    { token, conversation_id, message_id, content },
    callback,
    users
) => {
  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userOfToken = await User.findById(decodedToken.userId);

  try {
    const conversation = await Conversation.findOne({ _id: conversation_id });
    if (!conversation) return callback({ code: NOT_FOUND_CONVERSATION });

    const message = await Message.findById(message_id);
    if (!message) return callback({ code: NOT_FOUND_MESSAGE });

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

    await Conversation.updateOne(
        { _id: conversation_id },
        { messages: [...conversation.messages, createdMessage._id] }
    );

    conversation.participants.forEach((participant) => {
      users[participant]?.emit("@messageDelivered", {
        conversation_id,
        message: { ...createdMessage._doc, id: createdMessage._id },
      });
    });

    return callback({
      code: SUCCESS,
      data: {
        conversation_id: conversation_id,
        message: { ...createdMessage._doc, id: createdMessage._id },
      },
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  saveMessage,
  deleteMessage,
  editMessage,
  replyMessage,
  reactMessage,
};
