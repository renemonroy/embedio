require('./app.scss');

var React = require('react/addons'),
  Reflux = require('reflux'),
  debounce = null;

var loadApp = function() {

  /* ----------------------------------------------------------- +
  |                         Actions                              |
  + ----------------------------------------------------------- */

  /**
  * Actions used all over the app. Stores listen to these ones
  * depending the case of use.
  */
  var Actions = Reflux.createActions([
    "resizeUI",
    "getEmbeds",
    "activateEmbed"
  ]);

  /* ----------------------------------------------------------- +
  |                          Mixins                              |
  + ----------------------------------------------------------- */

  /**
  * Ajax Mixin. Created to be used by any component and reflux
  * store. Components should relie on Reflux.
  */
  var RESTMixin = {
    req : function(type, url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open(type, url, true);
      xhr.onreadystatechange = function () {
        if (this.readyState == 4) callback(null, this.responseText);
      };
      xhr.send();
    }
  };

  /**
   * Notification Mixin. can be used by any component to notify
   * or log results.
   */
  var HelpersMixin = {
    log : function() {
      if ( window._INFO.env !== 'production' ) {
        var curr = 0;
        window.log.history = window.log.history || [];
        window.log.history.push(arguments);
        curr = window.log.history.length;
        window.log.apply(this, arguments);
      }
      return this;
    }
  }

  /* ----------------------------------------------------------- +
  |                          Stores                              |
  + ----------------------------------------------------------- */

  /**
  * Embeds Store. All related to Embeds collection. More about
  * this at Apiary on MyWall project.
  */
  var UIStore = Reflux.createStore({
    init : function() {
      this.listenTo(Actions.resizeUI, this.resize);
    },
    resize : function(e) {
      var obj = {};
      obj.storeAction = 'resizeUI';
      obj.ev = e;
      this.trigger(obj);
    }
  });

  /**
  * Embeds Store. All related to Embeds collection. More about
  * this at Apiary on MyWall project.
  */
  var EmbedsStore = Reflux.createStore({
    apiUrl : window._INFO.ctx + '/api/embeds',
    init : function() {
      this.listenTo(Actions.getEmbeds, this.getEmbeds);
      this.listenTo(Actions.activateEmbed, this.activateEmbed);
    },
    getEmbeds : function(e) {
      var store = this;
      RESTMixin.req('GET', this.apiUrl, function(err, res) {
        var obj = {};
        if (err) obj.err = err;
        if (res) obj.res = JSON.parse(res);
        obj.storeAction = 'getEmbeds';
        store.trigger(obj);
      });
    },
    activateEmbed : function(embed) {
      var store = this,
        obj = {};
      obj.embed = embed;
      obj.storeAction = 'activateEmbed';
      store.trigger(obj);
    }
  });

  /* ----------------------------------------------------------- +
  |                       UI Components                          |
  + ----------------------------------------------------------- */

  /**
  * External component used by Row to resize columns if the
  * setting is activated.
  */
  var UIDraggable = require('react-draggable');

  /**
   * Column is used by Row Component to build containers around children
   * components of a row.
   */
  var UIColumn = React.createClass({
    displayName : 'UIColumn',
    mixins : [Reflux.ListenerMixin],
    getInitialState : function() {
      var ps = this.props;
      return  { width : ps.initialWidth ? parseInt(ps.initialWidth) : null };
    },
    componentDidMount : function() {
      this.listenTo(UIStore, this.uiStoreHandler);
    },
    uiStoreHandler : function(e) {
      switch (e.storeAction) {
        case 'resizeUI' :
          if ( !this.props.initialWidth ) this.setState({ width : null });
          break;
      }
    },
    renderChildren : function() {
      var col = this;
      return React.Children.map(this.props.children, function(child) {
        if ( col.props.initialWidth ) {
          return React.addons.cloneWithProps(child, {
            colWidth : col.state.width + 'px'
          });
        } else {
          return child;
        }
      });
    },
    render : function() {
      var st = this.state;
      return (
        <div {...this.props}
          style={{ flex : st.width ? '0 1 ' + st.width + 'px' : '1' }}
          className="ui-column">
          { this.renderChildren() }
        </div>
      );
    }
  });

  /**
   * Row is a component that wraps children with Columns to control the
   * different layouts. Its main purpose is to resize widths of columns
   * but is not a requirement.
   */
  var UIRow = React.createClass({
    displayName : 'UIRow',
    getInitialState : function() {
      var ps = this.props;
      return { resizable : ps.resizable };
    },
    _renderColumns : function() {
      var row = this,
        ps = row.props,
        columnsList = [];
      ps.children.forEach( function(comp, i) {
        var storeName = ps.storeName ? ps.storeName + '-' : '',
          colName = storeName + "column-" + i,
          colWidth = comp.props.colWidth || null;
        if ( i > 0 && row.state.resizable ) {
          columnsList.push(
            <UIDraggable
              key={"handler-" + i}
              axis="x"
              zIndex={1}
              start={{ x : 0, y : 0 }}
              onDrag={row.handleDrag.bind(row, i)}>
              <div><div className="handler-icon"></div></div>
            </UIDraggable>
          );
        }
        if ( localStorage.getItem(colName) !== null ) {
          colWidth = parseInt(localStorage.getItem(colName), 10);
        }
        columnsList.push(
          <UIColumn
            key={ colName }
            ref={ colName }
            initialWidth={ colWidth }>
            { comp }
          </UIColumn>
        );
      });
      return columnsList;
    },
    handleDrag : function(i, e, ui) {
      var rfs = this.refs,
        ps = this.props,
        storeName = ps.storeName ? ps.storeName + '-' : '',
        rColName = storeName + 'column-' + i,
        lColName = storeName + 'column-' + (i - 1),
        rCol = rfs[rColName],
        lCol = rfs[lColName],
        rColW = (rCol.state.width || parseInt(rCol.getDOMNode().offsetWidth)) - e.movementX,
        lColW = (lCol.state.width || parseInt(lCol.getDOMNode().offsetWidth)) + e.movementX;
      rCol.setState({ width : rColW });
      lCol.setState({ width : lColW });
      if ( ps.storeName && rCol.props.initialWidth ) localStorage.setItem(rColName, rColW.toString());
      if ( ps.storeName && lCol.props.initialWidth ) localStorage.setItem(lColName, lColW.toString());
    },
    render : function() {
      var ps = this.props;
      return (
        <div className="ui-row">
          { ps.children.length > 0 ? this._renderColumns() : null }
        </div>
      );
    }
  });

  /**
   * View Component shows the current page visible (in theory).
   */
  var UIView = React.createClass({
    displayName : 'UIView',
    render : function() {
      return (
        <div {...this.props} className="ui-view"></div>
      );
    }
  });

  /* ----------------------------------------------------------- +
  |                    Templates Components                      |
  + ----------------------------------------------------------- */

  /**
  * Embed Component. It doesn't manage any value inside but the
  * parent component handles their properties.
  */
  var Embed = React.createClass({
    displayName : 'Embed',
    mixins: [Reflux.ListenerMixin],
    getInitialState : function() {
      return { active : false };
    },
    componentDidMount : function() {
      this.listenTo(EmbedsStore, this.embedsStoreHandler);
    },
    embedsStoreHandler : function(e) {
      switch (e.storeAction) {
        case 'activateEmbed' :
          this.setState({ active : (e.embed._id === this.props.params._id ? true : false) });
          break;
      }
    },
    updateStyles : function() {
      var pms = this.props.params,
        defaultWidth = pms.defaultWidth;
      if ( pms.width <= defaultWidth )
        return { width : pms.width, height : pms.height };
      else {
        var newHeight = (pms.height/pms.width) * defaultWidth;
        return { width : defaultWidth, height : newHeight};
      }
    },
    activate : function(e) {
      e.preventDefault();
      Actions.activateEmbed(this.props.params);
    },
    _renderType : function(ps) {
      var ps = this.props;
      switch (ps.params.type) {
        case 'video' :
          return <div className="embed-video" style={this.updateStyles()} dangerouslySetInnerHTML={{__html: ps.params.html }}></div>;
          break;
        case 'photo' :
          return <div className="embed-image" style={this.updateStyles()} ><img src={ps.params.url} /></div>;
          break;
        case 'rich' :
          return <div className="embed-rich" style={this.updateStyles()} dangerouslySetInnerHTML={{__html: ps.params.html }}></div>;
          break;
        default :
          return null;
          break;
      }
    },
    _renderOverlay : function() {
        return <div className="embed-overlay" onClick={this.activate}></div>;
    },
    render : function() {
      var ps = this.props,
        embedClass = "embed" + (this.state.active ? ' active' : '');
      return (
        <div {...this.props} className={ embedClass }>
          <div className="embed-body">
            { this._renderType() }
            { ps.params.selfActive ? this._renderOverlay() : null }
          </div>
          <div className="embed-footer">
            <h4>{ ps.params.title }</h4>
          </div>
        </div>
      );
    }
  });

  /**
  * Embed List Component. Renders all the embeds found on db by
  * using reflux to fetch them.
  */
  var EmbedsList = React.createClass({
    displayName : 'EmbedsList',
    mixins : [Reflux.ListenerMixin, HelpersMixin],
    getInitialState : function() {
      return { embedsList : [], height : window.innerHeight };
    },
    getDefaultProps : function() {
      return { xPaddings : 10 };
    },
    componentDidMount : function() {
      this.listenTo(EmbedsStore, this.embedsStoreHandler);
      Actions.getEmbeds();
    },
    embedsStoreHandler : function(e) {
      switch (e.storeAction) {
        case 'getEmbeds' :
          this.log('Response from %cgetEmbeds', 'color:blue;', e);
          this.setState({ embedsList : e.res.embeds });
          break;
      }
    },
    _renderEmbeds : function() {
      var comp = this,
        ps = comp.props,
        embeds = null,
        embedsList = comp.state.embedsList,
        colWidth = comp.props.colWidth || '240px';
      if ( embedsList.length > 0 ) {
        embeds = [];
        colWidth = parseInt(comp.getDOMNode().offsetWidth - (ps.xPaddings * 2));
        embedsList.forEach( function(embed, i) {
          embed.defaultWidth = colWidth;
          embed.selfActive = true;
          embeds.push(
            <Embed
              ref={'embed-' + embed._id}
              key={embed._id}
              params={embed}>;
            </Embed>
          );
        });
      }
      return embeds;
    },
    render : function() {
      var st = this.state,
        listStyles = { height : st.height + 'px', width : this.props.colWidth || 'auto' };
      return (
        <div {...this.props} className="embeds-list" style={listStyles}>
          { this._renderEmbeds() }
        </div>
      );
    }
  });

  var EmbedSelected = React.createClass({
    displayName : 'EmbedSelected',
    mixins: [Reflux.ListenerMixin, HelpersMixin],
    getInitialState : function() {
      return { embed : null };
    },
    componentDidMount : function() {
      this.listenTo(EmbedsStore, this.embedsStoreHandler);
    },
    embedsStoreHandler : function(e) {
      switch (e.storeAction) {
        case 'activateEmbed' :
          this.setState({ embed : e.embed });
          break;
        }
    },
    _renderEmbed : function() {
      var st = this.state,
        embed = st.embed;
      if ( st.embed ) {
        embed = <div className="embed" dangerouslySetInnerHTML={{__html: st.embed.html }}></div>;
      }
      return embed;
    },
    render : function() {
      var st = this.state;
      return (
        <article>
          { this._renderEmbed() }
        </article>
      );
    }
  });

  /**
  * The principal component that renders the entire application.
  */
  var App = React.createClass({
    displayName : 'App',
    mixins: [Reflux.ListenerMixin],
    componentDidMount : function() {
      window.addEventListener('resize', function(e) {
        clearTimeout(debounce);
        debounce = setTimeout(Actions.resizeUI(e), 100);
      });
    },
    render : function() {
      return (
        <div className="app embedio">
          <UIView className="embeds">
            <UIRow resizable={true} storeName="embedsRow">
              <EmbedSelected />
              <EmbedsList colWidth="300px"/>
            </UIRow>
          </UIView>
        </div>
      );
    }
  });

  //
  // /* ----------------------------------------------------------- +
  // |                         Actions                              |
  // + ----------------------------------------------------------- */
  //
  // /**
  // * Actions used all over the app. Stores listen to these ones
  // * depending the case of use.
  // */
  // var Actions = Reflux.createActions([
  //   "activateEmbed",
  //   "getEmbeds",
  //   "deleteEmbed"
  // ]);
  //
  // /* ----------------------------------------------------------- +
  // |                          Mixins                              |
  // + ----------------------------------------------------------- */
  //
  // /**
  // * Ajax Mixin. Created to be used by any component and reflux
  // * store. Components should relie on Reflux.
  // */
  // var RESTMixin = {
  //   req : function(type, url, callback) {
  //     var xhr = new XMLHttpRequest();
  //     xhr.open(type, url, true);
  //     xhr.onreadystatechange = function () {
  //       if (this.readyState == 4) callback(null, this.responseText);
  //     };
  //     xhr.send();
  //   }
  // };
  //
  // /* ----------------------------------------------------------- +
  // |                          Stores                              |
  // + ----------------------------------------------------------- */
  //
  // /**
  // * Embeds Store. All related to Embeds collection. More about
  // * this at Apiary on MyWall project.
  // */
  // var EmbedsStore = Reflux.createStore({
  //   apiUrl : window._INFO.ctx + '/api/embeds',
  //   init : function() {
  //     this.listenTo(Actions.getEmbeds, this.getEmbeds);
  //     this.listenTo(Actions.deleteEmbed, this.deleteEmbed);
  //     this.listenTo(Actions.activateEmbed, this.activateEmbed);
  //   },
  //   getEmbeds : function(e) {
  //     var store = this;
  //     RESTMixin.req('GET', this.apiUrl, function(err, res) {
  //       var obj = {};
  //       if (err) obj.err = err;
  //       if (res) obj.res = JSON.parse(res);
  //       obj.storeAction = 'getEmbeds';
  //       store.trigger(obj);
  //     });
  //   },
  //   deleteEmbed : function(id) {
  //     var store = this;
  //     RESTMixin.req('DELETE', this.apiUrl + '/' + id, function(err, res) {
  //       var obj = {};
  //       if (err) obj.err = err;
  //       if (res) obj.res = JSON.parse(res);
  //       obj.storeAction = 'destroyEmbed';
  //       store.trigger(obj);
  //     });
  //   },
  //   activateEmbed : function(embed) {
  //     var store = this,
  //       obj = {};
  //     obj.embed = embed;
  //     obj.storeAction = 'activateEmbed';
  //     console.log('>>>>>> obj', obj);
  //     store.trigger(obj);
  //   }
  // });
  //
  // /* ----------------------------------------------------------- +
  // |                         Components                           |
  // + ----------------------------------------------------------- */
  //
  // /**
  // * Embed Component. It doesn't manage any value inside but the
  // * parent component handles their properties.
  // */
  // var EmbedEl = React.createClass({
  //   mixins: [Reflux.ListenerMixin],
  //   getInitialState : function() {
  //     return { active : false };
  //   },
  //   componentDidMount : function() {
  //     this.listenTo(EmbedsStore, this.embedsStoreHandler);
  //   },
  //   embedsStoreHandler : function(e) {
  //     if (e) {
  //       switch (e.storeAction) {
  //         case 'activateEmbed' :
  //           this.setState({ active : (e.embed._id === this.props.params._id ? true : false) });
  //           break;
  //       }
  //     }
  //   },
  //   setSize : function() {
  //     var pms = this.props.params,
  //       eDefault = pms.defaultWidth;
  //     if ( pms.width <= eDefault )
  //       return { width : pms.width, height : pms.height };
  //     else {
  //       var newHeight = (pms.height/pms.width) * eDefault;
  //       return { width : eDefault, height : newHeight};
  //     }
  //   },
  //   activateEmbed : function(e) {
  //     e.preventDefault();
  //     console.log('>>>> e', e);
  //     Actions.activateEmbed(this.props.params);
  //   },
  //   _renderEmbed : function(ps) {
  //     var ps = this.props;
  //     switch (ps.params.type) {
  //       case 'video' :
  //         return <div className="embed-video" style={this.setSize()} dangerouslySetInnerHTML={{__html: ps.params.html }}></div>;
  //         break;
  //       case 'photo' :
  //         return <div className="embed-image" style={this.setSize()}><img src={ps.params.url} /></div>;
  //         break;
  //       case 'rich' :
  //         return <div className="embed-rich" style={this.setSize()} dangerouslySetInnerHTML={{__html: ps.params.html }}></div>;
  //         break;
  //       default :
  //         return null;
  //         break;
  //     }
  //   },
  //   render : function() {
  //     var ps = this.props,
  //       embedClass = "embed" + (this.state.active ? ' active' : '');
  //     return (
  //       <li {...this.props} className={embedClass}>
  //         <div className="embed-body">
  //           { this._renderEmbed() }
  //           <div className="embed-overlay" onClick={this.activateEmbed}></div>
  //         </div>
  //         <div className="embed-footer">
  //           <h4>{ ps.params.title }</h4>
  //         {/*<button type="button" onClick={this.props.onDestroy}>Delete</button>*/}
  //         </div>
  //       </li>
  //     );
  //   }
  // });
  //
  // /**
  // * Embed List Component. Renders all the embeds found on db by
  // * using reflux to fetch them.
  // */
  // var EmbedsListEl = React.createClass({
  //   mixins: [Reflux.ListenerMixin],
  //   getInitialState : function() {
  //     return { embedsList : [] };
  //   },
  //   componentDidMount : function() {
  //     this.listenTo(EmbedsStore, this.embedsStoreHandler);
  //   },
  //   embedsStoreHandler : function(e) {
  //     if (e) {
  //       switch (e.storeAction) {
  //         case 'getEmbeds' :
  //           this.setState({ embedsList : e.res.embeds });
  //           break;
  //         case 'destroyEmbed' :
  //           this.unmountEmbed(e.res.embedId);
  //           break;
  //       }
  //     }
  //   },
  //   destroyEmbed : function(id) {
  //     Actions.deleteEmbed(id);
  //   },
  //   unmountEmbed : function(id) {
  //     var list = this.state.embedsList,
  //       listSize = list.length;
  //     for ( var i=0; i < listSize; i++ ) {
  //       if ( list[i]._id == id ) {
  //         list.splice(i, 1);
  //         break;
  //       }
  //     }
  //     this.setState({ embedsList : list });
  //     return this;
  //   },
  //   _renderEmbeds : function() {
  //     var comp = this,
  //       embedsList = this.state.embedsList, embeds,
  //       embedDefaultWidth = this.props.defaultWidth - 40;
  //
  //     if ( embedsList.length > 0 ) {
  //       embeds = embedsList.map(function(embed, i) {
  //         var destroyEmbed = comp.destroyEmbed.bind(comp, embed._id);
  //         embed.defaultWidth = comp.props.defaultWidth;
  //         return <EmbedEl ref={'embed-' + embed._id} key={embed._id} params={embed} onDestroy={destroyEmbed} />;
  //       });
  //     }
  //     return embeds;
  //   },
  //   render : function() {
  //     return (
  //       <ul {...this.props} className="embeds-list">
  //         { this._renderEmbeds() }
  //       </ul>
  //     );
  //   }
  // });
  //
  // ResizeEl = React.createClass({
  //   render : function() {
  //     return (
  //       <Draggable axis="x" zIndex={100} start={handlerStart} onDrag={this.handleDrag} >
  //         <div style={this.props.style}></div>
  //       </Draggable>
  //     );
  //   }
  // });
  // //
  // // AsideEl = React.createClass({
  // //   getInitialState : function() {
  // //     var w = 280;
  // //     if ( localStorage.getItem('asideWidth') !== null ) {
  // //       w = parseInt(localStorage.getItem('asideWidth'), 10) || w;
  // //     }
  // //     return { width : w };
  // //   },
  // //   changeWidth : function(w) {
  // //     // this.setState({ width : w });
  // //     localStorage.setItem('asideWidth', w.toString());
  // //     if ( this.props.onWidthChange ) this.props.onWidthChange(w);
  // //   },
  // //   render : function() {
  // //     return (
  // //       <aside style={asideStyles}>
  // //         <ResizeEl style={} />
  // //         <EmbedsListEl defaultWidth={this.state}/>
  // //       </aside>
  // //     );
  // //   }
  // // });
  //
  // /**
  // * Main Component. Is the main view where important components
  // * live and get rendered like Embeds List.
  // */
  // var ViewEl = React.createClass({
  //   getInitialState : function() {
  //     var ls = 280;
  //     if ( localStorage && (localStorage.getItem('asideWidth') !== null) ) {
  //       ls = parseInt(localStorage.getItem('asideWidth'), 10);
  //     }
  //     return { asideWidth : ls };
  //   },
  //   changeWidth : function(w) {
  //     this.setState({ asideWidth : w });
  //     if ( localStorage ) localStorage.setItem('asideWidth', w.toString());
  //   },
  //   handleDrag : function(e, ui) {
  //     this.changeWidth(window.innerWidth - ui.position.left);
  //   },
  //   render : function() {
  //     var ps = this.props,
  //       st = this.state,
  //       handlerStyles = { height : window.innerHeight },
  //       handlerStart = { x : window.innerWidth - st.asideWidth, y : 0},
  //       articleStyles = { width : handlerStart.x, height : handlerStyles.height },
  //       asideStyles = { width : st.asideWidth + 'px', height : handlerStyles.height },
  //       asideContentWidth = st.asideWidth - 40;
  //     return (
  //       <section className="view">
  //         <article style={articleStyles}>
  //           <EmbedEl />
  //         </article>
  //         <AsideEl style={asideStyles}/>
  //         {/*<Draggable axis="x" zIndex={100} start={handlerStart} onDrag={this.handleDrag} >
  //           <div style={handlerStyles}></div>
  //         </Draggable>
  //         <aside style={asideStyles}>
  //           <EmbedsListEl defaultWidth={asideContentWidth}/>
  //         </aside>*/}
  //       </section>
  //     );
  //   }
  // });
  //
  // /**
  // * App Component. Is the mothership of all components. It shows
  // * all the layout's sections.
  // */
  // var AppEl = React.createClass({
  //   componentDidMount : function() {
  //     Actions.getEmbeds({ dispatcher : 'AppEl' });
  //   },
  //   render : function() {
  //     return (
  //       <div className="app wall">
  //         <ViewEl />
  //       </div>
  //     );
  //   }
  // });

  /**
  * Renders the whole App once every class needed on a initial
  * load was already created.
  */
  React.render(<App />, document.body);
};

document.addEventListener('DOMContentLoaded', loadApp);