module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define("Subscription", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "organizations", key: "id" },
    },

    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "plans", key: "id" },
    },

    // Who activated this subscription (admin user)
    activated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
    },

    // Subscription lifecycle
    status: {
      type: DataTypes.ENUM("trialing", "active", "past_due", "cancelled", "expired"),
      defaultValue: "active",
    },

    // Billing period
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true, // null = no expiry (lifetime / manual)
    },

    // Trial end date (if applicable)
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Auto-renew flag
    auto_renew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // External payment reference (Stripe subscription ID, etc.)
    external_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Snapshot of usage counters for the current period
    used_users: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    used_tests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    used_assignments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: "subscriptions",
    timestamps: true,
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });

    Subscription.belongsTo(models.Plan, {
      foreignKey: "plan_id",
      as: "plan",
    });

    Subscription.belongsTo(models.User, {
      foreignKey: "activated_by",
      as: "activatedBy",
    });

    Subscription.hasMany(models.Invoice, {
      foreignKey: "subscription_id",
      as: "invoices",
    });
  };

  return Subscription;
};
