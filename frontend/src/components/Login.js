import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Container,
    Link,
    Alert,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const Login = ({ onLogin, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const formDataObj = new FormData();
            formDataObj.append('username', formData.username);
            formDataObj.append('password', formData.password);

            const response = await axios.post('http://localhost:5000/api/login', formDataObj);
            
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('userRole', response.data.role);
            
            onLogin(response.data);
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.detail || '登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    登录
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="用户名"
                        autoFocus
                        disabled={loading}
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="密码"
                        type="password"
                        disabled={loading}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, position: 'relative' }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ position: 'absolute' }} /> : '登录'}
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link 
                            component="button" 
                            variant="body2" 
                            onClick={onSwitchToRegister}
                            disabled={loading}
                        >
                            没有账号？点击注册
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default Login; 