import React, { useState, useEffect } from "react";
import axios from "axios";
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
  CardContent,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        "http://localhost:5000/users/getAllUsers"
      );
      const usersData = Array.isArray(response.data.users)
        ? response.data.users
        : [];
      setUsers(usersData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
      console.error("Error fetching users:", err);
      setUsers([]);
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

  // Handle admin details view - now triggered by clicking the row
  const handleViewDetails = (user) => {
    if (user.role === "ADMIN") {
      setSelectedAdmin(user);
      setDetailsDialogOpen(true);
    }
  };

  // Execute the confirmed action
  const executeAction = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      let message = "";

      switch (actionType) {
        case "verify":
          await axios.put(
            `http://localhost:5000/users/verify-admin/${selectedUser.id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(
            users.map((user) =>
              user.id === selectedUser.id
                ? { ...user, status: "ACTIVE", verified: true }
                : user
            )
          );
          message = `Successfully verified ${selectedUser.name}`;
          break;

        case "delete":
          await axios.delete(
            `http://localhost:5000/api/users/${selectedUser.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (Array.isArray(users)) {
            setUsers(users.filter((user) => user.id !== selectedUser.id));
          } else {
            setUsers([]);
          }
          message = `Successfully deleted ${selectedUser.name}`;
          break;

        default:
          break;
      }

      setSuccess(message);
      setOpenDialog(false);
      setSelectedUser(null);
      setActionType("");
    } catch (err) {
      setError(err.response?.data?.message || `Failed to perform action`);
      console.error("Error performing action:", err);
    }
  };

  // Close dialog without action
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setActionType("");
  };

  // Close details dialog
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedAdmin(null);
  };

  // Helper function to safely filter arrays
  const safeFilter = (array, filterFunction) => {
    if (!Array.isArray(array)) return [];
    return array.filter(filterFunction);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        pb: 4,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            mb: 2,
          }}
        >
          User Management
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  color="textSecondary"
                  variant="body2"
                  sx={{ fontWeight: "medium" }}
                >
                  Total Users:
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "primary.main",
                  }}
                >
                  {Array.isArray(users) ? users.length : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  color="textSecondary"
                  variant="body2"
                  sx={{ fontWeight: "medium" }}
                >
                  Pending Admins:
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "warning.main",
                  }}
                >
                  {
                    safeFilter(
                      users,
                      (user) =>
                        user.role === "ADMIN" && user.status === "PENDING"
                    ).length
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  color="textSecondary"
                  variant="body2"
                  sx={{ fontWeight: "medium" }}
                >
                  Active Users:
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "success.main",
                  }}
                >
                  {safeFilter(users, (user) => user.status === "ACTIVE").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  color="textSecondary"
                  variant="body2"
                  sx={{ fontWeight: "medium" }}
                >
                  Suspended:
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "error.main",
                  }}
                >
                  {
                    safeFilter(users, (user) => user.status === "SUSPENDED")
                      .length
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Users Table */}
      <Paper
        sx={{
          width: "100%",
          flex: 1,
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 250px)",
        }}
      >
        <TableContainer
          sx={{
            flex: 1,
            overflow: "auto",
            maxHeight: "100%",
          }}
        >
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                    fontSize: "0.95rem",
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                    fontSize: "0.95rem",
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                    fontSize: "0.95rem",
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                    fontSize: "0.95rem",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                    fontSize: "0.95rem",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!Array.isArray(users) || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    hover 
                    onClick={() => handleViewDetails(user)}
                    sx={{ 
                      cursor: user.role === "ADMIN" ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: user.role === "ADMIN" ? '#f5f5f5' : 'inherit'
                      }
                    }}
                  >
                    <TableCell sx={{ fontSize: "0.9rem", py: 1.5 }}>
                      {user.name || "N/A"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.9rem", py: 1.5 }}>
                      {user.email || "N/A"}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={user.role || "N/A"}
                        color={
                          user.role === "SUPERADMIN"
                            ? "secondary"
                            : user.role === "ADMIN"
                            ? "primary"
                            : user.role === "DRIVER"
                            ? "success"
                            : "default"
                        }
                        size="small"
                        sx={{ fontWeight: "medium" }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={user.status || "N/A"}
                        color={
                          user.status === "ACTIVE"
                            ? "success"
                            : user.status === "PENDING"
                            ? "warning"
                            : user.status === "SUSPENDED"
                            ? "error"
                            : "default"
                        }
                        size="small"
                        sx={{ fontWeight: "medium" }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }} onClick={(e) => e.stopPropagation()}>
                      <Box
                        display="flex"
                        gap={1}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {/* Show "Verify" button for pending admins only */}
                        {user.role === "ADMIN" && user.status === "PENDING" && (
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleAction(user, "verify")}
                            sx={{
                              color: "white",
                              textTransform: "none",
                              fontWeight: 500,
                              borderRadius: 1,
                              px: 1.5,
                              py: 0.5,
                              minWidth: 0,
                              width: 70,
                              boxShadow: "none",
                              fontSize: "0.75rem",
                              "&:hover": {
                                backgroundColor: "primary.dark",
                                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                              },
                            }}
                          >
                            Verify
                          </Button>
                        )}
                        
                        {/* Delete button for all users except SUPER_ADMIN */}
                        {user.role !== "SUPERADMIN" && (
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={() => handleAction(user, "delete")}
                            sx={{
                              color: "white",
                              textTransform: "none",
                              fontWeight: 500,
                              borderRadius: 1,
                              px: 1,
                              py: 0.5,
                              minWidth: 0,
                              width: 70,
                              boxShadow: "none",
                              fontSize: "0.75rem",
                              "&:hover": {
                                backgroundColor: "error.dark",
                                boxShadow: "0 2px 8px rgba(211, 47, 47, 0.3)",
                              },
                            }}
                            startIcon={<DeleteIcon sx={{ fontSize: "14px" }} />}
                          >
                            Delete
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            bgcolor: "primary.main",
            color: "white",
            padding: "20px 24px 16px 24px",
          }}
        >
          Confirm Action
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <DialogContentText sx={{ color: "black" }}>
            {selectedUser &&
              actionType === "verify" &&
              `Are you sure you want to verify ${selectedUser.name} as an admin?`}
            {selectedUser &&
              actionType === "delete" &&
              `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              color: "white",
              borderColor: "white",
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeAction}
            color={actionType === "delete" ? "error" : "primary"}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle
          sx={{
            position: 'relative',
            backgroundColor: '#f8f9fa',
            padding: '20px 24px',
            borderBottom: '1px solid #e9ecef'
          }}
        >
          <Typography variant="h5" component="h2" sx={{ 
            fontWeight: '600', 
            color: 'primary.main',
            fontSize: '1.5rem'
          }}>
            Admin Details
          </Typography>
          
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailsDialog}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3, px: 3 }}>
          {selectedAdmin && (
            <Box>
              {/* Basic Information Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: 'primary.main',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Full Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>
                        {selectedAdmin.name || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Email Address
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.email || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        NIC Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.nic || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Mobile Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.mobile_number || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Account Status Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: 'primary.main',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  Account Status
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Role
                      </Typography>
                      <Chip
                        label={selectedAdmin.role || "N/A"}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: "medium" }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Status
                      </Typography>
                      <Chip
                        label={selectedAdmin.status || "N/A"}
                        color={
                          selectedAdmin.status === "ACTIVE"
                            ? "success"
                            : selectedAdmin.status === "PENDING"
                            ? "warning"
                            : selectedAdmin.status === "SUSPENDED"
                            ? "error"
                            : "default"
                        }
                        size="small"
                        sx={{ fontWeight: "medium" }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Organization Information Section */}
              <Box>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: 'primary.main',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  Organization Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Company Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.company_name || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Business Registration
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.business_reg_number || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Depot Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.depot_name || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        mb: 0.5
                      }}>
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {selectedAdmin.location || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid #e9ecef',
          backgroundColor: '#f8f9fa'
        }}>
          <Button
            onClick={handleCloseDetailsDialog}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: '500',
              px: 3
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={() => setError("")} variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          variant="filled"
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;