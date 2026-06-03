import { useState } from "react";
import LoginForm from "./Login";
import RegisterForm from "./Register";
import "./Auth.css";

function AuthPage() {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  return (
    <>
      <div className="authentication-main-container">
        <div
          className={
            "authentication-container" +
            " " +
            (isRegistering ? "is-registering" : "")
          }
        >
          <div className="authentication-card">
            <div className="authentication-header">
              <img src={"/src/assets/app_icon.png"} className="app-icon"></img>
              {isRegistering ? (
                <div>
                  <h1 className="authentication-title">Creating account</h1>
                  <p className="authentication-subtitle">
                    We're excited to have you join us!
                  </p>
                </div>
              ) : (
                <h1 className="authentication-title">Welcome back!</h1>
              )}
            </div>
            {isRegistering ? (
              <RegisterForm
                isRegistering={() => setIsRegistering(false)}
              ></RegisterForm>
            ) : (
              <LoginForm
                isRegistering={() => setIsRegistering(true)}
              ></LoginForm>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthPage;
