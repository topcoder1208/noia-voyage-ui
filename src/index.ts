import { App } from "./app";

async function main() {
    const port = process.env.APP_LISTEN_PORT || 5000;
    const app = new App(port);
    await app.listen();
}

main();
