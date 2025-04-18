import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cron from "node-cron";
import fs from "fs";

import userRoutes from "./Routes/user.route.js";
import adminRoutes from "./Routes/admin.route.js";
import authRoutes from "./Routes/auth.route.js";
import songRoutes from "./Routes/song.route.js";
import albumRoutes from "./Routes/album.route.js";
import statRoutes from "./Routes/stat.route.js";


import { connectDb } from "./lib/db.js";
import cors from "cors";
import { createServer } from "http";
import { initializeSocket } from "./lib/socket.js";
dotenv.config(); 

const __dirname = path.resolve();

const app = express();
const port = process.env.PORT;

const httpServer = createServer(app);

initializeSocket(httpServer);

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true,
}));
app.use(express.json());
app.use(clerkMiddleware());
app.use(fileUpload(
    {
        useTempFiles: true,
        tempFileDir: path.join(__dirname, 'tmp'),
        createParentPath: true,
        limits: { fileSize: 20 * 1024 * 1024 }, //20mb max file size
    }
));

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
	if (fs.existsSync(tempDir)) {
		fs.readdir(tempDir, (err, files) => {
			if (err) {
				console.log("error", err);
				return;
			}
			for (const file of files) {
				fs.unlink(path.join(tempDir, file), (err) => {});
			}
		});
	}
});

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/stats', statRoutes);

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));
    app.get("*",(req,res)=>{
        res.sendFile(path.resolve(__dirname,"../frontend","dist", "index.html"));
    }); 
}

//error middleware
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

httpServer.listen(port, () => {
    console.log(`server on ${port}`);
    connectDb();
});