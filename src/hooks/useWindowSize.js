import { useEffect, useState } from 'react';

const useWindowSize = () => {
  // Começa com o tamanho real da janela. Antes começava "undefined": no celular (< 992 px) o layout montava
  // a versão de computador e logo trocava para a de celular, desmontando e recarregando a tela inteira.
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : undefined,
    height: typeof window !== 'undefined' ? window.innerHeight : undefined
  }));

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export default useWindowSize;
