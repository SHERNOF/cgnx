const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const cgx = express()

let sessionOptions = session({
    secret: "JavaScript is sooooo Cool",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

cgx.use(sessionOptions)
cgx.use(flash())

cgx.use(function(req, res, next){
    // make the marked down available in ejs template
    res.locals.filterUserHTML = function (content){
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
        // return markdown(content)
    }

    // make all the errors and success available to all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on the req object
    if(req.session.user){req.visitorId = req.session.user._id} else {req.visitorId = 0}

    // make user session data available from withiinview templates
    res.locals.user = req.session.user
    next()
})

const router = require('./router')

cgx.use(express.urlencoded({extended: false}))
cgx.use(express.json()) 

cgx.use(express.static('public'))
cgx.use('/', router)

cgx.set('views', 'views')
cgx.set('view engine', 'ejs')
 


module.exports = cgx