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

async function createAdmin() {
  const admin = await prisma.users.create({
    data: {
      firstname: "admin",
      lastname: "admin",
      email: "admin@test.com",
      password: sha256("Passord01"),
      role: Role.ADMIN,
      articles: {
        create: {
          title: "Hello world",
          content: "This is a test article",
        },
      },
    },
  });

  console.log(`${admin.firstname} has been created`);
}

async function createUsers() {
  const sales = await prisma.users.create({
    data: {
      firstname: "Saul",
      lastname: "Goodman",
      email: "saul@test.com",
      password: sha256("Passord01"),
      role: Role.SALES,
    },
  });

  const monteur = await prisma.users.create({
    data: {
      firstname: "Jesse",
      lastname: "Pinkman",
      email: "jesse@test.com",
      password: sha256("Passord01"),
      role: Role.MONTEUR,
    },
  });

  const customer = await prisma.users.create({
    data: {
      firstname: "Walter",
      lastname: "White",
      email: "walter@test.com",
      password: sha256("Passord01"),
      role: Role.CUSTOMER,
    },
  });

  console.log(`${sales.firstname} has been successfully created`);
  console.log(`${monteur.firstname} has been successfully created`);
  console.log(`${customer.firstname} has been successfully created`);
}

// function for encrypting password (message)
function sha256(message) {
  return crypto.createHash("sha256").update(message).digest("hex").toString();
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/login.html");
});

// auto gets pages
app.get("/:page", (req, res) => {
  const page = req.params.page;

  function Router(page) {
    res.sendFile(__dirname + `/pages/${page}.html`);
  }
  Router(page, req, res); // calls the function using the page from req params
});

// sets up port
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
