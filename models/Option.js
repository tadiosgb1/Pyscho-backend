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

    // ✅ New field to differentiate between text options and uploaded image paths
    content_type: {
      type: Sequelize.ENUM('text', 'image'),
      defaultValue: 'text',
      allowNull: false
    },

    // ✅ New field for character designations (e.g., 'E', 'I', 'N', 'T')
    indication_letter: {
      type: Sequelize.STRING(10),
      allowNull: true
    },

    triat_id: {
      type: Sequelize.INTEGER,
      allowNull: true, // Switched to true in case "open" type or certain items don't map to a trait directly
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