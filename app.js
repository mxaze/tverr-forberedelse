const { PrismaClient, Role } = require("@prisma/client");
const express = require("express");
const app = express();
const prisma = new PrismaClient();
const cookieparser = require("cookie-parser");
const crypto = require("crypto");
const { join } = require("path");

async function createAdmin() {
  const admin = await prisma.users.create({
    data: {
      firstname: "admin",
      lastname: "user",
      email: "admin@test.com",
      password: sha256("Passord01"),
      role: Role.ADMIN,
    },
  });

  console.log(`${admin.firstname} has been created`);
}

async function createUsers() {
  const admin = await prisma.users.create({
    data: {
      firstname: "tuco",
      lastname: "salamanca",
      email: "tuco@test.com",
      password: sha256("Passord01"),
      role: Role.ADMIN
    },
  });

  const sales = await prisma.users.create({
    data: {
      firstname: "saul",
      lastname: "goodman",
      email: "saul@test.com",
      password: sha256("Passord01"),
      role: Role.SALES
    },
  });

  const monteur = await prisma.users.create({
    data: {
      firstname: "jesse",
      lastname: "pinkman",
      email: "jesse@test.com",
      password: sha256("Passord01"),
      role: Role.MONTEUR
    }
  });

  const customer = await prisma.users.create({
    data: {
      firstname: "walter",
      lastname: "white",
      email: "walter@test.com",
      password: sha256("Passord01"),
      role: Role.CUSTOMER,
    },
  });

  console.log(`${admin.firstname} has been created`);
  console.log(`${sales.firstname} has been successfully created`);
  console.log(`${monteur.firstname} has been successfully created`);
  console.log(`${customer.firstname} has been successfully created`);
}

// function for creating articles, just write createArticles() under
async function createArticles() {
  const adminArticle = await prisma.article.create({
    data: {
      title: "Nyeste solcellepaneler!",
      content: "This is article made by admin blabla",
    }
  });

  const salesArticle = await prisma.article.create({
    data: {
      title: "Sales solcellepaneler!",
      content: "Artikkel lagd av salgsavdelingen",
    }
  });

  const monteurArticle = await prisma.article.create({
    data: {
      title: "Monterings artikkel",
      content: "Les hvordan vi monterte alt!",
    }
  });

  console.log(`${adminArticle.title} has been created`);
  console.log(`${salesArticle.title} has been created`);
  console.log(`${monteurArticle.title} has been created`);
}

// function for encrypting password (message)
function sha256(message) {
  return crypto.createHash("sha256").update(message).digest("hex").toString();
}

// Middleware
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(join(__dirname, "css")));
app.use(express.static(join(__dirname, "pages")));

// login post
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userInfo = await prisma.users.findFirst({
    where: {
      email: email,
      password: sha256(password),
    },
  });

  if (userInfo) {
    // Generate a new token
    const token = crypto.randomBytes(64).toString("hex");

    // Update the user record with the new token
    await prisma.users.update({
      where: {
        id: userInfo.id,
      },
      data: {
        token: token,
      },
    });

    // Set the new token as a cookie
    res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24 });
    res.redirect("/dashboard");
  } else {
    res.redirect("/");
  }
});

// gets dashboard and sends user the right dashboard based on role
app.get("/dashboard", async (req, res) => {
  const token = req.cookies.token;

  const user = await prisma.users.findFirst({
    where: {
      token: token,
    },
  });

  if (!user) {
    return res.redirect("/");
  }

  const role = user.role;

  res.sendFile(__dirname + `/pages/dashboard/${role}.html`);
});

// gets index and sends login
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/login.html");
});

// gets articles
app.get("/api/articles", async (req, res) => {
  const articles = await prisma.article.findMany();

  res.json(articles)
})

//get article by id
app.get("/api/article/:id", async (req, res) => {
  const article = await prisma.article.findFirst({
    where: {
      id: parseInt(req.params.id)
    }
  });

  res.json(article);
});

// sends create article page
app.get("/dashboard/article/create", async (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard/article/create.html");
});

// sends edit article page
app.get("/dashboard/article/:id", async (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard/article/id.html");
});

// logs out by clearing cookie and redirecting to login
app.post("/logout", async (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.post("/createArticle", async (req, res) => {
  const { title, content } = req.body;

  const article = await prisma.article.create({
    data: {
      title: title,
      content: content,
    },
  });

  res.redirect("/dashboard");
});

// sets up port
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
