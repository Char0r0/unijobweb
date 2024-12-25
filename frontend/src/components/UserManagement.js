import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box
} from '@mui/material';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [open, setOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchUniversities();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('获取用户失败:', error);
        }
    };

    const fetchUniversities = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/universities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUniversities(response.data);
        } catch (error) {
            console.error('获取大学列表失败:', error);
        }
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/users/${editUser.id}`, editUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('更新用户失败:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>用户名</TableCell>
                            <TableCell>角色</TableCell>
                            <TableCell>所属大学</TableCell>
                            <TableCell>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    {universities.find(u => u.id === user.university_id)?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    <Button onClick={() => handleEdit(user)}>编辑</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>编辑用户</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>角色</InputLabel>
                        <Select
                            value={editUser?.role || ''}
                            onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                        >
                            <MenuItem value="super_admin">超级管理员</MenuItem>
                            <MenuItem value="vip">VIP会员</MenuItem>
                            <MenuItem value="regular">普通会员</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>所属大学</InputLabel>
                        <Select
                            value={editUser?.university_id || ''}
                            onChange={(e) => setEditUser({...editUser, university_id: e.target.value})}
                        >
                            {universities.map(uni => (
                                <MenuItem key={uni.id} value={uni.id}>{uni.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleSave}>保存</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement; 