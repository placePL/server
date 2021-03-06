import puppeteer from 'puppeteer';
import path from 'path';

const canvasJsPath = 'document.querySelector("body > mona-lisa-app > faceplate-csrf-provider > faceplate-alert-reporter > mona-lisa-embed").shadowRoot.querySelector("div > mona-lisa-share-container > mona-lisa-camera > mona-lisa-canvas").shadowRoot.querySelector("div > canvas")';

export let browser: puppeteer.Browser;
export let page: puppeteer.Page;
let busy = false;

async function launchBrowser() {
    if (browser) await browser.close();
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
    if (busy) {
        console.log('browser busy');
        return;
    }

    try {
        if (!browser) {
            await launchBrowser();
        }

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36');


        busy = true;

        // console.log('g');
        await page.goto(`https://www.reddit.com/r/place/?cx=${x}&cy=${y}&px=137`, {timeout: 2 * 60 * 1000});
        console.log('rplace ok');

        // let p = path.resolve('test.png');
        // console.log('screenshot ', p);
        // await page.screenshot({path: p});

        await page.waitForSelector('.moeaZEzC0AbAvmDwN22Ma');
        await page.click('.moeaZEzC0AbAvmDwN22Ma');

        const elementHandle = await page.waitForSelector('iframe.Q-OBKuePQXXm3LGhGfv3k');
        const frame = (await elementHandle!.contentFrame())!;

        await page.waitForTimeout(2000);

        const canvas = await (await frame.evaluateHandle(canvasJsPath)).asElement()!;

        const data = await canvas.evaluate((c: HTMLCanvasElement, [x, y, w, h]) => c.getContext('2d').getImageData(x, y, w, h), [x, y, w, h]);

        console.log('ok');
        busy = false;
        page.close();

        return data;
    } catch (err) {
        busy = false;

        throw err;
    }
}
