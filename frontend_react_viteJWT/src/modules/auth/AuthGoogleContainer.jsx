import React, { useEffect } from 'react';
import axios from 'axios';

const AuthContainer = ({ user, setUser }) => {

    // on App.jsx
    // const [user, setUser] = useState(() => {
    //     // Initialize user state from localStorage (if available)
    //     const storedUser = localStorage.getItem('user');
    //     return storedUser ? JSON.parse(storedUser) : null;
    // });
    
  const handleCredentialResponse = async (response) => {
    try {
      const res = await axios.post('/auth/google/token', { token: response.credential }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json', // Ensure the correct content type
        },
      });
      setUser(res.data.user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const loadGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENTID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { type: 'standard', shape: 'rectangular', theme: 'outline', size: 'large' }
      );

      // window.google.accounts.id.prompt();
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('/auth/user', { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        setUser(null);
        loadGoogleSignIn();
      }
    };
    checkSession();
  }, [setUser]);


  useEffect(() => {

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = loadGoogleSignIn;
      document.body.appendChild(script);
    } else {
      loadGoogleSignIn();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div id="google-signin-button"></div>
      )}
    </div>
  );
};

export default AuthContainer;
