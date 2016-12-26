import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session'
import { Games } from '../imports/api/games.js'

import './main.html';

Template.start.events({
  'submit .joinForm'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const userName = target.userName.value;

    Session.set("userName", userName);
    FlowRouter.go('preGame');
  },
});

Template.start.helpers({
  userName: function () {
    return Session.get("userName");
  }
});

Template.preGame.events({
    'click .createGame'() {
        userName = Session.get("userName");
        sessionGame = Session.get("game")
        if (sessionGame == null) {
            const game = Games.insert({
                playerA: userName,
                status: 'pending',
                createdAt: new Date(), // current time
                field: [
                    [0,0,0,0,0,0],
                    [0,0,0,0,0,0],
                    [0,0,0,0,0,0],
                    [0,0,0,0,0,0],
                    [0,0,0,0,0,0],
                    [0,0,0,0,0,0],
                    [0,0,0,0,0,0],
                ]
            });
            console.log(game);
            Session.set("game", game);
            FlowRouter.go('game');
        } else {
            FlowRouter.go('preGame');
        }
    },
    'click .joinGame'() {
        userName = Session.get("userName");
        sessionGame = Session.get("game");
        if (sessionGame == null) {
            random = Math.random();
            activePlayer = 2
            if (random % 2 == 0) {
                activePlayer = 2
            }
            const game = Games.update(this._id, {
                $set: { playerB: userName, status: 'running', activePlayer: activePlayer },
            });
            Session.set("game", this._id);
            FlowRouter.go('game');
        } else {
            FlowRouter.go('preGame');
        }
    }
});

Template.preGame.helpers({
    userName: function () {
        return Session.get("userName");
    },
    pendingGames: function() {
        userName = Session.get("userName");
        return Games.find({status:'pending'});
    }
});

class ConnectFour {
    constructor(game) {
        sessionGame = Session.get("game");
        this.game = Games.findOne({_id:sessionGame});
    }
    isColFull(col) {
        return this.game.field[col][0] == 0;
    }
    getColRow(col ,row) {
        if (this.game.field[col][row] == 0) {
            return 'leer';
        } else if (this.game.field[col][row] == 1) {
            return 'PlayerA';
        } else if (this.game.field[col][row] == 2) {
            return 'PlayerB';
        }
    }
    makeTurn(col) {
        var victoryCoins = [];
        var winner = null;
        var status = 'running';
        for (var row = 6; row >= 0; row--) {
            if (this.game.field[col][row] == 0) {
                this.game.field[col][row] = this.game.activePlayer;
                console.log("set col " +col +" row " +row );
                victoryCoins = this.getVictoryCoins(this.game.field, this.game.activePlayer);
                console.log(victoryCoins);
                break;//this.setCoin(col, row, game.activePlayer);
            }
        }

        if (victoryCoins.length == 0) {
            if (this.game.activePlayer == 1) {
                activePlayer = 2;
            } else {
                activePlayer = 1;
            }
        } else {
            winner = this.game.activePlayer;
            status = 'finish';
        }
        const gameUpdate = Games.update(this.game._id, {
            $set: { activePlayer: activePlayer,
                field: this.game.field,
                winner: winner,
                status: status
            },
        });

        this.consoleLogField();

        if (status == 'finish') {
            return true;
        }
        return false;
    }
    getVictoryCoins(map, player) {
        var playerMap = new Array(7);
        for (var i_col = 0; i_col < 7; i_col++) {
            playerMap[i_col] = new Array(6);
            for (var i_row = 0; i_row < 6; i_row++) {
                if (map[i_col][i_row] === player) {
                    playerMap[i_col][i_row] = 1;
                } else {
                    playerMap[i_col][i_row] = 0;
                }
            }
        }

        var i, j, k;
        var temp_r = 0, temp_b = 0, temp_br = 0, temp_tr = 0;
        for (i = 0; i <= 6; i++) {
            for (j = 0; j < 7; j++) {
                temp_r = 0;
                fields_r = new Array();
                temp_b = 0;
                fields_b = new Array();
                temp_br = 0;
                fields_br = new Array();
                temp_tr = 0;
                fields_tr = new Array();
                for (k = 0; k <= 3; k++) {

                    //from (i,j) to right
                    if (j + k < 7) {
                        fields_r.push([i, j + k]);
                        temp_r += playerMap[i][j + k];
                    }
                    //from (i,j) to bottom
                    if (i + k <= 6) {
                        fields_b.push([i + k, j]);
                        temp_b += playerMap[i + k][j];
                    }

                    //from (i,j) to bottom-right
                    if (i + k <= 6 && j + k < 7) {
                        fields_br.push([i + k, j + k]);
                        temp_br += playerMap[i + k][j + k];
                    }

                    //from (i,j) to top-right
                    if (i - k >= 0 && j + k < 7) {
                        fields_tr.push([i - k, j + k]);
                        temp_tr += playerMap[i - k][j + k];
                    }
                }
                if (Math.abs(temp_r) === 4) {
                    return fields_r;
                } else if (Math.abs(temp_b) === 4) {
                    return fields_b;
                } else if (Math.abs(temp_br) === 4) {
                    return fields_br;
                } else if (Math.abs(temp_tr) === 4) {
                    return fields_tr;
                }
            }
        }
        return [];
    }
    consoleLogField() {
        sessionGame = Session.get("game");
        this.game = Games.findOne({_id:sessionGame});
        console.log(this.game);
        for (var i=0; i < this.game.field.length; i++) {
            console.log(this.game.field[i]);
        }
    }
}

