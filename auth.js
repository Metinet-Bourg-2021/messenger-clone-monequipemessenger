const jwt = require("jsonwebtoken");
const { NOT_AUTHENTICATED, NOT_FOUND_USER } = require("./codes");
const User = require("./models/User");

const checkAuth = (fct, socket) => async (params, callback) => {
  if (!params.token) {
    return callback({ code: NOT_AUTHENTICATED, data: {} });
  }

  try {
    const decodedToken = jwt.verify(params.token, process.env.JWT_KEY);
    const userId = decodedToken.userId;
    const isUserIDExist = await User.findById(userId);
    if (userId && isUserIDExist) {
      return fct(params, callback, socket);
    } else {
      return callback({ code: NOT_FOUND_USER, data: {} });
    }
  } catch (error) {
    console.error(error);
  }
  return callback({ code: NOT_AUTHENTICATED, data: {} });
};

module.exports = checkAuth;
