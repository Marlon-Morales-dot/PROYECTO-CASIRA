import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  fallback = '/grupo-canadienses.jpg',
  lazy = true,
  quality = 'medium'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  // Cache management
  const getCachedImageUrl = (originalSrc) => {
    if (!originalSrc || originalSrc.startsWith('/')) return originalSrc;

    // Use Supabase's built-in image transformations for optimization
    if (originalSrc.includes('supabase')) {
      const params = new URLSearchParams();

      // Add quality and format optimization
      switch (quality) {
        case 'low':
          params.set('quality', '60');
          params.set('width', '400');
          break;
        case 'medium':
          params.set('quality', '75');
          params.set('width', '800');
          break;
        case 'high':
          params.set('quality', '85');
          params.set('width', '1200');
          break;
      }

      params.set('format', 'webp');

      return `${originalSrc}?${params.toString()}`;
    }

    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  const imageUrl = error ? fallback : getCachedImageUrl(src);

  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ minHeight: '200px' }}
      />
    );
  }

  return (
    <div ref={imgRef} className="relative">
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`} />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
      />
    </div>
  );
};

export default OptimizedImage;