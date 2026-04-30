'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('UserRoles', [
      { userId: 1, roleId: 1, createdAt: new Date(), updatedAt: new Date() }, // admin → admin role
      { userId: 2, roleId: 2, createdAt: new Date(), updatedAt: new Date() }, // tadesse → psychologist
      { userId: 3, roleId: 3, createdAt: new Date(), updatedAt: new Date() }  // sara → user
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserRoles', null, {});
  }
};
