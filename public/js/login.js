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
                showAlert(data.message);
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
                showAlert("注册成功，请登录",1);
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            } else {
                showAlert(data.message);
            }
        });
}

function sha256(message) {
    return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}

function showAlert(message, type = 0) {
    const errorPopup = document.querySelector(".error");
    const closeBtn = document.querySelector(".error__close");
    const errorTitle = document.querySelector(".error__title");
    if (type === 1) {
        errorPopup.style.backgroundColor = "green";
    }
    errorTitle.textContent = message;
    errorPopup.classList.add("show");
    setTimeout(() => {
        errorPopup.classList.remove("show");
    }, 3000);
}

function closeAlert() {
    const errorPopup = document.querySelector(".error");
    errorPopup.classList.remove("show");
}
