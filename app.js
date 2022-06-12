require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const {verify} = require('hcaptcha')

// SET your PORT
const port = process.env.PORT || 3000
// SET your hcaptcha secret key
const SECRET = process.env.HCAPTCHA_SECRET_KEY
// SET your mongoose database connection
const DB_CONNECT = process.env.DB_CONNECT

const app = express()
app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(DB_CONNECT)

const tasksSchema = {
  name: String,
  status: String,
  taskBoard: String,
  taskStartDate: Date,
  taskEndDate: Date
}

const logsSchema = {
  object: String,
  action: String,
  logTimeDate: Date
}

const reportItemSchema = {
  totalTasks: {type: Number, default: 0},
  totalActions: {type: Number, default: 1},
  reportDate: Date
}

const profileSchema = {
  firstName: String,
  lastName: String,
  position: String,
  department: String,
  address: String,
  email: String,
  phone: String,
  hasExperience: Boolean,
  additionalNotes: String,
  tasks: [tasksSchema],
  createdBy: mongoose.ObjectId,
  currentStepActive: String,
  currentStepStatus: String
}

const Profile = mongoose.model("Profile", profileSchema)

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  log: [logsSchema],
  reports: [reportItemSchema],
  firstName: String,
  lastName: String,
  position: String,
  department: String,
  phone: String,
  apiKey: String
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy())
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

function RetrieveUserId(email, callback) {
  User.findOne({
    username: email
  }, function(err, user) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, user._id)
    }
  })
}

function RetrieveUserLogs(email, callback) {
  User.findOne({
    username: email
  }, function(err, user) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, user.log)
    }
  })
}

function reportAction(email, action) {
  let now = new Date()
  let start = new Date(now.getFullYear(),now.getMonth(),now.getDate(),1,0,0)
  let end = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,59,59)
  User.findOne({username: email, 'reports.reportDate': {$gte: start, $lt: end}}, function(err, doc) {
       if (doc === null) {
         User.findOne({
           username: email
         }, function(errors, user) {
           if (!errors) {
             const reportElement = {
               totalTasks: 0,
               totalActions: 1,
               reportDate: start
             }
             user.reports.push(reportElement)
             user.save()
           }
         })
       }
       if(action === "done") {
         User.updateOne({username: email,
          'reports.reportDate': {$gte: start, $lt: end}}, {$inc: {'reports.$.totalTasks': 1}}, function(err, doc) {
              if (err) {
                console.log(err)
              }
          })
       }
       User.updateOne({username: email,
        'reports.reportDate': {$gte: start, $lt: end}}, {$inc: {'reports.$.totalActions': 1}}, function(err, doc) {
            if (err) {
              console.log(err)
            }
        })
   })
  }

function LogUserAction(email, object, action) {
  User.findOne({
    username: email
  }, function(err, user) {
    if (!err) {
      const currentTime = new Date()
      const logElement = {
        object: object,
        action: action,
        logTimeDate: currentTime
      }
      user.log.push(logElement)
      user.save()
      reportAction(email, action)
    }
  })
}

