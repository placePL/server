import Jimp from 'jimp';
import { Colors } from './colors';

export async function loadImage(path: string) {
    const img = await Jimp.read(path);
    const width = img.getWidth(), height = img.getHeight();

    let res = { props: { width, height }, pixels: [] }
    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            const rawHex = img.getPixelColor(x, y).toString(16);
            const color = ("000000" + rawHex).slice(-8, -2);
            res.pixels.push([x, y, Colors[color]])
        }
    }
    console.log(JSON.stringify(res));
}

loadImage(process.argv[2]).catch();