const { PrismaClient, Role } = require("@prisma/client");
const express = require("express");
const app = express();
const prisma = new PrismaClient();
const cookieparser = require("cookie-parser");
const crypto = require("crypto");

app.use(express.json()); 
app.use(cookieparser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const userData = await prisma.users.findFirst({
    where: {
      email: email,
      password: sha256(password),
    },
  });

  if (userData) {
    switch (userData.role === Role.ADMIN) {
      case true:
        res.cookie("token", userData.token);
        res.redirect("/admin");
        break;
      case false:
        res.cookie("token", userData.token);
        res.redirect("/welcome");
        break;
    }
  } else {
    res.redirect("/");
  }

  if (userData) {
    console.log(userData.firstname + " " + "has been created");
  }
});

// function for encrypting password (message)
function sha256(message) {
  return crypto.createHash("sha256").update(message).digest("hex").toString();
}

// does so that you can access the pages folder iwth pages and css folder with css
app.use(express.static(join(__dirname, "css")));
app.use(express.static(join(__dirname, "pages")));

// sets up port
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});