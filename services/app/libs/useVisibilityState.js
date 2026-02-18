import { useState, useEffect, useCallback } from 'react';

export const useVisibilityState = () => {
  const [visibilityState, setVisibilityState] = useState(null);

  const handleVisbilityChange = useCallback(() => {
    setVisibilityState(document.visibilityState);
  }, [setVisibilityState]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisbilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisbilityChange);
  }, [handleVisbilityChange]);

  return visibilityState;
};
