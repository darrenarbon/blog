var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	methodOverride = require("method-override"),
	expressSanitizer = require("express-sanitizer");

//connect to mongoose
var DBurl = process.env.DATABASEURL || "mongodb://localhost:27017/blog_app"
mongoose.connect(DBurl, function (err, db) {
	if (err) {
		console.log("Database Failed");
	} else {
		console.log("Database Connected");
	}
});

//set up view engine
app.set("view engine", "ejs");

//set up css file access
app.use(express.static("public"));

//put method override
app.use(methodOverride("_method"));

//set up body parser
app.use(bodyParser.urlencoded({extended: true}));

//use express sanitizer
app.use(expressSanitizer());

//create data schema for mongoose
var blogSchema = mongoose.Schema({
	title: String,
	image: String,
	hashtags: String,
	body: String,
	created: {type:Date, default: Date.now}
});

//set up the blog data
var Blog = mongoose.model("Blog", blogSchema);


//ROUTES

app.get("/", function(req,res){
	res.redirect("/blogs");
});

//list all blogs
app.get("/blogs", function(req,res){
	//get all entries in the DB
	//.find({}) modified to sort by newest first.
	Blog.find().sort('-created').find(function(err, blogs){
		if(err){
			//an error, report
			console.log("Error!");
		} else {
			//redirect to index, include the data
			res.render("index", {blogs: blogs});
		}
	});
});

//new route
app.get("/blogs/new", function(req, res){
	res.render("new");
});

//create route
app.post("/blogs", function(req,res){
	//remove any potential bad scripts
	req.body.blog.body = req.sanitize(req.body.blog.body);
	//create blog
	Blog.create(req.body.blog, function(err,newBlog){
		if(err){
			//if error redirect to form
			res.render("new");
		} else {
			//load blog list
			res.redirect("/blogs");
		}
	});
});

//search for blogs
app.get("/blogs/search", function(req,res){
	//set up regexp
	var searchParam = new RegExp(req.query.search, "i")
//Blog.find().sort('-created').find(function(err, blogs){
	Blog.find({
		$or: [
			{ title: searchParam},
			{ hashtags: searchParam},
			{ body: searchParam}
		]
	}).sort('-created').exec(function(err,searchRes){
		if(err) {
			console.log(err);
		} else {
			//redirect to index, include the data
			res.render("index", {blogs: searchRes});
		}
	});
});

//show info on one blog
app.get("/blogs/:id", function(req,res){
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.render("show", {blog:foundBlog});
		}
	});
});

//show edit form
app.get("/blogs/:id/edit", function(req,res){
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.render("edit", {blog:foundBlog});
		}
	});
});

//route to update data
app.put("/blogs/:id", function(req,res){
	//remove any potential bad scripts
	req.body.blog.body = req.sanitize(req.body.blog.body);
	//update the database
	Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
		if(err) {
			res.redirect("/blogs");
		} else {
			res.redirect("/blogs/" + req.params.id);
		}
	});
});

//route to delete data
app.delete("/blogs/:id", function(req,res){
	//destroy blog
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		} else {
			res.redirect("/blogs");
		}
	});
});



//start server
app.listen(3000, process.env.IP, function() {
	console.log("Server is running");
});