const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const crypto = require("crypto");

var userInfo = []; //  {username,password,token}
var chatingUsers = []; //{username,socket}
var messages = []; //{username,message,time}

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// 生成 token
function generateToken() {
    return crypto.randomBytes(64).toString("hex");
}

// 登录接口
app.post("/api/login", express.json(), (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username) {
        res.json({ success: false, message: "请输入用户名" });
        return;
    }
    if (!password) {
        res.json({ success: false, message: "请输入密码" });
        return;
    }
    const existingUser = userInfo.find((user) => user.username === username);
    if (!existingUser) {
        res.json({ success: false, message: "用户不存在" });
        return;
    }
    if (existingUser.password != password) {
        res.json({ success: false, message: "密码错误" });
        console.log(username + " 登录失败(密码错误)");
        return;
    }
    const token = generateToken();
    res.json({ success: true, token: token });
    existingUser.token = token;
    console.log(username + " 登录成功");
});

// 注册接口
app.post("/api/register", express.json(), (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username) {
        res.json({ success: false, message: "请输入用户名" });
        return;
    }
    if (!password) {
        res.json({ success: false, message: "请输入密码" });
        return;
    }
    const existingUser = userInfo.find((user) => user.username === username);
    if (existingUser) {
        res.json({ success: false, message: "用户已存在" });
        return;
    }
    const token = generateToken();
    res.json({ success: true });
    userInfo.push({ username: username, password: password, token: null });
    console.log(username + " 注册成功");
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

// 格式化在线用户列表
function transformChatUsers() {
    return chatingUsers.map((user) => user.username).join(", ");
}

// 获取当前时间
function getCurrentTime() {
    const now = new Date();
    return now.toISOString(); // 格式化为 ISO 格式
}

io.on("connection", (socket) => {
    socket.on("join", (data) => {
        //data={token}
        const username = verifyUserToken(data.token);
        if (!username) {
            console.log("join:Token 不存在");
            socket.emit("errorMessage", { message: "Token 不存在" });
            return;
        }

        // 防多端
        const existingUser = chatingUsers.find(
            (user) => user.username === username
        );
        if (existingUser && existingUser.socket) {
            // 如果已存在用户，先断开旧的连接
            const oldSocket = existingUser.socket;
            if (oldSocket) {
                oldSocket.emit("errorMessage", {
                    message: "您已被踢出，您的账户在其他地方登录。",
                });
            }
            // 更新socket
            existingUser.socket = socket;
        } else {
            console.log(username + " 加入了聊天室");
            // 通知其他用户某人加入
            chatingUsers.forEach((user) => {
                user.socket.emit("userJoin", { username });
            });
            chatingUsers.push({ username: username, socket: socket });
            console.log("当前在线用户：" + transformChatUsers());
        }
    });

    socket.on("sendMessage", (data) => {
        const user = chatingUsers.find((user) => user.socket === socket);

        if (!user) {
            console.log("send:未找到用户 ");
            socket.emit("errorMessage", { message: "未找到用户" });
            return;
        }

        const username = user.username;

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
            console.log("disconnect:未找到用户");
            socket.emit("errorMessage", { message: "未找到用户" });
            return;
        }

        const username = user.username;
        console.log(username + " 离开了聊天室");
        chatingUsers = chatingUsers.filter((user) => user.socket !== socket);
        console.log("当前在线用户：" + transformChatUsers());
        // 通知其他用户某人离开
        chatingUsers.forEach((user) => {
            user.socket.emit("userLeft", { username });
        });
    });
});

http.listen(3000, () => {
    console.log("服务器启动，http://localhost:3000");
});
