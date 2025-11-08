/********************************************************************************
 *  WEB322 – Assignment 02
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Himanshu Khandelwal   Student ID: 104760244   Date: 2025/11/07
 *
 *  Published URL: __________________________________________
 *
 ********************************************************************************/

const express = require("express");
const path = require("path");
const projectData = require("./modules/projects");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

projectData
  .initialize()
  .then(() => console.log("Project data initialized"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => res.render("home"));
app.get("/about", (req, res) => res.render("about"));

app.get("/solutions/projects", (req, res) => {
  const sector = req.query.sector;
  if (sector) {
    projectData
      .getProjectsBySector(sector)
      .then((projects) => res.render("projects", { projects }))
      .catch(() =>
        res
          .status(404)
          .render("404", { message: `No projects found for sector: ${sector}` })
      );
  } else {
    projectData
      .getAllProjects()
      .then((projects) => res.render("projects", { projects }))
      .catch(() =>
        res.status(404).render("404", { message: "No projects available." })
      );
  }
});

app.get("/solutions/projects/:id", (req, res) => {
  const id = req.params.id;
  projectData
    .getProjectById(id)
    .then((project) => res.render("project", { project }))
    .catch((err) => res.status(404).render("404", { message: err }));
});

app.use((req, res) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for.",
  });
});

module.exports = app;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Local: http://localhost:${PORT}`));
}
