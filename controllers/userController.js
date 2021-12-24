const { NOT_VALID_USERNAMES, SUCCESS, NOT_FOUND_USER } = require("../codes");
const User = require("../models/User");
const { getRandomURL } = require("../pictures");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SALT_ROUND = 10;

const authenticate = async ({ username, password }, callback, users) => {
  if (!username || !password)
    return callback({ code: NOT_VALID_USERNAMES, data: {} });
  try {
    const user = await User.findOne({ username });

    if (!user) {
      const criptedPassword = await bcrypt.hash(password, SALT_ROUND);
      const createdUser = await User.create({
        username,
        password: criptedPassword,
        picture_url: getRandomURL(),
        awake: false,
      });

      const token = jwt.sign({ userId: createdUser._id }, process.env.JWT_KEY, {
        expiresIn: "1d",
      });

      Object.values(users).forEach((socket) => {
        socket.emit("@userCreated", {
          user: {
            username: createdUser.username,
            picture_url: createdUser.picture_url,
            token,
            last_activity: new Date(),
          },
        });
      });

      return callback({
        code: SUCCESS,
        data: {
          username: createdUser.username,
          picture_url: createdUser.picture_url,
          token,
        },
      });
    } else {
      bcrypt.compare(password, user.password, (err, res) => {
        if (err) {
          console.error(err);
          return callback({ code: NOT_FOUND_USER, data: {} });
        } else if (res) {
          const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
            expiresIn: "1h",
          });
          return callback({
            code: SUCCESS,
            data: {
              username: user.username,
              picture_url: user.picture_url,
              token,
            },
          });
        } else {
          return callback({ code: NOT_FOUND_USER, data: {} });
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const getUsers = async ({ token }, callback) => {
  const users = await User.find();
  const data = users.map((user) => ({
    username: user.username,
    picture_url: user.picture_url,
    awake: user.awake,
  }));
  return callback({ code: SUCCESS, data: { users: data } });
};

module.exports = { authenticate, getUsers };
