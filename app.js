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
      role: Role.ADMIN,
      articles: {
        create: {
          title: "Hello world",
          content: "This is a test article",
        },
      },
    },
  });
  
  const sales = await prisma.users.create({
    data: {
      firstname: "saul",
      lastname: "goodman",
      email: "saul@test.com",
      password: sha256("Passord01"),
      role: Role.SALES,
      articles: {
        create: {
          title: "SALES ARTICLE",
          content: "This is a test article",
        },
      },
    },
  });

  const monteur = await prisma.users.create({
    data: {
      firstname: "jesse",
      lastname: "pinkman",
      email: "jesse@test.com",
      password: sha256("Passord01"),
      role: Role.MONTEUR,
      articles: {
        create: {
          title: "MONTEUR ARTICLE",
          content: "This is a test article",
        },
      },
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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/login.html");
});

app.get("/api/articles", async (req, res) => {
  const articles = await prisma.article.findMany();

  res.json(articles)
})

// sets up port
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
