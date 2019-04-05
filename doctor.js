#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchangeLogs = 'logs';
        const exchangeInfo = 'info';

        ch.assertExchange(exchangeInfo, 'fanout', {durable: false});
        ch.assertQueue('', {exclusive: true}, function(err, q) {
            console.log(" [*] Waiting for messages from admin in %s. To exit press CTRL+C", q.queue);
            ch.bindQueue(q.queue, exchangeInfo, '');

            ch.consume(q.queue, function(msg) {
                if(msg.content) {
                    console.log(" [x] Info from admin: %s", msg.content.toString());
                }
            }, {noAck: true});
        });

        ask();
        function ask() {
            readline.question('Give type of examination (knee / hip / elbow)' +
                " and surname of patient or type 'exit' to quit\n", function(msg){

                if (msg === 'exit') handleExit(0);

                if (msg.split(" ").length === 2) {
                    var examType = msg.split(" ")[0];
                    // ch.assertExchange(exchangeName, 'direct', {durable: false});
                    // ch.publish(exchangeName, examType, new Buffer(msg));

                    ch.assertQueue('', {exclusive: true}, function(err, q) {
                        var corr = generateUuid();

                        ch.consume(q.queue, function(msg) {
                            if (msg.properties.correlationId === corr)
                                console.log(" [.] Got '%s'", msg.content.toString());
                        }, {noAck: true});

                        ch.sendToQueue(examType, new Buffer(msg),
                            { correlationId: corr, replyTo: q.queue });
                        console.log(" [x] Sent %s: '%s'", examType, msg);

                        // Logs
                        ch.assertExchange(exchangeLogs, 'fanout', {durable: false});
                        ch.publish(exchangeLogs, '', new Buffer(msg));

                        ask();
                    });
                } else
                    console.log("Wrong input.");
            });
        }
    });

    function generateUuid() {
        return Math.random().toString() +
            Math.random().toString() +
            Math.random().toString();
    }

    process.on('SIGINT', handleExit);
    function handleExit() {
        conn.close();
        readline.close();
        console.log('\nExiting');
        process.exit(0);
    }
});

