const jwt = require("jsonwebtoken");

function checkAuth(token) {
  console.log(token);
  if (!token) {
    return false;
  }
  const decodedToken = jwt.verify(token, "secret_key");
  const userId = decodedToken.userId;
  if (req.body.userId && req.body.userId !== userId) {
    return false;
  }
  return true;
}

module.exports = checkAuth;
