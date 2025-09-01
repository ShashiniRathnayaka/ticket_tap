import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Check as CheckIcon,
  // Block as BlockIcon,
  Delete as DeleteIcon,
  PlayArrow as ActivateIcon,
  Pause as SuspendIcon,
  // Close as CloseIcon
} from '@mui/icons-material';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle action confirmation
  const handleAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setOpenDialog(true);
  };

  // Execute the confirmed action
  const executeAction = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      let message = '';

      switch (actionType) {
        case 'verify':
          await axios.patch(
            `http://localhost:5000/api/users/${selectedUser.id}/verify`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(users.map(user => 
            user.id === selectedUser.id ? { ...user, status: 'ACTIVE', verified: true } : user
          ));
          message = `Successfully verified ${selectedUser.name}`;
          break;

        case 'activate':
          await axios.patch(
            `http://localhost:5000/api/users/${selectedUser.id}/status`,
            { status: 'ACTIVE' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(users.map(user => 
            user.id === selectedUser.id ? { ...user, status: 'ACTIVE' } : user
          ));
          message = `Successfully activated ${selectedUser.name}`;
          break;

        case 'suspend':
          await axios.patch(
            `http://localhost:5000/api/users/${selectedUser.id}/status`,
            { status: 'SUSPENDED' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(users.map(user => 
            user.id === selectedUser.id ? { ...user, status: 'SUSPENDED' } : user
          ));
          message = `Successfully suspended ${selectedUser.name}`;
          break;

        case 'delete':
          await axios.delete(
            `http://localhost:5000/api/users/${selectedUser.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(users.filter(user => user.id !== selectedUser.id));
          message = `Successfully deleted ${selectedUser.name}`;
          break;

        default:
          break;
      }

      setSuccess(message);
      setOpenDialog(false);
      setSelectedUser(null);
      setActionType('');

    } catch (err) {
      setError(err.response?.data?.message || `Failed to perform action`);
      console.error('Error performing action:', err);
    }
  };

  // Close dialog without action
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setActionType('');
  };

  // Get chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
      case 'INACTIVE': return 'default';
      default: return 'default';
    }
  };

  // Get chip color based on role
  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'secondary';
      case 'ADMIN': return 'primary';
      case 'DRIVER': return 'success';
      case 'USER': return 'default';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
          color="primary"
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" component="div">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Admins
              </Typography>
              <Typography variant="h4" component="div">
                {users.filter(user => user.role === 'ADMIN' && !user.verified).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" component="div">
                {users.filter(user => user.status === 'ACTIVE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.verified ? 'Yes' : 'No'}
                      color={user.verified ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      {user.role === 'ADMIN' && !user.verified && (
                        <IconButton
                          color="success"
                          onClick={() => handleAction(user, 'verify')}
                          title="Verify Admin"
                          size="small"
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                      
                      {user.role !== 'SUPER_ADMIN' && (
                        <>
                          {user.status === 'ACTIVE' ? (
                            <IconButton
                              color="warning"
                              onClick={() => handleAction(user, 'suspend')}
                              title="Suspend User"
                              size="small"
                            >
                              <SuspendIcon />
                            </IconButton>
                          ) : (
                            <IconButton
                              color="success"
                              onClick={() => handleAction(user, 'activate')}
                              title="Activate User"
                              size="small"
                            >
                              <ActivateIcon />
                            </IconButton>
                          )}
                          
                          <IconButton
                            color="error"
                            onClick={() => handleAction(user, 'delete')}
                            title="Delete User"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser && actionType === 'verify' && 
              `Are you sure you want to verify ${selectedUser.name} as an admin?`}
            {selectedUser && actionType === 'activate' && 
              `Are you sure you want to activate ${selectedUser.name}?`}
            {selectedUser && actionType === 'suspend' && 
              `Are you sure you want to suspend ${selectedUser.name}?`}
            {selectedUser && actionType === 'delete' && 
              `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={executeAction} 
            color={actionType === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for messages */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;