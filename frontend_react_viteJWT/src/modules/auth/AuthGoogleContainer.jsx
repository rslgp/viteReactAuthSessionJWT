import React, { useEffect } from 'react';

const AuthGoogleContainer = ({ user, setUser }) => {

    // on App.jsx
    // const [user, setUser] = useState(() => {
    //     // Initialize user state from localStorage (if available)
    //     const storedUser = localStorage.getItem('user');
    //     return storedUser ? JSON.parse(storedUser) : null;
    // });

  const handleCredentialResponse = (response) => {
    console.log('Google Sign-In response:', response);
    const userInfo = JSON.parse(atob(response.credential.split('.')[1]));
    console.log('User Info:', userInfo);

    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
    
  };

  useEffect(() => {
    const loadGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENTID || 'GOOGLE_CLIENT_ID',
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            type: 'standard',
            shape: 'rectangular',
            theme: 'outline',
            text: 'signin_with',
            size: 'large',
            logo_alignment: 'left',
          }
        );

        window.google.accounts.id.prompt();
      }
    };

    if (window.google) {
      loadGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = loadGoogleSignIn;
      document.body.appendChild(script);
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
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

export default AuthGoogleContainer;
