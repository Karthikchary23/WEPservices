"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { io } from "socket.io-client"; // Import socket.io client
// import Map from "../../Components/Maps";
import dynamic from "next/dynamic";
import { set } from "react-hook-form";
const MapComponent = dynamic(() => import("../../Components/Maps.js"), {
  ssr: false,
});

const socket = io("http://localhost:4000", {
  transports: ["websocket"],
});

const ServiceProviderDashboard = () => {
  const router = useRouter();
  const [email1, setEmail1] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [customerLocation, setcustomerLocation] = useState({
    lat: null,
    lng: null,
  });
  const [serviceType, setServiceType] = useState("");
  const [servicesProvidedCount, setServicesProvidedCount] = useState(0);
  const [servicesRejectedCount, setServicesRejectedCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState({});
  const [verifiedstatus, setVerifiedStatus] = useState(false);

  useEffect(() => {
    const spt = Cookies.get("spt");
    if (!spt) {
      router.push("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.post(
          "http://localhost:4000/serviceprovidertoken/serviceprovidertokenverify",
          { token: spt }
        );

        if (response.status === 200) {
          console.log("Current response", response.data);
          setEmail1(response.data.serviceprovider.email);
          setName(response.data.serviceprovider.firstName || "Provider");
          setServiceType(response.data.serviceprovider.serviceType);
          setServicesProvidedCount(
            response.data.serviceprovider.servicesProvidedCount
          );
          setServicesRejectedCount(
            response.data.serviceprovider.servicesRejectedCount
          );
          alert(
            `Welcome, ${response.data.serviceprovider.firstName || "Provider"}`
          );

          const providerData = {
            email: response.data.serviceprovider.email,
            serviceType: response.data.serviceprovider.serviceType, // This comes from your sign-in page
          };

         
          socket.emit("registerServiceProvider", providerData);
        }
      } catch (err) {
        console.error("Token verification error:", err);
        Cookies.remove("spt");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
    const check = localStorage.getItem("available");
    if (!check) {
      localStorage.setItem("available", "true");
    }

    const storedRequests =
      JSON.parse(localStorage.getItem("serviceAccepted")) || [];
    setRequests(storedRequests);
  }, []);

  useEffect(() => {
    function getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(" iam printing ", latitude, longitude);
            setLocation({ lat: latitude, lng: longitude });

            updateLocation(latitude, longitude);
          },
          (error) => {
            alert("Error getting location");
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      } else {
        console.log("Geolocation is not supported by this browser.");
      }
    }

    async function updateLocation(latitude, longitude) {
      if (!email1) return;
      try {
        await axios.post(
          "http://localhost:4000/serviceproviderlocation/update-location",
          {
            latitude,
            longitude,
            email: email1,
          }
        );
        console.log("Location updated successfully!");
      } catch (error) {
        console.error("Error updating location:", error);
      }
    }

    getCurrentLocation();

    const interval = setInterval(() => {
      socket.emit("providercurrentlocation", { location, customerEmail });

      console.log("Location sent to customer", location, customerEmail);
    }, 10000);

    return () => clearInterval(interval);
  }, [email1, location, customerEmail]);

  console.log("customerLocation", customerLocation);
  console.log("servicelocation", location);

  useEffect(() => {
    socket.on("newServiceRequest", (data) => {
      const isAvailable = localStorage.getItem("available") === "true";

      if (isAvailable) {
        console.log("New service request received:", data);
        alert(`New request from ${data.customerName} for ${data.serviceType}`);
        setRequests((prevRequests) => [
          ...prevRequests,
          { ...data, isAccepted: false },
        ]);
      }
    });

    socket.on("connect", () => console.log("Socket connected"));
    // socket.on("disconnect", () => console.log("Socket disconnected"));

    return () => {
      socket.off("newServiceRequest");
    };
  }, []);
  useEffect(() => {
    const customerLocationData = localStorage.getItem("serviceAccepted");
    console.log("customerLocation=================", customerLocationData);

    if (customerLocationData) {
      try {
        const parsedData = JSON.parse(customerLocationData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const latestCustomer = parsedData[parsedData.length - 1]; // Fetch the latest customer data
          console.log(
            "Parsed customerLocation:",
            latestCustomer.customerlocation
          );
          console.log("Parsed customerMail:", latestCustomer.customerId);
          setcustomerLocation(latestCustomer.customerlocation);
          setCustomerEmail(latestCustomer.customerId); // Store customer email
        } else {
          console.log("No valid customer location data found.");
        }
      } catch (error) {
        console.error("Error parsing customer location data:", error);
      }
    } else {
      console.log("No customer location found in localStorage.");
    }
  }, []);

  const handleAccept = (
    requestId,
    customerlocation,
    servicetype,
    cuname,
    fulladdress
  ) => {
    // alert(customerlocation);
    if (!customerlocation) {
      console.error("customerlocation is undefined or empty");
      return alert("invalid location");
    }
    if (customerlocation) {
      const coordinates = customerlocation;
      if (
        coordinates.length === 2 &&
        coordinates.every((coord) => typeof coord === "number")
      ) {
        const culatitude = coordinates[0];
        const culongitude = coordinates[1];

        console.log("Latitude:", culatitude);
        console.log("Longitude:", culongitude);
        setcustomerLocation({ lat: culatitude, lng: culongitude });
        const updatedCustomerLocation = { lat: culatitude, lng: culongitude };
        const data = {
          customername: cuname,
          customermail: requestId,
          customerlocation: updatedCustomerLocation,
          servicetype,
          serviceprovidername: name,
          serviceprovideremail: email1,
          serviceproviderlocation: location,
        };

        console.log("Data Object:", data);
        axios
          .post("http://localhost:4000/available/isavailable", {
            email: email1,
          })
          .then((response) => {
            // alert(response.data.message);
            axios
              .post(
                "http://localhost:4000/request/requestupdate",
                data
              )
              .then((response) => {
                console.log(response);

                socket.emit("serviceAccepted", {
                  customerEmail: requestId, // Customer's email
                  providerName: name,
                  providerEmail: email1,
                  providerLocation: location,
                  serviceType: servicetype,
                });

                alert("Customer has been notified!");
                localStorage.setItem("available", "false");

                let serviceDataArray =
                  JSON.parse(localStorage.getItem("serviceAccepted")) || [];

                // Create new data entry
                const newServiceData = {
                  customerName: cuname,
                  customerId: requestId,
                  serviceType: servicetype,
                  customerlocation: updatedCustomerLocation,
                  Fulladdress: fulladdress,
                  providerName: name,
                  providerEmail: email1,
                  otp: response.data.newRequest.otp,
                  providerLocation: location,
                  isAccepted: true,
                  isAvailable: false,
                };

                // Add new entry to the array
                serviceDataArray.push(newServiceData);

                // Store updated array in Local Storage
                localStorage.setItem(
                  "serviceAccepted",
                  JSON.stringify(serviceDataArray)
                );
                setRequests((prevRequests) =>
                  prevRequests.map((req) =>
                    req.customerId === requestId
                      ? { ...req, isAccepted: true }
                      : req
                  )
                );
              })
              .catch((error) => {
                console.error("Error updating request:", error);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        console.log("Invalid customerlocation format");
      }
    } else {
      console.error("customerlocation is not a valid string");
    }
    setTimeout(() => {
      window.location.reload();
    }, 2000); // Reset verified status after 10 seconds
  };
  
  socket.on("serviceAcceptednotification", (data) => {
    console.log("Service Verified" );
    setVerifiedStatus(true);
  });

  const handleReject = (requestId) => {
    // Emit cancelRequest event to the server

    alert("Request has been canceled!");
    localStorage.setItem("available", "true");
    axios
      .post("https://wepbackend23.onrender.com/request/deleterequest", {
        customermail: requestId,
        serviceprovideremail: email1,
      })
      .then(async (response) => {
        if (response.status == 200) {
          socket.emit("cancelRequest", {
            customerEmail: requestId,
            providerEmail: email1,
          });

          // Remove the request from the local state
          setRequests((prevRequests) =>
            prevRequests.filter((req) => req.customerId !== requestId)
          );

          // Optionally, update localStorage
          const updatedRequests =
            JSON.parse(localStorage.getItem("serviceAccepted")) || [];
          const filteredRequests = updatedRequests.filter(
            (req) => req.customerId !== requestId
          );
          localStorage.setItem(
            "serviceAccepted",
            JSON.stringify(filteredRequests)
          );
          await axios
            .post(
              "https://wepbackend23.onrender.com/serviceprovider/servicesrejectedcount",
              { providerEmail: email1 }
            )
            .then((response) => {
              console.log(response);
              setServicesRejectedCount(response.data.servicesRejectedCount);
            })
            .catch((error) => {
              console.log(
                "Error at incrementing service rejected count for provider",
                error
              );
            });
        }
      })
      .catch((error) => {
        console.error("Error Deleting request request:", error);
      });
  };


  const handleLogout = () => {
    alert("You have been logged out!");
    Cookies.remove("spt", { path: "/" });
    setTimeout(() => router.push("/"), 500);
  };
  useEffect(() => {
    socket.on("requestCanceledbycutomer", (data) => {
      alert(`Request canceled by the customer: ${data.customerEmail}`);
      const updatedRequests = requests.filter(
        (req) => req.customerId !== data.customerEmail
      );
      setRequests(updatedRequests);
      localStorage.setItem("serviceAccepted", JSON.stringify(updatedRequests));
      localStorage.setItem("available", "true");
    });

    return () => {
      socket.off("requestCanceledbycutomer");
    };
  }, [requests]);

  const handleComplete = async (requestId) => {
    const temp = JSON.parse(localStorage.getItem("serviceAccepted"));
    console.log("temp",temp);
    const customerMail = temp[0].customerId;
    console.log("customerMail",customerMail);
    console.log("serviceprovideremail", email1);
    await axios.post(
      "http://localhost:4000/request/deleterequest",{
        customermail: customerMail,
        serviceprovideremail: email1,
      }).then(async (response) => {
        console.log("Request completed successfully:", response.data);
        alert("Request completed successfully!");

      await axios
      .post(
        "http://localhost:4000/serviceprovider/servicesprovidedcount",
        { providerEmail: email1 }
      )
      .then((response) => {
        console.log(response);
        setServicesProvidedCount(response.data.servicesProvidedCount);
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.customerId !== requestId)
        );
        const updatedRequests =
          JSON.parse(localStorage.getItem("serviceAccepted")) || [];
        const filteredRequests = updatedRequests.filter(
          (req) => req.customerId !== requestId
        );
        localStorage.setItem(
          "serviceAccepted",
          JSON.stringify(filteredRequests)
        );
        localStorage.removeItem("available");
        localStorage.setItem("available", "true");
        setcustomerLocation({
          lat: null,
          lng: null,
        });
      })
      .catch((error) => {
        console.log(
          "Error at incrementing service provided count for provider",
          error
        );
      });


      }).catch((error) => {
        console.error("Error completing request:", error);
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#1f1f1f]">
  {/* Fixed Header */}
  <header className="bg-[#111] text-white text-base sm:text-lg md:text-xl px-4 sm:px-6 py-4 flex justify-between items-center shadow z-10 fixed w-full top-0 left-0">
    {loading ? (
      <p>Loading dashboard...</p>
    ) : (
      <>
        <div className="flex flex-col sm:flex-row sm:gap-3 items-start sm:items-center">
          <span className="font-semibold">Welcome, {name}</span>
          <span className="text-sm sm:text-base">({serviceType})</span>
          <span className="text-sm sm:text-base">
            Done: {servicesProvidedCount}, Rejected: {servicesRejectedCount}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 cursor-pointer px-3 py-1 rounded hover:bg-red-700 transition text-white text-sm"
        >
          Logout
        </button>
      </>
    )}
  </header>

  {/* Scrollable Content */}
  <main className="mt-[80px] overflow-y-auto px-4 sm:px-6 pb-10">
    {!loading && (
      <>
        <MapComponent
          customerLocation={customerLocation}
          providerLocation={location}
        />

        {/* Centered Incoming Requests Section */}
        <section className="mt-12 flex justify-center">
          <div className="w-full max-w-4xl px-4 sm:px-6">
            <h2 className="text-white text-lg font-bold mb-4">Incoming Requests</h2>
            {requests.length > 0 ? (
              requests.map((req, index) => (
                <div
                  key={index}
                  className="border border-gray-700 p-4 mb-4 bg-gray-800 rounded-md text-white"
                >
                  <p><strong>Customer name:</strong> {req.customerName}</p>
                  <p><strong>Customer ID:</strong> {req.customerId}</p>
                  <p><strong>Service Type:</strong> {req.serviceType}</p>
                  <p><strong>Location:</strong> {req.Fulladdress}</p>

                  {!req.isAccepted ? (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          handleAccept(
                            req.customerId,
                            req.customerLocation,
                            req.serviceType,
                            req.customerName,
                            req.Fulladdress
                          )
                        }
                        className="bg-green-500 cursor-pointer px-3 py-1 rounded text-white mr-2 hover:bg-green-600"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <button
                        disabled={!verifiedstatus}
                        onClick={() => handleComplete(req.customerId, email1)}
                        className={`px-3 py-1 rounded text-white cursor-pointer ${
                          verifiedstatus
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-green-300 cursor-not-allowed"
                        }`}
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleReject(req.customerId, email1)}
                        className="bg-red-500 cursor-pointer px-3 py-1 rounded text-white hover:bg-red-600"
                      >
                        Cancel
                      </button>
                      <p><strong>OTP:</strong> {req.otp}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-white">No new requests</p>
            )}
          </div>
        </section>
      </>
    )}
  </main>
</div>

  );
};

export default ServiceProviderDashboard;
