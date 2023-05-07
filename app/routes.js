const fetch = require('node-fetch');

module.exports = function (app, passport, db) {
  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function (req, res) {
    res.render("index.ejs");
  });

  // PROFILE SECTION =========================
  app.get("/profile", isLoggedIn, function (req, res) {
    const currentUser = req.user.local.email

    db.collection("social-posts")
      .find({ user: currentUser })
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("profile.ejs", {
          user: req.user.local,
        });
      });
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout(() => {
      console.log("User has logged out!");
    });
    res.redirect("/");
  });

  // message board routes ===============================================================

  async function getRecommendations(hair, problems, goals) {
    const correctProblems = problems.length <= 1 ? problems : problems.join(", ");
    const correctGoals = goals.length <= 1 ? goals : goals.join(", ");
    // to do: we should store this key in a env file instead
    const openAIKey = "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";

    const prompt = `Pretend you are a curly hair specialist. 
    Create a valid JSON array of two objects for providing hair recommendations for ${hair} hair type that solves for ${correctProblems} and promotes ${correctGoals}. Your response should be in this format: \n\n

    The resulting JSON ojbect should be in this format: [{"suggestedProducts": "string", "hairRecommendations": "string"}, {"suggestedProducts": "string", "hairRecommendations": "string"}] .\n\n
    `;

    const raw = JSON.stringify({ prompt: prompt, max_tokens: 1000 });

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 250,
        temperature: 0.5,
        model: "text-davinci-003"
      })
    };

    const response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    );
    const data = await response.json();
    const generatedText = data.choices[0].text.trim();
    return generatedText;
  }

  app.post("/submit", async (req, res) => {
    const { hair, problems, goals } = req.body;
    const recommendations = await getRecommendations(hair, problems, goals)
    // const recommendations = JSON.parse(response)
    console.log(recommendations)
    db.collection("recs").save(
      {
        hair,
        problems,
        goals,
        recommendations,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/profile");
      }
    );
  });


  app.delete("/messages", (req, res) => {
    db.collection("messages").findOneAndDelete(
      { name: req.body.name, msg: req.body.msg },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}
