import { Server } from 'socket.io';
import { Colors } from './colors';
import { getPixelsAt, page } from './placeCanvas';
import { Queue, Client, sleep, Pixel, getColorAt, ImageTemplate } from './utils';
import './admin';

export let image: ImageTemplate = require('../../data/image.json');

export let io: Server;
let clients: Client[] = [];
let queue = new Queue<Pixel>();
export let progress = 0;
export let startTime = 0;
export let totalDraws = 0;
export let lastPx: number[] = [];

async function main() {
    io = new Server();

    console.log('getting initial queue...');
    queue = await getPixelsToDraw(true);

    startTime = Date.now();

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

    run().catch(console.error);

    const port = parseInt(process.env.PORT) || 3000;
    console.log(`listening on :${port}`);
    io.listen(port);
}

async function run() {
    // await sleep(30 * 1000);
    // await step2();
    // setInterval(step2, (5 * 60 * 1000) + 5000);

    setInterval(step, 1000);
    setInterval(async () => {
        console.log('updating queue...');
        queue = await getPixelsToDraw();
    }, 60 * 1000);    
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
        return null;
    }
    return c;
}

async function step() {
    if(queue.isEmpty) {
        // console.log('q empty');
        return;
    }

    let px = queue.dequeue();

    let c = await getNextFreeClient();
    if(!c || !c.ready) {
        // console.log('no available clients');
        queue.enqueue(px);
        return;
    }

    console.log(`sending draw to ${c.id} - ${px.x} ${px.y} ${px.color}`);
    let socket = io.sockets.sockets.get(c.id);
    if(!socket) {
        removeClient(socket.id);
        queue.enqueue(px);
        return;
    }

    socket.emit('draw', px);
    totalDraws++;
    updateClient(c.id, { ready: false });
}


async function step2() {
    if(queue.isEmpty) {
        // console.log('q empty');
        return;
    }
    console.log('step...');

    let c = await getNextFreeClient();
    while(c && c.ready && c.ratelimitEnd < Date.now()) {
        let px = queue.dequeue();

        console.log(`sending draw to ${c.id} - ${px.x} ${px.y} ${px.color}`);
        let socket = io.sockets.sockets.get(c.id);
        if(!socket) {
            removeClient(socket.id);
            queue.enqueue(px);
            return;
        }
    
        socket.emit('draw', px);
        totalDraws++;
        updateClient(c.id, { ready: false });
    
        c = await getNextFreeClient();
    }
}

async function getPixelsToDraw(retry = false): Promise<Queue<Pixel>> {
    let q = new Queue<Pixel>();

    const {topLeftX, topLeftY, width, height} = image.props;

    let ok = false, retries = 0;
    let currentData: ImageData;
    while(!ok && retries < 5) {
        try {
            currentData = await getPixelsAt(topLeftX, topLeftY, width, height);
            ok = true;
        } catch(err) {
            await page.screenshot({path: 'err.png'});
            console.error(err);

            if(!retry) {
                return;
            }

            console.log(`error while getting current pixels - retry #${retries+1} - waiting 15s...`);
            await sleep(15000);
        }
        retries--;
    }

    let total = 0;
    let left = 0;
    for (const [x, y, color] of image.pixels) {
        total++;
        const c = getColorAt(currentData, x, y, width);
        // console.log(`is: ${c} (${Colors[c]}), should be: ${color}`);
        if(Colors[c] == color || color == -1) continue;

        let obj = {x: topLeftX + x, y: topLeftY + y, color: color};
        // console.log('adding to queue', obj);
        q.enqueue(obj);
        left++;
    }
    console.log(`${left}/${total} pixels left || ${clients.length} clients`);

    progress = (total-left)/total;

    return q;
}

main().catch(console.error);

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);