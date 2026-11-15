// Replace the empty production value with the deployed LunchLuxe API origin.
window.LUNCHLUXE_API_URL = location.origin === "http://localhost:8000" ? "http://localhost:3000" : "";
