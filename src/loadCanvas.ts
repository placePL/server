import { getPixelsAt } from "./placeCanvas";

async function main() {
    getPixelsAt(480, 344, 208, 31);
}

main().catch(console.error);