// Role-based access control middleware
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // req.user comes from authMiddleware
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized - No user" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Forbidden - Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: "Authorization error" });
    }
  };
};
