// modules/projects.js
const projectData = require("../data/projectData");
const sectorData = require("../data/sectorData");

let projects = [];

function initialize() {
  return new Promise((resolve, reject) => {
    try {
      projects = [];
      projectData.forEach((p) => {
        const s = sectorData.find((x) => Number(x.id) === Number(p.sector_id));
        projects.push({ ...p, sector: s ? s.sector_name : "Unknown" });
      });
      resolve(); // no data needed on resolve
    } catch (err) {
      reject("unable to initialize projects");
    }
  });
}

function getAllProjects() {
  return new Promise((resolve, reject) => {
    if (projects.length) resolve(projects);
    else reject("no projects available");
  });
}

function getProjectById(projectId) {
  return new Promise((resolve, reject) => {
    const p = projects.find((x) => Number(x.id) === Number(projectId));
    p ? resolve(p) : reject("unable to find requested project");
  });
}

function getProjectsBySector(sector) {
  return new Promise((resolve, reject) => {
    const q = String(sector || "").toLowerCase();
    const list = projects.filter((x) =>
      String(x.sector || "")
        .toLowerCase()
        .includes(q)
    );
    list.length ? resolve(list) : reject("unable to find requested projects");
  });
}

module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
};
