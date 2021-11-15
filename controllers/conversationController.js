const checkAuth = require("../auth");
const jwt = require("jsonwebtoken");
const { NOT_AUTHENTICATED, SUCCESS } = require("../codes");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const createManyToManyConversation = async ({ token, usernames }, callback) => {
  if (!checkAuth(token)) return callback({ code: NOT_AUTHENTICATED, data: {} });

  //Get existing users
  const users = await User.find({ username: usernames });
  //   users = users.map((user) => user.username);

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
      title: `Le titre ${Math.random()}`,
      theme: "BLUE",
      updated_at: Date.now(),
      seen: {},
      typing: {},
    });

    return callback({
      code: SUCCESS,
      data: {
        conversation: { id: createdConversation._id, ...createdConversation },
      },
    });
  } catch (error) {
    console.error(error);
  }
};

const getConversations = async ({ token }, callback) => {
  if (!checkAuth(token)) return callback({ code: NOT_AUTHENTICATED, data: {} });

  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userOfToken = await User.findById(decodedToken.userId);

  const conversations = await Conversation.find({
    participants: userOfToken.username,
  });

  return callback({
    code: SUCCESS,
    data: {
      conversations: conversations.map((conversation) => ({
        ...conversation._doc,
        id: conversation._doc._id,
      })),
    },
  });
};

module.exports = { createManyToManyConversation, getConversations };
