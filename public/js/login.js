// 获取用户 Token（如果已经存在）
function getUserToken() {
    return new Promise((resolve, reject) => {
        var usernameInput = document.getElementById("username");
        var username = usernameInput.value.trim();

        // 验证用户名是否为空
        if (username === "") {
            alert("请输入用户名");
            resolve(false); // 结束函数，防止继续执行
            return;
        }

        const url = "/api/login";
        const postData = { username: username };

        const fetchData = {
            method: "POST",
            body: JSON.stringify(postData),
            headers: { "Content-Type": "application/json" },
        };

        // 向服务器发送请求
        fetch(url, fetchData)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    // 登录成功，存储 Token 在 localStorage 中
                    const cookieName = "userToken";
                    const cookieValue = data.token;
                    const expires = new Date();
                    expires.setMinutes(expires.getMinutes() + 30); // 设置 Token 过期时间为 30 分钟
                    document.cookie = `${cookieName}=${cookieValue};expires=${expires.toUTCString()};path=/`;

                    console.log("cookie:", document.cookie); // 打印 cookie 以确认存储情况
                    resolve(true); // 返回成功，继续执行
                } else {
                    alert(data.message); // 如果服务器返回失败，显示消息
                    resolve(false); // 终止函数
                }
            })
            .catch((error) => {
                console.error("Error:", error); // 捕获任何错误
                resolve(false); // 终止函数
            });
    });
}

// 处理用户登录
function login() {
    getUserToken().then((success) => {
        if (success) {
            // 登录成功，跳转到聊天页面
            window.location.href = "chat.html";
        } else {
            // 登录失败，停留在当前页面
            console.log("登录失败，请重试");
        }
    });
}

// 监听登录按钮的点击事件
document.querySelector(".login-button").addEventListener("click", login);
