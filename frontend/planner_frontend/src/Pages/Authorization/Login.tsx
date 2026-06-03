import { useState } from "react";
import "./Auth.css";

function LoginForm({ isRegistering }: { isRegistering: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleOnClick = async () => {};

  return (
    <>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button className="login-button" type="button" onClick={handleOnClick}>
        <span>Login</span>
      </button>
      <div className="login-footer">
        <p>
          Need an account?
          <a
            className="register-link"
            onClick={() => {
              isRegistering();
            }}
          >
            Register
          </a>
        </p>
      </div>
    </>
  );
}

export default LoginForm;
