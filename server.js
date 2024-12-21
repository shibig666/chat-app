const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
var usernames = [];

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


function transformUsernames(){
    var result=[];
    for (var i = 0; i < usernames.length; i++) {
        result.push(usernames[i].username);
    }
    return result.join(", ");
}

// Socket.IO 处理
io.on("connection", (socket) => {

    // 接收用户名
    socket.on("join", (data) => {
        var username = data.username;
        var userID = data.userID;
        var isExist = false;
        for (var i = 0; i < usernames.length; i++) {
            if (usernames[i].username == username) {
                usernames[i].userID = userID;
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            console.log(username + " 加入了聊天室");
            usernames.push({ username: username, userID: userID });
            console.log("当前在线用户：" + transformUsernames(usernames));
            io.emit("userJoined", { username });
        }
    });

    // 接收并广播消息
    socket.on("sendMessage", (data) => {
        var userID = data.userID;
        var username = null;
        for (var i = 0; i < usernames.length; i++) {
            if (usernames[i].userID == userID) {
                username = usernames[i].username;
                break;
            }
        }
        if (!username) {
            console.log("未找到用户ID：" + userID);
            return;
        }
        console.log(username + " 发送了：" + data.message);
        io.emit("receiveMessage", {
            username: username,
            message: data.message,
            time: data.time,
        });
    });

    // 用户断开连接
    socket.on("userDisconnect", (data) => {
        var userID = data.userID;
        var username = null;
        var isExist = false;
        for (var i = 0; i < usernames.length; i++) {
            if (usernames[i].userID == userID) {
                username = usernames[i].username;
                usernames.splice(i, 1);
                isExist = true;
                break;
            }
        }
        if (isExist) {
            console.log(username + " 离开了聊天室");
            console.log("当前在线用户：" + transformUsernames(usernames));
            io.emit("userLeft", { username });
        }
    });
});

http.listen(3000, () => {
    console.log("服务器已启动，监听端口 3000");
});
