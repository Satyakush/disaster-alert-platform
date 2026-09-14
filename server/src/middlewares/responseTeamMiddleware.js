const responseTeamOnly = (req, res, next) => {
  if (!["admin", "responder"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Responder or admin access required" });
  }

  next();
};

export default responseTeamOnly;
