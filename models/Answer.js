module.exports = (sequelize, Sequelize) => {
  const Answer = sequelize.define("Answer", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    option_id: {
        type: Sequelize.INTEGER,
        references: { model: "options", key: "id" }
      },
    user_id: { type: Sequelize.INTEGER, references: { model: "Users", key: "id" } },
    question_id: { type: Sequelize.INTEGER, references: { model: "questions", key: "id" } },
    submited_at: { type: Sequelize.DATE }
  }, {
    tableName: "answers"
  });

  Answer.associate = (db) => {
    Answer.belongsTo(db.User,     { foreignKey: "user_id" });
    Answer.belongsTo(db.Question, { foreignKey: "question_id" });
    Answer.belongsTo(db.Option,   { foreignKey: "option_id", as: "Option" });
  };

  return Answer;
};