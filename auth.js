//@ts-check
const jwt = require("jsonwebtoken");
const Redis = require('./redis');

/**
 * 
 * @param {string} token 
 * @returns {Promise<{"id":number, "username":string}?>}
 */
module.exports = async (token) => {
  if (!token) { throw new Error('No token provided'); }
  const decoded = jwt.verify(token, process.env.SECRET_JWT);
  const fetchedToken = await Redis.get(`jwt:${decoded.id}`);
  if (fetchedToken != token) {
    throw new Error('bad token');
  }
  return {id:decoded.id, username:decoded.username};
};
