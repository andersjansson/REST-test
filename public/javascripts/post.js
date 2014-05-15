var Post = Backbone.Model.extend({
    urlRoot: "/posts",

    initialize : function(){
    },
    validate: function(attributes){
        var errors = [];
        if(attributes.title == 'undefined' || attributes.title == '')
            errors.push({'message': "No title!"});
        
        if(attributes.content == 'undefined' || attributes.content == '')
            errors.push({'message': "No content!"});

        if(errors.length > 0){
            return errors;
        }
    }
});

var PostCollection = Backbone.Collection.extend({
    model: Post,
    url: "/posts"
});

var AllPostsView = Backbone.View.extend({
    template: Handlebars.compile(($("#post-tpl-list").html())),
    initialize: function() {

        this.collection.bind("sync add remove change", _.bind(this.render, this));
    },
    events: {
        "click .delete" : "delete"
    },
    render: function() {
        var html = this.template({
            items: this.collection.toJSON()
        });
        this.$el.html(html);
    },
    delete: function(e) {
        e.preventDefault();
        var id = $(e.target).parent().attr("data-id");
        var post = this.collection.get(id);
        post.destroy();
    }
});

var FormView = Backbone.View.extend({
    initialize: function(){
        this.collection.fetch();
    },
    template: Handlebars.compile(($("#post-tpl-form").html())),
    events: {
        "submit form" : "updatePost"
    },
    render: function(){
        html = this.template(this.model);
        this.$el.html(html);
    },
    updatePost: function(e){

        e.preventDefault();
        var topic = e.target.title.value;
        var content = e.target.content.value;
        var success = false;
        var input = {title: topic, content: content};

        if(this.model != undefined){
            var mod = this.collection.get(this.model.id);
            success = mod.save(input);
        }
            
        else
            success = this.collection.create(input,{validate: true});

        if(success){
            e.target.reset();
            this.$el.find("#input-errors").html("");
            app.navigate("#posts",{trigger: true});
        }
    }
});

var SingleView = Backbone.View.extend({
    template: Handlebars.compile(($("#post-tpl-single").html())),
    //editTemplate: Handlebars.compile(($("#post-tpl-single-edit").html())),
    events: {
        "click .delete" : "delete"
    },
    render: function(id) {
        html = this.template(this.model);
        this.$el.find("#post").html(html);
    },
    delete: function(e) {
        e.preventDefault();
        var id = $(e.target).parent().attr("data-id");
        var post = app.postCollection.get(id);
        post.destroy();
        app.navigate("#posts", {trigger: true});
    }
});

var BlogApp = Backbone.Router.extend({
    routes: {
        ''                 : 'index',
        'posts'            : 'index',
        'posts/new'        : 'new',
        'posts/:id'        : 'singleView',
        'posts/:id/edit'   : 'edit',
        'posts/:id/delete' : 'delete'
    },
    initialize: function() {
        _this = this;

        this.postCollection = new PostCollection();
        
        this.views = {
            listView : new AllPostsView({
                el: "#posts",
                collection: this.postCollection
            }),
            singleView : new SingleView({
                el: "#single",
                collection: this.postCollection
            }),
            formView : new FormView({
                el: "#form",
                collection: this.postCollection
            })
        };
        
        //handle validation fail
        this.postCollection.on('invalid',function(postCollection,errors){
            var err = _this.views.formView.$el.find("#input-errors");
            var html = "";
            $(errors).each(function(index, error){
                html += "<p>"+error.message+"</p>";
            });
            
            err.html(html);
        });
    },
    showView: function(view){
        //hide all views
        $.each(this.views, function(viewName, viewObject){
            viewObject.$el.hide();
        });

        view.render();
        view.$el.show();
    },
    index: function() {
        this.postCollection.fetch();
        this.showView(this.views.listView);
    },
    new: function() {
        this.views.formView.model = undefined;
        this.showView(this.views.formView);
    },
    singleView: function(id){
        var post = new Post({id: id}).fetch().done(function(obj){
            if(obj != undefined){
                _this.views.singleView.model = obj;
                _this.showView(_this.views.singleView);
            }
        });
    },
    edit: function(id){
        var post = new Post({id: id}).fetch().done(function(obj){
            if(obj != undefined){
                _this.views.formView.model = obj;
                _this.showView(_this.views.formView);
            }
        });
    }
});

var app = new BlogApp();
Backbone.history.start();

//add support for "not equal"-comparison in handlebars
Handlebars.registerHelper('notequal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper notequal needs 2 parameters");
    if( lvalue != rvalue ) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

//add support for simple date-formatting in handlebars
Handlebars.registerHelper("niceDate", function(datetime) {
    var d = new Date(datetime);
    return d.getFullYear() + "-" 
         + d.getMonthFormatted() + "-" 
         + d.getDate() + " " 
         + d.getHours() + ":" 
         + d.getMinutes() + ":" 
         + d.getSeconds();
});

Date.prototype.getMonthFormatted = function() {
    var month = this.getMonth();
    return month < 10 ? '0' + (month+1) : (month+1); 
}