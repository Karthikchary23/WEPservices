const { getIo, getServiceProviders } = require("../socket"); // ✅ Import correctly

exports.requestService = async (req, res) => {
    const { name, email, latitude, longitude, serviceType,Fulladdress,Mobile } = req.body;
    //console.log("Received request:", req.body);

    const request = {
        customerName: name,
        customerId: email,
        serviceType,
        Fulladdress,
        Mobile,

        customerLocation: [latitude, longitude],
    };

    const io = getIo();
    const serviceProviders = getServiceProviders(); 
    Object.keys(serviceProviders).forEach((socketId) => {
        if (serviceProviders[socketId].serviceType === serviceType) {
            io.to(socketId).emit("newServiceRequest", request);
        }
    });

    res.status(200).json({ message: "Service request sent successfully" });
};
