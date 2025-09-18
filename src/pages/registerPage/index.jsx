import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./index.scss";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EV Driver"); // mặc định Driver
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password) {
      setMessage("Vui lòng nhập Username và Password!");
      return;
    }

    try {
      const res = await fetch("https://68c789225d8d9f51473219fa.mockapi.io/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      if (res.ok) {
        setMessage("Đăng ký thành công! Chuyển sang trang đăng nhập...");
        setTimeout(() => navigate("/login"), 1500); // tự động chuyển sau 1.5s
      } else {
        setMessage("Đăng ký thất bại!");
      }
    } catch (error) {
      console.error(error);
      setMessage("Lỗi khi gọi API!");
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Đăng ký</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="EV Driver">EV Driver</option>
          <option value="Admin">Admin</option>
        </select>
        <button onClick={handleRegister}>Đăng ký</button>
        <p>{message}</p>
        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
