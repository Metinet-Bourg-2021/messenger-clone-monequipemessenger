const jwt = require("jsonwebtoken");
const User = require("./models/User");

const checkAuth = async (token) => {
  if (!token) {
    return false;
  }
  const decodedToken = jwt.verify(token, process.env.JWT_KEY);
  const userId = decodedToken.userId;
  const isUserIDExist = await User.findById(userId);
  if (userId && isUserIDExist) {
    return true;
  }
  return false;
};

module.exports = checkAuth;
