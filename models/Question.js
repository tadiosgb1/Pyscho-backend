module.exports = (sequelize, Sequelize) => {
  const Question = sequelize.define("Question", {
    id: { 
      type: Sequelize.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    question_text: { 
      type: Sequelize.STRING, 
      allowNull: false 
    },
    // ✅ Category (e.g., "Extraversion vs Introversion")
    category_id: { 
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "categories", key: "id" }
    },
    // ✅ Question type
    type: {
      type: Sequelize.ENUM("multiple", "likert", "open"),
      allowNull: false
    },

    // ✅ Belongs to a test
    test_id: { 
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "tests", key: "id" }
    }

  }, {
    tableName: "questions"
  });

  // ✅ Associations
  Question.associate = (db) => {
    Question.belongsTo(db.Test, { foreignKey: "test_id" });
    Question.belongsTo(db.Category, { foreignKey: "category_id" });

    // optional but recommended
    Question.hasMany(db.Option, { foreignKey: "question_id" });
    Question.hasMany(db.Answer, { foreignKey: "question_id" });
  };

  return Question;
};