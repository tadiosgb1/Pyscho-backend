module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define("Plan", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Plan identifier slug — used in code logic
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // e.g. "free", "starter", "professional", "enterprise"
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. "Free", "Starter", "Professional", "Enterprise"
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Billing cycle: "monthly" or "yearly"
    billing_cycle: {
      type: DataTypes.ENUM("monthly", "yearly", "one_time"),
      defaultValue: "monthly",
    },

    // Price in cents (e.g. 4900 = $49.00) — avoids float precision issues
    price_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 = free
    },

    // Currency code
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },

    // ── Usage limits ──────────────────────────────────────────────────────────
    // -1 means unlimited

    max_users: {
      type: DataTypes.INTEGER,
      defaultValue: 5,    // max testers per org
    },

    max_tests: {
      type: DataTypes.INTEGER,
      defaultValue: 3,    // max tests the org can create/assign
    },

    max_groups: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    max_test_assignments: {
      type: DataTypes.INTEGER,
      defaultValue: 10,   // total assignments per billing period
    },

    // ── Feature flags ─────────────────────────────────────────────────────────

    has_custom_branding: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    has_analytics: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    has_api_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    has_priority_support: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    has_export: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Whether this plan is publicly visible on the pricing page
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Display order on pricing page
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: "plans",
    timestamps: true,
  });

  Plan.associate = (models) => {
    Plan.hasMany(models.Subscription, {
      foreignKey: "plan_id",
      as: "subscriptions",
    });
  };

  return Plan;
};
