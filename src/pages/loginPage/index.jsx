import { useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { Eye, EyeOff, Zap } from "lucide-react"
import "./login.scss"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ Username và Password!")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`https://68c789225d8d9f51473219fa.mockapi.io/api/users?username=${username}`)
      const data = await res.json()

      const user = data.find((u) => u.password === password)

      if (user) {
        setMessage(`Đăng nhập thành công! Xin chào ${user.role}`)
        //
      } else {
        setMessage("Sai tài khoản hoặc mật khẩu!")
      }
    } catch (error) {
      console.error(error)
      setMessage("Lỗi khi gọi API!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setMessage("Đăng nhập với Google thành công!")
    //
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="login-page">
      {}
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

      <div className="login-container">
        {}
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

        {}
        <div className="form-section">
          <div className="form-header">
            <h2>Đăng nhập</h2>
            <p>Truy cập vào hệ thống quản lý xe điện</p>
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

          <button className={`btn-login ${isLoading ? "loading" : ""}`} onClick={handleLogin} disabled={isLoading}>
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
            <span>Hoặc</span>
          </div>

          <button className="btn-google" onClick={handleGoogleLogin}>
            <FcGoogle size={20} />
            Đăng nhập với Google
          </button>

          {message && (
            <div className={`message ${message.includes("thành công") ? "success" : "error"}`}>{message}</div>
          )}
        </div>
      </div>
    </div>
  )
}
