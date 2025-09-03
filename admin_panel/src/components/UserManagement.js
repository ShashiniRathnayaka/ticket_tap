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
  // IconButton,
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
} from "@mui/material";
import {
  // Check as CheckIcon,
  Delete as DeleteIcon,
  // PlayArrow as ActivateIcon,
  // Pause as SuspendIcon,
} from "@mui/icons-material";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        "http://localhost:5000/users/getAllUsers"
      );
      console.log("Fetched users:", response.data);
      // Ensure we always set an array, even if response.data is not
      const usersData = Array.isArray(response.data.users)
        ? response.data.users
        : [];
      setUsers(usersData);
      console.log("Users state updated:", usersData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
      console.error("Error fetching users:", err);
      setUsers([]); // Set empty array on error
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

        case "activate":
          await axios.patch(
            `http://localhost:5000/api/users/${selectedUser.id}/status`,
            { status: "ACTIVE" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(
            users.map((user) =>
              user.id === selectedUser.id ? { ...user, status: "ACTIVE" } : user
            )
          );
          message = `Successfully activated ${selectedUser.name}`;
          break;

        case "suspend":
          await axios.patch(
            `http://localhost:5000/api/users/${selectedUser.id}/status`,
            { status: "SUSPENDED" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(
            users.map((user) =>
              user.id === selectedUser.id
                ? { ...user, status: "SUSPENDED" }
                : user
            )
          );
          message = `Successfully suspended ${selectedUser.name}`;
          break;

        case "delete":
          await axios.delete(
            `http://localhost:5000/api/users/${selectedUser.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Safe filtering with array check
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
        minHeight: "100vh", // Changed from height to minHeight
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

        {/* Stats Cards - Now with title and number on same line */}
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

      {/* Users Table - Now with proper scrolling */}
      <Paper
        sx={{
          width: "100%",
          flex: 1,
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 250px)", // Reduced from 300px to 250px
        }}
      >
        <TableContainer
          sx={{
            flex: 1,
            overflow: "auto", // Enable scrolling
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
                  <TableRow key={user.id} hover>
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
                    <TableCell align="center" sx={{ py: 1.5 }}>
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
                              width: 70, // Same width as verify button
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

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        className="confirmation-dialog"
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
              actionType === "activate" &&
              `Are you sure you want to activate ${selectedUser.name}?`}
            {selectedUser &&
              actionType === "suspend" &&
              `Are you sure you want to suspend ${selectedUser.name}?`}
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
