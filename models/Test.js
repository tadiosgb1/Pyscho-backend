module.exports = (sequelize, Sequelize) => {
  const Test = sequelize.define("Test", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    duration: { type: Sequelize.STRING },
    created_by: { type: Sequelize.INTEGER, references: { model: "users", key: "id" } }
  }, {
    tableName: "tests"
  });

  Test.associate = (db) => {
    Test.belongsTo(db.User, { foreignKey: "created_by" });
  };

  return Test;
};