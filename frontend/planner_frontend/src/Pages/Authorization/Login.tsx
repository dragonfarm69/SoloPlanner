import "./Auth.css";
function LoginForm({ isRegistering }: { isRegistering: () => void }) {
  const handleOnClick = async () => {
    const params = new URLSearchParams({
      client_id: "authentication-cli",
      response_type: "code",
      scope: "openid profile email",
      redirect_uri: "http://localhost:8081/auth/login",
    });

    window.location.href =
      "http://localhost:8080/realms/planner/protocol/openid-connect/auth?" +
      params.toString();
  };

  return (
    <>
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
