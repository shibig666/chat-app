function login() {
    const username = document.getElementById("login-account").value;
    const password = document.getElementById("login-password").value;
    fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
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

function register() {
    const username = document.getElementById("register-account").value;
    const password = document.getElementById("register-password").value;
    fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
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