const statusElement = document.getElementById("status");
const restaurantList = document.getElementById("restaurant-list");
const radiusForm = document.getElementById("radius-form");
const radiusInput = document.getElementById("radius");
const includeChainsCheckbox = document.getElementById("include-chains");
const excludeChainsCheckbox = document.getElementById("local-only");

let userLocation = null;

// Known chain restaurants
const knownChains = [
    "McDonald's", "Pizza Hut", "KFC", "Starbucks", "Subway",
    "Burger King", "Chick-Fil-A", "Papa John's", "Jack in the Box",
    "Raising Cane's Chicken Fingers", "Whataburger", "In-N-Out Burger",
    "Wendy's", "Wing Daddy's Sauce House", "Freddy's Frozen Custard & Steakburgers",
    "Taco Bell", "IHOP", "Peter Piper Pizza", "Famous Dave's", "Chuck E. Cheese",
    "P.F. Chang's", "la Madeline", "Grimaldi's"
];

excludeChainsCheckbox.addEventListener("change", () => {
    if(includeChainsCheckbox.checked){
        includeChainsCheckbox.checked = false;
    } else {
        includeChainsCheckbox.checked;
    }
});

// Fetch user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            statusElement.textContent = "Specify a search radius and preferences to find nearby restaurants.";
        },
        (error) => {
            console.error("Geolocation error:", error.message);
            statusElement.textContent = "Unable to retrieve your location.";
        }
    );
} else {
    statusElement.textContent = "Geolocation is not supported by this browser.";
}

// Fetch restaurants from Overpass API
async function fetchRestaurants(latitude, longitude, radiusMeters) {
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=restaurant](around:${radiusMeters},${latitude},${longitude});out;`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.elements) {
            // Filter out unnamed restaurants here
            return data.elements
                .filter((restaurant) => restaurant.tags.name) // Exclude unnamed
                .map((restaurant) => ({
                    name: restaurant.tags.name,
                    cuisine: restaurant.tags.cuisine || "unknown", // Get cuisine type
                    lat: restaurant.lat,
                    lon: restaurant.lon,
                }));
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
}

// Fetch address for a restaurant using reverse geocoding
async function fetchAddress(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.display_name || "Address not found";
    } catch (error) {
        console.error(`Error fetching address for (${lat}, ${lon}):`, error);
        return "Address not found";
    }
}

// Filter restaurants based on selected checkboxes
function filterRestaurants(restaurants) {
    let filteredRestaurants = restaurants;

    // Filter out chain restaurants if "Exclude Chains" is checked
    if (excludeChainsCheckbox.checked) {
        filteredRestaurants = filteredRestaurants.filter((restaurant) => {
            const isChain = knownChains.some((chain) =>
                restaurant.name.toLowerCase().includes(chain.toLowerCase())
            );
            return !isChain; // Exclude chains
        });
    }

    return filteredRestaurants;
}

// Render restaurants with their addresses in the list
async function displayRestaurants(restaurants) {
    restaurantList.innerHTML = ""; // Clear previous results

    if (restaurants.length === 0) {
        // Show "No restaurants found" message
        statusElement.textContent = "No restaurants found for the given radius and filters.";
        return;
    }

    statusElement.textContent = `Found ${restaurants.length} restaurants nearby.`;

    for (const restaurant of restaurants) {
        const address = await fetchAddress(restaurant.lat, restaurant.lon);
        const listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${restaurant.name}</strong><br><span>${address}</span>`;
        restaurantList.appendChild(listItem);
    }
}

// Handle form submission for disnance input
radiusForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!userLocation) {
        statusElement.textContent = "Please allow location access to use this feature.";
        return;
    }

    const radiusMiles = parseFloat(radiusInput.value);
    if (isNaN(radiusMiles) || radiusMiles < 1) {
        statusElement.textContent = "Please enter a valid radius in miles.";
        return;
    }

    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    statusElement.textContent = "Searching for restaurants...";
    const allRestaurants = await fetchRestaurants(userLocation.latitude, userLocation.longitude, radiusMeters);
    const filteredRestaurants = filterRestaurants(allRestaurants);
    displayRestaurants(filteredRestaurants);
});

// Event listeners for presses on different tabs
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tabs ul li");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));

            tab.classList.add("active");

            tabContents.forEach((content) => content.classList.remove("active"));

            // Show content for the selected tab
            const selectedSection = document.getElementById(`${tab.id.split('-')[1]}-section`);
            if (selectedSection) {
                selectedSection.classList.add("active");
            }
        });
    });
});
 
// Report about how much they give back
// Differentiate from Google Maps
// Show reviews (Stars)
// Dropdowns for locations
// Lifestyle is key; don't make too broad
// "Current Best Things To Do"
// CCPA and HIPPA Compliant