import { Server } from 'socket.io';
import image from '../data/image.json';
import { Colors } from './colors';
import { getPixelsAt } from './placeCanvas';
import { Queue, Client, sleep, Pixel, getColorAt } from './utils';

let io: Server;
let clients: Client[] = [];
let queue = new Queue<Pixel>();

async function main() {
    io = new Server();

    queue = await getPixelsToDraw();

    io.on('connection', (socket) => {
        console.log('socket connected', socket.id);
        clients.push({
            id: socket.id,
            ratelimitEnd: Date.now(),
            ready: false,
        });

        socket.on('ratelimitUpdate', (rl) => {
            console.log(`updating ratelimit of ${socket.id} to ${rl}`);
            updateClient(socket.id, { ratelimitEnd: rl });
        });

        socket.on('ready', () => {
            updateClient(socket.id, { ready: true, });
            console.log(`client ${socket.id} ready`);
        });

        socket.on('disconnect', () => {
            console.log('socket disconnected', socket.id);
            removeClient(socket.id);
        })
    });



    setInterval(step, 1000);
    setInterval(async () => {
        console.log('updating queue...');
        queue = await getPixelsToDraw();
    }, 30 * 1000);

    const port = parseInt(process.env.PORT) || 3000;
    console.log(`listening on :${port}`)
    io.listen(port);
}

function updateClient(id: string, newData: Partial<Client>) {
    const i = clients.findIndex(x => x.id === id);
    clients[i] = { ...clients[i], ...newData };
}

function removeClient(id: string) {
    let idx = clients.findIndex(x => x.id == id);
    clients.splice(idx, 1);
}

async function getNextFreeClient(): Promise<Client | null> {
    const c = clients.reduce((acc, x) => (x.ready && (acc === null || acc.ratelimitEnd > x.ratelimitEnd)) ? x : acc, null);
    if(!c) return null;
    
    if(c.ratelimitEnd > Date.now()) {
        await sleep(c.ratelimitEnd - Date.now());
    }
    return c;
}

async function step() {
    if(queue.isEmpty) {
        console.log('q empty');
        return;
    }

    let px = queue.dequeue();

    let c = await getNextFreeClient();
    if(!c || !c.ready) {
        console.log('no available clients');
        queue.enqueue(px);
        return;
    }

    console.log('sending draw to', c.id);
    let socket = io.sockets.sockets.get(c.id);
    if(!socket) {
        removeClient(socket.id);
        queue.enqueue(px);
        return;
    }

    socket.emit('draw', px);
    updateClient(c.id, { ready: false });
}

async function getPixelsToDraw(): Promise<Queue<Pixel>> {
    let q = new Queue<Pixel>();

    const {topLeftX, topLeftY, width, height} = image.props;
    const currentData = await getPixelsAt(topLeftX, topLeftY, width, height);

    let total = 0;
    let left = 0;
    for (const [x, y, color] of image.pixels) {
        total++;
        const c = getColorAt(currentData, x, y, width);
        if(Colors[c] == color) continue;

        let obj = {x: topLeftX + x, y: topLeftY + y, color: color + 1};
        // console.log('adding to queue', obj);
        q.enqueue(obj);
        left++;
    }
    console.log(`${left}/${total} pixels left`);

    return q;
}

main().catch(console.error);