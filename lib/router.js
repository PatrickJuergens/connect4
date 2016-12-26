import { Session } from 'meteor/session'
import { Games } from '../imports/api/games.js'

FlowRouter.route('/', {
    name: 'start',
    action: function(params, queryParams) {
        BlazeLayout.render('App_body', {main: 'start'});
    }
});

FlowRouter.route('/preGame/', {
    name: 'preGame',
    action: function(params, queryParams) {
        userName = Session.get("userName");
        game = Session.get("game");
        if (userName == null) {
            FlowRouter.go('start');
        } else if (game != null) {
            FlowRouter.go('game');
        } else {
            console.log("preGame");
            BlazeLayout.render('App_body', {main: 'preGame'});
        }
    }
});

FlowRouter.route('/game/', {
    name: 'game',
    action: function(params, queryParams) {
        userName = Session.get("userName");
        game = Session.get("game");
        if (userName == null ) {
            FlowRouter.go('start');
        } else if (game == null) {
            FlowRouter.go('preGame');
        } else {
            BlazeLayout.render('App_body', {main: 'game'});
        }

    }
});

FlowRouter.route('/gameOver/', {
    name: 'gameOver',
    action: function(params, queryParams) {
        var userName = Session.get("userName");
        var sessionGame = Session.get("game");
        var game = Games.findOne({_id:sessionGame});
        if (userName == null ) {
            FlowRouter.go('start');
        } else if (sessionGame == null) {
            FlowRouter.go('preGame');
        } else if (game.status != 'finish') {
            BlazeLayout.render('App_body', {main: 'game'});
        } else {
            BlazeLayout.render('App_body', {main: 'gameOver'});
        }
    }
});
