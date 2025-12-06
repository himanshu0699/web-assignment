/********************************************************************************
 *  WEB322 – Assignment 03
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Himanshu Khandelwal   Student ID: 104760244   Date: 2025/12/05
 *
 *  Published URL:
 *
 ********************************************************************************/

require("dotenv").config();
const express = require("express");
const path = require("path");
const clientSessions = require("client-sessions");

const {
  initialize,
  getAllProjects,
  getProjectsBySector,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
  getAllSectors,
} = require("./modules/projects");

const app = express();
const PORT = process.env.PORT || 8080;

/* ---------- View engine & static ---------- */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // for form POSTs

/* ---------- Session ---------- */
app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.SESSIONSECRET || "default_session_secret",
    duration: 30 * 60 * 1000, // 30 min
    activeDuration: 5 * 60 * 1000, // extend 5 min on activity
  })
);

/* expose session to templates */
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/* ---------- Auth helper ---------- */
function ensureLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

/* ---------- DB init ---------- */
initialize()
  .then(() => console.log("Sequelize synced"))
  .catch((err) => console.error("Sequelize init error:", err));

/* ====================================================================== */
/*  Public pages                                                          */
/* ====================================================================== */
app.get("/", (_, res) => res.render("home"));
app.get("/about", (_, res) => res.render("about"));

/* ---------------------------------------------------------------------- */
/*  Project listings / details                                            */
/* ---------------------------------------------------------------------- */
app.get("/solutions/projects", (req, res) => {
  const data = req.query.sector
    ? getProjectsBySector(req.query.sector)
    : getAllProjects();
  data
    .then((projects) => res.render("projects", { projects }))
    .catch((err) => res.status(500).render("500", { message: err }));
});

app.get("/solutions/projects/:id", (req, res) => {
  getProjectById(req.params.id)
    .then((project) => res.render("project", { project }))
    .catch((err) => res.status(404).render("404", { message: err }));
});

/* ====================================================================== */
/*  Part A – CRUD (protected)                                             */
/* ====================================================================== */
app.get("/solutions/addProject", ensureLogin, (req, res) => {
  getAllSectors()
    .then((sectors) => res.render("addProject", { sectors, message: "" }))
    .catch((err) => res.render("500", { message: err }));
});

app.post("/solutions/addProject", ensureLogin, (req, res) => {
  addProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) =>
      getAllSectors().then((sectors) =>
        res.render("addProject", { sectors, message: err })
      )
    );
});

app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
  Promise.all([getProjectById(req.params.id), getAllSectors()])
    .then(([project, sectors]) =>
      res.render("editProject", { project, sectors, message: "" })
    )
    .catch((err) => res.render("500", { message: err }));
});

/*  ⚠️  update route now accepts :id so the form can POST here directly */
app.post("/solutions/editProject/:id", ensureLogin, (req, res) => {
  req.body.id = req.params.id; // ensure id is present for updateProject
  updateProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) =>
      Promise.all([getProjectById(req.params.id), getAllSectors()]).then(
        ([project, sectors]) =>
          res.render("editProject", { project, sectors, message: err })
      )
    );
});

/* GET & POST delete helpers – either link or form */
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => res.render("500", { message: err }));
});

app.post("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => res.render("500", { message: err }));
});

/* ====================================================================== */
/*  Part B – Very-simple auth                                             */
/* ====================================================================== */
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login", { message: "", userName: "" });
});

app.post("/login", (req, res) => {
  const { userName, password } = req.body;
  if (!userName || !password)
    return res.render("login", {
      message: "Please enter both fields",
      userName,
    });

  const valid = {
    userName: "user1",
    password: "password1",
    email: "user1@example.com",
  };

  if (userName === valid.userName && password === valid.password) {
    req.session.user = { userName: valid.userName, email: valid.email };
    return res.redirect("/dashboard");
  }
  res.render("login", { message: "Invalid credentials", userName });
});

app.get("/dashboard", ensureLogin, (req, res) =>
  res.render("dashboard", { user: req.session.user })
);

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/login");
});

/* ====================================================================== */
/*  Fallback 404                                                          */
/* ====================================================================== */
app.use((_, res) =>
  res.status(404).render("404", { message: "We could not find that page." })
);

module.exports = app;
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`Server running → http://localhost:${PORT}`)
  );
}
