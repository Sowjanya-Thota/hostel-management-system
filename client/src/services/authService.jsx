import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";

// Create auth context
const AuthContext = createContext(null);

// Create a dedicated API instance for auth
const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add this function to get the token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Configure axios interceptors to add token to requests
API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthService = {
  login: async (credentials) => {
    try {
      console.log("Login credentials:", JSON.stringify(credentials));
      
      // Ensure role is included in credentials
      const loginData = {
        email: credentials.email,
        password: credentials.password,
        role: credentials.role || 'student' // Default to student if role is not provided
      };
      
      // Make a direct axios call to ensure proper formatting
      const response = await axios({
        method: 'post',
        url: 'http://localhost:8000/api/auth/login',
        data: loginData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Login response:", response.data);
      
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        
        // Ensure user object has the role property
        const userData = {
          ...response.data.user,
          role: response.data.user.role || loginData.role
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
      }
      return response.data;
    } catch (error) {
      console.error("Login error details:", error);
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        
        // Add more detailed error information
        if (error.response.data && typeof error.response.data === 'object') {
          console.error("Server error message:", error.response.data.message || "No specific error message");
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", error.message);
      }
      
      throw error.response?.data || { message: "Login failed. Please check your credentials and try again." };
    }
  },

  register: async (userData) => {
    try {
      const response = await API.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      throw error.response?.data || { message: "Registration failed" };
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  
  // Add method to check if token is valid
  // Update the checkAuthStatus method to use /auth/me instead of /auth/verify
  checkAuthStatus: async () => {
    try {
      const token = getToken();
      if (!token) return false;
      
      // Use /auth/me endpoint instead of /auth/verify since it doesn't exist
      const response = await API.get("/auth/me");
      return !!response.data; // If we get a response, the token is valid
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  }
};

// Add AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const storedUser = AuthService.getCurrentUser();
    setUser(storedUser);
    setLoading(false);
    
    // Verify token validity
    const verifyAuth = async () => {
      const isValid = await AuthService.checkAuthStatus();
      if (!isValid && storedUser) {
        // Token is invalid, log the user out
        AuthService.logout();
        setUser(null);
      }
    };
    
    if (storedUser) {
      verifyAuth();
    }
  }, []);

  const login = async (credentials) => {
    const data = await AuthService.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    return await AuthService.register(userData);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create useAuth hook that the Complaints component wants to import
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthService;
