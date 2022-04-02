import Jimp from 'jimp';
import { Colors } from './colors';
import { ImageTemplate } from './utils';

export async function loadImage(path: string, topxy: string): Promise<ImageTemplate> {
    const img = await Jimp.read(path);
    const width = img.getWidth(), height = img.getHeight();

    const [topLeftX, topLeftY] = topxy.split(',').map(x => parseInt(x));

    let res = { props: { width, height, topLeftX, topLeftY }, pixels: [] }
    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            const rawHex = img.getPixelColor(x, y).toString(16);
            const color = ("000000" + rawHex).slice(-8, -2);
            res.pixels.push([x, y, Colors[color]])
        }
    }

    return res;
}

if (require.main === module) {
    loadImage(process.argv[2], process.argv[3])
        .then(x => console.log(JSON.stringify(x)));
}