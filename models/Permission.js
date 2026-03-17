module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define("Permission", {
    name: DataTypes.STRING,
    code: { type: DataTypes.STRING, unique: true },
    description: DataTypes.STRING
  });

  Permission.associate = models => {
    Permission.belongsToMany(models.Role, { through: "RolePermissions" });
    Permission.belongsToMany(models.User, { through: "UserPermissions" });
  };

  return Permission;
};