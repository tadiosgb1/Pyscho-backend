module.exports = (sequelize, Sequelize) => {
  const Question = sequelize.define("Question", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    question_text: { type: Sequelize.STRING },
    question_type: { type: Sequelize.STRING },
    options: { 
      type: Sequelize.JSON,
      allowNull: true
     }, 
    metadata: { type: Sequelize.JSON }, // e.g., { category: "Extroversion" }
    correct_answer: { type: Sequelize.STRING },
    test_id: { type: Sequelize.INTEGER, references: { model: "tests", key: "id" } }
  }, {
    tableName: "questions"
  });

  Question.associate = (db) => {
    Question.belongsTo(db.Test, { foreignKey: "test_id" });
  };

  return Question;
};