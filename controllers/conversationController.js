const jwt = require("jsonwebtoken");
const {
  SUCCESS,
  NOT_FOUND_CONVERSATION,
  NOT_FOUND_MESSAGE,
  NOT_VALID_USERNAMES,
  NOT_VALID_CONTENT,
} = require("../codes");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const createConversation = async (
  { userOfToken, username, usernames },
  callback,
  socketsByUser
) => {
  let users;
  if (username) {
    const otherUser = await User.findOne({ username });
    if (otherUser.username === username)
      users = [username, userOfToken.username];
  } else if (usernames) {
    const otherUsers = await User.find({ username: usernames });
    if (otherUsers.length === usernames.length)
      users = [userOfToken.username, ...usernames];
  }

  if (!users) return callback({ code: NOT_VALID_USERNAMES, data: {} });

  try {
    const createdConversation = await Conversation.create({
      type: users.length === 2 ? "one_to_one" : "many_to_many",
      participants: users,
      messages: [],
      title: null,
      theme: "BLUE",
      updated_at: Date.now(),
      seen: {},
      typing: {},
    });

    createdConversation.participants.forEach((participant) =>
      socketsByUser[participant]?.emit("@conversationCreated", {
        conversation: {
          ...createdConversation._doc,
          id: createdConversation._id,
        },
      })
    );

    return callback({
      code: SUCCESS,
      data: {
        conversation: {
          ...createdConversation._doc,
          id: createdConversation._id,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }
};

const getConversations = async ({ userOfToken }, callback) => {
  const conversations = await Conversation.find({
    participants: userOfToken.username,
  }).populate("messages");

  return callback({
    code: SUCCESS,
    data: {
      conversations: conversations.map((conversation) => ({
        ...conversation._doc,
        id: conversation._doc._id,
        messages: conversation._doc.messages.map((message) => ({
          id: message._id,
          ...message._doc,
        })),
      })),
    },
  });
};

const seeConversation = async (
  { userOfToken, conversation_id, message_id },
  callback
) => {
  try {
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) return callback({ code: NOT_FOUND_CONVERSATION });

    if (
      !conversation.messages.find(
        (message) => message.toString() === message_id
      )
    )
      return callback({ code: NOT_FOUND_MESSAGE });

    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversation_id },
      {
        $set: {
          [`seen.${userOfToken.username}`]: { message_id, time: new Date() },
        },
      }
    );

    //set all never seen conversation user's to -1
    updatedConversation.participants.forEach((participant) => {
      if (!updatedConversation.seen[participant])
        updatedConversation.seen[participant] = -1;
    });

    return callback({
      code: SUCCESS,
      data: {
        conversation: {
          ...updatedConversation._doc,
          id: updatedConversation._id,
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
};

const removeParticipant = async (
  { conversation_id, userOfToken, username },
  callback,
  socketsByUser
) => {
  try {
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation._doc)
      return callback({ code: NOT_FOUND_CONVERSATION, data: {} });

    if (
      !conversation._doc.participants.find(
        (participant) => participant === userOfToken.username
      )
    )
      return callback({ code: NOT_VALID_CONTENT, data: {} });

    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversation_id },
      { $pull: { participants: username } },
      { new: true }
    )
      .populate("messages")
      .exec();

    updatedConversation.participants.forEach((participant) => {
      socketsByUser[participant]?.emit("@participantRemoved", {
        conversation: {
          ...updatedConversation._doc,
          id: updatedConversation._id,
        },
      });
    });
  } catch (err) {
    console.error(err);
  }
  return callback({ code: SUCCESS, data: {} });
};

const addParticipant = async (
  { userOfToken, conversation_id, username },
  callback,
  socketsByUser
) => {
  try {
    const conversation = await Conversation.findById(conversation_id);

    if (!conversation)
      return callback({ code: NOT_FOUND_CONVERSATION, data: {} });

    if (
      !conversation.participants.find(
        (participant) => participant === userOfToken.username
      )
    )
      return callback({ code: NOT_VALID_CONTENT });

    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversation_id },
      { $push: { participants: username } },
      { new: true }
    )
      .populate("messages")
      .exec();

    updatedConversation.participants.forEach((participant) =>
      socketsByUser[participant]?.emit("@participantAdded", {
        conversation: {
          ...updatedConversation._doc,
          id: updatedConversation._id,
        },
      })
    );

    return callback({
      code: SUCCESS,
      data: { ...updatedConversation._doc, id: updatedConversation._id },
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  seeConversation,
  removeParticipant,
  addParticipant,
};
