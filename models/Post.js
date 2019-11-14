const postsCollection = require('../db').db().collection("posts")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')
const validator = require('validator')

let Post = function(data, userid, requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function() {
    
    if(typeof(this.data.dateS) != "string"){this.data.dateS = ""}
    if(typeof(this.data.dateR) != "string"){this.data.dateR = ""}
    if(typeof(this.data.shift) != "string"){this.data.shift = ""}
    if(typeof(this.data.wwk) != "string"){this.data.wwk = ""}    
    if(typeof(this.data.testertype) != "string"){this.data.testertype = ""}
    if(typeof(this.data.prodfamily) != "string"){this.data.prodfamily = ""}
    if(typeof(this.data.testerdesc) != "string"){this.data.testerdesc = ""}
    if(typeof(this.data.partnumb) != "string"){this.data.partnumb = ""}
    if(typeof(this.data.issue) != "string"){this.data.issue = ""}
    if(typeof(this.data.actionsd) != "string"){this.data.actionsd = ""}
    if(typeof(this.data.causeoff) != "string"){this.data.causeoff = ""}
    if(typeof(this.data.tech1) != "string"){this.data.tech1 = ""}
    if(typeof(this.data.tech2) != "string"){this.data.tech2 = ""}
    if(typeof(this.data.tech3) != "string"){this.data.tech3 = ""}
    if(typeof(this.data.dtm) != "string"){this.data.dt  = ""}

    // remove any bogus properties.
    this.data = {
        dateS: this.data.dateS.trim(),
        dateR: this.data.dateR.trim(),
        shift: this.data.shift.trim(),
        wwk: sanitizeHTML(this.data.wwk.trim(), {allowedtags: [], allowedAttributes: {}}),
        testertype: this.data.testertype.trim(),
        prodfamily: sanitizeHTML(this.data.prodfamily.trim(), {allowedtags: [], allowedAttributes: {}}),
        testerdesc: this.data.testerdesc.trim(),
        partnumb: this.data.partnumb.trim(),
        issue: this.data.issue.trim(),
        actionsd: this.data.actionsd.trim(),
        causeoff: sanitizeHTML(this.data.causeoff.trim(), {allowedtags: [], allowedAttributes: {}}),
        tech1: sanitizeHTML(this.data.tech1.trim(), {allowedtags: [], allowedAttributes: {}}),
        tech2: sanitizeHTML(this.data.tech2.trim(), {allowedtags: [], allowedAttributes: {}}),
        tech3: sanitizeHTML(this.data.tech3.trim(), {allowedtags: [], allowedAttributes: {}}),
        dtm: sanitizeHTML(this.data.dtm.trim(), {allowedtags: [], allowedAttributes: {}}),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function() {
    if(this.data.dateS == ""){this.errors.push("Please provide the start of downtime")}
    if(this.data.dateR == ""){this.errors.push("Please provide the end of downtime")}
    if(this.data.shift == ""){this.errors.push("You must provide the Shift Number")}
    if(this.data.wwk !== "" && !validator.isNumeric(this.data.wwk)){this.errors.push("You must provide the workweek number")}
    if(this.data.testertype == ""){this.errors.push("Please provide the tester type")}
    if(this.data.prodfamily == ""){this.errors.push("You must provide the Product Family")}
    if(this.data.testerdesc == ""){this.errors.push("Please Enter the Tester Description")}
    if(this.data.partnumb == ""){this.errors.push("Please input tthe Part Number")}
    if(this.data.issue == ""){this.errors.push("You must put the issue")}
    if(this.data.actionsd == ""){this.errors.push("You must provide the Actions done")}
    if(this.data.causeoff == ""){this.errors.push("You need to input the cause of failure")}    
    if(this.data.dtm == ""){this.errors.push("You need to input the total downtime hours")}
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            // save post in database
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push("Pls try again later.")
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {dateS: this.data.dateS, dateR: this.data.dateR, shift: this.data.shift, wwk: this.data.wwk, testertype: this.data.testertype, prodfamily: this.data.prodfamily, testerdesc: this.data.testerdesc, partnumb: this.data.partnumb, issue: this.data.issue, actionsd: this.data.actionsd, causeoff: this.data.causeoff, tech1: this.data.tech1, tech2: this.data.tech2, tech3: this.data.tech3, dtm: this.data.dtm}})
            resolve("success")
        }else {
           resolve("failure")
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner){
                // actually update the db
                let status = await this.actuallyUpdate()
                resolve(status)
            }else{
                reject()
            }
        }catch {
            reject()
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                dateS: 1,
                dateR: 1,
                shift: 1,
                wwk: 1,
                testertype: 1,
                prodfamily: 1,
                testerdesc: 1,
                partnumb: 1,
                issue: 1,
                actionsd: 1,
                causeoff: 1,
                tech1: 1,
                tech2: 1,
                tech3: 1,
                dtm: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
          ])
      

          let posts = await postsCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(visitorId)
      post.authorId = undefined

      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }

      return post
    })

    resolve(posts)
  })
}

Post.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !ObjectID.isValid(id)) {
      reject()
      return
    }
    
    let posts = await Post.reusablePostQuery([
      {$match: {_id: new ObjectID(id)}}
    ], visitorId)

    if (posts.length) {
      console.log(posts[0])
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = function(authorId) {
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

Post.delete = function(postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId)
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
        resolve()
      } else {
        reject()
      }    
    } catch {
      reject()
    }
  })
}

Post.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) == "string") {
      let posts = await Post.reusablePostQuery([
        {$match: {$text: {$search: searchTerm}}},
        {$sort: {score: {$meta: "textScore"}}}
      ])
      resolve(posts)
    } else { 
      reject()
    }
  })
}

module.exports = Post