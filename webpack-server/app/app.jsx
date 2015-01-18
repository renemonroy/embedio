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
    "getEmbedsCollection",
  ]);

  /* ----------------------------------------------------------- +
  |                          Mixins                              |
  + ----------------------------------------------------------- */

  /**
  * Ajax Mixin. Created to be used by any component and reflux
  * store. Components should relie on Reflux.
  */
  var AjaxMixin = {
    get : function(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('get', url, true);
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
    // apiUrl : "http://private-0bd2a-mywall.apiary-mock.com/embeds",
    apiUrl : 'http://rene.mn/api/embeds',
    init : function() {
      this.listenTo(Actions.getEmbedsCollection, this.getEmbeds);
    },
    getEmbeds: function(e) {
      var store = this;
      AjaxMixin.get(this.apiUrl, function(err, res) {
        var obj = {};
        if (err) obj.err = err;
        if (res) obj.res = JSON.parse(res);
        obj.storeAction = 'getEmbeds';
        console.log('@ Store', obj);
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
    _renderHtml : function(ps) {
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
      return (
        <li {...this.props} className="embed">
          { this._renderHtml(ps) }
          <div className="embed-footer">
            <h4>{ ps.provider_name }</h4>
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
      if ( e && e.storeAction == 'getEmbeds' ) {
        console.log('@ Embeds List:', e.res);
        this.setState({ embedsList : e.res });
      }
    },
    _renderEmbeds : function() {
      var embedsList = this.state.embedsList, embeds;
      if ( embedsList.length > 0 ) {
        embeds = embedsList.map(function(embed, i) {
          return <EmbedEl key={"embed-" + i} params={embed} />;
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
      Actions.getEmbedsCollection({ dispatcher : 'AppEl' });
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