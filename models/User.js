module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: DataTypes.STRING,
    middle_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone: DataTypes.STRING,

    email: {
      type: DataTypes.STRING,
      // unique constraint already exists in DB — removing here prevents
      // Sequelize alter: true from hitting MySQL's 64-key limit
    },

    username: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique — set at DB level; omitted here to avoid alter:true FK issues
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

    // Group relations
    User.belongsToMany(models.Group, {
      through: models.UserGroup,
      foreignKey: "userId",
      otherKey: "groupId",
      as: "groups"
    });

    // Test assignments for this user
    User.hasMany(models.TestAssignment, {
      foreignKey: "assigned_to_id",
      as: "assignedTests",
      scope: { assigned_to_type: "user" },
    });

    // Optional: Users created by this user (inverse relation)
    User.hasMany(models.User, {
      foreignKey: "created_by",
      as: "createdUsers"
    });
  };

  return User;
};