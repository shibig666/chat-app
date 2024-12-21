// 获取用户的 token
const userToken = document.cookie.replace(
    /(?:(?:^|.*;\s*)userToken\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
);

// 如果没有 token，表示用户没有登录，重定向到登录页
if (!userToken) {
    alert("请先登录");
    window.location.href = "index.html";
} else {
    // 如果有 token，验证该 token 是否有效
    verifyUserToken();
}

// 验证 token 是否有效
function verifyUserToken() {
    const url = "/api/verify";
    const postData = { token: userToken };

    const fetchData = {
        method: "POST",
        body: JSON.stringify(postData),
        headers: { "Content-Type": "application/json" },
    };

    fetch(url, fetchData)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                // token 验证成功，存储用户名
                userName = data.message;
                console.log(`欢迎，${userName}`);
            } else {
                // token 无效，跳转到登录页面
                alert(data.message);
                window.location.href = "index.html";
                document.cookie =
                    "userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // 清除 cookie
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            window.location.href = "index.html";
        });
}

// 初始化 Socket.IO 连接
const socket = io();

// 加入聊天室
socket.emit("join", { token: userToken });

// 监听其他用户加入聊天室
socket.on("userJoin", (data) => {
    if (data.username === userName) return;
    const systemMessage = `${data.username} 加入了聊天室`;
    displaySystemMessage(systemMessage);
});

// 监听其他用户离开聊天室
socket.on("userLeft", (data) => {
    if (data.username) {
        const systemMessage = `${data.username} 离开了聊天室`;
        displaySystemMessage(systemMessage);
    }
});

// 监听服务器的错误信息
socket.on("errorMessage", (data) => {
    alert(data.message);
    window.location.href = "index.html"; // 如果 token 无效，跳转回登录页
});

// 监听接收到的消息
socket.on("receiveMessage", (data) => {
    var messageClass = "sent";
    var color = "green";
    if (data.username !== userName) {
        messageClass = "received";
        color = "#9b59b6"; // 其他用户的消息颜色
    }

    // 显示接收到的消息
    sendMessage(
        data.message,
        data.username[0].toUpperCase(), // 头像的第一个字母
        color,
        messageClass,
        data.time,
        data.username
    );
});

// 滚动到消息列表的底部
function scrollToBottom() {
    var messageList = document.getElementById("chat-area");
    messageList.scrollTop = messageList.scrollHeight;
}

// 显示系统消息（例如：某人加入或离开）
function displaySystemMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("system-message");
    messageElement.textContent = message;
    const messageList = document.getElementById("message-list");
    messageList.appendChild(messageElement);
    scrollToBottom();
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
    const messageTimeFormatted = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageTime.textContent = messageTimeFormatted;
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
    content,
    avatarText,
    avatarColor,
    messageClass,
    time,
    userName = ""
) {
    var messageList = document.getElementById("message-list");
    messageList.classList.add("updating");

    // 创建并显示消息
    var sendMessageElement = createMessageElement(
        content,
        avatarText,
        avatarColor,
        messageClass,
        time,
        userName
    );
    messageList.appendChild(sendMessageElement);

    // 滚动到消息底部
    scrollToBottom();

    var inputText = document.getElementById("chat-input");
    inputText.placeholder = "输入消息...";

    setTimeout(function () {
        messageList.classList.remove("updating");
    }, 300);
}

// 监听发送按钮的点击事件
document
    .querySelector(".sendButton")
    .addEventListener("click", sendChatMessage);

// 监听回车键发送消息
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

    // 发送消息到服务器
    socket.emit("sendMessage", { message: message });

    inputElement.value = ""; // 清空输入框
}

// 退出聊天室
function exit() {
    socket.disconnect();
    window.location.href = "/";
}
