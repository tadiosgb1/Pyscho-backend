module.exports = (sequelize, Sequelize) => {
  const Faqs = sequelize.define("Faqs", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Long question support
    question: {
      type: Sequelize.TEXT("long")
    },
    // Long answer support
    answer: {
      type: Sequelize.TEXT("long")
    },

    is_active: {
      type: Sequelize.BOOLEAN
    },

    order: {
      type: Sequelize.INTEGER
    }

  }, {
    tableName: "faks"
  });

  return Faqs;
};