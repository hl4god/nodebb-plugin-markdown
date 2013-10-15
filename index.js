var	marked = require('marked'),
	hljs = require('highlight.js'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	RDB = module.parent.require('./redis'),
	Markdown = {
		config: {},
		init: function() {
			// Load saved config
			var	_self = this,
				fields = [
					'gfm', 'highlight', 'tables', 'breaks', 'pedantic',
					'sanitize', 'smartLists', 'smartypants', 'langPrefix'
				],
				hashes = fields.map(function(field) { return 'nodebb-plugin-markdown:options:' + field });
			RDB.hmget('config', hashes, function(err, options) {
				fields.forEach(function(field, idx) {
					if (field !== 'langPrefix') options[idx] = options[idx] === '1' ? true : false;
					_self.config[field] = options[idx];
				});

				// Enable highlighting
				if (_self.config.highlight) {
					_self.config.highlight = function (code, lang) {
						return hljs.highlightAuto(code).value;
					};
				}

				marked.setOptions(_self.config);
			});
		},
		markdownify: function(raw) {
			return marked(raw);
		},
		admin: {
			menu: function(custom_header, callback) {
				custom_header.plugins.push({
					"route": '/plugins/markdown',
					"icon": 'icon-edit',
					"name": 'Markdown'
				});

				return custom_header;
			},
			route: function(custom_routes, callback) {
				fs.readFile(path.join(__dirname, 'public/templates/admin.tpl'), function(err, tpl) {
					custom_routes.routes.push({
						route: '/plugins/markdown',
						method: "get",
						options: function(req, res, callback) {
							callback({
								req: req,
								res: res,
								route: '/plugins/markdown',
								name: Markdown,
								content: tpl
							});
						}
					});

					callback(null, custom_routes);
				});
			},
			activate: function() {
				var	Meta = module.parent.require('./meta'),
					defaults = [
						{ field: 'gfm', value: '1' },
						{ field: 'highlight', value: '1' },
						{ field: 'tables', value: '1' },
						{ field: 'breaks', value: '1' },
						{ field: 'pedantic', value: '0' },
						{ field: 'sanitize', value: '1' },
						{ field: 'smartLists', value: '1' },
						{ field: 'smartypants', value: '0' },
						{ field: 'langPrefix', value: 'lang-' }
					];

				async.each(defaults, function(optObj, next) {
					Meta.configs.setOnEmpty('nodebb-plugin-markdown:options:' + optObj.field, optObj.value, next);
				});
			}
		}
	};

Markdown.init();
module.exports = Markdown;