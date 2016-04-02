var http    = require('http');
var server  = http.createServer();
var io      = require('socket.io')(server);

var storage = [];

io.sockets.on('connection', function (socket) {
    socket.on('ready', function (j) {
        var o = {
            "name"      : j.name,
            "socket"    : socket,
            "game"      : null
        };
        
        for(var i = 0; i < storage.length; i++){
            var d  = storage[i];
            if(d.name !== o.name && !d.game){
                var game        = new Orchestrator(d.name, o.name);
                d.game          = game;
                o.game          = game;
                
                d.socket.emit('game-ready', {"name" : o.name});
                o.socket.emit('game-ready', {"name" : d.name});
                d.socket.emit('log', {"msg" : "First player is : "+d.name});
                
                refreshGrid(game, d.socket);
                refreshGrid(game, o.socket);
            }
        }
        storage.push(o);
    });
    
    socket.on('error', function (e) {
        console.log(e);
    });
    
    socket.on('play', function (d) {
        var s = getStorageValueBySocket(socket);
        if(s.game.getUserManager().getCurrentUser().getName() === s.name){
            s.game.play(d.row, d.col);
            
            var users = s.game.getUserManager().getUsers();
            for(var i = 0; i < users.length; i++){
                var e       = users[i];
                var storage = getStorageValueByName(e.getName());
                refreshGrid(storage.game, storage.socket);
            }
        }
        
        if(s.game.getWinner()){
            var users = s.game.getUserManager().getUsers();
            for(var i = 0; i < users.length; i++){
                var e       = users[i];
                var storage = getStorageValueByName(e.getName());
                storage.socket.emit('win', s.game.getWinner().getName());
            }
        }
    });
    
    socket.on('disconnect', function () {
        for(var i = 0; i < storage.length; i++){
            var d  = storage[i];
            if(d.socket.id === socket.id){
                storage = storage.splice(i, 1);
            }
        }
    });
    
    function getStorageValueBySocket(socket){
        for(var i = 0; i < storage.length; i++){
            var d  = storage[i];
            if(d.socket.id === socket.id){
                return d;
            }
        }
    }
    function getStorageValueByName(name){
        for(var i = 0; i < storage.length; i++){
            var d  = storage[i];
            if(d.name === name){
                return d;
            }
        }
    }
    
    /**
     * 
     * @returns {undefined}
     */
    function refreshGrid(orchestrator, socket){
        var cells = orchestrator.getGridManager().getGrid().getCells();
         socket.emit('refresh-grid', cells);
    }
});



server.listen(1337, function () {
    console.log('listening on *:1337');
});

/*************
 * 
 * 
 * 
 */
var Cell = function (value) {
    this.value = 0; //0 = vide; -1 = croix; 1 = rond        

    this.cell = function (value) {
        this.value = value;
    };
    this.getValue = function () {
        return this.value;
    };
    this.setValue = function (value) {
        this.value = value;
    };

    this.cell(value);
};

var Grid = function () {
    this.cells = null;

    this.grid = function () {
        this.cells = [];
        for (var i = 0; i < 3; i++) {
            this.cells[i] = [];
            for (var j = 0; j < 3; j++) {
                this.cells[i][j] = new Cell(0);
            }
        }
    };
    this.getCells = function () {
        return this.cells;
    };
    this.refreshCell = function (row, col, value) {
        this.getCells()[row][col].setValue(value);
    };
    this.grid();
};

var GridManager = function () {
    this.grid = null;

    this.gridManager = function () {
        this.grid = new Grid();
    };
    this.getGrid = function () {
        return this.grid;
    };
    this.gridManager();
};

var User = function (value, name) {
    this.value  = 0; //0 = vide; -1 = croix; 1 = rond        
    this.name   = null;
    
    this.user = function (value, name) {
        this.value  = value;
        this.name   = name;
    };
    this.getValue = function () {
        return this.value;
    };
    this.getName = function () {
        return this.name;
    };
    this.user(value, name);
};

var UserManager = function (player1_name, player2_name) {
    this.users = [];
    this.current_user = 0;

    this.userManager = function (player1_name, player2_name) {
        this.users[0] = new User(-1, player1_name);
        this.users[1] = new User(1, player2_name);
    };
    this.getUsers = function () {
        return this.users;
    };
    this.getCurrentUser = function () {
        return this.users[this.current_user];
    };
    this.play = function () {
        this.current_user = (this.current_user === 0) ? 1 : 0;
    };
    this.userManager(player1_name, player2_name);
};

var Orchestrator = function (player1_name, player2_name) {
    this.gridManager = null;
    this.userManager = null;
    this.winner      = null;
    
    this.matrix = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    this.possibilities = [
        "0:0-0:1-0:2",
        "1:0-1:1-1:2",
        "2:0-2:1-2:2",
        "0:0-1:1-2:2",
        "0:2-1:1-2:0",
        "0:0-1:0-2:0",
        "0:1-1:1-2:1",
        "0:2-1:2-2:2"
    ];

    this.results = [];

    this.orchestrator = function (player1_name, player2_name) {
        this.gridManager = new GridManager();
        this.userManager = new UserManager(player1_name, player2_name);
    };
    this.getGridManager = function () {
        return this.gridManager;
    };
    this.getUserManager = function () {
        return this.userManager;
    };
    this.getWinner = function () {
        return this.winner;
    };
    this.play = function (row, col) {
        this.matrix[row][col] = this.getUserManager().getCurrentUser().getValue();
        this.getGridManager().getGrid().refreshCell(row, col, this.getUserManager().getCurrentUser().getValue());
        this.checkGrid();
        this.getUserManager().play();
    };
    this.checkGrid = function () {
        var found = false;
        for (var i in this.possibilities) {
            var row = this.possibilities[i];
            var cells = this.getCells(row);

            var result = [];
            for (var c in cells) {
                var cell = cells[c];
                var cell_matrix = this.getCellMatrix(cell);
                result[c] = cell_matrix;
            }
            if (this.check(result)) {
                this.winner = this.getUserManager().getCurrentUser();
            }
        }
    };
    this.check = function (arr) {
        if (arr.length === 3) {
            var sum = parseFloat(arr[0]) + parseFloat(arr[1]) + parseFloat(arr[2]);
            if (sum === 3 || sum === -3) {
                return true;
            }
        }
        return false;
    };
    this.getCells = function (str) {
        return str.split("-");
    };
    this.getCellMatrix = function (str) {
        var idx = str.split(":");
        return this.matrix[idx[0]][idx[1]];
    };

    this.orchestrator(player1_name, player2_name);
};