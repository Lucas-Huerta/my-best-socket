import express from 'express';
import http from 'http';
import ip from 'ip';
import { Server } from 'socket.io';
import cors from 'cors';
const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = new Server(server, {
    cors: {
        origin: '*',
        }
})

app.use(cors())

app.get('/', (req, res) => {
    res.json('ip address: http://' + ip.address()+':'+PORT);
    return myData;
});

server.listen(PORT, () => {
    console.log('Server ip : http://' +ip.address() +":" + PORT);
})
