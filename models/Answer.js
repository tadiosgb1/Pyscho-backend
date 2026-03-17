module.exports = (sequelize, Sequelize) => {
  const Answer = sequelize.define("Answer", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    answer_text: { type: Sequelize.STRING },
    user_id: { type: Sequelize.INTEGER, references: { model: "users", key: "id" } },
    question_id: { type: Sequelize.INTEGER, references: { model: "questions", key: "id" } },
    submited_at: { type: Sequelize.DATE }
  }, {
    tableName: "answers"
  });

  Answer.associate = (db) => {
    Answer.belongsTo(db.User, { foreignKey: "user_id" });
    Answer.belongsTo(db.Question, { foreignKey: "question_id" });
  };

  return Answer;
};