Template.game.helpers({
    isPlayerActive: function() {
        const game = Games.findOne({_id:sessionGame});
        if (game.status == 'finish') {
            FlowRouter.go('gameOver');
        } else {
            userName = Session.get("userName")
            if (game.playerA == userName && game.activePlayer == 1) {
                return true;
            } else if (game.playerB == userName && game.activePlayer == 2) {
                return true;
            }
            return false;
        }
    },
    isPlayerA: function() {
        sessionGame = Session.get("game");
        userName = Session.get("userName")
        const game = Games.findOne({_id:sessionGame});
        return game.playerA == userName;
    },
    isPlayerB: function() {
        sessionGame = Session.get("game");
        userName = Session.get("userName")
        const game = Games.findOne({_id:sessionGame});
        return game.playerB == userName;
    },
    activePlayerA: function() {
        sessionGame = Session.get("game");
        const game = Games.findOne({_id:sessionGame});
        return game.activePlayer == 1;
    },
    activePlayerB: function() {
        sessionGame = Session.get("game");
        const game = Games.findOne({_id:sessionGame});
        return game.activePlayer == 2;
    },
    isCol0Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(0);
    },
    isCol1Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(1);
    },
    isCol2Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(2);
    },
    isCol3Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(3);
    },
    isCol4Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(4);
    },
    isCol5Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(5);
    },
    isCol6Full: function() {
        const c4 = new ConnectFour();
        return c4.isColFull(6);
    },
    playerCol0Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(0,0);
    },
    playerCol1Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(1,0);
    },
    playerCol2Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(2,0);
    },
    playerCol3Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(3,0);
    },
    playerCol4Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(4,0);
    },
    playerCol5Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(5,0);
    },
    playerCol6Row0: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(6,0);
    },
    playerCol0Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(0,1);
    },
    playerCol1Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(1,1);
    },
    playerCol2Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(2,1);
    },
    playerCol3Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(3,1);
    },
    playerCol4Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(4,1);
    },
    playerCol5Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(5,1);
    },
    playerCol6Row1: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(6,1);
    },
    playerCol0Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(0,2);
    },
    playerCol1Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(1,2);
    },
    playerCol2Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(2,2);
    },
    playerCol3Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(3,2);
    },
    playerCol4Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(4,2);
    },
    playerCol5Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(5,2);
    },
    playerCol6Row2: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(6,2);
    },
    playerCol0Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(0,3);
    },
    playerCol1Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(1,3);
    },
    playerCol2Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(2,3);
    },
    playerCol3Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(3,3);
    },
    playerCol4Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(4,3);
    },
    playerCol5Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(5,3);
    },
    playerCol6Row3: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(6,3);
    },
    playerCol0Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(0,4);
    },
    playerCol1Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(1,4);
    },
    playerCol2Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(2,4);
    },
    playerCol3Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(3,4);
    },
    playerCol4Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(4,4);
    },
    playerCol5Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(5,4);
    },
    playerCol6Row4: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(6,4);
    },
    playerCol0Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(0,5);
    },
    playerCol1Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(1,5);
    },
    playerCol2Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(2,5);
    },
    playerCol3Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(3,5);
    },
    playerCol4Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(4,5);
    },
    playerCol5Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(5,5);
    },
    playerCol6Row5: function() {
        const c4 = new ConnectFour();
        return c4.getColRow(6,5);
    },
});

Template.game.events({
    'click .makeTurnCol0'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(0);
    },
    'click .makeTurnCol1'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(1);
    },
    'click .makeTurnCol2'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(2);
    },
    'click .makeTurnCol3'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(3);
    },
    'click .makeTurnCol4'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(4);
    },
    'click .makeTurnCol5'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(5);
    },
    'click .makeTurnCol6'() {
        const c4 = new ConnectFour();
        var gameOver = c4.makeTurn(6);
    }
});

Template.gameOver.events({
    'click .startNewGame'() {
        Session.set("game", null);
        FlowRouter.go('preGame');
    }
});

Template.gameOver.helpers({
    winner: function () {
        sessionGame = Session.get("game");
        const game = Games.findOne({_id:sessionGame});
        if (game.winner == 1) {
            return game.playerA;
        } else {
            return game.playerB;
        }
    }
});
