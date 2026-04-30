'use strict';

// All models in the system
const models = [
  'user',
  'role',
  'permission',
  'organization',
  'group',
  'test',
  'question',
  'option',
  'answer',
  'result',
  'progress',
  'category',
  'trait',
];

// CRUD operations
const operations = ['view', 'create', 'edit', 'delete'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [];

    // Generate CRUD permissions for each model
    models.forEach(model => {
      operations.forEach(op => {
        permissions.push({
          name: `${op.charAt(0).toUpperCase() + op.slice(1)} ${model.charAt(0).toUpperCase() + model.slice(1)}`,
          code: `${model}.${op}`,
          description: `${op.charAt(0).toUpperCase() + op.slice(1)} ${model} records`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    // Additional special permissions
    permissions.push(
      {
        name: 'Manage Roles',
        code: 'role.manage',
        description: 'Assign and manage roles',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Permissions',
        code: 'permission.manage',
        description: 'Assign and manage permissions',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'View Dashboard',
        code: 'dashboard.view',
        description: 'Access dashboard',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Take Tests',
        code: 'test.take',
        description: 'Take psychological tests',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'View Own Results',
        code: 'result.view_own',
        description: 'View own test results',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    await queryInterface.bulkInsert('Permissions', permissions);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', null, {});
  },
};
