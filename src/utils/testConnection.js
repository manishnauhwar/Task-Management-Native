import axios from 'axios';

export const testBackendConnection = async () => {
  try {
    console.log('Testing connection to backend...');
    const response = await axios.get('https://taskmanagement-backend-2.onrender.com/health');
    console.log('Backend response:', response.data);
    return true;
  } catch (error) {
    console.error('Backend connection error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    return false;
  }
}; 