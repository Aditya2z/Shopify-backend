const mongoose = require("mongoose");
const User = require("./models/user");

// Function to seed admin users
const seedAdminUsers = async () => {
  try {
    // Check if admin users already exist
    const existingAdminUsers = await User.find({ isAdmin: true });

    if (existingAdminUsers.length === 0) {
      // Create two admin users only if they don't exist
      const admin1 = new User({
        name: "Admin1",
        email: "admin1@gmail.com",
        password: "admin1",
        isAdmin: true,
      });

      const admin2 = new User({
        name: "Admin2",
        email: "admin2@gmail.com",
        password: "admin2",
        isAdmin: true,
      });

      // Save the admin users
      await admin1.save();
      await admin2.save();

      console.log("Admin users seeded successfully");
    } else {
      console.log("Admin users already exist. No need to seed.");
    }
  } catch (error) {
    console.error("Error seeding admin users:", error);
  }
};

module.exports = seedAdminUsers;
