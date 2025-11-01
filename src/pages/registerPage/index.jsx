import { useState } from "react"
import { Eye, EyeOff, UserPlus, Zap } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import api from "../../config/api";
import "./index.scss"

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function derivePasswordFromSub(sub) {
  // Deterministic password for Google-created accounts
  return `GOOGLE_${String(sub || "").slice(0, 24)}`;
}

export default function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [fullname, setFullname] = useState("") // local state
  const [dob, setDob] = useState("")
  const [address, setAddress] = useState("")
  const [numberphone, setNumberphone] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  const today = new Date().toISOString().split("T")[0] // giới hạn ngày

  const validateEmail = (em) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)
  }

  // Google Client ID (same as login)
  const GOOGLE_CLIENT_ID = "689149719053-mntdte4ogijvhlj69l3hi7ctc2o02o9d.apps.googleusercontent.com"

  // Load Google Identity Services script
  if (typeof window !== "undefined" && !window.google && !document.getElementById("google-gsi")) {
    const s = document.createElement("script")
    s.src = "https://accounts.google.com/gsi/client"
    s.async = true
    s.defer = true
    s.id = "google-gsi"
    s.onload = () => setGoogleReady(true)
    document.head.appendChild(s)
  } else if (typeof window !== "undefined" && window.google && !googleReady) {
    setGoogleReady(true)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage("")

    // basic validation
    if (!username || !password || !email || !fullname) {
      setMessage(" Vui lòng nhập đầy đủ: username, email, full name, password.")
      return
    }
    if (!validateEmail(email)) {
      setMessage(" Email không hợp lệ.")
      return
    }
    if (password.length < 6) {
      setMessage(" Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }

    setIsLoading(true)

    
    const payload = {
      username: String(username),
      password: String(password),
      email: String(email),
      fullName: String(fullname), 
      dob: dob ? String(dob) : "", 
      address: String(address || ""),
      numberphone: String(numberphone || ""),
    }

    console.log("Register payload:", payload)

    try {
      
      const res = await api.post("/users/create", payload)

      
      const data = res.data
      console.log("Register response:", res.status, data)

      if (res.status === 200 || res.status === 201) {
        setMessage("✅ Đăng ký thành công! Chuyển sang trang đăng nhập...")
  setUsername("")
  setEmail("")
  setFullname("")
  setPassword("")
  setDob("")
  setAddress("")
  setNumberphone("")
        setTimeout(() => (window.location.href = "/login"), 1200)
      } else {
        setMessage(data.message || ` Đăng ký thất bại (status ${res.status})`)
      }
    } catch (err) {
      // axios trả về err.response nếu có
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message)
      } else {
        setMessage(" Lỗi khi gọi API hoặc kết nối bị chặn (xem console/network).")
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setMessage("")
    try {
      if (!window.google) {
        setMessage("Không thể tải Google Sign-In. Vui lòng thử lại!")
        return
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const idToken = response?.credential
            if (!idToken) {
              setMessage("Không nhận được mã xác thực từ Google.")
              return
            }

            // Decode để lấy email, name, sub
            const payload = decodeJwt(idToken) || {};
            const googleEmail = payload.email;
            const googleName = payload.name || payload.given_name || "Google User";
            const googleSub = payload.sub;
            const derivedPassword = derivePasswordFromSub(googleSub);

            // 1) Thử tạo tài khoản nếu chưa có (bỏ qua lỗi nếu đã tồn tại)
            try {
              if (googleEmail) {
                await api.post("/users/create", {
                  username: googleEmail,
                  password: derivedPassword,
                  email: googleEmail,
                  fullName: googleName,
                  dob: "",
                  address: "",
                  numberphone: "",
                });
              }
            } catch (e) {
              // Nếu trùng (409/400) thì bỏ qua
              // console.warn("Create user skipped:", e?.response?.status);
            }

            // 2) Đăng nhập bằng cặp (email, derivedPassword)
            if (googleEmail) {
              const loginRes = await api.post("/users/login", {
                username: googleEmail,
                password: derivedPassword,
              });
              const backendToken = loginRes?.data?.data?.token;
              if (backendToken) {
                localStorage.setItem("token", backendToken);
                setMessage("✅ Đăng ký/Đăng nhập với Google thành công!");
                setTimeout(() => (window.location.href = "/"), 800);
                return;
              }
            }

            // Fallback: lưu idToken (nếu backend chưa sẵn sàng)
            localStorage.setItem("token", idToken);
            setMessage("✅ Đăng ký với Google (token tạm thời)");
            setTimeout(() => (window.location.href = "/"), 800);
          } catch (err) {
            console.error("Google register error:", err)
            setMessage("Không thể đăng ký với Google.")
          }
        },
      })

      window.google.accounts.id.prompt()
    } catch (e) {
      console.error(e)
      setMessage("Xảy ra lỗi khi khởi tạo Google Sign-In")
    }
  }

  return (
    <div className="register-page">
      <div className="bg-elements">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="gradient-overlay"></div>
      </div>

      <div className="register-container">
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
            <div className="brand-features">
              <div className="feature-item">
                <Zap size={16} />
                <span>Sạc nhanh</span>
              </div>
              <div className="feature-item">
                <Zap size={16} />
                <span>Thân thiện môi trường</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-header">
            <h2>Tạo tài khoản mới</h2>
            <p>Đăng ký để truy cập hệ thống quản lý xe điện</p>
          </div>

          <form className="form-content" onSubmit={handleRegister}>
            <div className="input-group">
              <label className="input-label">Tên đăng nhập</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập username của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Họ và tên</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập họ và tên của bạn"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Ngày sinh</label>
              <div className="input-wrapper">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="form-input"
                  max={today}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Địa chỉ</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập địa chỉ của bạn"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Số điện thoại</label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại của bạn"
                  value={numberphone}
                  onChange={(e) => setNumberphone(e.target.value)}
                  className="form-input"
                  pattern="[0-9]{10,11}"
                  maxLength={11}
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
                  className="form-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className={`btn-register ${isLoading ? "loading" : ""}`} disabled={isLoading}>
              {isLoading ? <div className="loading-spinner" /> : <><UserPlus size={20} /> Đăng ký</>}
            </button>

            <div className="divider"><span>Hoặc tiếp tục với</span></div>

            <button type="button" className="btn-google" onClick={handleGoogleRegister} disabled={!googleReady}>
              <FcGoogle size={20} /> Đăng nhập với Google
            </button>

            {message && <div className={`message ${message.includes("thành công") ? "success" : "error"}`}>{message}</div>}

            <div className="login-link">
              Đã có tài khoản? <a href="/login" className="link-accent">Đăng nhập ngay</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
