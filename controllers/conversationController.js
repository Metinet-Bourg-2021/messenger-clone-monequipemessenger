const jwt = require("jsonwebtoken");
const {
  SUCCESS,
  NOT_FOUND_CONVERSATION,
  NOT_FOUND_MESSAGE,
  NOT_VALID_USERNAMES,
} = require("../codes");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const createOneToOneConversation = async (
  { token, username },
  callback,
  socketsByUser
) => {
  const user = await User.find({ username });

  if (!user) return callback({ code: NOT_VALID_USERNAMES, data: {} });

  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userOfToken = await User.findById(decodedToken.userId);

  try {
    const createdConversation = await Conversation.create({
      type: "one_to_one",
      participants: [username, userOfToken.username],
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

const createManyToManyConversation = async (
  { token, usernames },
  callback,
  socketsByUser
) => {
  //Get existing users
  const users = await User.find({ username: usernames });

  //Add creator user
  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userOfToken = await User.findById(decodedToken.userId);
  //   users = [...users, userOfToken.username];

  try {
    const createdConversation = await Conversation.create({
      type: "many_to_many",
      participants: [
        ...users.map((user) => user.username),
        userOfToken.username,
      ],
      messages: [],
      title: null,
      theme: "BLUE",
      updated_at: Date.now(),
      seen: {},
      typing: {},
    });
    console.log(createdConversation.participants);
    createdConversation.participants.forEach((participant) => {
      socketsByUser[participant]?.emit("@conversationCreated", {
        conversation: {
          ...createdConversation._doc,
          id: createdConversation._id,
        },
      });
    });

    return callback({
      code: SUCCESS,
      data: {
        conversation: {
          id: createdConversation._id,
          ...createdConversation._doc,
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
};

const getConversations = async ({ token }, callback) => {
  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userOfToken = await User.findById(decodedToken.userId);

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
  { token, conversation_id, message_id },
  callback
) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userOfToken = await User.findById(decodedToken.userId);

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

module.exports = {
  createOneToOneConversation,
  createManyToManyConversation,
  getConversations,
  seeConversation,
};
