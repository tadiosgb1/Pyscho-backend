const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const tableInfo = await queryInterface.describeTable('Users');
    
    // Only add columns if they don't already exist
    if (!tableInfo.photo) {
      await queryInterface.addColumn('Users', 'photo', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.cv) {
      await queryInterface.addColumn('Users', 'cv', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.date_of_birth) {
      await queryInterface.addColumn('Users', 'date_of_birth', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    if (!tableInfo.age) {
      await queryInterface.addColumn('Users', 'age', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!tableInfo.department) {
      await queryInterface.addColumn('Users', 'department', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.gender) {
      await queryInterface.addColumn('Users', 'gender', {
        type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true,
      });
    }

    if (!tableInfo.phone_number) {
      await queryInterface.addColumn('Users', 'phone_number', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('Users');
    
    if (tableInfo.photo) await queryInterface.removeColumn('Users', 'photo');
    if (tableInfo.cv) await queryInterface.removeColumn('Users', 'cv');
    if (tableInfo.date_of_birth) await queryInterface.removeColumn('Users', 'date_of_birth');
    if (tableInfo.age) await queryInterface.removeColumn('Users', 'age');
    if (tableInfo.department) await queryInterface.removeColumn('Users', 'department');
    if (tableInfo.gender) await queryInterface.removeColumn('Users', 'gender');
    if (tableInfo.phone_number) await queryInterface.removeColumn('Users', 'phone_number');
  },
};