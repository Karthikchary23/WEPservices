"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
// import Map from "@/Components/Maps";
import { io } from "socket.io-client";
import dynamic from "next/dynamic";
import { set } from "react-hook-form";
const MapComponent = dynamic(() => import("../../Components/Maps.js"), { ssr: false })

const socket = io("https://wepservicesonline.onrender.com", { transports: ["websocket"] });

const CustomerDashboard = () => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [name, setName] = useState("");
  const [email1, setEmail1] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const router = useRouter();
  const [serviceProvider, setServiceProvider] = useState([]);
  const [requests,setRequests] = useState([]);
  const [otp,setOtp]=useState("");
  const [servicesRecievedCount, setServicesRecievedCount] = useState(0);
  const [servicesRejectedCount, setServicesRejectedCount] = useState(0);
  const [serviceProviderlocation,setserviceProviderLocation]=useState({lat:null,lng:null})
  const [waitingForProvider, setWaitingForProvider] = useState(false);

  useEffect(() => {
    // Remove "spt" token (if any)
    Cookies.remove("spt");
    const ct = Cookies.get("ct");

    if (!ct) {
      router.push("/");
      return;
    }
    // ✅ Verify Token & Fetch User Details
    const verifyToken = async () => {
      try {
        const response = await axios.post(
          "https://wepservicesonline.onrender.com/customertoken/customertokenverify",
          {
            token: ct,
          }
        );

        if (response.status === 200) {
          //console.log("customer Respjnse", response.data);
          setName(response.data.customer.name);
          setEmail1(response.data.customer.email);
          setCustomerAddress(response.data.customer.Fulladdress);
          setServicesRecievedCount(response.data.customer.servicesRecievedCount);
          setServicesRejectedCount(response.data.customer.servicesRejectedCount);
          alert(`Welcome, ${response.data.customer.name}`);
          //console.log("Socket Connected:", socket.connected);
          socket.emit("registerCustomer", response.data.customer.email);

        }
      } catch (err) {
        console.error("Token verification error:", err);
        Cookies.remove("ct"); // Remove invalid token
        router.push("/");
      }
    };

    verifyToken();
  }, []); 

  useEffect(() => {
    const fetchingAcceptedRequests = async (providerEmail, customerEmail) => {
      const res = await axios.get("https://wepservicesonline.onrender.com/request/acceptedrequests", {
        params: {
          providerEmail: providerEmail,
          customerEmail: customerEmail,
        },
      });

      if (res.status === 200) {
        return res.data; 
      } else {
        throw new Error("Failed to fetch accepted requests");
      }
    };

    const handleNotification = async (data) => {
      //console.log("Service provider assigned:", data);
      alert(`Service Accepted! Provider: ${data.providerName}`);

      try {
        const acceptedRequest = await fetchingAcceptedRequests(data.providerEmail, data.customerEmail);
        //console.log("Fetched Request:", acceptedRequest);

        // Add missing fields (email, address, and currentLocation) to the acceptedRequest object
        const completeRequest = {
          ...acceptedRequest
        };

        // Prevent duplicate entries in requests
        setRequests((prevRequests) => {
          const isDuplicate = prevRequests.some((req) => req.Mobile === completeRequest.Mobile);
          if (!isDuplicate) {
            const updatedRequests = [...prevRequests, completeRequest];
            localStorage.setItem("serviceProviderDetails", JSON.stringify(updatedRequests)); // Update local storage
            return updatedRequests;
          }
          return prevRequests;
        });

        // Update serviceProvider state with the latest accepted request
        setServiceProvider(completeRequest);
      } catch (error) {
        console.error("Error handling notification:", error);
      }
    };

    //console.log("Setting up notification listener");
    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  // useEffect(() => {
  //   //console.log("Updated Requests State:", requests);
  //   //console.log("Updated Service Provider State:", serviceProvider);
  // }, [requests, serviceProvider]);

  useEffect(() => {
    function getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            //console.log("User Location:", latitude, longitude);

            // Update state
            setLocation({ lat: latitude, lng: longitude });

            updateLocation(latitude, longitude, email1);
          },
          (error) => {
            alert("Error getting location");
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      } else {
        //console.log("Geolocation is not supported by this browser.");
      }
    }

    async function updateLocation(latitude, longitude, email1) {
      if (!email1) return;

      try {
        await axios.post(
          "https://wepservicesonline.onrender.com/customerlocation/update-location",
          {
            latitude,
            longitude,
            email: email1,
          }
        );
       

        //console.log("Location updated successfully!");
      } catch (error) {
        alert("not success");
        console.error("Error updating location:", error);
      }
    }

    getCurrentLocation();

  }, [email1]);


  useEffect(() => {
    // Fetch service provider details from local storage on page load
    const storedServiceProvider = JSON.parse(localStorage.getItem("serviceProviderDetails"));
    if (storedServiceProvider && storedServiceProvider.length > 0) {
      setServiceProvider(storedServiceProvider[storedServiceProvider.length - 1]); // Set the latest service provider
    }
  }, []);

  useEffect(() => {
    // Fetch requests from local storage on page load
    const storedRequests = JSON.parse(localStorage.getItem("serviceProviderDetails")) || [];
    setRequests(storedRequests);
  }, []);

  useEffect(() => {
    if (requests.length > 0) {
      const latestProvider = requests[requests.length - 1];
      if (latestProvider?.currentLocation?.coordinates) {
        setserviceProviderLocation({
          lat: latestProvider.currentLocation.coordinates[1],
          lng: latestProvider.currentLocation.coordinates[0],
        });
      }
    }
  }, [requests]);

  const handleRequestService = async (serviceType) => {
    if (!location.lat || !location.lng) {
      alert("Location not available. Please allow location access.");
      return;
    }

    try {
      const response = await axios.post(
        "https://wepservicesonline.onrender.com/request/request-service",
        {
          name,
          email: email1,
          latitude: location.lat,
          longitude: location.lng,
          Fulladdress: customerAddress,
          serviceType,
        }
      );

      if (response.status === 200) {
        alert(`Request for ${serviceType} sent successfully!`);
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send service request.");
    }
  };

  // ✅ Logout function
  const handleLogout = () => {
    alert("You have been logged out!");
    Cookies.remove("ct"); // Remove customer token
    setTimeout(() => {
      router.push("/");
    }, 500); // Ensure logout is processed before redirect
  };
  //console.log("craztyy",requests)
  //console.log("service provider ",serviceProvider)

  
  const handleCancel = (serviceProviderEmail) => {
    // Send a request to the backend to delete the request
    setserviceProviderLocation({ lat: null, lng: null });
    axios
      .post("https://wepservicesonline.onrender.com/request/deleterequest", {
        customermail: email1,
        serviceprovideremail: serviceProviderEmail,
      })
      .then(async (response) => {
        if (response.status === 200) {
          alert("Request has been canceled!");
  
          // Emit cancelRequest event to the server
          socket.emit("cancelRequest", {
            customerEmail: email1,
            providerEmail: serviceProviderEmail,
          });
  
          // Remove the request from the local state
          const updatedRequests = requests.filter(
            (provider) => provider.email !== serviceProviderEmail
          );
          setRequests(updatedRequests);
  
          // Update local storage
          localStorage.setItem("serviceProviderDetails", JSON.stringify(updatedRequests));
          await axios.post("https://wepservicesonline.onrender.com/customer/servicerejectedcount",{customerEmail: email1})
          .then((response)=>{
            if(response.status===200){
                //console.log(response);
                setServicesRejectedCount(response.data.servicesRejectedCount);
            }
          })
          .catch((error)=>{
            //console.log("Error incrementing service recieved count",error);
          });
        }
      })
      .catch((error) => {
        console.error("Error deleting request:", error);
        alert("Failed to cancel the request. Please try again.");
      });


  };
 

  const handleVerify = async (provider) => {
    await axios
      .post("https://wepservicesonline.onrender.com/otp/otpverification", {
        customerEmail: email1,
        serviceProviderEmail: provider.email,
        otp: otp,
      })
      .then(async (response) => {
        if (response.status === 200) {
          alert(`Verified service provider: ${provider.Name}`);
          socket.emit("serviceAccepted", {
            serviceProviderEmail: provider.email,});
          setOtp("")

          await axios.post("https://wepservicesonline.onrender.com/customer/servicerecievedcount", { customerEmail: email1 })
            .then((response) => {
              if (response.status === 200) {
                //console.log(response);
                setServicesRecievedCount(response.data.servicesRecievedCount);

                const local = JSON.parse(localStorage.getItem("serviceProviderDetails"));
                // //console.log("yyyyyyyyyyyyyyyyyyyy",local)
                const updatedRequests = local.filter(
                  (provider) => provider.email !== provider.email
                );
                setRequests(updatedRequests);
                localStorage.setItem("serviceProviderDetails", JSON.stringify(updatedRequests));
                setserviceProviderLocation({ lat: null, lng: null });
              }
            })
            .catch((error) => {
              //console.log("Error incrementing service recieved count", error);
            });
        } else {
          alert("Enter valid OTP");
        }
      })
      .catch((error) => {
        console.error("Error verifying OTP:", error);
        alert("Enter valid otp");
      });
      setTimeout(() => {
        window.location.reload(); // Reload the page after 2 seconds
      }, 2000); // Adjust the delay as needed
  };
  socket.on("providerLocationUpdate", (data) => {
    //console.log("Provider location update:", data);
    const { lat, lng } = data;
    //console.log("Updated provider location:", lat, lng);
    // alert("Provider location updated!");
    setserviceProviderLocation({ lat, lng });
  })

  useEffect(() => {
    socket.on("requestCanceledbyprovider", (data) => {
      alert(`Request canceled of the service provider: ${data.providerEmail}`);
      const updatedRequests = requests.filter(
        (provider) => provider.email !== data.providerEmail
      );
      setRequests(updatedRequests);
      localStorage.setItem("serviceProviderDetails", JSON.stringify(updatedRequests));
    });
  
    return () => {
      socket.off("requestCanceled");
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#1f1f1f]">
  {/* Fixed Header */}
  <header className="bg-[#111] text-white text-base sm:text-lg md:text-xl px-4 sm:px-6 py-4 flex justify-between items-center shadow z-10 fixed w-full top-0 left-0">
    <div className="flex flex-col sm:flex-row sm:gap-3 items-start sm:items-center">
      <span className="font-semibold">Welcome, {name}</span>
      <span className="text-sm sm:text-base">
        Services Received: {servicesRecievedCount}, Rejected: {servicesRejectedCount}
      </span>
    </div>
    <button
      onClick={handleLogout}
      className="bg-red-500 cursor-pointer px-3 py-1 rounded hover:bg-red-700 transition text-white text-sm"
    >
      Logout
    </button>
  </header>

  {/* Scrollable Content */}
  <main className="mt-[80px] overflow-y-auto px-4 sm:px-6 pb-10">
    {/* Map */}
    <div className="w-full mb-8">
      <MapComponent
        customerLocation={location}
        providerLocation={serviceProviderlocation}
      />
    </div>

    {/* Service Options */}
    {requests.length === 0 && (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-2xl px-1 sm:px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            {[
              { type: "Electrician", label: "⚡ Electrician", color: "blue" },
              { type: "Plumber", label: "🔧 Plumber", color: "green" },
              { type: "Cook", label: "🍳 Cook", color: "orange" },
              { type: "Water Service", label: "💧 Water Service", color: "teal" },
            ].map((service) => (
              <div
                key={service.type}
                onClick={() => handleRequestService(service.type)}
                className={`bg-${service.color}-500 hover:bg-${service.color}-700
                text-white font-semibold text-xs sm:text-sm md:text-base lg:text-lg
                py-3 rounded-lg text-center cursor-pointer transition w-full`}
              >
                {service.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Service Provider Details */}
    <div className="w-full flex justify-center">
      <div className="text-white w-full max-w-4xl mt-10">
        {requests.length > 0 ? (
          requests.map((provider, index) => (
            <div key={index} className="mt-6 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
              <h2 className="text-lg sm:text-xl font-bold mb-2">Service Provider Details</h2>
              <p><strong>Name:</strong> {provider.Name || "N/A"}</p>
              <p><strong>Mobile:</strong> {provider.Mobile || "N/A"}</p>
              {/* <p><strong>Email:</strong> {provider.email || "N/A"}</p> */}
              {/* <p>
                <strong>Location:</strong>{" "}
                {provider?.currentLocation?.coordinates?.length === 2
                  ? `${provider.currentLocation.coordinates[0]}, ${provider.currentLocation.coordinates[1]}`
                  : "Location not available"}
              </p> */}
              <p><strong>Service Type:</strong> {provider.ServiceType || "N/A"}</p>

              <div className="mt-4">
                <label className="block mb-1">Enter OTP</label>
                <input
                  type="text"
                  className="border border-white rounded px-3 py-2 w-full bg-transparent text-white"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  onClick={() => handleVerify(provider)}
                  className="bg-green-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-green-700 transition w-full sm:w-auto"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleCancel(provider.email)}
                  className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-red-700 transition w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center mt-8">No service providers assigned yet.</p>
        )}
      </div>
    </div>
  </main>
</div>


  );
};

export default CustomerDashboard;