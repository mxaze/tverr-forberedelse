const { PrismaClient, Role } = require("@prisma/client");
const express = require("express");
const app = express();
const prisma = new PrismaClient();
const cookieparser = require("cookie-parser");
const crypto = require("crypto");
const { join } = require("path");

app.use(express.json());
app.use(cookieparser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// does so that you can access the pages folder iwth pages and css folder with css
app.use(express.static(join(__dirname, "css")));
app.use(express.static(join(__dirname, "pages")));

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userData = await prisma.users.findFirst({
    where: {
      email: email,
      password: sha256(password),
    },
  });

  if (userData) {
    res.cookie("token", userData.token);
    const role = userData.role;
    res.redirect(`/${role}`);
  } else {
    res.redirect("/");
  }
});

// function for encrypting password (message)
function sha256(message) {
  return crypto.createHash("sha256").update(message).digest("hex").toString();
}

const pageroutes = {
  admin: (req, res) => {
    res.sendFile(__dirname + "/pages/admin/index.html");
  },
  login: (req, res) => {
    res.sendFile(__dirname + "/pages/login.html");
  },
};

// auto gets pages from page array
app.get("/:page", (req, res) => {
  const page = req.params.page;
  pageroutes[page](req, res);
});

// sets up port
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
