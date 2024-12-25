import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Container,
    Link,
    Alert
} from '@mui/material';
import axios from 'axios';
import { validateRegistration } from '../utils/validation';

const Register = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const { isValid, errors } = validateRegistration(formData);
        if (!isValid) {
            setErrors(errors);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/register', {
                username: formData.username,
                password: formData.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.message === "注册成功") {
                onSwitchToLogin();
            }
        } catch (error) {
            setError(error.response?.data?.detail || '注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    注册
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {errors.submit && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errors.submit}
                        </Alert>
                    )}
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="用户名"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        error={!!errors.username}
                        helperText={errors.username}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="密码"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        error={!!errors.password}
                        helperText={errors.password}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="确认密码"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? '注册中...' : '注册'}
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component="button" variant="body2" onClick={onSwitchToLogin}>
                            已有账号？点击登录
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default Register; 