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

        sharedRMQ.subscribeRMQ(ch, exchangeInfo);
        delegateTask();

        function delegateTask() {
            readline.question('[*] Give type of examination (knee / hip / elbow)' +
                " and surname of patient or type 'exit' to quit\n", function(msg) {
                if (msg === 'exit') handleExit(0);

                if (msg.split(" ").length !== 2)
                    console.log("Wrong input.");
                else {
                    const examType = msg.split(" ")[0];
                    ch.assertQueue('', {exclusive: true}, function(err, q) {
                        var corr = config.generateUuid();
                        ch.consume(q.queue, function(msg) {
                            if (msg.properties.correlationId === corr)
                                console.log("[.] Received '%s'", msg.content.toString());
                        }, {noAck: true});
                        ch.sendToQueue(examType, new Buffer(msg),
                            {correlationId: corr, replyTo: q.queue});
                        console.log("[x] Sent %s: '%s'", examType, msg);

                        sharedRMQ.publishRMQ(ch, exchangeLogs, msg);
                        delegateTask();
                    });
                }
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

