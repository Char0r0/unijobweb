import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton
} from '@mui/material';
import {
    Menu as MenuIcon,
    Work as WorkIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import JobTable from './JobTable';
import UserManagement from './UserManagement';

const Dashboard = ({ onLogout }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentView, setCurrentView] = useState('jobs');
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        onLogout();
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        澳大利亚大学招聘系统
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        退出登录
                    </Button>
                </Toolbar>
            </AppBar>

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <List>
                    <ListItem button onClick={() => {
                        setCurrentView('jobs');
                        setDrawerOpen(false);
                    }}>
                        <ListItemIcon><WorkIcon /></ListItemIcon>
                        <ListItemText primary="工作岗位" />
                    </ListItem>
                    
                    {userRole === 'super_admin' && (
                        <ListItem button onClick={() => {
                            setCurrentView('users');
                            setDrawerOpen(false);
                        }}>
                            <ListItemIcon><PeopleIcon /></ListItemIcon>
                            <ListItemText primary="用户管理" />
                        </ListItem>
                    )}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
                {currentView === 'jobs' && <JobTable />}
                {currentView === 'users' && userRole === 'super_admin' && <UserManagement />}
            </Box>
        </Box>
    );
};

export default Dashboard; 