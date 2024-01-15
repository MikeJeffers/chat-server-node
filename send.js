//@ts-check
const ws = require('ws');
/**
 * @param {ws.WebSocket} socket 
 * @param {string} socketId 
 * @param {string} command 
 * @param {Object} data 
 * @param {(err?: Error | undefined) => void|undefined} [cb]
 * @returns 
 */
const send = (socket, socketId, command, data, cb = undefined) => {
  const message = serializeObj({ command, socketId, ...data });
  return socket.send(message, cb);
};

/**
 * 
 * @param {ws.Server} server 
 * @param {Object<string, any>} jsonMessage 
 */
const broadcast = (server, jsonMessage) => {
  const stringed = serializeObj(jsonMessage);
  server.clients.forEach((c) => c.send(stringed));
};

/**
 * @param {Object<string, any>} json 
 * @returns {string}
 */
const serializeObj = (json) => JSON.stringify(json);


module.exports = {send, broadcast};