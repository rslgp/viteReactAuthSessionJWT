import { useState, useEffect } from "react";

// const readJWT = (token) => {

//   // Split the token into its three parts
//   const [header, payload, signature] = token.split('.');

//   // Decode the Base64-encoded payload
//   const decodedPayload = JSON.parse(atob(payload));
//   console.log(decodedPayload);
// }

function App() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLogged, setUserLogged] = useState("");
  const [message, setMessage] = useState("");

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("http://localhost:3001/protected", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        setIsAuthenticated(true);
        const data = await response.json();
        console.log(data);
        setUserLogged(data.user.username);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage("Register successful!");
    } catch (error) {
      console.log(error);
      setMessage(`Register failed. ${error}.`);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) throw new Error("Login failed");
      setIsAuthenticated(true);
      setUserLogged(formData.username);
      setMessage("Login successful!");
    } catch (error) {
      console.log(error);
      setMessage("Login failed. Invalid credentials.");
    }
  };

  const handleProtectedRoute = async () => {
    try {
      const response = await fetch("http://localhost:3001/protected", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (!response.ok) throw new Error("Access denied");
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.log(error);
      setMessage("Access denied. Invalid or missing token.");
    }
  };

  const handleRefreshToken = async () => {
    try {
      const response = await fetch("http://localhost:3001/refresh", {
        method: "POST",
        credentials: "include", // Include cookies
      });

      if (!response.ok) throw new Error("Failed to refresh token");
      setMessage("Access token refreshed!");
    } catch (error) {
      console.log(error);
      setMessage("Failed to refresh access token.");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3001/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });

      if (!response.ok) throw new Error("Logout failed");
      setIsAuthenticated(false);
      setMessage("Logout successful!");
    } catch (error) {
      console.log(error);
      setMessage("Logout failed.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div>
      <h1>JWT Authentication with Cookies</h1>
      <div>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </div>
      {isAuthenticated && (
        <div>
          <button onClick={handleProtectedRoute}>Access Protected Route</button>
          <button onClick={handleRefreshToken}>Refresh Access Token</button>
          <button onClick={handleLogout}>Logout</button>
          <p>User logged: {userLogged}</p>
        </div>
      )}
      <p>{message}</p>
    </div>
  );
}

export default App;