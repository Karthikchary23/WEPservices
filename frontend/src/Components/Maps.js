"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const defaultCenter = (customerLocation, providerLocation) => {
  if (customerLocation?.lat && customerLocation?.lng) {
    return [customerLocation.lat, customerLocation.lng];
  } else if (providerLocation?.lat && providerLocation?.lng) {
    return [providerLocation.lat, providerLocation.lng];
  }
  return [17.385044, 78.486671]; // Fallback to original default location
};

const Routing = ({ L, customerLocation, providerLocation, setDistance }) => {
  const map = useMap();

  useEffect(() => {
    if (
      map && L && L.Routing &&
      customerLocation?.lat && customerLocation?.lng &&
      providerLocation?.lat && providerLocation?.lng
    ) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(customerLocation.lat, customerLocation.lng),
          L.latLng(providerLocation.lat, providerLocation.lng)
        ],
        routeWhileDragging: true,
        show: true,
        lineOptions: {
          styles: [{ color: "blue", weight: 4 }]
        },
        createMarker: () => null
      }).addTo(map);

      routingControl.on("routesfound", (e) => {
        const summary = e.routes[0].summary;
        setDistance(summary.totalDistance / 1000);
      });

      return () => {
        map.removeControl(routingControl);
      };
    }
  }, [map, L, customerLocation, providerLocation, setDistance]);

  return null;
};

const Map = ({ providerLocation, customerLocation }) => {
  const [L, setL] = useState(null);
  const [distance, setDistance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically import Leaflet
      import("leaflet").then((leaflet) => {
        import("leaflet-routing-machine").then(() => {
          setL(leaflet.default);
        });
      });

      // Get the user's geolocation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        () => {
          setUserLocation(defaultCenter(customerLocation, providerLocation));
        }
      );
    }
  }, [customerLocation, providerLocation]);

  if (!L || !userLocation) return <div style={{ textAlign: "center", padding: "20px"  }}><p className="text-white text-lg font-bold mb-2">Loading map...</p>
    </div>;

  const center = providerLocation?.lat && providerLocation?.lng && customerLocation?.lat && customerLocation?.lng
    ? [
        (providerLocation.lat + customerLocation.lat) / 2,
        (providerLocation.lng + customerLocation.lng) / 2
      ]
    : userLocation; // Use user's location if no provider or customer data

  const providerIcon = new L.Icon({
    iconUrl: "/service.png",
    iconRetinaUrl: "/service.png",
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30]
  });

  const customerIcon = new L.Icon({
    iconUrl: "/maps.png",
    iconRetinaUrl: "/maps.png",
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30]
  });

  return (
    <div className="w-full flex justify-center items-center mt-6 px-2">
      <div className="relative w-full max-w-7xl h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[65vh] rounded-lg overflow-hidden shadow-md">
        <MapContainer
          style={{ width: "100%", height: "100%" }}
          center={center}
          zoom={13}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {providerLocation?.lat && providerLocation?.lng && (
            <Marker icon={providerIcon} position={[providerLocation.lat, providerLocation.lng]}>
              <Popup>Service Provider Location</Popup>
            </Marker>
          )}
          {customerLocation?.lat && customerLocation?.lng && (
            <Marker icon={customerIcon} position={[customerLocation.lat, customerLocation.lng]}>
              <Popup>Customer Location</Popup>
            </Marker>
          )}
          {providerLocation && customerLocation && (
            <Routing
              L={L}
              customerLocation={customerLocation}
              providerLocation={providerLocation}
              setDistance={setDistance}
            />
          )}
        </MapContainer>

        {distance && (
          <div className="absolute bottom-3 left-3 bg-white text-black text-sm px-3 py-1 rounded shadow">
            Distance: {distance.toFixed(2)} km
          </div>
        )}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Map), { ssr: false });
