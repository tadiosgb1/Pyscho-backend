module.exports = (sequelize, Sequelize) => {
  const Group = sequelize.define("Group", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    organization: { type: Sequelize.STRING },
    _id: { type: Sequelize.INTEGER, references: { model: "organizations", key: "id" } }
  }, {
    tableName: "groups"
  });

  Group.associate = (db) => {
    Group.belongsTo(db.Organization, { foreignKey: "_id" });
  };

  return Group;
};