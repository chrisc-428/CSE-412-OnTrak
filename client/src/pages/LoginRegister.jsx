import '../App.css';
import Home from "./Home";

import {useState, useEffect} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

export default function LoginRegister() {
    const navigate = useNavigate();

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [authToken, setAuthToken] = useState(null);

    //Register handler
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/register', { registerEmail, registerUsername, registerPassword });
            
            alert('Registration successful!');
            setRegisterEmail('');
            setRegisterUsername('');
            setRegisterPassword('');
            
            console.log(response.data);
        } catch (err) {
            console.error(err);
            alert('Registration failed');
        }
    };

    //Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', { loginEmail, loginPassword });
            setAuthToken(response.data.token);  //Set JWT token to be auth token
            console.log(response.data);
            
            //Pass user info into localstorage for other pages to use
            localStorage.setItem("username", response.data.username);
            localStorage.setItem("email", response.data.email);
            localStorage.setItem("userid", response.data.userid)
            localStorage.setItem("token", response.data.token);

            navigate("/home");
        } catch (err) {
            console.error(err);
            alert('Login failed');
        }
    };  

    return (
        <div className="auth-container">
            <header className="auth-header">
                <h1>OnTrak</h1>
            </header>
            
            <div className="auth-content">
                <h2>Login or Register</h2>
                
                <div className="form-group-wrapper">
                    
                    {/* --- Register Form --- */}
                    <section className="auth-form-section register-section">
                        <h3>Create Account</h3>
                        <form className="auth-form" onSubmit={handleRegister}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="register-btn">Register</button>
                        </form>
                    </section>

                    {/* --- Login Form --- */}
                    <section className="auth-form-section login-section">
                        <h3>Sign In</h3>
                        <form className="auth-form" onSubmit={handleLogin}>
                            <input
                                type="text"
                                placeholder="Email/Username"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="login-btn">Login</button>
                        </form>
                    </section>
                </div>
            </div>
            <footer className="auth-footer">
                <p>CSE 412: Database Management - Ripken Chong, Chris Chou</p>
            </footer>
        </div>
    );
}