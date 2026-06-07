import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useSpring(0, { stiffness: 1000, damping: 50 });
  const cursorY = useSpring(0, { stiffness: 1000, damping: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX - (isHovering ? 30 : 20));
      cursorY.set(e.clientY - (isHovering ? 30 : 20));
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.tagName === 'A' || 
          target.tagName === 'BUTTON' || 
          target.closest('[data-cursor-hover]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY, isHovering]);

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          width: isHovering ? '60px' : '40px',
          height: isHovering ? '60px' : '40px',
        }}
      >
        <svg
          viewBox="0 0 50 50"
          className="w-full h-full"
        >
          <circle
            cx="25"
            cy="25"
            r="8"
            className="fill-white"
            style={{
              transform: isHovering ? 'scale(2.5)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'transform 0.3s ease-out',
            }}
          />
        </svg>
      </motion.div>
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          width: '8px',
          height: '8px',
        }}
      >
        <div className="w-full h-full bg-white rounded-full" />
      </motion.div>
    </>
  );
};

export default CustomCursor;
