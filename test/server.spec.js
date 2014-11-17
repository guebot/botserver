'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var io = require('socket.io-client');
var app = require('../src/server');
var config = require('../src/config');

var options = {
    transports: ['websocket'],
    'force new connection': true
};

describe("Websocket Server", function () {
    it("Should emit broadcast status when received", function (done) {
        var client = io.connect(config.test.websocketUrl, options);
        var request = {
            "consult": {
                "status": config.channels.states.upOpen, //(Estado en el que se encuentra el robot, después de la ejecución el comando, UP_OPEN, UP_CLOSE, DOWN_OPEN, DOWN_CLOSE)
                "response": {
                    "code": "00", //('00' ejecutada exitosamente, '50' problemas de comunicación, ' 80' petición invalida, '90' petición encolada, '99' error desconocido)
                    "message": "" // (Mensaje complementario, es opcional, puede ser la cantidad de instrucciones que están pendientes ante de ejecutar la solicitada)
                }
            }
        };
        client.on('connect', function (data) {
            client.emit(config.channels.status, request
            );
        });

        client.on(config.channels.status, function (data) {
            data.consult.status.should.be.equal(request.consult.status);
            client.disconnect();
            done();
        });
    });

    it("Should emit a new movement event when receive a valid movement event", function (done) {
        var client = io.connect(config.test.websocketUrl, options);
        var request = {
            "move": {
                "token": "tokenSecret", //(token de autorización generado por OpenID google)
                "userId": "userId", // (el userid de OpenID google)
                "data": {
                    "instruction": config.channels.moves.open, // (Instrucción del movimiento UP, DOWN, OPEN, CLOSE, CALIBRATE )
                    "value": "" // (Cuando la opción es CALIBRATE se coloca el tamaño del huevo a utilizar, inicialmente no se utilizará pero puede ser útil este campo)
                }
            }
        };
        client.on('connect', function (data) {
            client.emit(config.channels.movement, request);
        });

        client.on(config.channels.movement, function (data) {
            data.move.data.instruction.should.be.equal(request.move.data.instruction);
            client.disconnect();
            done();
        });
    });

    it("Should emit a new error event when receive an invalid movement event", function (done) {
        var client = io.connect(config.test.websocketUrl, options);
        var move = 'invalid move';
        client.on('connect', function (data) {
            client.emit(config.channels.movement, move);
        });

        client.on(config.channels.error, function (data) {
            data.should.be.equal('\'' + move + '\' is an invalid move');
            client.disconnect();
            done();
        });
    });
});