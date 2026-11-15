window.LUNCHLUXE_API_URL = location.origin === "http://localhost:8000"
  ? "http://localhost:3000"
  : ["https://lunchluxe.com", "https://www.lunchluxe.com"].includes(location.origin) ? location.origin : "";
