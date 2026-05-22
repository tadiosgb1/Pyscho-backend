module.exports = (sequelize, DataTypes) => {
  const TestAssignment = sequelize.define("TestAssignment", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // The test being assigned
    test_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "tests", key: "id" },
    },

    // Who is being assigned: "user" or "group"
    assigned_to_type: {
      type: DataTypes.ENUM("user", "group"),
      allowNull: false,
    },

    // The ID of the user or group being assigned
    // NOTE: This is a polymorphic column — it holds either a user ID or a group ID
    // depending on assigned_to_type. It must NOT have a FK reference to users.
    assigned_to_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Admin/org who created the assignment
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Users", key: "id" },
    },

    // Optional deadline
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Assignment lifecycle status
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "expired"),
      defaultValue: "pending",
    },

    // Optional notes from the assigner
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: "test_assignments",
    timestamps: true,
  });

  TestAssignment.associate = (models) => {
    // The test being assigned
    TestAssignment.belongsTo(models.Test, {
      foreignKey: "test_id",
      as: "test",
    });

    // The admin/org who assigned it
    TestAssignment.belongsTo(models.User, {
      foreignKey: "assigned_by",
      as: "assigner",
    });
  };

  return TestAssignment;
};
