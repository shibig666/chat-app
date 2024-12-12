const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

// 静态文件服务
app.use(express.static(path.join(__dirname, "public")));

// 根路径，提供 index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 动态路由，根据用户名渲染聊天页面
app.get("/:username", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Socket.IO 处理
io.on("connection", (socket) => {
    let username = "";

    // 接收用户名
    socket.on("join", (data) => {
        username = data.username;
        socket.username = username;
        io.emit("userJoined", { username });
    });

    // 接收并广播消息
    socket.on("sendMessage", (data) => {
        io.emit("receiveMessage", {
            username: username,
            message: data.message,
            time: data.time,
        });
    });

    // 用户断开连接
    socket.on("disconnect", () => {
        if (username) {
            io.emit("userLeft", { username });
        }
    });
});

http.listen(3000, () => {
    console.log("服务器已启动，监听端口 3000");
});
