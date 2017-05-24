const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPost} = require('./models');

const app = express();
app.use(bodyParser.json());

// GET requests to /posts returns all posts
app.get('/posts', (req, res) => {
	BlogPost
		.find()
		.exec()
		.then(blogposts => {
			res.json({
				blogposts: blogposts.map(
					(blogpost) => blogpost.apiRepr())
			});
		})
		.catch(
			err => {
				console.error(err);
				res.status(500).json({message: 'Internal server error'});
			});
});

// GET requests to /posts/:id returns single post
app.get('/posts/:id', (req, res) => {
	BlogPost
		.findById(req.params.id)
		.exec()
		.then(blogpost => res.json(blogpost.apiRepr()))
		.catch(err => {
			console.error(err);
				res.status(500).json({message: 'Internal server error'});
		});
});

// POST requests to /posts
app.post('/posts', (req, res) => {
	const requiredFields = ['title', 'author', 'content'];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}

	BlogPost
		.create({
			title: req.body.title,
			author: req.body.author,
			content: req.body.content,
		})
		.then(
			blogpost => res.status(201).json(blogpost.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

// PUT requests to /posts/:id
app.put('/posts/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = (
			`Request path id (${req.params.id}) and request body id ` +
			`(${req.body.id}) must match`);
		console.error(message);
		res.status(400).json({message: message});
	}

	const toUpdate = {};
	const updateableFields = ['title', 'author', 'content'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	BlogPost
		.findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
		.exec()
		.then(blogpost => res.status(200).json(blogpost.apiRepr()))
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// DELETE requests to /posts/:id
app.delete('/posts/:id', (req, res) => {
	BlogPost
		.findByIdAndRemove(req.params.id)
		.exec()
		.then(blogpost => res.status(204).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.use('*', (req, res) => {
	res.status(404).json({message: 'Not found'});
});

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl, err => {
			if (err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`Your app is listening on port ${port}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing server');
			server.close(err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
}

if (require.main === module) {
	runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};