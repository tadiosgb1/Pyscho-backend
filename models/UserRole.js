module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define("UserRole", {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'userId'
    },
    roleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'roleId'
    }
  }, {
    tableName: 'UserRoles',
    timestamps: true,
    id: false  // ✅ Tell Sequelize not to add an 'id' column
  });
  return UserRole;
};