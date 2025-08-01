function roleMiddleware(role) {
  return (req, res, next) => {
    console.log('Role middleware check:', { 
      user: req.user, 
      requiredRole: role, 
      userRole: req.user?.role 
    });
    
    if (!req.user || req.user.role !== role) {
      console.log('Role check failed:', { 
        hasUser: !!req.user, 
        userRole: req.user?.role, 
        requiredRole: role 
      });
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    
    console.log('Role check passed');
    next();
  };
}

module.exports = roleMiddleware; 