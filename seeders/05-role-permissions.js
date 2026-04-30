'use strict';

// Permission codes assigned per role
// Role IDs: admin=1, organization=2, tester=3

const adminPermissions = [
  // All CRUD for every model
  'user.view', 'user.create', 'user.edit', 'user.delete',
  'role.view', 'role.create', 'role.edit', 'role.delete', 'role.manage',
  'permission.view', 'permission.create', 'permission.edit', 'permission.delete', 'permission.manage',
  'organization.view', 'organization.create', 'organization.edit', 'organization.delete',
  'group.view', 'group.create', 'group.edit', 'group.delete',
  'test.view', 'test.create', 'test.edit', 'test.delete', 'test.take',
  'question.view', 'question.create', 'question.edit', 'question.delete',
  'option.view', 'option.create', 'option.edit', 'option.delete',
  'answer.view', 'answer.create', 'answer.edit', 'answer.delete',
  'result.view', 'result.create', 'result.edit', 'result.delete', 'result.view_own',
  'progress.view', 'progress.create', 'progress.edit', 'progress.delete',
  'category.view', 'category.create', 'category.edit', 'category.delete',
  'trait.view', 'trait.create', 'trait.edit', 'trait.delete',
  'dashboard.view',
];

const organizationPermissions = [
  // Can manage their own users/groups, view tests and results
  'user.view', 'user.create', 'user.edit',
  'group.view', 'group.create', 'group.edit', 'group.delete',
  'test.view', 'test.take',
  'result.view', 'result.view_own',
  'progress.view',
  'category.view',
  'trait.view',
  'dashboard.view',
];

const testerPermissions = [
  // Can only take tests and view own results
  'test.view', 'test.take',
  'result.view_own',
  'progress.view',
  'dashboard.view',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all permissions from DB to get their IDs by code
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, code FROM `Permissions`',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const codeToId = {};
    permissions.forEach(p => { codeToId[p.code] = p.id; });

    const rows = [];

    const addRows = (roleId, codes) => {
      codes.forEach(code => {
        const permId = codeToId[code];
        if (permId) {
          rows.push({
            roleId,
            permissionId: permId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          console.warn(`Permission code not found: ${code}`);
        }
      });
    };

    addRows(1, adminPermissions);        // admin
    addRows(2, organizationPermissions); // organization
    addRows(3, testerPermissions);       // tester

    await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
  },
};
