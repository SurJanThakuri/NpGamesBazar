import React, { useEffect, useState } from 'react';

const Auth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is already authenticated
    fetch('auth/check-session', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        if (data.isAuthenticated) {
          setIsAuthenticated(true);
        }
      });
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {isAuthenticated ? (
        <div>
          <h1>You are logged in!</h1>
          <p>Welcome to the application.</p>
        </div>
      ) : (
        <div>
          <h1>Login with Google</h1>
          <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Login with Google
          </button>
        </div>
      )}
    </div>
  );
};

export default Auth;
