'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('UserPermissions', [
      // Give user 2 (tadesse) an extra direct permission: view_results
      { userId: 2, permissionId: 3, createdAt: new Date(), updatedAt: new Date() },
      // Give user 3 (sara) direct take_tests permission
      { userId: 3, permissionId: 4, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserPermissions', null, {});
  }
};
