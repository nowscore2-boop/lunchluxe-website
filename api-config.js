window.LUNCHLUXE_API_URL = location.origin === "http://localhost:8000"
  ? "http://localhost:3000"
  : location.origin === "https://www.lunchluxe.com" ? location.origin : "";
