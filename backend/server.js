// server.js
const express = require("express");
const cors = require("cors");
const groupsRoutes = require("./routes/groups");

const app = express();
app.use(cors());
app.use(express.json());

// Use groups routes
app.use("/groups", groupsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
