const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
	title: {type: String, required: true},
	author: {
		firstName: String,
		lastName: String
	},
	content: {type: String, required: true}
},	{
	timestamps: {createdAt: 'created'}
});

blogPostSchema.virtual('authorName').get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim()});

blogPostSchema.methods.apiRepr = function() {
	return {
		id: this.id,
		title: this.title,
		author: this.authorName,
		content: this.content,
		created: this.created
	};
};

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {BlogPost};