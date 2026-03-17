// utility/companyUtils.js
const db = require("../models");
const Companyinfo = db.Companyinfo;
const Corevalues = db.Corvalues;

/**
 * Get the company information.
 * If no record exists, create one using the provided defaults.
 * @param {Object} defaults - Optional default values for about, vission, mission
 */
async function getCompanyInfo(defaults = {}) {
  try {
    let company = await Companyinfo.findOne();

    // If not present, create with defaults
    if (!company) {
      const defaultValues = {
        about:
          defaults.about ||
          "Ant Technology is a technology-driven company dedicated to transforming wholesale and retail supply chains in Africa through a robust B2B E-Commerce ecosystem. The company connects suppliers, retailers, and delivery partners via an integrated digital platform that streamlines product sourcing, order management, payment processing, and logistics coordination.By leveraging technology and data analytics, Ant Technology bridges the gap between manufacturers and retailers, ensuring efficient distribution, real-time delivery tracking, and transparent business transactions across the supply chain.",
        vission:
          defaults.vission ||
          "To become Africa’s most trusted and scalable B2B E-Commerce and logistics technology provider, enabling a seamless and transparent trade ecosystem across borders.",
        mission:
          defaults.mission ||
          "To empower African businesses by providing a reliable digital marketplace that connects suppliers and retailers with efficient order, payment, and delivery management systems."
      };
      company = await Companyinfo.create(defaultValues);
      console.log("Created default company info.");
    }

    return {
      about: company.about,
      vission: company.vission,
      mission: company.mission
    };
  } catch (error) {
    console.error("Error fetching company info:", error);
    throw error;
  }
}

/**
 * Seed default core values if none exist.
 */
async function seedCoreValues() {
  try {
    const existing = await Corevalues.count();
    if (existing === 0) {
      const values = [
        { title: "Innovation", description: "We continuously seek out new technologies and methods to enhance our services and stay at the forefront of e-Commerce and VAS solutions." },
        { title: "Integrity", description: "We are committed to transparency, accountability, and honesty in all our interactions and solutions." },
        { title: "Customer-Centricity", description: "We prioritize the needs of our clients, dedicating ourselves to delivering solutions that enable their success." },
        { title: "Efficiency", description: "Delivering fast, reliable, and cost-effective business solutions." },
        { title: "Quality", description: "We strive for excellence in all our deliverables, from software development to customer support." },
        { title: "Collaboration", description: "We believe in fostering strong partnerships with clients, employees, and industry stakeholders, working together to achieve shared goals." }
      ];

      await Corevalues.bulkCreate(values);
      console.log("Seeded default core values.");
    } else {
      console.log("Core values already seeded.");
    }
  } catch (error) {
    console.error("Error seeding core values:", error);
    throw error;
  }
}

module.exports = { getCompanyInfo, seedCoreValues };