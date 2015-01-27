require('./app.scss');

var React = require('react/addons'),
  Reflux = require('reflux');

var loadApp = function() {

  /* ----------------------------------------------------------- +
  |                         Actions                              |
  + ----------------------------------------------------------- */

  /**
  * Actions used all over the app. Stores listen to these ones
  * depending the case of use.
  */
  var Actions = Reflux.createActions([
    "getEmbeds",
    "deleteEmbed"
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

  /* ----------------------------------------------------------- +
  |                          Stores                              |
  + ----------------------------------------------------------- */

  /**
  * Embeds Store. All related to Embeds collection. More about
  * this at Apiary on MyWall project.
  */
  var EmbedsStore = Reflux.createStore({
    apiUrl : window._INFO.ctx + '/api/embeds',
    init : function() {
      this.listenTo(Actions.getEmbeds, this.getEmbeds);
      this.listenTo(Actions.deleteEmbed, this.deleteEmbed);
    },
    getEmbeds : function(e) {
      var store = this;
      RESTMixin.req('GET', this.apiUrl, function(err, res) {
        var obj = {};
        if (err) obj.err = err;
        if (res) obj.res = JSON.parse(res);
        obj.storeAction = 'getEmbeds';
        console.log('@ Store', obj);
        store.trigger(obj);
      });
    },
    deleteEmbed : function(id) {
      var store = this;
      RESTMixin.req('DELETE', this.apiUrl + '/' + id, function(err, res) {
        var obj = {};
        if (err) obj.err = err;
        if (res) obj.res = JSON.parse(res);
        obj.storeAction = 'destroyEmbed';
        console.log('@ Embed deleted', obj);
        store.trigger(obj);
      });
    }
  });

  /* ----------------------------------------------------------- +
  |                         Components                           |
  + ----------------------------------------------------------- */

  /**
  * Embed Component. It doesn't manage any value inside but the
  * parent component handles their properties.
  */
  var EmbedEl = React.createClass({
    setSize : function() {
      var pms = this.props.params,
        eDefault = pms.defaultWidth;
      if ( pms.width <= eDefault )
        return { width : pms.width, height : pms.height };
      else {
        var newHeight = (pms.height/pms.width) * eDefault;
        return { width : eDefault, height : newHeight};
      }
    },
    openEmbed : function(e) {
      e.preventDefault();
      var pms = this.props.params;
      console.log('Embed:', pms);
    },
    _renderEmbed : function(ps) {
      var ps = this.props;
      switch (ps.params.type) {
        case 'video' :
          return <div className="embed-video" style={this.setSize()} dangerouslySetInnerHTML={{__html: ps.params.html }}></div>;
          break;
        case 'photo' :
          return <div className="embed-image" style={this.setSize()}><img src={ps.params.url} /></div>;
          break;
        case 'rich' :
          return <div className="embed-rich" style={this.setSize()} dangerouslySetInnerHTML={{__html: ps.params.html }}></div>;
          break;
        default :
          return null;
          break;
      }
    },
    render : function() {
      var ps = this.props;
      return (
        <li {...this.props} className="embed">
          <div className="embed-body">
            { this._renderEmbed() }
            <div className="embed-overlay" onClick={this.openEmbed}></div>
          </div>
          <div className="embed-footer">
            <h4>{ ps.params.title }</h4>
          {/*<button type="button" onClick={this.props.onDestroy}>Delete</button>*/}
          </div>
        </li>
      );
    }
  });

  /**
  * Embed List Component. Renders all the embeds found on db by
  * using reflux to fetch them.
  */
  var EmbedsListEl = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState : function() {
      return { embedsList : [] };
    },
    componentDidMount : function() {
      this.listenTo(EmbedsStore, this.embedsStoreHandler);
    },
    embedsStoreHandler : function(e) {
      if (e) {
        switch (e.storeAction) {
          case 'getEmbeds' :
            this.setState({ embedsList : e.res.embeds });
            break;
          case 'destroyEmbed' :
            this.unmountEmbed(e.res.embedId);
            break;
        }
      }
    },
    destroyEmbed : function(id) {
      Actions.deleteEmbed(id);
    },
    unmountEmbed : function(id) {
      var list = this.state.embedsList,
        listSize = list.length;
      for ( var i=0; i < listSize; i++ ) {
        if ( list[i]._id == id ) {
          list.splice(i, 1);
          break;
        }
      }
      this.setState({ embedsList : list });
      return this;
    },
    _renderEmbeds : function() {
      var comp = this,
        embedsList = this.state.embedsList, embeds,
        embedDefaultWidth = this.props.defaultWidth - 40;

      if ( embedsList.length > 0 ) {
        embeds = embedsList.map(function(embed, i) {
          var destroyEmbed = comp.destroyEmbed.bind(comp, embed._id);
          embed.defaultWidth = comp.props.defaultWidth;
          return <EmbedEl ref={'embed-' + embed._id} key={embed._id} params={embed} onDestroy={destroyEmbed} />;
        });
      }
      return embeds;
    },
    render : function() {
      return (
        <ul {...this.props} className="embeds-list">
          { this._renderEmbeds() }
        </ul>
      );
    }
  });

  /**
  * Main Component. Is the main view where important components
  * live and get rendered like Embeds List.
  */
  var MainEl = React.createClass({
    getInitialState : function() {
      return { defaultWidth : 320 };
    },
    changeWidth : function(e) {
      this.setState({ defaultWidth : e.target.value });
    },
    render : function() {
      var st = this.state,
        objStyles = {
          width : st.defaultWidth + 'px',
          height : window.innerHeight
        };
      return (
        <section className="main">
          <input type="range" min={320} max={480} onChange={this.changeWidth} />
          <EmbedsListEl style={objStyles} defaultWidth={st.defaultWidth - 40}/>
        </section>
      );
    }
  });

  /**
  * App Component. Is the mothership of all components. It shows
  * all the layout's sections.
  */
  var AppEl = React.createClass({
    componentDidMount : function() {
      Actions.getEmbeds({ dispatcher : 'AppEl' });
    },
    render : function() {
      return (
        <div className="app wall">
          <MainEl />
        </div>
      );
    }
  });

  /**
  * Renders the whole App once every class needed on a initial
  * load was already created.
  */
  React.render(<AppEl />, document.body);
};

document.addEventListener('DOMContentLoaded', loadApp);