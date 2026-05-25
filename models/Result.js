module.exports = (sequelize, Sequelize) => {
  const Result = sequelize.define("Result", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    score: { type: Sequelize.INTEGER },
    interpretation: { type: Sequelize.STRING },
    recommendations: { type: Sequelize.STRING },
    status: { type: Sequelize.ENUM('pending', 'confirmed'), defaultValue: 'pending' },
    user_id: { type: Sequelize.INTEGER, references: { model: "Users", key: "id" } },
    test_id: { type: Sequelize.INTEGER, references: { model: "tests", key: "id" } },
    completed_at: { type: Sequelize.DATE }
  }, {
    tableName: "results"
  });

  Result.associate = (db) => {
    Result.belongsTo(db.User, { foreignKey: "user_id" });
    Result.belongsTo(db.Test, { foreignKey: "test_id" });
  };
  return Result;
};