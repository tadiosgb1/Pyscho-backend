module.exports = (sequelize, Sequelize) => {
  const Organization = sequelize.define("Organization", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING },
    address: { type: Sequelize.STRING },
    contact_email: { type: Sequelize.STRING }
  }, {
    tableName: "organizations"
  });

  Organization.associate = models => {
    Organization.hasMany(models.User, {
      foreignKey: "organization_id",
      as: "users"
    });
  };

  return Organization;
};