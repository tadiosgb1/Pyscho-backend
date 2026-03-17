module.exports = (sequelize, Sequelize) => {
  const Progress = sequelize.define("Progress", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    score: { type: Sequelize.INTEGER },
    user_id: { type: Sequelize.INTEGER, references: { model: "users", key: "id" } },
    test_id: { type: Sequelize.INTEGER, references: { model: "tests", key: "id" } },
    taken_at: { type: Sequelize.DATE }
  }, {
    tableName: "progresses"
  });

  Progress.associate = (db) => {
    Progress.belongsTo(db.User, { foreignKey: "user_id" });
    Progress.belongsTo(db.Test, { foreignKey: "test_id" });
  };

  return Progress;
};