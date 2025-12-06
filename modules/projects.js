/************************************************************
 * modules/projects.js  – Sequelize data helpers
 ************************************************************/
require("dotenv").config(); // ← add this line
const { Sequelize, DataTypes } = require("sequelize");
const projectData = require("../data/projectData.json");
const sectorData = require("../data/sectorData.json");

/* ─── Sequelize connection ──────────────────────────────── */
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectOptions: {
      ssl:
        process.env.DB_HOST !== "localhost"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
  }
);

/* ─── Models ─────────────────────────────────────────────── */
/* Adjust fields / datatypes to match your real DB schema.   */
const Sector = sequelize.define("Sector", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
});

const Project = sequelize.define("Project", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  summary_short: { type: DataTypes.TEXT, allowNull: false },
  intro_short: { type: DataTypes.TEXT },
  sector: { type: DataTypes.STRING },
  sector_id: { type: DataTypes.INTEGER },
});

/* ─── Relationships (optional) ───────────────────────────── */
// Project.belongsTo(Sector, { foreignKey: "sector_id" });

/* ─── Initialize (sync) ─────────────────────────────────── */
function initialize() {
  return sequelize.sync();
}

/* ─── Queries ───────────────────────────────────────────── */
function getAllProjects() {
  return Project.findAll({ order: [["id", "ASC"]] });
}

const { Op } = require("sequelize");

/* override the old version */
function getProjectsBySector(sectorName) {
  return Project.findAll({
    where: {
      sector: { [Op.iLike]: sectorName.trim() }, // case-insensitive match
      // use `%${sectorName.trim()}%` if you want substring matching
    },
    order: [["id", "ASC"]],
  });
}

function getProjectById(id) {
  return Project.findByPk(id);
}

/* ─── CRUD helpers for Part A ───────────────────────────── */
function addProject(projectData) {
  return Project.create(projectData)
    .then(() => {})
    .catch((err) => Promise.reject(err.errors[0].message));
}

function updateProject(projectData) {
  return Project.update(projectData, { where: { id: projectData.id } })
    .then(() => {})
    .catch((err) => Promise.reject(err.errors[0].message));
}

function deleteProject(id) {
  return Project.destroy({ where: { id } })
    .then(() => {})
    .catch((err) => Promise.reject(err.errors[0].message));
}

function getAllSectors() {
  return Sector.findAll({ order: [["name", "ASC"]] });
}

/* ─── Exports ───────────────────────────────────────────── */
module.exports = {
  initialize,
  getAllProjects,
  getProjectsBySector,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
  getAllSectors,
};

/*sequelize
  .sync()
  .then(async () => {
    try {
      await Sector.bulkCreate(sectorData);
      await Project.bulkCreate(projectData);
      await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('"Sectors"', 'id'), (SELECT MAX(id) FROM "Sectors"))`
      );
      await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('"Projects"', 'id'), (SELECT MAX(id) FROM "Projects"))`
      );
      console.log("-----");
      console.log("data inserted successfully");
    } catch (err) {
      console.log("-----");
      console.log(err.message);
      // NOTE: If you receive the error:
      // insert or update on table "Projects" violates foreign key constraint "Projects_sector_id_fkey"
      // it means a project’s sector_id doesn’t exist in sectorData.
      // Delete the tables, fix the JSON, and re-run.
    }
    process.exit();
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });*/
