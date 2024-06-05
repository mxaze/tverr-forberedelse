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
      password: sha256("admin"),
      role: Role.ADMIN
    },
  });

  const sales = await prisma.users.create({
    data: {
      firstname: "saul",
      lastname: "goodman",
      email: "saul@test.com",
      password: sha256("sales"),
      role: Role.SALES
    },
  });

  const monteur = await prisma.users.create({
    data: {
      firstname: "jesse",
      lastname: "pinkman",
      email: "jesse@test.com",
      password: sha256("monteur"),
      role: Role.MONTEUR
    }
  });

  const customer = await prisma.users.create({
    data: {
      firstname: "walter",
      lastname: "white",
      email: "walter@test.com",
      password: sha256("customer"),
      role: Role.CUSTOMER,
    },
  });

  console.log(`${admin.firstname} has been created`);
  console.log(`${sales.firstname} has been successfully created`);
  console.log(`${monteur.firstname} has been successfully created`);
  console.log(`${customer.firstname} has been successfully created`);
}
// write createUsers() under to create users when you want to create them.

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

// write createArticles() under to create articles when you want to create them.

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
// login post
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Clear the id
  res.clearCookie("id");

  const userInfo = await prisma.users.findFirst({
    where: {
      email: email,
      password: sha256(password),
    },
  });

  // if there is userinformation (account actually exists in database)
  if (userInfo) {
    // Set the user's id as a cookie
    res.cookie("id", userInfo.id.toString());

    // Redirect the user to the dashboard page that corresponds to their role
    res.redirect("/dashboard");
  } else {
    // If the user is not found, redirect back to the login page
    res.redirect("/");
  }
});

app.get("/dashboard", async (req, res) => {
  const id = parseInt(req.cookies.id); // gets the id from the cookie

  const user = await prisma.users.findFirst({ // gets the user by the id
    where: {
      id: id,
    },
  });

  // If the user is not found, redirect to the login page
  if (!user) {
    return res.redirect("/");
  }

  // Redirect the user to the dashboard page that corresponds to their role
  switch (user.role) {
    case Role.ADMIN:
      return res.redirect("/dashboard/admin");
    case Role.SALES:
      return res.redirect("/dashboard/sales");
    case Role.MONTEUR:
      return res.redirect("/dashboard/monteur");
    case Role.CUSTOMER:
      return res.redirect("/dashboard/customer");
    default:
      return res.redirect("/");
  }
});

app.get("/dashboard/admin", (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard/admin.html");
});

app.get("/dashboard/sales", (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard/sales.html");
});

app.get("/dashboard/monteur", (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard/monteur.html");
});

app.get("/dashboard/customer", (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard/customer.html");
});

// gets index and sends login
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/login.html");
});

// gets articles
app.get("/api/articles", async (req, res) => {
  const articles = await prisma.article.findMany(); // finds all articles in the database

  res.json(articles) // sends the articles as json
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
