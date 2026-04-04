// models/group.js
const { v4: uuidv4 } = require("uuid");

class Group {
  constructor({ name, creator, members }) {
    this.id = uuidv4();
    this.name = name;
    this.creator = creator;
    this.members = members;
  }

  // Validate group data
  static validate({ name, creator, members }) {
    if (!name || !creator || !Array.isArray(members)) {
      return "name, creator, and members array are required";
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.name || !member.phone) {
        return `Each member must have name and phone (index ${i})`;
      }
    }

    return null; // valid
  }
}

module.exports = Group;
