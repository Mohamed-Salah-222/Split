// routes/groups.js
const express = require("express");
const router = express.Router();
const Group = require("../models/group");

// In-memory storage
let groups = [];

// Create a group
router.post("/", (req, res) => {
  const error = Group.validate(req.body);
  if (error) return res.status(400).json({ error });

  const newGroup = new Group(req.body);
  groups.push(newGroup);

  res.status(201).json({ message: "Group created", group: newGroup });
});

// Get all groups
router.get("/", (req, res) => {
  res.json(groups);
});

// Get a single group by ID
router.get("/:id", (req, res) => {
  const group = groups.find((g) => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  res.json(group);
});

// Update a group
router.patch("/:id", (req, res) => {
  const group = groups.find((g) => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const { name, creator, members } = req.body;

  if (name) group.name = name;
  if (creator) group.creator = creator;

  if (members) {
    const error = Group.validate({
      name: group.name,
      creator: group.creator,
      members,
    });
    if (error) return res.status(400).json({ error });
    group.members = members;
  }

  res.json({ message: "Group updated", group });
});

// Delete a group
router.delete("/:id", (req, res) => {
  const index = groups.findIndex((g) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Group not found" });

  const deletedGroup = groups.splice(index, 1);
  res.json({ message: "Group deleted", group: deletedGroup[0] });
});

module.exports = router;
