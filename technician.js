#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const config = require('./config');
const sharedRMQ = require('./sharedRMQ');

const args = process.argv;

checkArgs();
function checkArgs() {
    if (args.length !== 4) {
        console.log("Wrong number of args. Give 2 types of specialization (knee / hip / elbow).");
        process.exit(1);
    }
}

amqp.connect(config.url, function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchangeLogs = config.exchangeLogs;
        const exchangeInfo = config.exchangeInfo;
        const spec1 = args[2];
        const spec2 = args[3];

        sharedRMQ.subscribeRMQ(ch, exchangeInfo);
        listenForTasks(spec1);
        listenForTasks(spec2);

        function listenForTasks(spec) {
            ch.assertQueue(spec, {durable: false});
            ch.prefetch(1);
            console.log("[*] Waiting for messages in %s. To exit press CTRL+C", spec);

            ch.consume(spec, function reply(msg) {
                console.log("[.] Received: '%s'", msg.content.toString());
                setTimeout(function() { // pretends workload
                    console.log("[x] Done: '%s' | Sending results back.", msg.content.toString());
                    var response = 'Done: ' + msg.content.toString();
                    ch.sendToQueue(msg.properties.replyTo,
                        new Buffer(response), {correlationId: msg.properties.correlationId});

                    sharedRMQ.publishRMQ(ch, exchangeLogs, response);
                    ch.ack(msg);
                }, config.techWorkTimeIn_ms);
            });
        }
    });

    process.on('SIGINT', handleExit);
    function handleExit() {
        conn.close();
        console.log('\nExiting');
        process.exit(0);
    }
});