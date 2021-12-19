const jwt = require("jsonwebtoken");
const { SUCCESS } = require("../codes");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const createOneToOneConversation = async ({ token, username }, callback) => {
  const user = await User.find({ username });

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

const createManyToManyConversation = async ({ token, usernames }, callback) => {
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

module.exports = {
  createOneToOneConversation,
  createManyToManyConversation,
  getConversations,
};
