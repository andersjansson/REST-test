var Post = Backbone.Model.extend({
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
    render: function() {
        var html = this.template({
            items: this.collection.toJSON()
        });
        this.$el.html(html);
    }
});

var FormView = Backbone.View.extend({
    template: Handlebars.compile(($("#post-tpl-form").html())),
    events: {
        "submit form" : "updatePost"
    },
    render: function(model){
        if(model != undefined)
            var mod = model.toJSON();

        html = this.template(mod);
        this.$el.html(html);
    },
    updatePost: function(e){

        e.preventDefault();
        var topic = e.target.title.value;
        var content = e.target.content.value;
        var success = false;
        var input = {title: topic, content: content};

        if(this.model != undefined)
            success = this.model.save(input);
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
    render: function(model) {
        var mod = model.toJSON();
        html = this.template(mod);
        this.$el.find("#post").html(html);
    }
});

var BlogApp = Backbone.Router.extend({
    routes: {
        '' : 'index',
        'posts' : 'index',
        'posts/new' : 'new',
        'posts/:id' : 'singleView',
        'posts/:id/edit' : 'edit',
        'posts/:id/delete' : 'delete'
        
    },
    initialize: function() {
        this.postCollection = new PostCollection();
        this.postCollection.fetch();
        this.views = {
            listView : new AllPostsView({
                el: "#posts",
                collection: this.postCollection
            }),
            singleView : new SingleView({
                el: "#single"
            }),
            formView : new FormView({
                el: "#form",
                collection: this.postCollection
            })
        };
        _this = this;
        this.postCollection.bind("add remove change", _.bind(this.views.listView.render, this.views.listView));

        //validation fail
        this.postCollection.on('invalid',function(postCollection,errors){
            var err = _this.views.formView.$el.find("#input-errors");
            var html = "";
            $(errors).each(function(index, error){
                html += "<p>"+error.message+"</p>";
            });
            err.html(html);
        });
    },
    showView: function(view, options){
        $.each(this.views, function(viewName, viewObject){
            viewObject.$el.hide();
        });

        if(options != undefined && options.model != undefined)
            view.render(options.model);
        else
            view.render();
        
        view.$el.show();
    },
    index: function() {
        this.showView(this.views.listView);
    },
    new: function() {
        this.views.formView.model = undefined;
        this.showView(this.views.formView);
    },
    singleView: function(id){
        var post = this.postCollection.get(id);
        if(post != undefined){
            this.showView(this.views.singleView, {model: post});
        }
    },
    delete: function(id){
        var post = this.postCollection.get(id);
        if(post != undefined)
            post.destroy();

        _this.navigate("#posts",{trigger: true});
    },
    edit: function(id){
        var post = this.postCollection.get(id);
        if(post != undefined){
            this.views.formView.model = post;
            this.showView(this.views.formView, {model: post});
        }
    }
    
});

var app = new BlogApp();
Backbone.history.start();
/*
var posts = new PostCollection();
var postList = new AllPostsView({
  el: "#main",
  collection: posts
}).render();*/
