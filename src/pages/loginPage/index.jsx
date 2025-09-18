import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.scss";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ Username và Password!");
      return;
    }

    try {
      const res = await fetch(
        `https://68c789225d8d9f51473219fa.mockapi.io/api/users?username=${username}`
      );
      const data = await res.json();

      // Lọc password ở FE
      const user = data.find((u) => u.password === password);

      if (user) {
        setMessage(`Đăng nhập thành công! Xin chào ${user.role}`);
        navigate("/");
      } else {
        setMessage("Sai tài khoản hoặc mật khẩu!");
      }
    } catch (error) {
      console.error(error);
      setMessage("Lỗi khi gọi API!");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Đăng nhập</h2>
        <input
          type="text"
          placeholder="Nhập Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Nhập Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Đăng nhập</button>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default Login;
