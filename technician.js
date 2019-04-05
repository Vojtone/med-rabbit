#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv;
if (args.length !== 4) {
    console.log("Wrong number of args. Give 2 types of examinations (knee / hip / elbow).");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var spec1 = args[2];
        var spec2 = args[3];

        listen(spec1);
        listen(spec2);

        function listen(spec) {
            ch.assertQueue(spec, {durable: false});
            ch.prefetch(1);
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", spec);
            ch.consume(spec, function reply(msg) {

                console.log(" [.] Received: %s", msg.content.toString());
                setTimeout(function() {
                    console.log(" [x] Done: %s | Sending results back.", msg.content.toString());
                    ch.sendToQueue(msg.properties.replyTo,
                        new Buffer(msg.content.toString() + " Done"),
                        {correlationId: msg.properties.correlationId});

                    ch.ack(msg);
                }, 3 * 1000);
            });
        }
    });
});