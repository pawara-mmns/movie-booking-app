import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in leaflet with bundlers
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const cinemas = [
    { id: 1, name: "CineSphere Colombo", position: [6.9271, 79.8612], address: "Colombo City Centre" },
    { id: 2, name: "CineSphere Kandy", position: [7.2906, 80.6337], address: "Kandy City Centre" },
    { id: 3, name: "CineSphere Galle", position: [6.0535, 80.2210], address: "Galle Fort" },
    { id: 4, name: "CineSphere Negombo", position: [7.2088, 79.8356], address: "Negombo Beach Road" },
];

const CinemaMap = () => {
    return (
        <div className="w-full h-[500px] rounded-xl overflow-hidden glass-panel border border-white/10 relative z-0">
            <MapContainer
                center={[7.8731, 80.7718]}
                zoom={8}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {cinemas.map((cinema) => (
                    <Marker key={cinema.id} position={cinema.position}>
                        <Popup>
                            <div className="p-2 min-w-[150px]">
                                <h3 className="font-bold text-gray-900">{cinema.name}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin size={12} />
                                    {cinema.address}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[500] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-xs text-black">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                    <MapPin className="text-primary" size={16} />
                    Our Locations
                </h4>
                <p className="text-sm text-gray-600">
                    Visit one of our premium cinema halls across Sri Lanka for an unforgettable experience.
                </p>
            </div>
        </div>
    );
};

export default CinemaMap;
