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

        ask();
        function ask() {
            readline.question('Type info and hit enter to send it to everyone.\n', function(msg){
                ch.assertExchange(exchangeInfo, 'fanout', {durable: false});
                ch.publish(exchangeInfo, '', new Buffer(msg));
                ask();
            });
        }

        ch.assertExchange(exchangeLogs, 'fanout', {durable: false});
        ch.assertQueue('', {exclusive: true}, function(err, q) {
            console.log(" [*] Waiting for logs in %s. To exit press CTRL+C", q.queue);
            ch.bindQueue(q.queue, exchangeLogs, '');

            ch.consume(q.queue, function(msg) {
                if(msg.content) {
                    console.log(" [x] %s", msg.content.toString());
                }
            }, {noAck: true});
        });
    });
});