module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("Role", {
    name: { type: DataTypes.STRING, unique: true },
    description: DataTypes.STRING
  });

  Role.associate = models => {
    Role.belongsToMany(models.User, { through: "UserRoles" });
    Role.belongsToMany(models.Permission, { through: "RolePermissions" });
  };

  return Role;
};