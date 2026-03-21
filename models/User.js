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

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" } // Self-referential FK
    },

    resetToken: DataTypes.STRING,
    resetTokenExpiry: DataTypes.DATE
  });

  User.associate = models => {
    // Self-reference: who created this user
    User.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator" // can access as user.creator
    });

    // User belongs to Organization
    User.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization"
    });

    // Role relations
    User.belongsToMany(models.Role, { through: "UserRoles" });

    // Permission relations
    User.belongsToMany(models.Permission, { through: "UserPermissions" });

    // Optional: Users created by this user (inverse relation)
    User.hasMany(models.User, {
      foreignKey: "created_by",
      as: "createdUsers"
    });
  };

  return User;
};