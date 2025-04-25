const Customer = require('../models/Customermodel');

exports.ServicesRecievedCountForCustomer = async (req, res) => {
  try {
    const { customerEmail } = req.body; 
    if (!customerEmail) {
      return res.status(400).json({ message: "Customer email is required" });
    }

    const customer = await Customer.findOne({ email: customerEmail });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.servicesRecievedCount += 1;

    await customer.save();

    return res.status(200).json({
      message: "Services Received Count incremented successfully",
      servicesRecievedCount: customer.servicesRecievedCount,
    });
  } catch (error) {
    console.error("Error incrementing services received count:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.ServicesRejectedCountForCustomer = async (req, res) => {
  try {
    const { customerEmail } = req.body; 
    if (!customerEmail) {
      return res.status(400).json({ message: "Customer email is required" });
    }

    const customer = await Customer.findOne({ email: customerEmail });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.servicesRejectedCount += 1;

    await customer.save();

    return res.status(200).json({
      message: "Services Rejected Count incremented successfully",
      servicesRejectedCount: customer.servicesRejectedCount,
    });
  } catch (error) {
    console.error("Error incrementing services rejected count:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};