module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "subscriptions", key: "id" },
    },

    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "organizations", key: "id" },
    },

    // Invoice number (e.g. "INV-2026-001")
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // Amount in cents
    amount_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },

    // Invoice status
    status: {
      type: DataTypes.ENUM("draft", "issued", "paid", "overdue", "cancelled", "refunded"),
      defaultValue: "issued",
    },

    // Billing period covered by this invoice
    period_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    period_end: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // Payment tracking
    issued_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // External payment reference (Stripe invoice ID, etc.)
    external_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Optional PDF URL or file path
    pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: "invoices",
    timestamps: true,
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Subscription, {
      foreignKey: "subscription_id",
      as: "subscription",
    });

    Invoice.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
  };

  return Invoice;
};
