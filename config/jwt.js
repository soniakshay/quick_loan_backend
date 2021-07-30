const jwt = require("jsonwebtoken");
const { response, createResponse } = require("./response");

const jwt_secret = 'quick_loan#123';
const jwt_expiry = 1800000;

const verify = async (req, res, next) => {
  try {
    // console.log(req.headers, req.headers['access-token'], 'check this out token')
    const token = req.headers["access-token"];
    if (!token) {
      return response(
        res,
        400,
        createResponse("Authorization Failed, Access denied !")
      );
    }
    const decoded = jwt.verify(token, jwt_secret);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.log(error, "Error in verifying token !");
    return response(
      res,
      500,
      createResponse("Authorization Failed, Access denied !")
    );
  }
};

const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers["access-token"];
        if (!token) {
          return response(
            res,
            400,
            createResponse("Authorization Failed, Access denied !")
          );
        }
        const decoded = jwt.verify(token, jwt_secret);
        // console.log(decoded, 'this is decode token')
        if(!decoded.user.is_admin) {
            return response(
                res,
                400,
                createResponse("Authorization Failed, Access denied !")
              );
        }
        req.user = decoded.user;
        next();
      } catch (error) {
        console.log(error, "Error in verifying token !");
        return response(
          res,
          500,
          createResponse("Authorization Failed, Access denied !")
        );
      }
};

const createToken = async (payload) => {
    const token = await jwt.sign(payload, jwt_secret, { expiresIn: jwt_expiry });
    return token;
}

const decodeToken = async(token) => {
  const decoded = jwt.verify(token, jwt_secret);
  return decoded;
}

module.exports = {
    createToken, verify, verifyAdmin, decodeToken
}