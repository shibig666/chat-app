// 检查当前页面是否为登录页
if (
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html"
) {
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const usernameInput = document.getElementById("username");
        const username = usernameInput.value.trim();
        if (username) {
            window.location.href = "/" + encodeURIComponent(username);
        } else {
            usernameInput.placeholder = "用户名不能为空";
        }
    });
} else {
    // 聊天页面的代码

    // 建立 Socket.IO 连接
    const socket = io();

    // 获取用户名（从 URL 中获取）
    const urlParts = window.location.pathname.split("/");
    const username =
        decodeURIComponent(urlParts[urlParts.length - 1]) || "匿名用户";
    var userID = username + Math.random().toString(36).substr(2);

    // 设置用户名和头像显示
    // document.getElementById("chat-username").textContent = username;
    // document.getElementById("user-avatar").textContent = username.charAt(0);

    // 发送用户名给服务器
    socket.emit("join", { username, userID });

    // 监听发送按钮点击事件
    document
        .querySelector(".sendButton")
        .addEventListener("click", sendChatMessage);

    // 监听回车键
    function checkEnter(event) {
        if (event.key === "Enter") {
            sendChatMessage();
        }
    }

    // 发送聊天消息
    function sendChatMessage() {
        const inputElement = document.getElementById("chat-input");
        const message = inputElement.value.trim();
        if (message === "") {
            inputElement.placeholder = "输入不能为空";
            return;
        }

        const time = getCurrentTime();

        // 本地显示自己发送的消息
        sendMessage(
            message,
            username.charAt(0),
            "green",
            "sent",
            time,
            username
        );

        // 发送消息给服务器
        socket.emit("sendMessage", {
            message: message,
            time: time,
            userID: userID,
        });

        inputElement.value = "";
    }

    // 接收并显示其他用户的消息
    socket.on("receiveMessage", (data) => {
        if (data.username !== username) {
            sendMessage(
                data.message,
                data.username.charAt(0),
                "#9b59b6",
                "received",
                data.time,
                data.username
            );
        }
    });

    // 提示用户加入
    socket.on("userJoined", (data) => {
        if (data.username !== username) {
            const systemMessage = `${data.username} 加入了聊天室`;
            displaySystemMessage(systemMessage);
        }
    });

    // 提示用户离开
    socket.on("userLeft", (data) => {
        if (data.username) {
            const systemMessage = `${data.username} 离开了聊天室`;
            displaySystemMessage(systemMessage);
        }
    });

    // 显示系统消息
    function displaySystemMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("system-message");
        messageElement.textContent = message;
        const messageList = document.getElementById("message-list");
        messageList.appendChild(messageElement);
        scrollToBottom();
    }

    // 获取当前时间
    function getCurrentTime() {
        const now = new Date();
        return now.getHours() + ":" + ("0" + now.getMinutes()).slice(-2);
    }

    // 创建消息元素
    function createMessageElement(
        content,
        avatarText,
        avatarColor,
        messageClass,
        time,
        userName = ""
    ) {
        // 创建消息容器
        var messageContainer = document.createElement("div");
        messageContainer.classList.add("message", messageClass);

        // 创建头像元素
        var avatar = document.createElement("div");
        avatar.textContent = avatarText;
        avatar.classList.add("message-avatar");
        avatar.style.backgroundColor = avatarColor;

        // 创建消息气泡
        var messageBubble = document.createElement("div");
        messageBubble.classList.add("message-bubble");

        // 创建消息时间
        var messageTime = document.createElement("div");
        messageTime.textContent = time;
        messageTime.classList.add("message-time");
        messageBubble.appendChild(messageTime);

        // 创建用户名
        if (userName) {
            var messageUser = document.createElement("div");
            messageUser.textContent = userName;
            messageUser.classList.add("message-user");
            messageBubble.appendChild(messageUser);
        }

        // 创建消息内容
        var messageContent = document.createElement("div");
        messageContent.textContent = content;
        messageContent.classList.add("message-content");
        messageBubble.appendChild(messageContent);

        messageContainer.appendChild(avatar);
        messageContainer.appendChild(messageBubble);

        return messageContainer;
    }

    // 发送消息
    function sendMessage(
        messageContent,
        avatarText,
        avatarColor,
        messageClass,
        time,
        userName = ""
    ) {
        var messageList = document.getElementById("message-list");
        messageList.classList.add("updating");

        var sendMessageElement = createMessageElement(
            messageContent,
            avatarText,
            avatarColor,
            messageClass,
            time,
            userName
        );
        messageList.appendChild(sendMessageElement);

        scrollToBottom();

        var inputText = document.getElementById("chat-input");
        inputText.placeholder = "输入消息...";

        setTimeout(function () {
            messageList.classList.remove("updating");
        }, 300);
    }

    // 自动滚动到底部
    function scrollToBottom() {
        var messageList = document.getElementById("chat-area");
        messageList.scrollTop = messageList.scrollHeight;
    }


    // 退出聊天室
    function exit() {
        socket.emit("userDisconnect", {
            userID: userID,
        });
        socket.disconnect();
        window.location.href = "/";
    }
}
