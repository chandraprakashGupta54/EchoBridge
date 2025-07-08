let coords = [72.8777, 19.0760];

const map = L.map('map').setView(coords, 13);
L.tileLayer("https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=WyQVIak1fVFzBm92eoGM", {
  tileSize: 512,
  zoomOffset: -1,
  attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
}).addTo(map);

// Dummy NGO data (will use real data or API later)
// const ngos = [
//   { name: "Helping Hands NGO", lat: 19.0896, lng: 72.8656 },
//   { name: "Hope Foundation", lat: 18.9602, lng: 72.8066 },
//   { name: "Care India", lat: 19.2012, lng: 72.8442 },
//   { name: "Distant NGO", lat: 18.5204, lng: 73.8567 } // Pune - out of range
// ];

async function fetchNGOsFromNominatim(lat, lng, radiusKm = 30) {
  const base = `https://nominatim.openstreetmap.org/search`;
  const latOffset = radiusKm / 111;
  const lngOffset = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const viewbox = [
    lng - lngOffset,
    lat + latOffset,
    lng + lngOffset,
    lat - latOffset
  ].join(',');

  const url = `${base}?format=json&q=sanstha&bounded=1&limit=50&viewbox=72.7,19.2,73.2,18.9&email=503manashsvjc@gmail.com`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Fetched NGOs:", data);
    return data; // contains lat, lon, display_name
  } catch (error) {
    console.error("Failed to fetch NGOs:", error);
    return [];
  }
}

// async function fetchNGOsFromDarpan(stateCode = "31", districtName = "Mumbai") {
//   try {
//     const res = await fetch("/darpan", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: new URLSearchParams({
//         state: "27",
//         district: "Mumbai",
//         limit: 50,
//         start: 0
//       })
//     });
//     const json = await res.json();
//     // Example structure: { ngos: [ { name, address, work_area, ... } ] }
//     console.log("Fetched Darpan NGOs:", json);
//     return json.ngos || [];
//   } catch (err) {
//     console.error("Error fetching Darpan NGOs", err);
//     return [];
//   }
// }


// Calculate distance in km using Haversine formula
function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Main function to show everything
function showNearby(lat, lng) {
  map.setView([lat, lng], 12);

  // Red marker for user's location
  const userIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  // Add a marker for the user's location
  L.marker([lat, lng], { icon: userIcon })
    .addTo(map)
    .bindPopup("📍 You are here")
    .openPopup();


  // Show NGOs as blue circles within 30km
  // ngos.forEach(ngo => {
  //   const distance = getDistance(coords[0], coords[1], ngo.lat, ngo.lng);
  //   if (distance <= 20) {
  //     L.circle([ngo.lat, ngo.lng], {
  //       radius: 500, // NGO highlight size in meters
  //       color: 'green',
  //       fillColor: '#3fa9f5',
  //       fillOpacity: 0.4
  //     })
  //       .addTo(map)
  //       .bindPopup(`${ngo.name}<br>📍 ${distance.toFixed(1)} km away`);
  //   }
  // });

  fetchNGOsFromNominatim(lat, lng).then(results => {
    results.forEach(ngo => {
      const ngoLat = parseFloat(ngo.lat);
      const ngoLng = parseFloat(ngo.lon);
      const distance = getDistance(lat, lng, ngoLat, ngoLng);

      if (distance <= 20) {
        L.circle([ngoLat, ngoLng], {
          radius: 200,
          color: 'blue',
          fillColor: '#3fa9f5',
          fillOpacity: 0.4
        }).addTo(map)
          .bindPopup(`${ngo.display_name}<br>📍 ${distance.toFixed(1)} km away`);
      }
    });
  });

  // fetchNGOsFromDarpan("27", "Mumbai").then(list => {
  //   list.forEach(ngo => {
  //     const [ngoLat, ngoLng] = myGeocode(ngo.address);
  //     const distance = getDistance(lat, lng, ngoLat, ngoLng);
  //     if (distance <= 30) {
  //       L.circle([ngoLat, ngoLng], {
  //         radius: 200,
  //         color: 'blue',
  //         fillColor: '#3fa9f5',
  //         fillOpacity: 0.4
  //       })
  //         .addTo(map)
  //         .bindPopup(`${ngo.name}<br>${distance.toFixed(1)} km away`);
  //     }
  //   });
  // });

}

// Use the browser's geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    position => {

      coords = [
        position.coords.latitude,
        position.coords.longitude,
      ];

      showNearby(coords[0], coords[1]);

      // // Center map on user location
      // map.setView(coords, 15);

      // // Add a marker at the location
      // const marker = L.marker(coords, { icon: greenIcon }).addTo(map).bindPopup(`<h4>${title}</h4><p>Book for more details</p>`).openPopup();

    },
    error => {
      alert("Location access denied or not available.");
      const marker = L.marker(coords, { icon: greenIcon }).addTo(map).bindPopup(`<h4>${title}</h4><p>Book for more details</p>`).openPopup();
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
  const marker = L.marker(coords, { icon: greenIcon }).addTo(map).bindPopup(`<h4>${title}</h4><p>Book for more details</p>`).openPopup();
}
