import { Socket } from "socket.io";

export class RandomQueue<T> {
    elements: T[];
    constructor() {
      this.elements = [];
    }
    enqueue(element: T) {
      this.elements.push(element);
    }
    dequeue(): T {
      const idx = Math.floor(Math.random() * this.length);
      const item = this.elements[idx];
      this.elements.splice(idx, 1);
      return item;
    }
    get length() {
      return this.elements.length;
    }
    get isEmpty() {
      return this.length === 0;
    }
  }
  

export interface Client {
  ready: boolean;
  id: string;
  ratelimitEnd: number;
}
export interface Pixel {
  x: number;
  y: number;
  color: number;
}

export const sleep = (t: number) => new Promise(r => setTimeout(r, t));

export function getColorIndicesForCoord(x: number, y: number, width: number) {
  var red = y * (width * 4) + x * 4;
  return [red, red + 1, red + 2, red + 3];
}

export function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255)
      throw "Invalid color component";
  return ((r << 16) | (g << 8) | b).toString(16);
}

export function rgbToHexString(r, g, b) {
  return ("000000" + rgbToHex(r, g, b)).slice(-6);
}

export function getColorAt(data: ImageData, x: number, y: number, width: number): string | null {
  const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, width);
  var r = data.data[redIndex];
  var g = data.data[greenIndex];
  var b = data.data[blueIndex];
  
  return rgbToHexString(r, g, b);
} 


export interface Props {
    width: number;
    height: number;
    topLeftX: number;
    topLeftY: number;
}

export interface ImageTemplate {
    props: Props;
    pixels: number[][];
}

