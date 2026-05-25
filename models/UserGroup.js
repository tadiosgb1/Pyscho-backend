module.exports = (sequelize, DataTypes) => {
  const UserGroup = sequelize.define("UserGroup", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id"
      }
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "groups",
        key: "id"
      }
    }
  }, {
    tableName: "user_groups",
    timestamps: true
  });

  UserGroup.associate = (models) => {
    UserGroup.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user"
    });

    UserGroup.belongsTo(models.Group, {
      foreignKey: "groupId",
      as: "group"
    });
  };

  return UserGroup;
};
