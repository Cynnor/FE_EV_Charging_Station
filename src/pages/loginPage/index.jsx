import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from "../../config/api";
import "./login.scss";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Lấy redirect từ query string nếu có
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get("redirect") || "/";

  // Google Client ID (from user)
  const GOOGLE_CLIENT_ID =
    "689149719053-mntdte4ogijvhlj69l3hi7ctc2o02o9d.apps.googleusercontent.com";

  // Load Google Identity Services script
  if (
    typeof window !== "undefined" &&
    !window.google &&
    !document.getElementById("google-gsi")
  ) {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.id = "google-gsi";
    s.onload = () => setGoogleReady(true);
    document.head.appendChild(s);
  } else if (typeof window !== "undefined" && window.google && !googleReady) {
    setGoogleReady(true);
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ Username và Password!");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/users/login", { username, password });
      const data = res.data;
      console.log("Login response:", data);

      if (data.success && data.data && data.data.token) {
        setMessage("Đăng nhập thành công!");
        setIsSuccess(true);
        localStorage.setItem("token", data.data.token);

        // Giả sử response trả về user info và token
        const user = data.data.user;
        localStorage.setItem("user", JSON.stringify(user));

        // Điều hướng theo role
        const role = user.role || user.userRole || user.accountRole;
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "STAFF") {
          navigate("/staff", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setMessage(data.message || "Phản hồi không hợp lệ từ server!");
        setIsSuccess(false);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setMessage("Sai tài khoản hoặc mật khẩu!");
        } else if (error.response.status === 400) {
          setMessage("Dữ liệu không hợp lệ!");
        } else {
          setMessage("Lỗi server!");
        }
      } else {
        setMessage("Lỗi khi gọi API!");
      }
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!window.google) {
        setMessage("Không thể tải Google Sign-In. Vui lòng thử lại!");
        setIsSuccess(false);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const idToken = response?.credential;
            if (!idToken) {
              setMessage("Không nhận được mã xác thực từ Google.");
              setIsSuccess(false);
              return;
            }

            // Nếu backend có endpoint xác thực Google, gọi ở đây
            // const apiRes = await api.post("/users/login/google", { idToken });
            // const backendToken = apiRes.data?.data?.token;
            // localStorage.setItem("token", backendToken || idToken);

            // Tạm thời lưu idToken vào localStorage và điều hướng
            localStorage.setItem("token", idToken);
            setMessage("Đăng nhập với Google thành công!");
            setIsSuccess(true);
            navigate(decodeURIComponent(redirectPath));
          } catch (err) {
            console.error("Google login error:", err);
            setMessage("Không thể đăng nhập với Google.");
            setIsSuccess(false);
          }
        },
      });

      // Gợi ý đăng nhập (One Tap / Account chooser)
      window.google.accounts.id.prompt();
    } catch (e) {
      console.error(e);
      setMessage("Xảy ra lỗi khi khởi tạo Google Sign-In");
      setIsSuccess(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-page">
      <div className="bg-elements">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="gradient-overlay"></div>
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-wrapper">
            <div className="logo-frame">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/z7036022802941_9a3d15ec82e54a9765f8f3ea61d79d00.jpg-JjWtkaP2DhrAhKdvt2musNbW5UqyXb.jpeg"
                alt="Electric Scooter"
                className="logo-img"
              />
              <div className="logo-glow"></div>
            </div>
          </div>
          <div className="brand-text">
            <h1>
              <span className="brand-highlight">EV</span> Charging Station
            </h1>
            <p>Tương lai xanh, di chuyển thông minh</p>
          </div>
        </div>

        {/* Form */}
        <div className="form-section">
          <div className="form-header">
            <h2>Chào mừng trở lại</h2>
            <p>Đăng nhập để truy cập hệ thống quản lý xe điện</p>
          </div>

          <div className="form-content">
            <div className="input-group">
              <label className="input-label">Tên đăng nhập</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập username của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="form-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Mật khẩu</label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              className={`btn-login ${isLoading ? "loading" : ""}`}
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <Zap size={20} />
                  Đăng nhập
                </>
              )}
            </button>

            <div className="divider">
              <span>Hoặc tiếp tục với</span>
            </div>

            <button
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={!googleReady}
            >
              <FcGoogle size={20} />
              Đăng nhập với Google
            </button>

            {message && (
              <div className={`message ${isSuccess ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <div className="register-link">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="link-accent">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
