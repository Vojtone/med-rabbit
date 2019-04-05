#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const config = require('./config');
const sharedRMQ = require('./sharedRMQ');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

amqp.connect(config.url, function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchangeLogs = config.exchangeLogs;
        const exchangeInfo = config.exchangeInfo;

        sharedRMQ.subscribeRMQ(ch, exchangeLogs);
        broadcastInfo();

        function broadcastInfo() {
            readline.question('[*] Type info and hit enter to send it to everyone.\n', function(msg) {
                sharedRMQ.publishRMQ(ch, exchangeInfo, msg);
                broadcastInfo();
            });
        }
    });

    process.on('SIGINT', handleExit);
    function handleExit() {
        conn.close();
        readline.close();
        console.log('\nExiting');
        process.exit(0);
    }
});