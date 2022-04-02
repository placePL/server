import { Socket } from "socket.io";

export class Queue<T> {
    elements: Record<number, T>;
    head: number;
    tail: number;

    constructor() {
      this.elements = {};
      this.head = 0;
      this.tail = 0;
    }
    enqueue(element: T) {
      this.elements[this.tail] = element;
      this.tail++;
    }
    dequeue(): T {
      const item = this.elements[this.head];
      delete this.elements[this.head];
      this.head++;
      return item;
    }
    peek(): T {
      return this.elements[this.head];
    }
    get length() {
      return this.tail - this.head;
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

export function getColorAt(data: ImageData, x: number, y: number, width: number): string {
  const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, width);
  var r = data.data[redIndex];
  var g = data.data[greenIndex];
  var b = data.data[blueIndex];
  
  return rgbToHexString(r, g, b);
} 