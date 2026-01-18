import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Supabase redirects with hash parameters, not query parameters
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1)); // Remove the '#'
      
      // Check for error in hash params (Supabase error redirect)
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      const errorCode = params.get('error_code');
      
      // Check for success params
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      console.log('Hash params:', { error, errorCode, errorDescription, accessToken: !!accessToken });

      // Handle error cases
      if (error) {
        if (errorCode === 'otp_expired' || errorDescription?.includes('expired') || errorDescription?.includes('invalid')) {
          setStatus('error');
          setMessage('This verification link has expired or has already been used. Please try logging in - your email may already be verified.');
          return;
        }
        
        setStatus('error');
        setMessage(errorDescription || 'Verification failed. Please try again.');
        return;
      }

      // Handle success case - Supabase provides tokens after successful verification
      if (accessToken && refreshToken) {
        // Store the tokens
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to your profile...');
        
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
        return;
      }

      // If we get here, check old query params format (for backward compatibility)
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      if (!token_hash && !accessToken) {
        setStatus('error');
        setMessage('Invalid verification link. Please click the link from your email.');
        return;
      }

      // Only call backend if we have token_hash (old format)
      if (token_hash && type === 'email') {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-email?token_hash=${token_hash}&type=${type}`
          );
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          
        } catch (error) {
          console.error('Verification error:', error);
          setStatus('error');
          setMessage(error.message || 'Verification failed. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center">
      <div className="card shadow-lg p-5 text-center" style={{ maxWidth: '500px', width: '100%' }}>
        
        {status === 'verifying' && (
          <>
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
            <h3 className="mb-2">Verifying Email...</h3>
            <p className="text-muted">Please wait while we verify your email.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-success mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
              </svg>
            </div>
            <h3 className="text-success mb-3">Success!</h3>
            <p className="mb-4">{message}</p>
            
            {message.includes('Redirecting') && (
              <div className="progress mb-3" style={{height: '4px'}}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{width: '100%'}}></div>
              </div>
            )}
            
            <button 
              className="btn btn-success" 
              onClick={() => navigate('/profile')}
            >
              Go to Profile
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-danger mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </div>
            <h3 className="text-danger mb-3">Verification Issue</h3>
            <p className="mb-4">{message}</p>
            
            <div className="d-grid gap-2">
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
              <p className="text-muted small mt-2">
                If your email is already verified, you can log in normally.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;