//@ts-check 
require('./preload');
const ws = require('ws');
const { send, broadcast } = require('./send');
const auth = require('./auth');

const MAX_MESSAGES = 50;

const startServer = async (port) => {
  const server = new ws.Server({ port });
  server.on('close', (m) => {
    console.log(`[WS] onclose`, m);
    server.clients.forEach(c => c.close(1001, 'Server closing'));
  });
  server.on('error', (m) => {
    console.log(`[WS] onError`, m);
  });
  server.on('headers', (m) => {
    //console.log(`[WS] onHeaders`, m);
  });
  server.on('listening', (m) => {
    console.log(`[WS] onListening`, m);
  });


  const close = () => {
    server.clients.forEach(c => c.close(1001, 'Server closing'));
    return new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve(true)));
  }

  /**
   * @typedef {{id:string, name:string, token:string, socketId:string}} User
   * @typedef {{message:string, at:Date, from:string}} Message
   */

  // Chat state
  /** @type {Array<Message>} */
  const messages = [];
  /** @type {Object<string, User>} */
  const users = {};

  const userToClient = (user) => ({ name: user.name, id: user.id });

  /**
   * @param {string|number} id
   * @returns {User|undefined}
   */
  const userById = (id) => users[id];
  /**
   * 
   * @param {string} id 
   * @returns {boolean}
   */
  const removeUser = (id) => {
    if (!users[id]) {
      return false;
    }
    broadcast(server, { command: 'USER_LEAVE', user: userToClient(users[id]) });
    return delete users[id];
  }
  /**
   * 
   * @param {string} token 
   * @param {string} name 
   * @param {string} socketId
   * @param {number} userId
   */
  const addUser = (token, name, socketId, userId) => {
    users[userId] = { id: `${userId}`, name, token, socketId };
    broadcast(server, { command: 'USER_JOIN', user: userToClient(users[userId]) });
    return users[userId];
  }
  /**
   * 
   * @param {string} content 
   * @param {User} user 
   */
  const addMessage = (content, user) => {
    const message = { message: content, from: user.name, at: new Date() };
    messages.push(message);
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }
    broadcast(server, { command: 'MESSAGE_ADD', message });
  }

  /**
   * @param {ws.WebSocket} socket 
   * @param {string} socketId 
   * @param {string} token 
   * @param {User} user
   */
  const messageHandlers = async (socket, socketId, token, user) => {

    const onPlayerSocketClose = async (data) => {
      console.log(`User ${user.id} disconnected`);
      removeUser(user.id);
      if (!data.wasClean) {
        console.warn('UNCLEAN SOCKET CLOSURE');
      }
      console.log(`Socket close reason: ${data.reason}`);
    };

    const onMessage = async (message) => {
      console.log(message.data)
      try {
        const data = JSON.parse(message.data);
        const command = data.command;
        console.log(`Received: ${command}`);
        switch (command) {
          case 'SEND_MESSAGE': {
            //TODO validate message content
            addMessage(data.message, user);
            break;
          }
          case 'REFRESH': {
            send(socket, socketId, 'ACK', { messages, users: Object.values(users).map(userToClient) });
            break;
          }
          default:
            console.log(`No handler for command: ${command}`);
            break;
        }
      } catch (e) {
        console.log(e)
        //TODO only send "user" errors
        socket.send(JSON.stringify({ command: 'ERROR', message: e.message }));
      }
    };
    socket.onmessage = onMessage;
    socket.onclose = onPlayerSocketClose;
  }

  /**
   * 
   * @param {ws.WebSocket} socket 
   */
  const connectionHandler = (socket) => {
    socket.onmessage = async (message) => {
      console.log(message.data)
      try {
        const data = JSON.parse(message.data);
        const command = data.command;
        if (command === 'AUTH') {
          if (!data.token || !data.socketId) {
            throw new Error('Missing data for auth')
          }
          const userData = await auth(data.token);
          if (!userData) {
            throw new Error('Auth failed');
          }
          const connectedUser = userById(userData.id);
          if (connectedUser) {
            console.log(`User is already connected! Booting old connection for ${JSON.stringify(connectedUser)}`);
            removeUser(connectedUser.id);
          }
          const user = addUser(data.token, userData.username, data.socketId, userData.id);
          await messageHandlers(socket, data.socketId, data.token, user);
          send(socket, data.socketId, 'ACK', { messages, users: Object.values(users).map(userToClient) });
        }
      } catch (e) {
        console.log(e)
        //TODO only send "user" errors
        socket.send(JSON.stringify({ command: 'ERROR', message: e.message }));
      }
    }
  };
  server.on('connection', connectionHandler);
  return { close, address: () => server.address() };
}

const start = async () => {
  const server = await startServer(8077);
  console.log(`[WS] Server address: ${JSON.stringify(server.address())}`);

  const gracefulExit = async (signal) => {
    console.log(`=> Received signal to terminate: ${signal}`);
    try {
      await server.close();
    } catch (err) {
      console.log(err);
    } finally {
      process.kill(process.pid, signal);
    }
  }

  process.once('SIGINT', gracefulExit);
  process.once('SIGTERM', gracefulExit);
}

start();
