import puppeteer from 'puppeteer';

const canvasJsPath = 'document.querySelector("body > mona-lisa-app > faceplate-csrf-provider > faceplate-alert-reporter > mona-lisa-embed").shadowRoot.querySelector("div > mona-lisa-share-container > mona-lisa-camera > mona-lisa-canvas").shadowRoot.querySelector("div > canvas")';

let browser: puppeteer.Browser;
let page: puppeteer.Page;
let busy = false;

async function launchBrowser() {
    await browser?.close();
    browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1000,
            height: 800
        }
    });
}

setInterval(async () => {
    await launchBrowser();
}, 3 * 60 * 1000);

export async function getPixelsAt(x: number, y: number, w: number, h: number): Promise<ImageData> {
    if(!browser) {
        await launchBrowser();
    }

    page = await browser.newPage();

    if(busy) return;

    busy = true;

    page.goto('https://www.reddit.com/r/place/?cx=500&cy=500&px=460');
    await page.waitForSelector('.moeaZEzC0AbAvmDwN22Ma');
    await page.click('.moeaZEzC0AbAvmDwN22Ma');

    const elementHandle = await page.waitForSelector('iframe.Q-OBKuePQXXm3LGhGfv3k');
    const frame = (await elementHandle!.contentFrame())!;

    await page.waitForTimeout(2000);

    const canvas = await (await frame.evaluateHandle(canvasJsPath)).asElement()!;

    const data = await canvas.evaluate((c: HTMLCanvasElement, [x, y, w, h]) => c.getContext('2d').getImageData(x, y, w, h), [x, y, w, h]);

    busy = false;
    page.close();

    return data;
}
