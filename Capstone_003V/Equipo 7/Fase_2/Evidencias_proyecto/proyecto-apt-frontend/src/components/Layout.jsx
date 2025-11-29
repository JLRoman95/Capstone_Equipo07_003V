import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #101828 0%, #0b1220 60%, #0b1220 100%)',
        color: '#f8fafc'
      }}
    >
      <Header />
      {children}
    </div>
  );
};

export default Layout;
