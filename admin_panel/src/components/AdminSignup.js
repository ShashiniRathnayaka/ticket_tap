// import React, { useState } from "react";
// import axios from "axios";
// import { Link } from 'react-router-dom';
// import './AuthForms.css';

// function AdminSignup() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "ADMIN"
//   });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState('');

//   // const history = useHistory();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     if (error) setError('');
//     if (success) setSuccess('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       const res = await axios.post("http://localhost:5000/auth/signup", formData);
//       setSuccess(res.data.message || "Signup successful! Wait for approval.");

//       setFormData({
//         name: "",
//         email: "",
//         password: "",
//         role: "ADMIN"
//       });

//     } catch (err) {
//       setError(err.response?.data?.message || "Signup failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const redirectToLogin = () => {
//   //   history.push('/login');
//   // };

//   return (
//     <div className="auth-container">
//       <form className="auth-form" onSubmit={handleSubmit}>
//         <h2>Admin Signup</h2>

//         {error && <div className="error-message">{error}</div>}
//         {success && <div className="success-message">{success}</div>}

//         <div className="form-group">
//           <label>Name</label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             required
//             placeholder="Enter your full name"
//           />
//         </div>

//         <div className="form-group">
//           <label>Email</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//             placeholder="Enter your email"
//           />
//         </div>

//         <div className="form-group">
//           <label>Password</label>
//           <input
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//             placeholder="Create a password"
//           />
//         </div>

//         <input type="hidden" name="role" value="ADMIN" />

//         <button type="submit" disabled={loading}>
//           {loading ? 'Signing up...' : 'Sign Up'}
//         </button>

//         <p className="auth-link">
//           Already have an account? <Link to="/login">Login here</Link>
//         </p>
//       </form>
//     </div>
//   );
// }

// export default AdminSignup;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./AuthForms.css";

function AdminSignup() {
  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nic: "",
    mobileNumber: "",

    // Organization Information
    userType: "private", // 'private' or 'government'
    companyName: "",
    businessRegNumber: "",
    depotName: "",
    location: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    if (error) setError("");
    if (success) setSuccess("");
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.nic.trim()) newErrors.nic = "NIC is required";
    if (!formData.mobileNumber.trim())
      newErrors.mobileNumber = "Mobile number is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Conditional validation based on user type
    if (formData.userType === "private") {
      if (!formData.companyName.trim())
        newErrors.companyName = "Company name is required";
    } else {
      if (!formData.depotName.trim())
        newErrors.depotName = "Depot name is required";
      if (!formData.location.trim())
        newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare the data to send
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        nic: formData.nic,
        mobileNumber: formData.mobileNumber,
        userType: formData.userType,
        companyName: formData.companyName,
        businessRegNumber: formData.businessRegNumber,
        depotName: formData.depotName,
        location: formData.location,
      };

      const res = await axios.post(
        "http://localhost:5000/auth/admin-signup",
        payload
      );
      setSuccess(
        res.data.message ||
          "Admin registration successful! Waiting for approval."
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        nic: "",
        mobileNumber: "",
        userType: "private",
        companyName: "",
        businessRegNumber: "",
        depotName: "",
        location: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const messageRef = useRef(null);

  // Scroll to messages when they appear
  useEffect(() => {
    if (error || success) {
      messageRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [error, success]);

  return (
    <div className="auth-container">
      <form className="auth-form admin-signup-form" onSubmit={handleSubmit}>
        <h2>Admin Registration</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-section">
          <h3>Personal Information</h3>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              className={errors.name ? "error" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>NIC Number *</label>
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              required
              placeholder="Enter your NIC number"
              className={errors.nic ? "error" : ""}
            />
            {errors.nic && <span className="field-error">{errors.nic}</span>}
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              required
              placeholder="Enter your mobile number"
              className={errors.mobileNumber ? "error" : ""}
            />
            {errors.mobileNumber && (
              <span className="field-error">{errors.mobileNumber}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                className={errors.password ? "error" : ""}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className={errors.confirmPassword ? "error" : ""}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Organization Information</h3>

          <div className="form-group">
            <label>I am registering as: *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="private"
                  checked={formData.userType === "private"}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                <span>Private Agency Admin</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="government"
                  checked={formData.userType === "government"}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                <span>Government Depot Admin</span>
              </label>
            </div>
          </div>

          {formData.userType === "private" ? (
            <>
              <div className="form-group">
                <label>Company/Association Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required={formData.userType === "private"}
                  placeholder="Enter company/association name"
                  className={errors.companyName ? "error" : ""}
                />
                {errors.companyName && (
                  <span className="field-error">{errors.companyName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Business Registration Number</label>
                <input
                  type="text"
                  name="businessRegNumber"
                  value={formData.businessRegNumber}
                  onChange={handleChange}
                  placeholder="Enter business registration number (optional)"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Depot Name *</label>
                <input
                  type="text"
                  name="depotName"
                  value={formData.depotName}
                  onChange={handleChange}
                  required={formData.userType === "government"}
                  placeholder="Enter depot name"
                  className={errors.depotName ? "error" : ""}
                />
                {errors.depotName && (
                  <span className="field-error">{errors.depotName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Location (District/Province) *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required={formData.userType === "government"}
                  placeholder="Enter location (district/province)"
                  className={errors.location ? "error" : ""}
                />
                {errors.location && (
                  <span className="field-error">{errors.location}</span>
                )}
              </div>
            </>
          )}
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Processing..." : "Register as Admin"}
        </button>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default AdminSignup;
