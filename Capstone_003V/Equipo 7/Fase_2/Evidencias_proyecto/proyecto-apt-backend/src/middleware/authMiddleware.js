import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Error al verificar token:', err);
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    req.user = decoded; // Guarda { id, rol } del token
    next();
  });
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (allowedRoles.includes(req.user.rol)) {
      next();
    } else {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso',
        required_roles: allowedRoles,
        user_role: req.user.rol
      });
    }
  };
};
