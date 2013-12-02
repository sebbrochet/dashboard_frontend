/*
function tick(){
	$('#ticker li:first').slideUp( function () { $(this).appendTo($('#ticker')).slideDown(); });
}
setInterval(function(){ tick () }, 5000);
*/

function stackTrace() {
    var err = new Error();
    return err.stack;
}

(function($) {

    var app = $.sammy('#main', function() {

          this.use('Template');
          this.use('Haml');

          this.around(function(callback) {
             var context = this;
             this.load(REST_API + 'projects?order_by=name', {json: true})
               .then(function(data) {
                  context.projects = data["objects"];
               })
               .then(callback);
          });

          this.get('#/', function(context) {
            context.app.swap('');
            //try {
            //projects = [ { "name" : "prj1"}, { "name" : "prj2"} ];
            //console.log(context.data);
            //console.log(typeof(context.data));
            context.render('templates/project_list.haml').appendTo(context.$element());
            /*} catch (e) {
               alert(stackTrace()); 
               //alert("Error: " + e.description );
            }*/
          });

          this.get('#/about', function(context) {
            context.app.swap('');
            context.render('templates/about.haml').appendTo(context.$element());
          });

          this.get('#/projects/detail/:id', function(context) {
            this.project = this.projects[this.params['id']];
            if (!this.project) { return this.notFound(); }
            this.partial('templates/project_detail.template');
          });

          this.get('#/environments_old/:id/events&environment=:name', function(context) {
            context.app.swap('');
            environment = { "name" :  this.params['name'], "id" : this.params['id'] } 
            this.load(REST_API + 'events?order_by=-date&environment=' + this.params['id'], {json: true})
            .then(function(data) {
                $.each(data["objects"], function(i, event) {
                    context.render('templates/event.template', {environment: environment, event: event})
                           .appendTo(context.$element());
                });
            });
          });

          this.get('#/environments/:id/events&environment=:name', function(context) {
            context.app.swap('');
            this.environment = { "name" :  this.params['name'], "id" : this.params['id'] }
            this.load(REST_API + 'events?order_by=-date&environment=' + this.params['id'], {json: true})
            .then(function(data) {
                context.events = data["objects"];
                context.render('templates/event_environment.haml').appendTo(context.$element());
            });
          });


          this.get('#/projects/:name/events', function(context) {
            context.app.swap('');
            context.$element().append('<h1>Events for ' + this.params['name'] + '</h1>');
            this.load(REST_API + 'events?order_by=-date&environment__project__name=' + this.params['name'], {json: true})
            .then(function(data) {
                $.each(data["objects"], function(i, event) {
                    context.render('templates/event.template', {environment: { "name": "" }, event: event})
                           .appendTo(context.$element());
                });
            });
          });

          this.get('#/projects/:name', function(context) {
            app.clearTemplateCache()             
            context.app.swap('');
            self = this
            this.load(REST_API + 'environments?order_by=name&project__name=' + this.params['name'], {json: true})
            .then(function(data) {
                context.$element().append('<h1>' + self.params['name'] + '</h1>');
                context.$element().append('<h3><a href="#/projects/' + self.params['name'] + '/events"><small>(history)</small></a></h3>');
                $.each(data["objects"], function(i, environment) {
                    self.load(REST_API + 'events?order_by=-date&limit=1&environment=' + environment.id, {json: true})
                    .then(function(data) {
                        $.each(data["objects"], function(i, event) {
                            context.render('templates/event.template', {environment: environment, event: event})
                                   .appendTo(context.$element());
                        });
                    });
                });
            });
          });

          this.get('#/projects2/:name', function(context) {
            app.clearTemplateCache()
            context.app.swap('');
            self = this;
            this.load(REST_API + 'environments?project__name=' + this.params['name'], {json: true})
            .then(function(data) {
                context.project_name = self.params['name'];
                context.environments = data["objects"];
                $.each(context.environments, function(i, environment) {
                    self.load(REST_API + 'events?order_by=-date&limit=1&environment=' + environment.id, {json: true})
                    .then(function(data) {
                        environment.events = data["objects"];
                    });
                });
            })
            .then(function(data) {
               console.log(context.environments);
               context.render('templates/event.haml').appendTo(context.$element());
               console.log(context.environments);
            })
          });

          this.get('#/event_ticker_bad', function(context) {
            context.$element().append('<table class="table">');
            this.load(REST_API + 'events?order_by=-date', {json: true})
            .then(function(data) {
                $.each(data["objects"], function(i, event) {
                  environment = event.environment
                  project = environment.project
                  context.render('templates/event_ticker.template', {project: project, environment: environment, event: event})
                        .appendTo(context.$element());
                });
            });
            context.$element().append('</table>');
          });

          this.get('#/event_ticker', function(context) {
            context.app.swap('');
            this.load(REST_API + 'events?order_by=-date', {json: true})
            .then(function(data) {
                context.events = data["objects"];
                for (var i = 0; i < context.events.length; i++) {
                   context.events[i].project_name = context.events[i].environment.project.name;
                   context.events[i].environment_name = context.events[i].environment.name;
                }
                //context.events = [ context.events[0] ];
                //console.log(context.events[0].environment);
                context.render('templates/event_ticker.haml').appendTo(context.$element());
            });
          });

    });

    $(function() {
        // Replace django_dashboard.yourdomain.com with the domain you use to serve django_dashboard REST API
        // or edit your local /etc/hosts file to resolve django_dashboard.yourdomain.com to the IP you uese to serve django_dashboard REST API
        REST_API = "http://django_dashboard.yourdomain.com/api/v1/"
        app.run('#/');
    });

})(jQuery);
