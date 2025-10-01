import { useState } from "react"
import { KeyRound, Mail, Shield, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import api from "../../config/api";
import "./forgot.scss"

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendEmail = async () => {
    if (!email) {
      setMessage("Vui lòng nhập email!")
      return
    }

    setIsLoading(true)
    try {
      
      const res = await api.post("/users/password/forgot", { email })
      const data = res.data
      console.log("Forgot password response:", data)

      if (!data.success) {
        setMessage(data.message || "Có lỗi xảy ra từ server!")
        return
      }

      setMessage(data.message || "OTP đã được gửi về email")
      setStep(2)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message)
      } else {
        setMessage("Không thể kết nối tới server!")
      }
      console.error("Forgot password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      setMessage("Vui lòng nhập đầy đủ thông tin!")
      return
    }

    setIsLoading(true)
    try {
     
      const res = await api.post("/users/password/reset", { email, otp, newPassword })
      const data = res.data
      console.log("Reset password response:", data)

      if (!data.success) {
        setMessage(data.message || "Đặt lại mật khẩu thất bại!")
        return
      }

      setMessage(data.message || "Đặt lại mật khẩu thành công!")
      setTimeout(() => {
        setStep(1)
        setEmail("")
        setOtp("")
        setNewPassword("")
      }, 2000)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message)
      } else {
        setMessage("Không thể đặt lại mật khẩu!")
      }
      console.error("Reset password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (step === 1) {
        handleSendEmail()
      } else {
        handleResetPassword()
      }
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="bg-elements">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div> 
        </div>
        <div className="gradient-overlay"></div>
      </div>

      <div className="forgot-password-container">
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
            <p>Khôi phục tài khoản của bạn</p>
            <div className="brand-features">
              <div className="feature-item">
                <Shield size={16} />
                <span>Bảo mật cao</span>
              </div>
              <div className="feature-item">
                <KeyRound size={16} />
                <span>Khôi phục nhanh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-header">
            <h2>{step === 1 ? "Quên mật khẩu?" : "Xác thực OTP"}</h2>
            <p>
              {step === 1
                ? "Nhập email để nhận mã OTP khôi phục mật khẩu"
                : "Nhập mã OTP và mật khẩu mới của bạn"}
            </p>
          </div>

          <div className="form-content">
            {step === 1 && (
              <>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <div className="input-wrapper">
                    {}
                    <Mail className="input-icon" size={25} />
                    <input
                      type="email"
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}x
                      onKeyPress={handleKeyPress}
                      className="form-input"
                      
                    />
                  </div>
                </div>

                <button
                  className={`btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={handleSendEmail}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <Mail size={20} />
                      Gửi mã OTP
                    </>
                  )}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="input-group">
                  <label className="input-label">Mã OTP</label>
                  <div className="input-wrapper">
                    {}
                    <Shield className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Nhập mã OTP từ email"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="form-input"
                      
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Mật khẩu mới</label>
                  <div className="input-wrapper">
                    {}
                    <KeyRound className="input-icon" size={18} />
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="form-input"
                      
                    />
                  </div>
                </div>

                <button
                  className={`btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <KeyRound size={20} />
                      Đặt lại mật khẩu
                    </>
                  )}
                </button>
              </>
            )}

            {message && (
              <div
                className={`message ${
                  message.includes("thành công") ? "success" : "error"
                }`}
              >
                {message}
              </div>
            )}

            {}
            <Link to="/login" className="btn-back">
              <ArrowLeft size={18} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
          
          