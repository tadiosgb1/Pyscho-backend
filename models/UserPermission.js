module.exports = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define("UserPermission", {
    userId: DataTypes.INTEGER,
    permissionId: DataTypes.INTEGER
  });
  return UserPermission;
};