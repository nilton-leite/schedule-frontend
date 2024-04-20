import { useContext } from 'react';
import JWTContext from '../contexts/JWTContext';

const useAuth = () => useContext(JWTContext);

export default useAuth;
