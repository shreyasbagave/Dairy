const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth header:', authHeader);
  console.log('Token:', token);
  
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('Decoded user from token:', user);
    req.user = user;
    next();
  });
}

module.exports = authMiddleware; 