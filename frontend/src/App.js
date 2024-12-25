import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

const theme = createTheme();

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [showRegister, setShowRegister] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
        toast.success('登录成功！');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        toast.info('已退出登录');
    };

    const handleSwitchToRegister = () => {
        setShowRegister(true);
    };

    const handleSwitchToLogin = () => {
        setShowRegister(false);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {isLoggedIn ? (
                <Dashboard onLogout={handleLogout} />
            ) : (
                showRegister ? (
                    <Register onSwitchToLogin={handleSwitchToLogin} />
                ) : (
                    <Login onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
                )
            )}
            <ToastContainer position="top-right" autoClose={3000} />
        </ThemeProvider>
    );
}

export default App; 