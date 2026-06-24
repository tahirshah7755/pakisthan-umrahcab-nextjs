"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function DriverLoginPage() {
  const { driverLogin, driverUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (driverUser) {
      router.push("/driver/dashboard");
    }
  }, [driverUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await driverLogin(username, password);
      if (res.success) {
        router.push("/driver/dashboard");
      } else {
        setError(res.error || "Invalid username or password.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-login-page">
      <style>{`
        .driver-login-page {
          min-height: 100vh;
          background-color: var(--secondary-color, #1e1e2d);
          background: linear-gradient(135deg, var(--secondary-color, #1e1e2d) 0%, #0c0c14 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: 0 16px;
          font-family: var(--font-family-sans), sans-serif;
        }
        
        .glow-orb-1 {
          position: absolute;
          top: 25%;
          left: 25%;
          width: 384px;
          height: 384px;
          background-color: rgba(180, 138, 29, 0.05);
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        
        .glow-orb-2 {
          position: absolute;
          bottom: 25%;
          right: 25%;
          width: 384px;
          height: 384px;
          background-color: rgba(212, 175, 55, 0.05);
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        
        .login-wrapper {
          width: 100%;
          max-width: 448px;
          z-index: 10;
        }
        
        .brand-header {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .logo-box {
          width: 64px;
          height: 64px;
          background: var(--gradient, linear-gradient(135deg, #b48a1d 0%, #1e1e2d 100%));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(180, 138, 29, 0.3);
          margin-bottom: 16px;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .logo-box i {
          font-size: 24px;
          color: #ffffff;
        }
        
        .brand-title {
          font-size: 30px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin: 0;
        }
        
        .brand-title span {
          background: linear-gradient(to right, var(--accent-color, #d4af37), var(--primary-color, #b48a1d));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .brand-subtitle {
          color: var(--text-muted, #8898aa);
          margin-top: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .login-card {
          background-color: rgba(30, 30, 45, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .error-banner {
          margin-bottom: 24px;
          padding: 16px;
          background-color: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: #f87171;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted, #8898aa);
          font-size: 14px;
          pointer-events: none;
        }
        
        .form-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background-color: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }
        
        .form-input::placeholder {
          color: var(--text-muted, #8898aa);
        }
        
        .form-input:focus {
          border-color: var(--primary-color, #b48a1d);
          box-shadow: 0 0 0 1px var(--primary-color, #b48a1d);
        }
        
        .submit-btn {
          width: 100%;
          padding: 16px;
          background: var(--gradient, linear-gradient(135deg, #b48a1d 0%, #1e1e2d 100%));
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(180, 138, 29, 0.15);
        }
        
        .submit-btn:hover {
          opacity: 0.9;
          box-shadow: 0 6px 16px rgba(180, 138, 29, 0.25);
          transform: translateY(-1px);
        }
        
        .submit-btn:active {
          transform: translateY(0);
        }
        
        .submit-btn:disabled {
          background: var(--secondary-color, #1e1e2d);
          color: var(--text-muted, #8898aa);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Decorative Blur Spheres */}
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      <div className="login-wrapper">
        {/* Brand/Logo Header */}
        <div className="brand-header">
          <div className="logo-box">
            <i className="fas fa-steering-wheel" style={{ display: "none" }}></i>
            <i className="fas fa-taxi"></i>
          </div>
          <h1 className="brand-title">
            Umrah<span>Cab</span>
          </h1>
          <p className="brand-subtitle">Driver Portal Administration</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <h2 className="card-title">Driver Sign In</h2>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your driver username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
