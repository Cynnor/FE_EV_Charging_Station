import { useState } from "react"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import "./register.scss"

function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("EV Driver")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async () => {
    if (!username || !password || !email) {
      setMessage("Vui lòng nhập đầy đủ thông tin!")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("https://68c789225d8d9f51473219fa.mockapi.io/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, role }),
      })

      if (res.ok) {
        setMessage("Đăng ký thành công! Chuyển sang trang đăng nhập...")
        setTimeout(() => {
          console.log("Navigate to login page")
        }, 1500)
      } else {
        setMessage("Đăng ký thất bại!")
      }
    } catch (error) {
      console.error(error)
      setMessage("Lỗi khi gọi API!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    setMessage("Đăng ký với Google thành công!")
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRegister()
    }
  }

  return (
    <div className="register-page">
      <div className="bg-elements">
        <div className="neon-line line-1"></div>
        <div className="neon-line line-2"></div>
        <div className="neon-line line-3"></div>
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      <div className="register-container">
        <div className="logo-section">
          <div className="logo-duo">
            <div className="logo-wrapper">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/z7036022984678_10a42c07afdf6fea85889fcbf03a4b99.jpg-INRdCVP7PB1qH2dXZaFzTfVdzq6ZKT.jpeg"
                alt="Electric Car"
                className="logo-img car-logo"
              />
              <div className="logo-glow"></div>
            </div>
            <div className="logo-wrapper">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/z7036022802941_9a3d15ec82e54a9765f8f3ea61d79d00.jpg-JjWtkaP2DhrAhKdvt2musNbW5UqyXb.jpeg"
                alt="Electric Scooter"
                className="logo-img scooter-logo"
              />
              <div className="logo-glow"></div>
            </div>
          </div>
          <div className="brand-text">
            <h1>EV Charging Station</h1>
            <p>Tương lai xanh, di chuyển thông minh</p>
          </div>
        </div>

        <div className="form-section">
          <div className="form-header">
            <h2>Đăng ký</h2>
            <p>Tạo tài khoản mới để trải nghiệm tương lai xanh</p>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Nhập Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="form-input"
            />
            <div className="input-border"></div>
          </div>

          <div className="input-group">
            <input
              type="email"
              placeholder="Nhập Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="form-input"
            />
            <div className="input-border"></div>
          </div>

          <div className="input-group">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="input-border"></div>
          </div>

          <div className="input-group">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
              <option value="EV Driver">EV Driver</option>
              <option value="Admin">Admin</option>
              <option value="Station Owner">Station Owner</option>
            </select>
            <div className="input-border"></div>
          </div>

          <button
            className={`btn-register ${isLoading ? "loading" : ""}`}
            onClick={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <UserPlus size={20} />
                Đăng ký
              </>
            )}
          </button>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          <button className="btn-google" onClick={handleGoogleRegister}>
            <FcGoogle size={20} />
            Đăng ký với Google
          </button>

          {message && (
            <div className={`message ${message.includes("thành công") ? "success" : "error"}`}>{message}</div>
          )}

          <div className="login-link">
            Đã có tài khoản?{" "}
            <a href="/login" className="link-accent">
              Đăng nhập ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
