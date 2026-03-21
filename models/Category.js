module.exports = (sequelize, Sequelize) => {
  const Category = sequelize.define("Category", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  }, {
    tableName: "categories"
  });

  
 Category.associate = (db) => {
    Category.hasMany(db.Triat, { foreignKey: "category_id" });
  };

  return Category;
};