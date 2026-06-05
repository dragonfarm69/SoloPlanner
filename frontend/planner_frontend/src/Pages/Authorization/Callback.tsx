import "../../App.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CallBackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const finalizeLogin = async () => {
      try {
        //this should lead to home page
        navigate("/");
      } catch (error) {}
    };

    finalizeLogin();
  }, [navigate]);

  return (
    <div className="app-container" style={{ backgroundColor: "white" }}>
      <h1>Finalize login...</h1>
    </div>
  );
}

export default CallBackPage;
