import express, { Application } from "express";
// Routes
import indexRoutes from "./routes/IndexRoutes";
import path from "path";
import cors from "cors";
import { config } from "dotenv";
config({
    path: path.resolve(__dirname, "../.env"),
});

export class App {
    private app: Application;

    constructor(private port?: number | string) {
        this.app = express();
        this.settings();
        this.middleWares();
        this.routes();
        this.cronjobs();
    }

    settings() {
        this.app.set("port", this.port || process.env.PORT || 5001);
        this.app.use(express.static(path.join(__dirname, "build")));
        this.app.use(cors());
    }

    middleWares() {
        this.app.use(express.json());
    }

    routes() {
        this.app.use(indexRoutes);
        this.app.use('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
        })
    }

    cronjobs() {
        // Schedule tasks to be run on the server.
        // cron.schedule("* * * * *", bot);
    }

    async listen() {
        await this.app.listen(this.app.get("port"));
        console.log(`server started at http://localhost:${this.app.get("port")}`);
    }
}
