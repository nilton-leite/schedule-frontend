import { useContext, useEffect } from 'react';
import axios from 'axios';
import { LoadingContext } from '../contexts/LoadingContext';

export const useAxiosLoader = () => {
  const { setLoading } = useContext(LoadingContext);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setLoading(true);
        return config;
      },
      (error) => {
        setLoading(false);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setLoading(false);
        return response;
      },
      (error) => {
        setLoading(false);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [setLoading]);
};
