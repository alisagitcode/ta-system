# Talent Acquisition Management System
TA-Guide is powerful and easy to use tool for talent acquisition management process 
- https://ta-guide.herokuapp.com/ - TA-Guide
- https://github.com/alisagitcode/ta-system/tree/master/help - Comprehensive User's Guide with screenshots

# Why TA-Guide ?

1. Digitalization of the talent acquisition process
2. Reports present adequate information on various aspects of the talent acquisition process
3. All the tasks related to the talent acquisition process are stored in one place
4. Segmentation of tasks by steps of the talent acquisition process (Human Resources Interview Related Tasks, Technical Interview Related Tasks and Paperwork Related Tasks)
5. Tracking each step of task progress (Status: "new task", "in progress", "done")
6. Information related to each candidate can be accessed and updated in real time
7. Integration with third-party systems by REST API

# How to use TA-Guide

1. Create your account
2. Fill in your personal details (My Settings)
3. Create profile for a new candidate (Create Profile)
4. Create list of necessary tasks for Initial Human Resources Department Interview
5. Create list of necessary tasks for Technical Department Interview
6. Create list of necessary tasks for Paperwork Process
7. Track each step of task progress (Mark Task Status as "in progress" or "done")
8. Send candidate feedback related to each step of recrutment process
9. Access list of all scheduled tasks for today on Dashboard page
10. Make a final decision of candidte acceptance and send feedback email
11. https://github.com/alisagitcode/ta-system/tree/master/help - Comprehensive User's Guide with screenshots

# REST API
- TA-Guide has built-in API that conforms to the constraints of REST architectural style and allows for interaction with RESTful web services for existing systems integration and data migration purposes
- Generate your {apiKey} (Dashboard > API)

| http method | Root route        | Specific route             |
|----------|-------------------|----------------------------|
| GET      | /talents/{apiKey} | /talents/{apiKey}/{taskId} |
| POST     | /talents/{apiKey} |                            |
| PUT      |                   | /talents/{apiKey}/{taskId} |
| DELETE   | /talents/{apiKey} | /talents/{apiKey}/{taskId} |

- Endpoint URL (Dashboard > API)

## Install
- ready to deploy on heroku & mongodb atlas
- create .env file in project root directory

```console
#SET your PORT
PORT=
#SET your hcaptcha secret key
HCAPTCHA_SECRET_KEY=
#SET your mongoose database connection (server)
DB_CONNECT=
```

## Tech stack

TA-Guide App uses a number of open source projects to work properly:

- [NodeJS] - JavaScript runtime built on Chrome's V8 JavaScript engine
- [Express.js] - is a back end web application framework for Node.js
- [body-parser] - body parsing middleware. Parse incoming request bodies in a middleware before your handlers, available under the req.body property
- [mongoose] - is a JavaScript object-oriented programming library that creates a connection between MongoDB and the Express web application framework
- [ejs] - is a simple templating language that lets you generate HTML markup with plain JavaScript
- [Passport.js] - is authentication middleware for Node.js. Extremely flexible and modular
- [hcaptcha] - bots protection
- [Bootstrap 5] - UI boilerplate for modern web apps
- [HTML] -  the standard markup language for documents designed to be displayed in a web browser
- [CSS] - CSS is the language we use to style an HTML document
- [Font Awesome] is a font and icon toolkit based on CSS and Less

## License

GNU General Public License v3.0
