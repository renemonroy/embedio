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
    apiUrl : 'http://rene.mn/api/embeds',
    // apiUrl : 'http://localhost:8080/api/embeds',
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
    _renderEmbed : function(ps) {
      switch (ps.type) {
        case 'video' :
          return <div className="embed-video" dangerouslySetInnerHTML={{__html: ps.html }}></div>;
          break;
        case 'photo' :
          return <div className="embed-image"><img src={ps.url} /></div>;
          break;
        case 'rich' :
          return <div className="embed-rich" dangerouslySetInnerHTML={{__html: ps.html }}></div>;
          break;
        default :
          return null;
          break;
      }
    },
    render : function() {
      var ps = this.props.params;
      console.log(this.props);
      return (
        <li {...this.props} className="embed">
          { this._renderEmbed(ps) }
          <div className="embed-footer">
            <h4>{ ps.title }</h4>
            <button type="button" onClick={this.props.onDestroy}>Delete</button>
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
      this.listenTo(EmbedsStore, this._embedsStoreHandler);
    },
    _embedsStoreHandler : function(e) {
      if (e) {
        switch (e.storeAction) {
          case 'getEmbeds' :
            console.log('@ Embeds List:', e.res.embeds);
            this.setState({ embedsList : e.res.embeds });
            break;
          case 'destroyEmbed' :
            console.log('@ Embed List Updated:', e.res.embedId);
            var list = this.state.embedsList, listSize = list.length;
            for ( var i=0; i < listSize; i++ ) {
              if ( list[i]._id == e.res.embedId ) {
                list.splice(i, 1);
                break;
              }
            }
            this.setState({ embedsList : list });
            break;
        }
      }
    },
    destroyEmbed : function(id) {
      Actions.deleteEmbed(id);
    },
    _renderEmbeds : function() {
      var comp = this,
        embedsList = this.state.embedsList, embeds;
      if ( embedsList.length > 0 ) {
        embeds = embedsList.map(function(embed, i) {
          var onDestroy = comp.destroyEmbed.bind(comp, embed._id);
          return <EmbedEl ref={'embed-' + embed._id} key={embed._id} params={embed} onDestroy={onDestroy} />;
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
    render : function() {
      return (
        <section className="main">
          <EmbedsListEl />
        </section>
      );
    }
  });

  /**
  * Header Component. Is the header view where controls and other
  * components get rendered.
  */
  var HeaderEl = React.createClass({
    render : function() {
      return (
        <header>
          <form className="new-embed-form">
            <input type="text" name="embed" placeholder="Embed Name..." />
          </form>
        </header>
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
          <HeaderEl />
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