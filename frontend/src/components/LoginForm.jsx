import React, { useState } from 'react';
import axios from 'axios';
import api from '../api';
import './LoginForm.css';

export default function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.username.trim()) {
      errs.username = 'Username is required';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (!formData.firstName.trim()) errs.firstName = 'First name is required';
      if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        errs.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errs.email = 'Invalid email format';
      }
    }

    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors(e => ({ ...e, [name]: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isLogin) {
        // Login with existing API instance
        const res = await api.post('token-auth/', {
          username: formData.username,
          password: formData.password
        });
        const token = res.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('username', formData.username);
        api.defaults.headers.common['Authorization'] = `Token ${token}`;
      } else {
        // Create clean axios instance for registration
        const regApi = axios.create({
          baseURL: 'http://localhost:8000/api/',
          headers: {'Content-Type': 'application/json'}
        });

        // Registration request
        const res = await regApi.post('register/', {
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password
        });

        // Handle successful registration
        const token = res.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('username', formData.username);
        api.defaults.headers.common['Authorization'] = `Token ${token}`;
      }
      onAuthSuccess();
    } catch (err) {
      const errorData = err.response?.data || {};
      const errorMessage = errorData.error || Object.values(errorData)[0]?.[0] || 'Authentication failed';
      setErrors({ form: errorMessage });
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(l => !l);
    setErrors({});
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
      {errors.form && <div className="error">{errors.form}</div>}

      <div className="form-group">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        {errors.username && <span className="error">{errors.username}</span>}
      </div>

      {!isLogin && (
        <>
          <div className="form-group">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
            />
            {errors.firstName && <span className="error">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
            />
            {errors.lastName && <span className="error">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
        </>
      )}

      <div className="form-group">
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <button type="submit">{isLogin ? 'Login' : 'Register'}</button>

      <p className="auth-link">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={toggleAuthMode} className="auth-toggle">
          {isLogin ? 'Register here' : 'Login here'}
        </button>
      </p>
    </form>
  );
}