module.exports = (sequelize, Sequelize) => {
  const Option = sequelize.define("Option", {
    id: { 
      type: Sequelize.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },

    text: { 
      type: Sequelize.STRING 
    },


    triat_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "triats", key: "id" }
    },


    question_id: {
      type: Sequelize.INTEGER,
      references: { model: "questions", key: "id" }
    },

    value: { 
      type: Sequelize.STRING // "extrovert", "introvert", etc.
    },

    weight: { 
      type: Sequelize.INTEGER,
      defaultValue: 0
    },

    // ✅ THIS CONTROLS ORDER
    position: {
      type: Sequelize.INTEGER,
      allowNull: false
    }

  }, {
    tableName: "options"
  });

Option.associate = (db) => {
  Option.belongsTo(db.Question, { foreignKey: "question_id" });
  Option.belongsTo(db.Triat, { foreignKey: "triat_id" });
};
  return Option;
};