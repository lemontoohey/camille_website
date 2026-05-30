'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function GatekeeperPage() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [bypassed, setBypassed] = useState(false);

  // Skip gatekeeper if already visited this session
  useEffect(() => {
    if (sessionStorage.getItem('aki-entered')) {
      setBypassed(true);
      router.replace('/collection');
    }
  }, [router]);

  // Lock body/html scroll while gatekeeper is active
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const enter = () => {
    if (exiting) return;
    sessionStorage.setItem('aki-entered', '1');
    setContentVisible(false);
    setExiting(true);
    setTimeout(() => router.push('/collection'), 1100);
  };

  const skip = () => {
    if (exiting) return;
    sessionStorage.setItem('aki-entered', '1');
    setExiting(true);
    setTimeout(() => router.push('/collection'), 1100);
  };

  if (bypassed) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="gatekeeper"
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          zIndex: 10,
        }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: exiting ? 1.2 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* LAYER 3 — CONTENT */}
        <AnimatePresence>
          {contentVisible && (
            <motion.div
              key="content"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: 'easeIn' }}
            >
              {/* A — Kanji 間 */}
              <motion.span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  color: '#FDF5E6',
                  letterSpacing: '0.05em',
                  marginBottom: '2rem',
                  display: 'block',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.12 }}
                transition={{ duration: 4, ease: 'easeIn', delay: 0.5 }}
              >
                間
              </motion.span>

              {/* B — Brand name */}
              <motion.span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  color: '#FDF5E6',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.88, y: 0 }}
                transition={{ duration: 2, ease: 'easeOut', delay: 1.8 }}
              >
                AKI FUNADA
              </motion.span>

              {/* C — Horizontal rule */}
              <motion.div
                style={{
                  width: '24px',
                  height: '1px',
                  background: '#FDF5E6',
                  opacity: 0.18,
                  margin: '1.5rem 0',
                  transformOrigin: 'center',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 2.8 }}
              />

              {/* D — Enter label */}
              <motion.span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  color: '#FDF5E6',
                  letterSpacing: '0.55em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  display: 'block',
                }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 0.28,
                    transition: { duration: 1, delay: 3.4, ease: 'easeOut' },
                  },
                  hovered: {
                    opacity: 0.6,
                    transition: { duration: 0.4, ease: 'easeOut' },
                  },
                }}
                initial="hidden"
                animate="visible"
                whileHover="hovered"
                onClick={enter}
              >
                Enter
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SKIP — bottom-right, no content animation on click */}
        <motion.span
          style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            fontSize: '9px',
            letterSpacing: '0.4em',
            color: '#FDF5E6',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 20,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1, delay: 4 }}
          onClick={skip}
        >
          SKIP
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}
