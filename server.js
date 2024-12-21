const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const crypto = require("crypto");

var userInfo = [];
var chatingUsers = [];
var messages = [];

// 静态文件服务
app.use(express.static(path.join(__dirname, "public")));

// 根路径，提供 index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 动态路由，根据用户名渲染聊天页面
app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// 生成更安全的 token
function generateToken() {
    return crypto.randomBytes(64).toString("hex");
}

// 登录接口
app.post("/api/login", express.json(), (req, res) => {
    const username = req.body.username;
    if (username) {
        const existingUser = userInfo.find(
            (user) => user.username === username
        );
        if (existingUser) {
            existingUser.token = generateToken();
            res.json({ success: true, token: existingUser.token });
            return;
        }
        const token = generateToken();
        res.json({ success: true, token: token });
        userInfo.push({ username: username, token: token });
    } else {
        res.json({ success: false, message: "请输入用户名" });
    }
});

// 验证 token 接口
app.post("/api/verify", express.json(), (req, res) => {
    const token = req.body.token;
    if (token) {
        const user = userInfo.find((user) => user.token === token);
        if (user) {
            res.json({ success: true, message: user.username });
        } else {
            res.json({ success: false, message: "不存在该用户" });
        }
    } else {
        res.json({ success: false, message: "缺少token" });
    }
});

// 用户 Token 验证
function verifyUserToken(token) {
    const user = userInfo.find((user) => user.token === token);
    if (user) {
        return user.username;
    } else {
        return null;
    }
}

// 获取当前时间
function getCurrentTime() {
    const now = new Date();
    return now.toISOString(); // 格式化为 ISO 格式，或使用其他格式
}

// 格式化在线用户列表
function transformUsernames() {
    return userInfo.map((user) => user.username).join(", ");
}

io.on("connection", (socket) => {
    socket.on("join", (data) => {
        const username = verifyUserToken(data.token);
        if (!username) {
            socket.emit("errorMessage", { message: "Token 不存在" });
            return;
        }
        console.log(username + " 加入了聊天室");
        console.log("当前在线用户：" + transformUsernames());

        // 通知其他用户某人加入
        chatingUsers.forEach((user) => {
            user.socket.emit("userJoin", { username });
        });

        chatingUsers.push({ username: username, socket: socket });
    });

    socket.on("sendMessage", (data) => {
        const username = chatingUsers.find(
            (user) => user.socket === socket
        ).username;

        if (!username) {
            console.log("未找到用户");
            socket.emit("errorMessage", { message: "未找到用户" });
            return;
        }

        console.log(username + " 发送了：" + data.message);
        const time = getCurrentTime();
        messages.push({
            username: username,
            message: data.message,
            time: time,
        });

        // 广播消息给所有在线用户
        chatingUsers.forEach((user) => {
            user.socket.emit("receiveMessage", {
                username: username,
                message: data.message,
                time: time,
            });
        });
    });

    socket.on("disconnect", () => {
        const user = chatingUsers.find((user) => user.socket === socket);

        if (!user) {
            console.log("未找到用户");
            socket.emit("errorMessage", { message: "未找到用户" });
            return;
        }

        const username = user.username;
        console.log(username + " 离开了聊天室");
        console.log("当前在线用户：" + transformUsernames());

        // 通知其他用户某人离开
        chatingUsers.forEach((user) => {
            user.socket.emit("userLeft", { username });
        });

        chatingUsers = chatingUsers.filter((user) => user.socket !== socket);
    });

});

http.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
