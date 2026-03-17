module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    first_name: DataTypes.STRING,
    middle_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone: DataTypes.STRING,

    email: {
      type: DataTypes.STRING,
      unique: true
    },

    password: DataTypes.STRING,

    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    resetToken: DataTypes.STRING,
    resetTokenExpiry: DataTypes.DATE
  });

  User.associate = models => {

    // User belongs to Organization
    User.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization"
    });

    // Role relations
    User.belongsToMany(models.Role, { through: "UserRoles" });

    // Permission relations
    User.belongsToMany(models.Permission, { through: "UserPermissions" });
  };

  return User;
};