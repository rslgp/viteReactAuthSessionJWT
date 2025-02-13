import React, { useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function AuthContainer({ user, setUser }) {
  // community LTS
    const loginWithToken = async (loginResponse) => {

        const res = await axios.post('/auth/google/token', { token: loginResponse.credential }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json', // Ensure the correct content type
            },
        });
        setUser(res.data.user);
    }

    const handleLogout = async () => {
        try {
            await axios.post('/auth/logout', {}, { withCredentials: true });
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const checkSession = async () => {
        try {
            const response = await axios.get('/auth/user', { withCredentials: true });
            setUser(response.data);
        } catch (error) {
            setUser(null);
        }
    };

    useEffect(() => {
        checkSession();
    }, [setUser]);

    return (
        <div>
            {user ? (
                <div>
                    <p>Welcome, {user.name}!</p>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENTID}>
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            console.log('Login Success:', credentialResponse);

                            await loginWithToken(credentialResponse);
                        }}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                    />
                </GoogleOAuthProvider>
            )}
        </div>
    );
}

export default AuthContainer;
