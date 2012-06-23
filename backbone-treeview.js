// A file tree view javascript class
//     Accepts formatted JSON:
//     Root Node ->
//     {
//         name: "name",
//         nodes: [ array of nodes ]
//     }

window.Filetree = function(spec, my) {

    var Node = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        initialize: function(args) {
            var nodes = null;
            if (this.has('nodes')) {
                nodes = this.get('nodes');
                this.unset('nodes');
            }

            if (nodes) {
                var nodeList = new NodeList(nodes);
                this.set('nodes', nodeList);
            }
        }
    });

    var NodeList = Backbone.Collection.extend({
        model: Node,
        comparator: function(node) {
            return node.get('name');
        }
    });

    var NodeView = Backbone.View.extend({
        tagName: 'li',
        navIconTemplate: '<div class="backbone-tree-nav-icon"></div>',
        iconTemplate: '<div class="backbone-tree-icon"></div>',
        labelTemplate: '<div class="backbone-tree-label">{{name}}</div>',
        events: {
            'click .backbone-tree-nav-icon': 'toggle',
            'mouseover .backbone-tree-label': 'labelHoverOn',
            'mouseout .backbone-tree-label': 'labelHoverOff',
            'click .backbone-tree-label': 'labelClick',
            'contextmenu .backbone-tree-label': 'handleRightClick'
        },
        initialize: function() {
            if (this.model.has('nodes')) {
                //TODO: can add code here for open/close state as parameter
                this.className = 'backbone-tree-expandable';
                this.$el.attr('class', this.className);
                this.nodeListView = new NodeListView({
                    collection: this.model.get('nodes'),
                    parent: this
                });
            }
            else {
                this.className = 'backbone-tree-leaf';
                this.$el.attr('class', this.className);
            }
            var indexOfThisModel = this.model.collection.indexOf(this.model);
            if (indexOfThisModel == 0 && indexOfThisModel == this.model.collection.length - 1) {
                this.$el.addClass('backbone-tree-single');
            }
            else if (indexOfThisModel == 0) {
                this.$el.addClass('backbone-tree-first');
            }
            else if (indexOfThisModel == this.model.collection.length - 1) {
                this.$el.addClass('backbone-tree-last');
            }
        },
        render: function() {
            var navIconHtml = Handlebars.compile(this.navIconTemplate);
            var iconHtml = Handlebars.compile(this.iconTemplate);
            var labelHtml = Handlebars.compile(this.labelTemplate);
            var context = {name: this.model.get('name')};

            this.$el.append(navIconHtml)
                .append(iconHtml)
                .append(labelHtml(context));
            if (this.nodeListView) {
                this.$el.append(this.nodeListView.render().el);
            }

            if (this.model.has('iconClass')) {
                this.$('.backbone-tree-icon').addClass(this.model.get('iconClass'));
            }

            return this;
        },
        toggle: function(event) {
            event.stopPropagation();
            if (!this.$el.hasClass('backbone-tree-leaf')) {
                if (this.$el.hasClass('backbone-tree-collapsible')) {
                    this.$el.removeClass('backbone-tree-collapsible')
                        .addClass('backbone-tree-expandable');
                }
                else {
                    this.$el.removeClass('backbone-tree-expandable')
                        .addClass('backbone-tree-collapsible');
                }
            }
        },
        labelHoverOn: function(event) {
            event.stopPropagation();
            this.$el.children('.backbone-tree-label')
                .addClass('backbone-tree-hovered');
        },
        labelHoverOff: function(event) {
            event.stopPropagation();
            this.$el.children('.backbone-tree-label')
                .removeClass('backbone-tree-hovered');
        },
        labelClick: function(event) {
            event.stopPropagation();
            this.model.set('selected', true, {silent: true});
            var rootView = this;
            while (rootView.parent) {
                rootView = rootView.parent;
            }
            rootView.handleClickNode(this);
            this.$el.trigger("blkui-tree-leftclick", this.model.attributes);
        },
        setParent: function(parent) {
            this.parent = parent;
        },
        setSelectHighlight: function() {
            this.$el.children('.backbone-tree-label')
                .addClass('backbone-tree-selected');
        },
        unsetSelectHighlight: function() {
            this.$el.children('.backbone-tree-label')
                .removeClass('backbone-tree-selected');
        },
        handleRightClick: function(e) {
            e.stopPropagation();
            this.$el.trigger("blkui-tree-rightclick", 
                [this.model.attributes, {pageX: e.pageX, pageY: e.pageY}]
            );
            return false;
        },
        isLeaf: function() {
            return (!this.model.has('nodes'));
        },
        getAttributes: function() {
            return this.model.attributes;
        }
    });

    var NodeListView = Backbone.View.extend({
        tagName: 'ul',
        initialize: function(args) {
            _.bindAll(this, 'createNodeView', 'renderNode');
            this.parent = args.parent;
            this.nodeViews = {};
            this.collection.each(this.createNodeView);
        },
        render: function() {
            this.collection.each(this.renderNode);
            return this;
        },
        renderNode: function(node) {
            this.$el.append(this.nodeViews[node.cid].render().el);
        },
        createNodeView: function(node) {
            var nodeView = new NodeView({model: node});
            nodeView.setParent(this.parent);
            this.nodeViews[node.cid] = nodeView;
        }
    });

    var TreeView = Backbone.View.extend({
        className: 'backbone-tree',
        initialize: function(args) {
            var nodeList = new NodeList(args.nodes);
            this.nodeListView = new NodeListView({
                collection: nodeList,
                parent: this
            });
            this.className += 
                (args.theme) ? ' ' + args.theme : ' backbone-tree-default';
            this.$el.attr('class', this.className);
            this.selected = null;
        },
        render: function() {
            this.$el.append(this.nodeListView.render().el);
            return this;
        },
        handleClickNode: function(nodeView) {
            if (this.selected) {
                this.selected.unsetSelectHighlight();
            }
            this.selected = nodeView;
            this.selected.setSelectHighlight();
        }
    });

    var treeView = new TreeView({
        el: spec.el,
        nodes: spec.nodes,
        theme: spec.theme
    });

    if (spec.autoRender) {
        treeView.render();
    }

    return treeView; 

};

