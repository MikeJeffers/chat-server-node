//@ts-check
const jwt = require("jsonwebtoken");
const Redis = require('./redis');
const USER = require('./user');

/**
 * 
 * @param {string} token 
 * @returns {Promise<{"id":number, "username":string}?>}
 */
module.exports = async (token) => {
  if (!token) { throw new Error('No token provided'); }
  const decoded = jwt.verify(token, process.env.SECRET_JWT);
  const fetchedToken = await Redis.get(`jwt:${decoded.user.id}`);
  if (fetchedToken != token) {
    throw new Error('bad token');
  }
  return await USER.getById(decoded.user.id);
};