app.post("/settings", function(req, res){
  if (req.isAuthenticated()) {
    let currentUserEmail = req.session.passport.user
    const filter = {
      username: currentUserEmail
    }
    const update = {
      $set: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        position: req.body.position,
        department: req.body.department,
        username: req.body.email,
        phone: req.body.phone
      }
    }
    // If you set the `upsert` option, Mongoose will insert
    // a new document if one isn't found.
    const opts = {
      upsert: true
    }
    User.findOneAndUpdate(filter, update, opts, function(err, results) {
      if (!err) {
        res.redirect("/settings")
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/settings", function(req, res) {
  if (req.isAuthenticated()) {
    let currentUserEmail = req.session.passport.user
    User.findOne({username: currentUserEmail}, function(err, doc) {
       if (doc != null) {
         res.render("settings", {profileData: doc})
       }})
  } else {
    res.redirect("/")
  }
})

app.get("/dashboard", function(req, res) {
  if (req.isAuthenticated()) {
    let today = new Date()
    let currentUserEmail = req.session.passport.user
    RetrieveUserId(currentUserEmail, function(err, userId) {
      if (!err) {
        Profile.find({
          createdBy: userId
        }, function(err, foundItems) {
          if (foundItems.length != 0) {
            res.render("dashboard", {
              myProfiles: foundItems,
              todayYear: today.getFullYear(),
              todayMonth: today.getMonth(),
              todayDay: today.getDate(),
              searchInterface: false
            })
          } else {
            res.render("dashboard", {
              myProfiles: null
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/search", function(req, res) {
  res.redirect("/dashboard")
})

app.post("/search", function(req, res) {
  if (req.isAuthenticated()) {
    let today = new Date()
    let currentUserEmail = req.session.passport.user
    let searchQuery = req.body.searchQuery
    RetrieveUserId(currentUserEmail, function(err, userId) {
      if (!err) {
        Profile.find({
          createdBy: userId,
          lastName: searchQuery
        }, function(err, foundItems) {
          if (foundItems.length != 0) {
            res.render("dashboard", {
              myProfiles: foundItems,
              todayYear: today.getFullYear(),
              todayMonth: today.getMonth(),
              todayDay: today.getDate(),
              searchInterface: true
            })
          } else {
            res.render("dashboard", {
              myProfiles: null
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/logs", function(req, res) {
  if (req.isAuthenticated()) {
    let currentUserEmail = req.session.passport.user
    RetrieveUserLogs(currentUserEmail, function(err, logsData) {
      if (!err) {
        res.render("actions_log", {
          logsData: logsData
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/details/profile/create", function(req, res) {
  if (req.isAuthenticated()) {
    let currentUserEmail = req.session.passport.user
    RetrieveUserLogs(currentUserEmail, function(err, logsData) {
      if (!err) {
        res.render("details", {
          taskBoard: 0,
          logsData: logsData
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/details/overview/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = req.params.talentId
    Profile.findOne({
      _id: talentId
    }, function(err, foundList) {
      if (!foundList || !mongoose.Types.ObjectId.isValid(talentId)) {
        console.log("Not found" + err)
      } else if (!err) {
        let currentUserEmail = req.session.passport.user
        RetrieveUserLogs(currentUserEmail, function(err, logsData) {
          if (!err) {
            res.render("details", {
              taskBoard: 5,
              profileData: foundList,
              logsData: logsData
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/details/profile/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = req.params.talentId
    Profile.findOne({
      _id: talentId
    }, function(err, foundList) {
      if (!foundList || !mongoose.Types.ObjectId.isValid(talentId)) {
        console.log("Not found" + err)
      } else if (!err) {
        let currentUserEmail = req.session.passport.user
        RetrieveUserLogs(currentUserEmail, function(err, logsData) {
          if (!err) {
            res.render("details", {
              taskBoard: 4,
              profileData: foundList,
              logsData: logsData
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.post("/updateProfile", function(req, res) {
  if (req.isAuthenticated()) {
    let experience = false
    if (req.body.hasExperience === "on") {
      experience = true
    }
    const filter = {
      _id: mongoose.Types.ObjectId(req.body.id)
    }
    const update = {
      $set: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        position: req.body.position,
        department: req.body.department,
        address: req.body.address,
        email: req.body.email,
        phone: req.body.phone,
        hasExperience: experience,
        additionalNotes: req.body.additionalNotes
      }
    }
    // If you set the `upsert` option, Mongoose will insert
    // a new document if one isn't found.
    const opts = {
      upsert: true
    }
    Profile.findOneAndUpdate(filter, update, opts, function(err, results) {
      if (!err) {
        let currentUserEmail = req.session.passport.user
        LogUserAction(currentUserEmail, "Candidate", "modify details")
        res.redirect(req.body.linkBack)
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/finishStep/:stepName/:stepStatus/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = req.params.talentId
    const stepName = req.params.stepName
    const stepStatus = req.params.stepStatus
    let redirectLink = "/dashboard"
    let update = {
      $set: {
        currentStepActive: "profile",
        currentStepStatus: stepStatus
      }
    }
    switch (stepName) {
      case "hr_interview":
        update = {
          $set: {
            currentStepActive: "technical_interview",
            currentStepStatus: stepStatus
          }
        }
        redirectLink = "/details/technical_interview/" + talentId
        break;
      case "technical_interview":
        update = {
          $set: {
            currentStepActive: "paperwork",
            currentStepStatus: stepStatus
          }
        }
        redirectLink = "/details/paperwork/" + talentId
        break;
      case "paperwork":
        update = {
          $set: {
            currentStepActive: "finishedAllSteps",
            currentStepStatus: stepStatus
          }
        }
        break;
    }
    const filter = {
      _id: mongoose.Types.ObjectId(talentId)
    }
    const opts = {
      upsert: true
    }
    Profile.findOneAndUpdate(filter, update, opts, function(err, results) {
      if (!err) {
        let currentUserEmail = req.session.passport.user
        if (stepStatus != "reject") {
          LogUserAction(currentUserEmail, "Candidate", stepName + ", " + stepStatus)
          res.redirect(redirectLink)
        } else {
          LogUserAction(currentUserEmail, "Candidate", "reject")
          res.redirect("/dashboard")
        }
      }
    })
  } else {
    res.redirect("/")
  }
})


app.post("/saveTask", function(req, res) {
  if (req.isAuthenticated()) {
    task = {
      name: req.body.taskText,
      status: "new",
      taskBoard: req.body.taskBoard,
      taskStartDate: new Date(req.body.taskStartDate + "T" + req.body.taskStartTime),
      taskEndDate: new Date(req.body.taskStartDate + "T" + req.body.taskEndTime)
    }
    Profile.findOne({
      _id: mongoose.Types.ObjectId(req.body.id)
    }, function(err, foundList) {
      let currentUserEmail = req.session.passport.user
      foundList.tasks.push(task)
      foundList.save()
      LogUserAction(currentUserEmail, req.body.taskBoard + " Task", "create")
      let link = "/details/" + req.body.taskBoard + "/" + req.body.id
      res.redirect(link)
    })
  } else {
    res.redirect("/")
  }
})

app.post("/saveProfile", function(req, res) {
  if (req.isAuthenticated()) {
    let experience = false
    if (req.body.hasExperience === "on") {
      experience = true
    }
    let currentUserEmail = req.session.passport.user
    RetrieveUserId(currentUserEmail, function(err, userId) {
      if (!err) {
        const profileData = new Profile({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          position: req.body.position,
          department: req.body.department,
          address: req.body.address,
          email: req.body.email,
          phone: req.body.phone,
          hasExperience: experience,
          additionalNotes: req.body.additionalNotes,
          tasks: [],
          createdBy: userId,
          currentStepActive: "hr_interview",
          currentStepStatus: "success"
        })
        profileData.save((err, profile) => {
          let currentUserEmail = req.session.passport.user
          LogUserAction(currentUserEmail, "Candidate", "create")
          res.redirect("/details/hr_interview/" + profile._id)
        })
      }
    })
  } else {
    res.redirect("/")
  }
})


app.get("/details/hr_interview/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = req.params.talentId
    Profile.findOne({
      _id: talentId
    }, function(err, foundList) {

      if (!foundList || !mongoose.Types.ObjectId.isValid(talentId)) {
        console.log("Not found" + err)

      } else if (!err) {
        let currentUserEmail = req.session.passport.user
        RetrieveUserLogs(currentUserEmail, function(err, logsData) {
          if (!err) {
            res.render("details", {
              taskBoard: "hr_interview",
              profileData: foundList,
              talentId: talentId,
              logsData: logsData
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/details/technical_interview/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = req.params.talentId
    Profile.findOne({
      _id: talentId
    }, function(err, foundList) {
      if (!foundList || !mongoose.Types.ObjectId.isValid(talentId)) {
        console.log("Not found" + err)
      } else if (!err) {
        let currentUserEmail = req.session.passport.user
        RetrieveUserLogs(currentUserEmail, function(err, logsData) {
          if (!err) {
            res.render("details", {
              taskBoard: "technical_interview",
              profileData: foundList,
              talentId: talentId,
              logsData: logsData
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/details/paperwork/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = req.params.talentId
    Profile.findOne({
      _id: talentId
    }, function(err, foundList) {
      if (!foundList || !mongoose.Types.ObjectId.isValid(talentId)) {
        console.log("Not found" + err)
      } else if (!err) {
        let currentUserEmail = req.session.passport.user
        RetrieveUserLogs(currentUserEmail, function(err, logsData) {
          if (!err) {
            res.render("details", {
              taskBoard: "paperwork",
              profileData: foundList,
              talentId: talentId,
              logsData: logsData
            })
          }
        })
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/deleteProfile/:talentId", function(req, res) {
  if (req.isAuthenticated()) {
    const talentId = mongoose.Types.ObjectId(req.params.talentId)
    Profile.findByIdAndRemove(talentId, function(err) {
      if (!err) {
        res.redirect("/dashboard")
      }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/taskAction/:dashboardLink/:taskId/:actionType/:talentId/:taskBoard", function(req, res) {
  if (req.isAuthenticated()) {
    const taskId = mongoose.Types.ObjectId(req.params.taskId)
    const actionType = req.params.actionType
    const taskBoard = req.params.taskBoard
    const talentId = mongoose.Types.ObjectId(req.params.talentId)
    const dashboardLink = req.params.dashboardLink

    Profile.findOne({
      '_id': talentId
    }).then(doc => {
      item = doc.tasks.id(taskId)
      let currentUserEmail = req.session.passport.user
      if (actionType === "processing") {
        item["status"] = "processing"
        LogUserAction(currentUserEmail, "Task", "processing")
      }
      if (actionType === "finish") {
        item["status"] = "done"
        LogUserAction(currentUserEmail, "Task", "done")
      }
      if (actionType === "cancel") {
        item["status"] = "cancelled"
        LogUserAction(currentUserEmail, "Task", "cancelled")
      }
      if (actionType === "redirect") {
        res.redirect("/details/" + taskBoard + "/" + talentId)
      }
      doc.save()

      if (dashboardLink === "true" && actionType != "redirect") {
        res.redirect("/dashboard/")
      }
      if (dashboardLink != "true" && actionType != "redirect") {
        res.redirect("/details/" + taskBoard + "/" + talentId)
      }

    }).catch(err => {
      console.log(err)
    })
  } else {
    res.redirect("/")
  }
})

app.get("/help", function(req, res){
  if (req.isAuthenticated()) {
    res.render("help")
  } else {
    res.redirect("/")
  }
})


app.get("/reports", function(req, res){
  if (req.isAuthenticated()) {
    res.render("reports")
  } else {
    res.redirect("/")
  }
})

app.get("/:typeofChart/chart.js", function(req, res) {
  if (req.isAuthenticated()) {
    const typeofChart = req.params.typeofChart
    let currentUserEmail = req.session.passport.user
    User.findOne({username: currentUserEmail}, function(err, doc) {
       if (doc != null) {
         let tasksArray = []
         let actionsArray = []
         let reportDatesArray = []
         const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
         for (var i = 0; i < doc.reports.length; i++) {
           tasksArray.push(doc.reports[i].totalTasks)
           actionsArray.push(doc.reports[i].totalActions)
           let dayName = new Date(doc.reports[i].reportDate).getDay()
           reportDatesArray.push("'" + weekday[dayName]+ "'")
         }
         if(typeofChart === "actions") {
           res.render("partials/chart.ejs", {
             values: actionsArray,
             reportDate: reportDatesArray,
             chartName: "myChartActions"
           })
         }
         if(typeofChart === "tasks") {
           res.render("partials/chart.ejs", {
             values: tasksArray,
             reportDate: reportDatesArray,
             chartName: "myChartTasks"
           })
         }
       }
    })
  } else {
    res.redirect("/")
  }
})

app.get("/", function(req, res) {
  res.render("main_page", {
    authErrorText: ""
  })
})

app.get("/login", function(req, res) {
  res.redirect("/")
})

app.post("/login", function(req, res) {
  const token = req.body["g-recaptcha-response"] ?? req.body["h-captcha-response"] ?? req.query["g-recaptcha-response"] ?? req.query["h-captcha-response"]
  verify(SECRET, token)
  .then((data) => {
    if (data.success === true) { //true === NORMAL
      if (req.body.loginBtn === "login") {
        if (!req.body.username) {
          res.render("main_page", {
            authErrorText: "Error. Please fill all fields!"
          })

        } else {
          if (!req.body.password) {
            res.render("main_page", {
              authErrorText: "Error. Please fill all fields!"
            })
          } else {
            passport.authenticate('local', function(err, user, info) {
              if (err) {
                res.render("main_page", {
                  authErrorText: err
                })
              } else {
                if (!user) {
                  res.render("main_page", {
                    authErrorText: "Error. Incorrect login / password!"
                  })
                } else {
                  req.login(user, function(err) {
                    if (err) {
                      res.render("main_page", {
                        authErrorText: err
                      })

                    } else {
                      passport.authenticate("local")(req, res, function() {
                        res.redirect("/dashboard")
                      })
                    }
                  })
                }
              }
            })(req, res)
          }
        }
      } else {
        User.register({
          username: req.body.username
        }, req.body.password, function(err, user) {
          if (err) {
            console.log(err)
            res.render("main_page", {
              authErrorText: "Error! Please try again..."
            })
          } else {
            passport.authenticate("local")(req, res, function() {
              res.redirect("/dashboard")
            })
          }
        })
      }
    } else {
      res.render("main_page", {
        authErrorText: "Error. Captcha verification failed"
      })
    }
  })
  .catch(console.error)
})

app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      return next(err)
    }
    res.redirect('/')
  })
})

//REST API

function generateApiKey(length) {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength))
  }
  return result
}

app.get("/getApiKey", function(req, res) {
  if (req.isAuthenticated()) {
    let currentUserEmail = req.session.passport.user
    const newApiKey = generateApiKey(35)
    const filter = {
      username: currentUserEmail
    }
    const update = {
      apiKey: newApiKey
    }
    User.findOneAndUpdate(filter, update, {
        overwrite: false
      },
      function(err) {
        if (!err) {
          res.redirect("/api")
        }
      })

  } else {
    res.redirect("/")
  }
})

function RetrieveUserIdbyApiKey(apiKey, callback) {
  User.findOne({
    apiKey: apiKey
  }, function(err, user) {
    if (err) {
      callback(err, null)
    } else if (user) {
      callback(null, user._id)
    } else {
      callback(null, null)
    }
  })
}

// articles route (ALL)
app.route("/API/talents/:apiKey")
  .get(function(req, res) {
    const apiKey = req.params.apiKey
    RetrieveUserIdbyApiKey(apiKey, function(err, userId) {
      if (userId && !err) {
        Profile.find({
          createdBy: userId
        }, function(error, foundProfiles) {
          if (!error && foundProfiles.length != 0) {
            res.send(foundProfiles)
          } else {
            res.send("null")
          }
        })
      } else {
        res.send("Nothing is there. Please check your API-Key")
      }
    })
  })
  .post(function(req, res) {
    const apiKey = req.params.apiKey
    RetrieveUserIdbyApiKey(apiKey, function(err, userId) {
      if (userId && !err) {

        const newProfile = new Profile({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          position: req.body.position,
          department: req.body.department,
          address: req.body.address,
          email: req.body.email,
          phone: req.body.phone,
          hasExperience: req.body.hasExperience,
          additionalNotes: req.body.additionalNotes,
          tasks: [],
          createdBy: userId,
          currentStepActive: "hr_interview",
          currentStepStatus: "success"
        })
        newProfile.save(function(err) {
          if (!err) {
            res.send("Successfully saved a new talent to DB")
          } else {
            res.send(err)
          }
        })
      } else {
        res.send("Nothing is there. Please check your API-Key")
      }
    })
  })

  .delete(function(req, res) {
    const apiKey = req.params.apiKey
    RetrieveUserIdbyApiKey(apiKey, function(err, userId) {
      if (userId && !err) {
        const deleteCondition = {
          createdBy: userId
        }
        Profile.deleteMany(deleteCondition, function(err) {
          if (!err) {
            res.send("Successfully removed all talents from DB")
          } else {
            res.send(err)
          }
        })
      } else {
        res.send("Nothing is there. Please check your API-Key")
      }
    })

  })

// specific task route
app.route("/API/talents/:apiKey/:taskId")
  .get(function(req, res) {
    const apiKey = req.params.apiKey
    const taskId = req.params.taskId
    RetrieveUserIdbyApiKey(apiKey, function(err, userId) {
      if (userId && !err) {
        Profile.findOne({
          createdBy: userId,
          "tasks._id": taskId
        }, {
          "tasks.$": 1
        }, function(error, foundTask) {
          if (!error && foundTask) {
            res.send(foundTask)
          } else {
            res.send("null")
          }
        })
      } else {
        res.send("Nothing is there. Please check your API-Key")
      }
    })
  })

  .put(function(req, res) {
    const apiKey = req.params.apiKey
    const taskId = req.params.taskId
    RetrieveUserIdbyApiKey(apiKey, function(err, userId) {
      if (userId && !err) {
        const filter = {
          createdBy: userId,
          "tasks._id": taskId
        }
        const update = {
          "tasks.$.name": req.body.taskName
        }
        Profile.findOneAndUpdate(filter, update, {
            overwrite: false
          },
          function(err) {
            if (!err) {
              res.send("Successfully updated task")
            }
          })
      } else {
        res.send("Nothing is there. Please check your API-Key")
      }
    })
  })

  .delete(function(req, res) {
    const apiKey = req.params.apiKey
    const taskId = req.params.taskId
    RetrieveUserIdbyApiKey(apiKey, function(err, userId) {
      if (userId && !err) {
        Profile.findOneAndUpdate({
            createdBy: userId,
            "tasks._id": taskId
          }, {
            $pull: {
              tasks: {
                _id: taskId
              }
            }
          }, {
            new: true
          },
          function(err) {
            if (!err) {
              res.send("Successfully cancelled task")
            }
          }
        )

      } else {
        res.send("Nothing is there. Please check your API-Key")
      }
    })
  })

app.get("/api", function(req, res){
  if (req.isAuthenticated()) {
    let currentUserEmail = req.session.passport.user
    User.findOne({username: currentUserEmail}, function(err, doc) {
       if (doc != null) {
         res.render("api", {userData: doc})
       } else {
         res.render("api", {userData: null})
       }
     })
  } else {
    res.redirect("/")
  }
})

app.listen(port, function() {
  console.log("Server Started Successfully")
})
