# Talent Acquisition Management System
TA-Guide is powerful and easy to use tool for talent acquisition management process 
- https://ta-guide.herokuapp.com/

# Why TA-Guide ?
- Digitalization of the talent acquisition process
- Reports present adequate information on various aspects of the talent acquisition process
- All the tasks related to the talent acquisition process are stored in one place
- Segmentation of tasks by steps of the talent acquisition process (Human Resources Interview Related Tasks, Technical Interview Related Tasks and Paperwork Related Tasks)
- Tracking each step of task progress (Status: "new task", "in progress", "done")
- Information related to each candidate can be accessed and updated in real time

# How to use TA-Guide
- Create your account
- Fill in your personal details (My Settings)
- Create profile for a new candidate (Create Profile)
- Create list of necessary tasks for Initial Human Resources Department Interview
- Create list of necessary tasks for Technical Department Interview
- Create list of necessary tasks for Paperwork Process
- Track each step of task progress (Mark Task Status as "in progress" or "done")
- Send candidate feedback related to each step of recrutment process
- Access list of all scheduled tasks for today on Dashboard page
- Make a final decision of candidte acceptance and send feedback email

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
- SET your PORT
- PORT=
- SET your hcaptcha secret key
- HCAPTCHA_SECRET_KEY=
- SET your mongoose database connection (server)
- DB_CONNECT=

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
