module.exports = (sequelize, Sequelize) => {
  const Triat = sequelize.define("Triat", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: Sequelize.INTEGER, references: { model: "categories", key: "id" } },
    name: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
    
  }, {
    tableName: "triats"
  });

  Triat.associate = (db) => {
    Triat.belongsTo(db.Category, { foreignKey: "category_id" });
  };

  return Triat;
};