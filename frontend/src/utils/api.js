const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dairy-1-baro.onrender.com';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  // Add Authorization header if token exists
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    console.log(`Making API call to: ${url}`);
    console.log('Request options:', {
      method: finalOptions.method || 'GET',
      headers: finalOptions.headers,
      body: finalOptions.body ? 'Present' : 'None'
    });
    
    const response = await fetch(url, finalOptions);
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, use the status text
        console.warn('Could not parse error response as JSON:', jsonError);
      }
      throw new Error(errorMessage);
    }
    
    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      // For JSON responses, we'll let the caller handle the parsing
      return response;
    } else {
      // For non-JSON responses, return as is
      return response;
    }
  } catch (error) {
    console.error('API call failed:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper function to clear authentication
export const clearAuth = () => {
  localStorage.removeItem('token');
}; 
