const ServiceProvider = require('../models/Serviceprovider')

exports.ServicesProvidedCountForProvider = async (req, res) => {
    try {
      const { providerEmail } = req.body; 
      if (!providerEmail) {
        return res.status(400).json({ message: "Provider email is required" });
      }
  
      const provider = await ServiceProvider.findOne({ email: providerEmail });
      console.log(provider);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
  
      provider.servicesProvidedCount += 1;
  
      await provider.save();
  
      return res.status(200).json({
        message: "Services Provided Count incremented successfully",
        servicesProvidedCount: provider.servicesProvidedCount,
      });
    } catch (error) {
      console.error("Error incrementing services provided count:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  exports.ServicesRejectedCountForProvider = async (req, res) => {
    try {
      const { providerEmail } = req.body; 
      if (!providerEmail) {
        return res.status(400).json({ message: "Provider email is required" });
      }
  
      const provider = await ServiceProvider.findOne({ email: providerEmail });
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
  
      provider.servicesRejectedCount += 1;
  
      await provider.save();
  
      return res.status(200).json({
        message: "Services Rejected Count incremented successfully",
        servicesRejectedCount: provider.servicesRejectedCount,
      });
    } catch (error) {
      console.error("Error incrementing services rejected count:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };