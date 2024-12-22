async function login() {
    const username = document.getElementById("login-account").value;
    const password = document.getElementById("login-password").value;
    const hashedPassword = sha256(password); 
    fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password: hashedPassword }), // 发送加密后的密码
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                localStorage.setItem("token", data.token);
                window.location.href = "/chat.html";
            } else {
                alert(data.message);
            }
        });
}

async function register() {
    const username = document.getElementById("register-account").value;
    const password = document.getElementById("register-password").value;
    const hashedPassword = sha256(password);
    fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password: hashedPassword }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("注册成功，请登录");
                window.location.href = "/";
            } else {
                alert(data.message);
            }
        });
}

function sha256(message) {
    return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}
