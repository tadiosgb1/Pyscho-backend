module.exports = (sequelize, Sequelize) => {
  const Contact = sequelize.define("Contact", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: Sequelize.STRING
    },

    email: {
      type: Sequelize.STRING
    },

    phone: {
      type: Sequelize.STRING
    },

    // Large text for full messages
    message: {
      type: Sequelize.TEXT("long")
    },

    sent_at: {
      type: Sequelize.DATE
    }

  }, {
    tableName: "contacts"
  });

  return Contact;
};