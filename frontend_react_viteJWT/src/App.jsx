import { useState } from "react";

function App() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [message, setMessage] = useState("");

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
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
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
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) throw new Error("Login failed");
      const data = await response.json();
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
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
        headers: {
          Authorization: accessToken,
        },
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error("Failed to refresh token");
      const data = await response.json();
      setAccessToken(data.accessToken);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error("Logout failed");
      const data = await response.json();
      setAccessToken("");  // Clear access token
      setRefreshToken("");  // Clear refresh token
      setMessage(data.message);
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
      <h1>JWT Authentication with Refresh Tokens</h1>
      <div>
        <input
          type="text"
          name="username"  // Set the name attribute to identify the field
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}  // Single handler for both fields
          onKeyDown={handleKeyDown}  // Added event listener for Enter key
        />
        <input
          type="password"
          name="password"  // Set the name attribute to identify the field
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}  // Single handler for both fields
          onKeyDown={handleKeyDown}  // Added event listener for Enter key
        />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </div>
      {accessToken && (
        <div>
          <button onClick={handleProtectedRoute}>Access Protected Route</button>
          <button onClick={handleRefreshToken}>Refresh Access Token</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
      <p>{message}</p>
    </div>
  );
}

export default App;
