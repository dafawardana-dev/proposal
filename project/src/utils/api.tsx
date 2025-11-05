const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    body: options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  };

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Non-JSON response:', text);
      throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      const errorMessage = data.detail || data.error || JSON.stringify(data);
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Untuk upload file (FormData)
export const apiFormDataRequest = async (
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers, 
      body: formData,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
  
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Non-JSON response:', text);
      throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      const errorMessage = data.detail || data.error || JSON.stringify(data);
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }

    return data;
  } catch (error) {
    console.error('API FormData Error:', error);
    throw error;
  }
};