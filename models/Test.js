module.exports = (sequelize, Sequelize) => {
  const Test = sequelize.define("Test", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    duration: { type: Sequelize.INTEGER, defaultValue: 30 },
    created_by: { type: Sequelize.INTEGER }
  }, {
    tableName: "tests"
  });

  Test.associate = (db) => {
    Test.belongsTo(db.User, { foreignKey: "created_by" });
    Test.hasMany(db.TestAssignment, { foreignKey: "test_id", as: "assignments" });
  };

  return Test;
};