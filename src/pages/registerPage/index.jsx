import { useState } from "react"
import { Eye, EyeOff, UserPlus, Zap } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import api from "../../config/api";
import "./register.scss"

export default function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [fullname, setFullname] = useState("") // local state
  const [dob, setDob] = useState("")
  const [address, setAddress] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const today = new Date().toISOString().split("T")[0] // giới hạn ngày

  const validateEmail = (em) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)
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

  const handleGoogleRegister = () => {
    setMessage(" Đăng ký với Google (chưa tích hợp)")
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

            <button type="button" className="btn-google" onClick={handleGoogleRegister}>
              <FcGoogle size={20} /> Đăng ký với Google
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
