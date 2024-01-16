//@ts-check
const sql = require('./db');
const TABLE_NAME = 'users';
/**
 * 
 * @param {{
*   "username":string,
*   "password":string
* }} user 
* @returns {Promise<Object?>}
*/
const createUser = async (user) => {
  const data = (await sql`INSERT INTO ${sql(TABLE_NAME)} ${sql(user)} RETURNING *`)[0];
  if (!data) { return null }
  return data;
}

/**
 * 
 * @param {Number} id 
 * @returns {Promise<Object?>}
 */
const getById = async (id) => {
  const data = (await sql`SELECT * FROM ${sql(TABLE_NAME)} WHERE id=${id}`)[0];
  if (!data) { return null; }
  return data;
}

/**
 * 
 * @param {string} username 
 * @returns {Promise<Object?>}
 */
const getByUsername = async (username) => {
  const data = (await sql`SELECT * FROM ${sql(TABLE_NAME)} WHERE username=${username} LIMIT 1`)[0];
  if (!data) { return null; }
  return data;
}


module.exports = {
  createUser,
  getById,
  getByUsername
}