import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Box,
    Link,
    Alert,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const JobTable = () => {
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/jobs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(response.data);
        } catch (error) {
            setError(error.response?.data?.detail || '获取工作信息失败');
            console.error('获取工作信息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (value) => {
        setSearchTerm(value);
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const url = value 
                ? `http://localhost:5000/api/jobs/search?keyword=${value}`
                : 'http://localhost:5000/api/jobs';
            
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(response.data);
        } catch (error) {
            setError(error.response?.data?.detail || '搜索失败');
            console.error('搜索失败:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            <TextField
                fullWidth
                label="搜索工作或大学"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                sx={{ mb: 2 }}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>职位名称</TableCell>
                            <TableCell>大学名称</TableCell>
                            <TableCell>链接</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job, index) => (
                            <TableRow key={index}>
                                <TableCell>{job.job_title}</TableCell>
                                <TableCell>{job.uni_name}</TableCell>
                                <TableCell>
                                    <Link href={job.link} target="_blank" rel="noopener">
                                        查看详情
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default JobTable; 